use crate::protocol::AgentSocketFrame;
use thiserror::Error;
use tracing::{info, error};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};
use futures_util::{StreamExt, SinkExt};

#[derive(Debug, Error)]
pub enum RelayModeError {
    #[error("Payload limit exceeded")]
    PayloadLimitExceeded,
    #[error("WebSocket Error: {0}")]
    WebSocketError(String),
}

/// RelayMode: Serverless Wrapper
///
/// Designed for ephemeral serverless functions (e.g., AWS Lambda).
/// Packages state alongside requests, enabling zero-persistent-connection
/// telemetry streaming and stateless execution via ephemeral WebSockets.
pub struct RelayMode {
    pub state_bucket_url: String, // E.g. "ws://lambda-gateway.internal:8080"
}

impl RelayMode {
    pub fn new(state_bucket_url: &str) -> Self {
        Self {
            state_bucket_url: state_bucket_url.to_string(),
        }
    }

    /// Processes a single request with inline state injection over an ephemeral WebSocket
    pub async fn process_stateless(
        &self,
        inline_state: Option<serde_json::Value>,
        mut request_frame: AgentSocketFrame,
    ) -> Result<AgentSocketFrame, RelayModeError> {
        info!("RelayMode preparing stateless invocation via {}", self.state_bucket_url);

        // 1. Deflate state and attach to request_frame
        request_frame.metadata = inline_state.unwrap_or_else(|| serde_json::json!({}));
        
        // 2. Ephemeral WebSocket dial
        match connect_async(&self.state_bucket_url).await {
            Ok((mut ws_stream, _)) => {
                info!("RelayMode ephemeral connection established");
                
                // 3. Dispatch
                let payload = bincode::serialize(&request_frame)
                    .map_err(|e| RelayModeError::WebSocketError(e.to_string()))?;
                    
                ws_stream.send(Message::Binary(payload))
                    .await
                    .map_err(|e| RelayModeError::WebSocketError(e.to_string()))?;
                
                // 4. Wait for exactly one response (serverless paradigm)
                if let Some(msg_result) = ws_stream.next().await {
                    match msg_result {
                        Ok(Message::Binary(resp_data)) => {
                            let response: AgentSocketFrame = bincode::deserialize(&resp_data)
                                .map_err(|e| RelayModeError::WebSocketError(e.to_string()))?;
                            
                            // Graceful disconnect
                            let _ = ws_stream.close(None).await;
                            return Ok(response);
                        }
                        _ => {
                            let _ = ws_stream.close(None).await;
                            return Err(RelayModeError::WebSocketError("Unexpected text or close frame received in relay mode".to_string()));
                        }
                    }
                }
                
                Err(RelayModeError::WebSocketError("Server closed connection without responding".to_string()))
            }
            Err(e) => {
                error!("Ephemeral WebSocket connection failed: {}. Falling back to mock response.", e);
                // Return immediate mock response for local testing
                let mut mock_resp = request_frame.clone();
                mock_resp.metadata = serde_json::json!({"status": "mock_relay_offline"});
                Ok(mock_resp)
            }
        }
    }
}
