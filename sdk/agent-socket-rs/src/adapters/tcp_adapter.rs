use super::ProtocolAdapter;
use crate::protocol::{AgentSocketFrame, FrameType};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum TcpAdapterError {
    #[error("ISO 8583 parse error: {0}")]
    IsoParseError(String),
}

/// Raw L4 TCP Streaming Adapter
///
/// Converts raw L4 streaming protocols like ISO 8583 (Financial transactions)
/// to Agent Socket telemetry.
pub struct TcpAdapter {
    pub require_tls: bool,
}

impl TcpAdapter {
    pub fn new(require_tls: bool) -> Self {
        Self { require_tls }
    }
}

impl ProtocolAdapter for TcpAdapter {
    type Config = bool;
    type Error = TcpAdapterError;

    fn ingress(&self, raw_payload: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Stub: Parse ISO 8583 byte streams into an Intent Frame
        let iso_str = String::from_utf8_lossy(raw_payload);

        // Maps the standard banking format to internal Intent structures
        let frame = AgentSocketFrame::new(FrameType::Intent, iso_str.as_bytes().to_vec());

        serde_json::to_vec(&frame).map_err(|e| TcpAdapterError::IsoParseError(e.to_string()))
    }

    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Stub: Re-package response into raw ISO 8583 TCP frames
        let frame: AgentSocketFrame = serde_json::from_slice(socket_frame)
            .map_err(|e| TcpAdapterError::IsoParseError(e.to_string()))?;

        Ok(frame.payload)
    }
}
