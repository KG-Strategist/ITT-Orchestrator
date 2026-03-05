use crate::protocol::AgentSocketFrame;
use thiserror::Error;
use tracing::info;

#[derive(Debug, Error)]
pub enum DirectModeError {
    #[error("Connection dropped")]
    ConnectionDropped,
}

/// DirectMode: Stateful WebSocket Connection
///
/// A stateful, full-duplex WebSocket connection designed for dedicated servers.
/// Manages connection state, heartbeats, and binary frame chunking natively.
pub struct DirectMode {
    pub endpoint: String,
    pub heartbeat_interval_ms: u64,
}

impl DirectMode {
    pub fn new(endpoint: &str, heartbeat_interval_ms: u64) -> Self {
        Self {
            endpoint: endpoint.to_string(),
            heartbeat_interval_ms,
        }
    }

    /// Simulates establishing a stateful WebSocket connection
    pub async fn connect(&self) -> Result<(), DirectModeError> {
        info!("DirectMode connecting to {}", self.endpoint);
        Ok(())
    }

    /// Handles an incoming stream of frames
    pub async fn handle_stream<F, Fut>(&self, _callback: F) -> Result<(), DirectModeError>
    where
        F: FnMut(AgentSocketFrame) -> Fut + Send + 'static,
        Fut: std::future::Future<Output = ()> + Send + 'static,
    {
        info!("Starting DirectMode binary frame stream processor");
        // In a real implementation, this would read from the tungstenite WebSocket receiver

        Ok(())
    }

    /// Sends a frame back over the stateful connection
    pub async fn send_frame(&self, frame: AgentSocketFrame) -> Result<(), DirectModeError> {
        info!("DirectMode sending frame type: {:?}", frame.frame_type);
        Ok(())
    }
}
