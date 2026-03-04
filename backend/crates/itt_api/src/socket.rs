use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde_json::json;
use std::sync::Arc;
use crate::AppState;

pub async fn agent_socket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    tracing::info!("AgentSocket connected. Upgraded to full-duplex binary stream.");
    
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.melt_tx.subscribe();

    // Spawn a task to handle outgoing messages from the broadcast channel
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let log_bytes = match serde_json::to_vec(&msg) {
                Ok(bytes) => bytes,
                Err(e) => {
                    tracing::error!("Failed to serialize log message: {}", e);
                    continue;
                }
            };
            if sender.send(Message::Binary(log_bytes)).await.is_err() {
                tracing::info!("AgentSocket disconnected during MELT stream.");
                break;
            }
        }
    });

    // Spawn a task to handle incoming messages
    let melt_tx = state.melt_tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Binary(data) => {
                    tracing::info!("AgentSocket received binary frame: {} bytes", data.len());
                    
                    if let Ok(text) = String::from_utf8(data) {
                        if let Ok(payload) = serde_json::from_str::<serde_json::Value>(&text) {
                            if payload["action"] == "start_simulation" {
                                // Trigger real events instead of sleep loop
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[INFO] Intent Received: Suspicious Transaction", "color": "text-blue-400" }));
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[SECURITY] Semantic Firewall: RealTimeTrustScore 98/100 -> PASSED", "color": "text-emerald-400" }));
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[TOOL] Context Injector: Pre-fetching Knowledge Graph from MongoDB...", "color": "text-cyan-400" }));
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[FEDERATION] Applying Local Differential Privacy (LDP)...", "color": "text-violet-400" }));
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[ARBITRAGE] Routing to Internal SLM (Cost: $0.00) vs Frontier LLM (Cost: $0.05)", "color": "text-amber-400" }));
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[EXECUTION] MCP Tool 'Global AML Model' invoked successfully.", "color": "text-emerald-400" }));
                                let _ = melt_tx.send(json!({ "type": "log", "message": "[INFO] Simulation Complete. Ready for GVM Deployment.", "color": "text-white" }));
                                let _ = melt_tx.send(json!({ "type": "status", "status": "complete" }));
                            }
                        }
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
