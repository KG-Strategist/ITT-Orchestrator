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
        // Physicalized ISO 8583 Parsing 
        // Extract Message Type Indicator (MTI) for content-based routing in the Gateway
        
        let mut mti = String::from("0000"); // default
        
        // Unpacked string routing fallback for ISO8583
        if raw_payload.len() >= 4 {
            mti = String::from_utf8_lossy(&raw_payload[0..4]).to_string();
        }

        tracing::info!("TCP Adapter Extracted ISO 8583 MTI: {}", mti);

        // Map the legacy frame to a modernized AgentSocket Intent Frame
        let mut frame = AgentSocketFrame::new(FrameType::Intent, raw_payload.to_vec());
        frame.metadata = serde_json::json!({
            "protocol": "ISO_8583",
            "mti": mti,
            "tls_terminated": self.require_tls
        });

        serde_json::to_vec(&frame).map_err(|e| TcpAdapterError::IsoParseError(e.to_string()))
    }

    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Reverse-package: extract the raw payload to stream back out to the TCP socket
        let frame: AgentSocketFrame = serde_json::from_slice(socket_frame)
            .map_err(|e| TcpAdapterError::IsoParseError(e.to_string()))?;

        Ok(frame.payload)
    }
}
