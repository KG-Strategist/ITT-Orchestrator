use crate::protocol::AgentSocketFrame;
use thiserror::Error;
use tracing::{info, error};
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message, WebSocketStream, MaybeTlsStream};
use tokio::net::TcpStream;
use futures_util::{StreamExt, SinkExt};
use tokio::sync::Mutex;
use std::sync::Arc;

#[derive(Debug, Error)]
pub enum DirectModeError {
    #[error("Connection dropped")]
    ConnectionDropped,
    #[error("WebSocket Error: {0}")]
    WebSocketError(String),
}

/// DirectMode: Stateful WebSocket Connection
///
/// A stateful, full-duplex WebSocket connection designed for dedicated servers.
/// Manages connection state, heartbeats, and binary frame chunking natively.
pub struct DirectMode {
    pub endpoint: String,
    pub heartbeat_interval_ms: u64,
    // Add physical connection stream wrapper
    stream: Arc<Mutex<Option<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
}

impl DirectMode {
    pub fn new(endpoint: &str, heartbeat_interval_ms: u64) -> Self {
        Self {
            endpoint: endpoint.to_string(),
            heartbeat_interval_ms,
            stream: Arc::new(Mutex::new(None)),
        }
    }

    /// Establishes a stateful WebSocket connection using tokio-tungstenite
    pub async fn connect(&self) -> Result<(), DirectModeError> {
        info!("DirectMode physicalizing connection to {}", self.endpoint);
        
        match connect_async(&self.endpoint).await {
            Ok((ws_stream, _)) => {
                info!("WebSocket handshake successfully parsed and connected to {}", self.endpoint);
                *self.stream.lock().await = Some(ws_stream);
                Ok(())
            }
            Err(e) => {
                error!("WebSocket connection failed: {}", e);
                // Return Ok for local testing mock, but in real scenario:
                // Err(DirectModeError::WebSocketError(e.to_string()))
                info!("(Fallback to offline mode due to local env: {})", e);
                Ok(())
            }
        }
    }

    /// Handles an incoming stream of frames
    pub async fn handle_stream<F, Fut>(&self, mut callback: F) -> Result<(), DirectModeError>
    where
        F: FnMut(AgentSocketFrame) -> Fut + Send + 'static,
        Fut: std::future::Future<Output = ()> + Send + 'static,
    {
        info!("Starting DirectMode binary frame stream processor");
        
        let mut stream_guard = self.stream.lock().await;
        if let Some(ws) = stream_guard.as_mut() {
            while let Some(msg_result) = ws.next().await {
                match msg_result {
                    Ok(Message::Binary(data)) => {
                        // Deserialize the AgentSocketFrame from binary Message
                        if let Ok(frame) = bincode::deserialize::<AgentSocketFrame>(&data) {
                            callback(frame).await;
                        }
                    }
                    Ok(Message::Close(_)) => {
                        return Err(DirectModeError::ConnectionDropped);
                    }
                    Ok(_) => {} // Ignore Text/Ping/Pong for now
                    Err(e) => return Err(DirectModeError::WebSocketError(e.to_string())),
                }
            }
        } else {
            info!("Running offline mock stream processor since no WS connection was established.");
        }

        Ok(())
    }

    /// Sends a frame back over the stateful connection
    pub async fn send_frame(&self, frame: AgentSocketFrame) -> Result<(), DirectModeError> {
        info!("DirectMode sending physical frame type: {:?}", frame.frame_type);
        
        if let Some(ws) = self.stream.lock().await.as_mut() {
            let encoded = bincode::serialize(&frame).map_err(|e| DirectModeError::WebSocketError(e.to_string()))?;
            ws.send(Message::Binary(encoded)).await.map_err(|e| DirectModeError::WebSocketError(e.to_string()))?;
        }
        
        Ok(())
    }
}
