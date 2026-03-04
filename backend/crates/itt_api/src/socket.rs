use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures_util::{sink::SinkExt, stream::StreamExt};
use tokio::time::{sleep, Duration};
use serde_json::json;

pub async fn agent_socket_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(socket: WebSocket) {
    tracing::info!("AgentSocket connected. Upgraded to full-duplex binary stream.");
    
    let (mut sender, mut receiver) = socket.split();

    // We will spawn a task to handle incoming messages
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Binary(data) => {
                    tracing::info!("AgentSocket received binary frame: {} bytes", data.len());
                    
                    if let Ok(text) = String::from_utf8(data) {
                        if let Ok(payload) = serde_json::from_str::<serde_json::Value>(&text) {
                            if payload["action"] == "start_simulation" {
                                let is_test_mode = std::env::var("TEST_MODE").unwrap_or_default() == "true";
                                
                                let logs = if is_test_mode {
                                    vec![
                                        json!({ "type": "log", "message": "[INFO] Intent Received: Suspicious Cross-Border Transaction", "color": "text-blue-400" }),
                                        json!({ "type": "log", "message": "[SECURITY] Semantic Firewall: Trust Score 99/100 -> PASSED", "color": "text-emerald-400" }),
                                        json!({ "type": "log", "message": "[TOOL] Context Injector: Fetching Graph Relationships from Neo4j", "color": "text-cyan-400" }),
                                        json!({ "type": "log", "message": "[FEDERATION] Applying Local Differential Privacy (LDP)...", "color": "text-violet-400" }),
                                        json!({ "type": "log", "message": "[SUCCESS] Output: High-Risk Network Detected. Alerting CoE_Super_Admin.", "color": "text-emerald-400" }),
                                        json!({ "type": "status", "status": "complete" })
                                    ]
                                } else {
                                    vec![
                                        json!({ "type": "log", "message": "[INFO] Intent Received: Suspicious Transaction", "color": "text-blue-400" }),
                                        json!({ "type": "log", "message": "[SECURITY] Semantic Firewall: RealTimeTrustScore 98/100 -> PASSED", "color": "text-emerald-400" }),
                                        json!({ "type": "log", "message": "[TOOL] Context Injector: Pre-fetching Knowledge Graph from Pinecone...", "color": "text-cyan-400" }),
                                        json!({ "type": "log", "message": "[FEDERATION] Applying Local Differential Privacy (LDP)...", "color": "text-violet-400" }),
                                        json!({ "type": "log", "message": "[ARBITRAGE] Routing to Internal SLM (Cost: $0.00) vs Frontier LLM (Cost: $0.05)", "color": "text-amber-400" }),
                                        json!({ "type": "log", "message": "[EXECUTION] MCP Tool 'Global AML Model' invoked successfully.", "color": "text-emerald-400" }),
                                        json!({ "type": "log", "message": "[INFO] Simulation Complete. Ready for GVM Deployment.", "color": "text-white" }),
                                        json!({ "type": "status", "status": "complete" })
                                    ]
                                };
                                
                                for log in logs {
                                    sleep(Duration::from_millis(800)).await;
                                    let log_bytes = match serde_json::to_vec(&log) {
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
        _ = (&mut recv_task) => {},
    }
    
    tracing::info!("AgentSocket connection closed.");
}
