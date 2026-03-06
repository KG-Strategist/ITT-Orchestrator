use super::ProtocolAdapter;
use base64::prelude::*;
use crate::protocol::{AgentSocketFrame, FrameType};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MqAdapterError {
    #[error("Queue format error: {0}")]
    FormatError(String),
    #[error("Kafka producer error: {0}")]
    KafkaError(String),
}

// ─────────────────────────────────────────────────────────────────────────────
//  GVM Manifest Protocol Adapter Configuration
// ─────────────────────────────────────────────────────────────────────────────

/// Configuration extracted from the GVM Manifest's `protocol_adapters` section.
/// Populated by the No-Code Extensibility Hub frontend.
#[derive(Debug, Clone, serde::Deserialize)]
pub struct KafkaAdapterConfig {
    pub broker_url: String,
    pub port: u16,
    pub topic_prefix: Option<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
//  Kafka Producer (Physicalized v1.1.0)
// ─────────────────────────────────────────────────────────────────────────────

use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;

/// Mesh-to-Queue Bridge — Physicalized with rdkafka
///
/// Transcodes Agent Socket binary frames directly into Kafka producer records,
/// allowing enterprise message buses (Confluent, MSK, RedPanda) to consume
/// AI agent telemetry and intent payloads natively.
///
/// # Architecture
/// ```
///  [Agent Socket WebSocket] → MqAdapter.egress() → [Kafka Topic]
///  [Kafka Topic] → MqAdapter.ingress() → [Agent Socket Frame]
/// ```
pub struct MqAdapter {
    pub broker_type: String,
    /// Kafka producer — initialized when `connect()` is called with a GVM config.
    producer: Option<FutureProducer>,
    /// Topic prefix from GVM manifest (e.g., "aml.txn.")
    topic_prefix: String,
    /// Bootstrap servers string (e.g., "kafka.internal.bank.com:9092")
    bootstrap_servers: String,
}

impl MqAdapter {
    /// Create a new MQ Adapter (not yet connected).
    pub fn new(broker_type: &str) -> Self {
        Self {
            broker_type: broker_type.to_string(),
            producer: None,
            topic_prefix: String::new(),
            bootstrap_servers: String::new(),
        }
    }

    /// Connect to a Kafka cluster using configuration from the GVM manifest.
    ///
    /// Called by the Control Plane when it deserializes the `protocol_adapters`
    /// section from the YAML manifest submitted by the No-Code Extensibility Hub.
    pub fn connect_from_manifest(&mut self, config: &KafkaAdapterConfig) -> Result<(), MqAdapterError> {
        let bootstrap = format!("{}:{}", config.broker_url, config.port);
        tracing::info!(
            bootstrap_servers = %bootstrap,
            topic_prefix = ?config.topic_prefix,
            "Initializing Kafka producer from GVM manifest"
        );

        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &bootstrap)
            .set("message.timeout.ms", "5000")
            .set("queue.buffering.max.ms", "0") // Low-latency: no batching
            .set("acks", "all")                 // Durability: wait for all ISR
            .set("enable.idempotence", "true")  // Exactly-once semantics
            .create()
            .map_err(|e| MqAdapterError::KafkaError(format!("Producer creation failed: {}", e)))?;

        self.producer = Some(producer);
        self.topic_prefix = config.topic_prefix.clone().unwrap_or_default();
        self.bootstrap_servers = bootstrap;

        tracing::info!("Kafka producer connected successfully");
        Ok(())
    }

    /// Publish an Agent Socket frame to a Kafka topic.
    ///
    /// The frame payload is base64-encoded and wrapped in a JSON envelope
    /// with metadata for downstream consumers (Spark, Flink, ksqlDB).
    pub async fn publish_frame(
        &self,
        topic: &str,
        frame: &AgentSocketFrame,
    ) -> Result<(), MqAdapterError> {
        let producer = self.producer.as_ref().ok_or_else(|| {
            MqAdapterError::KafkaError(
                "Producer not initialized — call connect_from_manifest() first".into(),
            )
        })?;

        let full_topic = format!("{}{}", self.topic_prefix, topic);

        // Serialize the frame to a Kafka-compatible JSON envelope
        let payload = serde_json::json!({
            "schema_version": "1.0",
            "frame_type": format!("{:?}", frame.frame_type),
            "frame_version": frame.version,
            "payload_b64": BASE64_STANDARD.encode(&frame.payload),
            "metadata": {
                "source": "agent-socket-rs",
                "broker": &self.bootstrap_servers,
                "timestamp_ms": std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis(),
            }
        });

        let payload_bytes = serde_json::to_vec(&payload)
            .map_err(|e| MqAdapterError::FormatError(e.to_string()))?;

        // Use the frame version as the Kafka message key (partition routing)
        let key = frame.version.to_string();

        let record = FutureRecord::to(&full_topic)
            .key(&key)
            .payload(&payload_bytes);

        producer
            .send(record, Duration::from_secs(5))
            .await
            .map_err(|(err, _)| {
                MqAdapterError::KafkaError(format!(
                    "Failed to publish to {}: {}",
                    full_topic, err
                ))
            })?;

        tracing::info!(
            topic = %full_topic,
            key = %key,
            payload_size = payload_bytes.len(),
            "Agent Socket frame published to Kafka"
        );

        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ProtocolAdapter trait impl (backward compat — synchronous path)
// ─────────────────────────────────────────────────────────────────────────────

impl ProtocolAdapter for MqAdapter {
    type Config = String;
    type Error = MqAdapterError;

    fn ingress(&self, raw_payload: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Parse a Kafka consumer record → Agent Socket frame
        // Attempts to extract the base64 payload from the JSON envelope
        if let Ok(envelope) = serde_json::from_slice::<serde_json::Value>(raw_payload) {
            if let Some(b64) = envelope.get("payload_b64").and_then(|v| v.as_str()) {
                let decoded = BASE64_STANDARD
                    .decode(b64)
                    .map_err(|e| MqAdapterError::FormatError(format!("Base64 decode: {}", e)))?;
                let frame = AgentSocketFrame::new(FrameType::Command, decoded);
                return serde_json::to_vec(&frame)
                    .map_err(|e| MqAdapterError::FormatError(e.to_string()));
            }
        }

        // Fallback: treat raw bytes as an opaque command payload
        let frame = AgentSocketFrame::new(FrameType::Command, raw_payload.to_vec());
        serde_json::to_vec(&frame).map_err(|e| MqAdapterError::FormatError(e.to_string()))
    }

    fn egress(&self, socket_frame: &[u8]) -> Result<Vec<u8>, Self::Error> {
        // Maps Agent Socket frames into Kafka-compatible JSON envelopes
        let frame: AgentSocketFrame = serde_json::from_slice(socket_frame)
            .map_err(|e| MqAdapterError::FormatError(e.to_string()))?;

        let kafka_record = serde_json::json!({
            "schema_version": "1.0",
            "topic": format!("{}ai-telemetry", self.topic_prefix),
            "key": frame.version,
            "frame_type": format!("{:?}", frame.frame_type),
            "payload_b64": BASE64_STANDARD.encode(&frame.payload),
            "broker": &self.bootstrap_servers,
        });

        serde_json::to_vec(&kafka_record).map_err(|e| MqAdapterError::FormatError(e.to_string()))
    }
}
