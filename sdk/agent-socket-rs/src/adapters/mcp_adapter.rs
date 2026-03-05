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
        // In a real implementation, this would parse an HTTP text block
        // representing an MCP request and map it to an intent.

        let req_text = String::from_utf8_lossy(raw_payload);

        // Simple stub translation
        let frame = AgentSocketFrame::new(FrameType::Intent, req_text.as_bytes().to_vec());

        serde_json::to_vec(&frame).map_err(|e| McpAdapterError::SerializationError(e.to_string()))
    }

    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Transcode from Agent Socket binary frame back into SSE/HTTP text stream

        let frame: AgentSocketFrame = serde_json::from_slice(socket_frame)
            .map_err(|e| McpAdapterError::ParseError(e.to_string()))?;

        let sse_msg = format!("data: {}\n\n", String::from_utf8_lossy(&frame.payload));
        Ok(sse_msg.into_bytes())
    }
}
