use super::ProtocolAdapter;
use crate::protocol::{AgentSocketFrame, FrameType};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum McpAdapterError {
    #[error("Failed to parse MCP HTTP/SSE payload: {0}")]
    ParseError(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

/// Model Context Protocol Transcoder
///
/// Intercepts standard Model Context Protocol (HTTP+SSE) and transcodes
/// the SSE text streams into dense Agent Socket binary frames.
#[derive(Default)]
pub struct McpAdapter {
    pub allow_experimental_features: bool,
}

impl McpAdapter {
    pub fn new(allow_experimental_features: bool) -> Self {
        Self {
            allow_experimental_features,
        }
    }
}

// impl removed for #[derive(Default)]

impl ProtocolAdapter for McpAdapter {
    type Config = bool;
    type Error = McpAdapterError;

    fn ingress(&self, raw_payload: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Physicalized MCP Ingress: Parse Server-Sent Events (SSE) data blocks
        let req_text = String::from_utf8_lossy(raw_payload);
        
        // Extract the actual JSON payload from the SSE format: "data: {json}\n\n"
        let data_payload = req_text
            .lines()
            .find(|line| line.starts_with("data: "))
            .map(|line| line.trim_start_matches("data: ").trim())
            .unwrap_or(req_text.as_ref());

        let mut frame = AgentSocketFrame::new(FrameType::Intent, data_payload.as_bytes().to_vec());
        frame.metadata = serde_json::json!({
            "protocol": "MCP_SSE",
            "experimental": self.allow_experimental_features
        });

        serde_json::to_vec(&frame).map_err(|e| McpAdapterError::SerializationError(e.to_string()))
    }

    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Physicalized MCP Egress: Transcode AgentSocket binary to strict SSE format
        let frame: AgentSocketFrame = serde_json::from_slice(socket_frame)
            .map_err(|e| McpAdapterError::ParseError(e.to_string()))?;

        // Format exactly as required by the Model Context Protocol
        let sse_msg = format!("event: agent_socket_response\ndata: {}\n\n", String::from_utf8_lossy(&frame.payload));
        Ok(sse_msg.into_bytes())
    }
}
