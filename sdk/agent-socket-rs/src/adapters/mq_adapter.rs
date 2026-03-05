use super::ProtocolAdapter;
use base64::prelude::*;
use crate::protocol::{AgentSocketFrame, FrameType};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MqAdapterError {
    #[error("Queue format error: {0}")]
    FormatError(String),
}

/// Mesh-to-Queue Bridge
///
/// Transcodes WebSocket intents directly into JMS or Kafka producer records,
/// allowing enterprise message buses to consume AI telemetry natively.
pub struct MqAdapter {
    pub broker_type: String, // e.g., "KAFKA", "RABBITMQ"
}

impl MqAdapter {
    pub fn new(broker_type: &str) -> Self {
        Self {
            broker_type: broker_type.to_string(),
        }
    }
}

impl ProtocolAdapter for MqAdapter {
    type Config = String;
    type Error = MqAdapterError;

    fn ingress(&self, raw_payload: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Maps a Kafka topic record to an Agent Socket Telemetry/Command frame
        let frame = AgentSocketFrame::new(FrameType::Command, raw_payload.to_vec());

        serde_json::to_vec(&frame).map_err(|e| MqAdapterError::FormatError(e.to_string()))
    }

    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Maps Agent Socket Telemetry frames into Kafka/JMS topics
        let frame: AgentSocketFrame = serde_json::from_slice(socket_frame)
            .map_err(|e| MqAdapterError::FormatError(e.to_string()))?;

        // Stub: Wrap payload in a JSON envelope suitable for Kafka
        let kafka_record = serde_json::json!({
            "topic": "ai-telemetry",
            "key": frame.version,
            "value": BASE64_STANDARD.encode(&frame.payload),
        });

        serde_json::to_vec(&kafka_record).map_err(|e| MqAdapterError::FormatError(e.to_string()))
    }
}
