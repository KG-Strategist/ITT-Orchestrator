use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FrameType {
    Intent,
    Telemetry,
    Command,
    Response,
    Heartbeat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSocketFrame {
    pub version: String,
    pub frame_type: FrameType,
    pub payload: Vec<u8>,
    pub metadata: serde_json::Value,
}

impl AgentSocketFrame {
    pub fn new(frame_type: FrameType, payload: Vec<u8>) -> Self {
        Self {
            version: "1.0".to_string(),
            frame_type,
            payload,
            metadata: serde_json::json!({}),
        }
    }
}
