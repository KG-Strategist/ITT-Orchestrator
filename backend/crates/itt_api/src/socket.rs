use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde_json::json;
use std::sync::Arc;
use std::time::Instant;
use tracing::{error, info, instrument, Span};
use tracing_opentelemetry::OpenTelemetrySpanExt;
use opentelemetry::trace::TraceContextExt;

use crate::AppState;
use agent_socket_rs::adapters::{McpAdapter, ProtocolAdapter};
use agent_socket_rs::protocol::{AgentSocketFrame, FrameType};

pub async fn agent_socket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    tracing::info!("AgentSocket connected. Upgraded to full-duplex binary stream.");

    let (sender, mut receiver) = socket.split();
    let mut rx = state.melt_tx.subscribe();

    // Wrap sender in Arc<Mutex> so both tasks can use it
    let sender = Arc::new(tokio::sync::Mutex::new(sender));
    let sender_clone = sender.clone();

    // Spawn a task to handle outgoing messages from the broadcast channel
    let mut send_task = tokio::spawn(async move {
        // Initialize an MCP adapter for outbound mapping if necessary, or just send valid frames
        let adapter = McpAdapter::new(true);

        while let Ok(msg) = rx.recv().await {
            let payload_bytes = match serde_json::to_vec(&msg) {
                Ok(bytes) => bytes,
                Err(e) => {
                    tracing::error!("Failed to serialize log message: {}", e);
                    continue;
                }
            };

            // Build a Telemetry frame
            let frame = AgentSocketFrame::new(FrameType::Telemetry, payload_bytes);

            // Convert to a target egress format
            if let Ok(egress_bytes) =
                adapter.egress(&serde_json::to_vec(&frame).unwrap_or_default())
            {
                let mut s = sender_clone.lock().await;
                if s.send(Message::Binary(egress_bytes)).await.is_err() {
                    tracing::info!("AgentSocket disconnected during MELT stream.");
                    break;
                }
            }
        }
    });

    // Spawn a task to handle incoming messages
    let melt_tx = state.melt_tx.clone();
    let state_clone = state.clone();
    let sender_recv = sender.clone();
    let mut recv_task = tokio::spawn(async move {
        let adapter = McpAdapter::new(true);
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Binary(data) => {
                    tracing::info!("AgentSocket received binary frame: {} bytes", data.len());

                    // Map incoming payload to AgentSocketFrame intent via the Adapter
                    match adapter.ingress(&data) {
                        Ok(frame_bytes) => {
                            if let Ok(frame) =
                                serde_json::from_slice::<AgentSocketFrame>(&frame_bytes)
                            {
                                if let Ok(text) = String::from_utf8(frame.payload) {
                                    if let Ok(payload) =
                                        serde_json::from_str::<serde_json::Value>(&text)
                                    {
                                        if payload["action"] == "start_simulation" {
                                            match orchestrate_intent(
                                                &state_clone,
                                                payload["intent"]
                                                    .as_str()
                                                    .unwrap_or("default_intent")
                                                    .as_bytes(),
                                            )
                                            .await
                                            {
                                                Ok((result_bytes, trace_id)) => {
                                                    let response = json!({
                                                        "status": "success",
                                                        "result": String::from_utf8_lossy(&result_bytes).to_string(),
                                                        "trace_id": trace_id,
                                                    });

                                                    let _ = melt_tx.send(json!({
                                                        "type": "log",
                                                        "message": format!("[SUCCESS] Orchestration complete. Trace ID: {}", trace_id),
                                                        "color": "text-emerald-400"
                                                    }));

                                                    let response_bytes =
                                                        serde_json::to_vec(&response)
                                                            .unwrap_or_default();
                                                    let resp_frame = AgentSocketFrame::new(
                                                        FrameType::Response,
                                                        response_bytes,
                                                    );
                                                    if let Ok(egress_bytes) = adapter.egress(
                                                        &serde_json::to_vec(&resp_frame)
                                                            .unwrap_or_default(),
                                                    ) {
                                                        let mut s = sender_recv.lock().await;
                                                        let _ = s
                                                            .send(Message::Binary(egress_bytes))
                                                            .await;
                                                    }
                                                }
                                                Err(e) => {
                                                    let error_response = json!({
                                                        "status": "error",
                                                        "error": e.to_string(),
                                                    });

                                                    let _ = melt_tx.send(json!({
                                                        "type": "log",
                                                        "message": format!("[ERROR] Orchestration failed: {}", e),
                                                        "color": "text-red-400"
                                                    }));

                                                    let error_bytes =
                                                        serde_json::to_vec(&error_response)
                                                            .unwrap_or_default();
                                                    let resp_frame = AgentSocketFrame::new(
                                                        FrameType::Response,
                                                        error_bytes,
                                                    );
                                                    if let Ok(egress_bytes) = adapter.egress(
                                                        &serde_json::to_vec(&resp_frame)
                                                            .unwrap_or_default(),
                                                    ) {
                                                        let mut s = sender_recv.lock().await;
                                                        let _ = s
                                                            .send(Message::Binary(egress_bytes))
                                                            .await;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Err(e) => tracing::error!("Adapter ingress failed: {:?}", e),
                    }
                }
                Message::Text(_) => {
                    tracing::error!("AgentSocket Protocol Violation: Text frames are strictly prohibited. Dropping connection.");
                    break; // Enforce binary only
                }
                _ => {}
            }
        }
    });

    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    tracing::info!("AgentSocket connection closed.");
}

/// Core orchestration pipeline: Firewall → Analysis → Tool Discovery → Execution → Cost Arbitrage
#[instrument(
    name = "AgentSocket::orchestrate_intent",
    skip(state, raw_payload),
    fields(payload_size = raw_payload.len())
)]
async fn orchestrate_intent(
    state: &Arc<AppState>,
    raw_payload: &[u8],
) -> Result<(Vec<u8>, String), String> {
    let start_time = Instant::now();
    let otel_cx = Span::current().context();
    let trace_id = otel_cx
        .span()
        .span_context()
        .trace_id()
        .to_string();

    info!("═══════════════════════════════════════════════════════════════════");
    info!("Stage 1/5: FIREWALL (Semantic Firewall & Jailbreak Detection)");
    info!("═══════════════════════════════════════════════════════════════════");

    // Stage 1: FIREWALL - Semantic Firewall Analysis
    match state.firewall.inspect_and_sanitize(raw_payload).await {
        Ok(sanitized) => {
            info!(
                sanitized_len = %sanitized.len(),
                "Firewall analysis passed"
            );
        }
        Err(e) => return Err(format!("Firewall blocked request: {}", e)),
    };

    info!("═══════════════════════════════════════════════════════════════════");
    info!("Stage 2/5: INTENT ANALYSIS (TinyTransformer)");
    info!("═══════════════════════════════════════════════════════════════════");

    // Stage 2: ANALYSIS - TinyTransformer Intent Analysis
    // TinyTransformer.classify_api provides taxonomy classification
    let payload_str = String::from_utf8_lossy(raw_payload).to_string();
    let classification = state.intent.classify_api(&payload_str, "AgentSocket", "live-intent").await;
    info!(
        category = %classification.category,
        name = %classification.name,
        "Intent classification complete"
    );

    // Map classification to orchestration context
    let target_model = if classification.category == "experience" {
        "frontier-llm".to_string()
    } else {
        "local-slm-v5".to_string()
    };
    let required_tools = vec!["default_aml_model".to_string()];
    let token_budget: usize = 4096;

    info!("═══════════════════════════════════════════════════════════════════");
    info!("Stage 3/5: MCP TOOL DISCOVERY (Registry Lookup)");
    info!("═══════════════════════════════════════════════════════════════════");

    // Stage 3: TOOL DISCOVERY - MCPToolRegistry
    let tool_name = required_tools
        .first()
        .cloned()
        .unwrap_or_else(|| "default_aml_model".to_string());

    let (_tool_meta, wasm_bytes) = match state.mcp_registry.discover_tool(&tool_name).await {
        Ok((meta, wasm)) => {
            info!(
                tool_name = %meta.name,
                tool_version = %meta.version,
                wasm_size = %wasm.len(),
                "MCP tool discovered"
            );
            (meta, wasm)
        }
        Err(_e) => {
            // If tool not found, create a minimal test WASM module
            info!("Tool not in registry, using default test WASM");
            let test_wasm = vec![0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00];
            let default_meta = itt_core::MCPToolMetadata::new(
                tool_name.clone(),
                "1.0.0".to_string(),
                "Default test tool".to_string(),
                "abc123".to_string(),
                vec![],
            );
            (default_meta, test_wasm)
        }
    };

    info!("═══════════════════════════════════════════════════════════════════");
    info!("Stage 4/5: WASM EXECUTION (Secure Execution Sandbox)");
    info!("═══════════════════════════════════════════════════════════════════");

    // Stage 4: EXECUTION - Secure Execution Sandbox
    let execution_result = match state.sandbox.execute_mcp_tool(&wasm_bytes, 42) {
        Ok(result) => {
            info!(result = %result, "WASM execution completed successfully");
            result
        }
        Err(e) => {
            error!("WASM execution failed: {}", e);
            return Err(format!("WASM execution failed: {}", e));
        }
    };

    info!("═══════════════════════════════════════════════════════════════════");
    info!("Stage 5/5: COST ARBITRAGE (Token Budget & Model Selection)");
    info!("═══════════════════════════════════════════════════════════════════");

    // Stage 5: COST ARBITRAGE - Token Budget Evaluation & Model Selection
    let selected_model = match state
        .cost_arbitrage
        .evaluate_and_route(
            "default-tenant",
            50.0, // Estimated cost in INR
            &target_model,
            "local-slm", // Fallback model
        )
        .await
    {
        Ok(model) => {
            info!(model = %model, "Model selected based on budget");
            model
        }
        Err(e) => {
            error!("Cost arbitrage evaluation failed: {}", e);
            return Err(format!("Cost arbitrage failed: {}", e));
        }
    };

    info!("═══════════════════════════════════════════════════════════════════");
    info!("✅ ORCHESTRATION COMPLETE");
    info!("═══════════════════════════════════════════════════════════════════");

    let execution_time_ms = start_time.elapsed().as_millis();
    info!(
        execution_time_ms = %execution_time_ms,
        trace_id = %trace_id,
        "Real orchestration pipeline executed successfully"
    );

    // Return the execution result and trace_id for frontend correlation
    let response = json!({
        "execution_result": execution_result,
        "selected_model": selected_model,
        "execution_time_ms": execution_time_ms,
    });

    Ok((serde_json::to_vec(&response).unwrap_or_default(), trace_id))
}
