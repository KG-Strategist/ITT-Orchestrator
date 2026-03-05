use crate::protocol::AgentSocketFrame;
use thiserror::Error;
use tracing::info;

#[derive(Debug, Error)]
pub enum RelayModeError {
    #[error("Payload limit exceeded")]
    PayloadLimitExceeded,
}

/// RelayMode: Serverless Wrapper
///
/// Designed for ephemeral serverless functions (e.g., AWS Lambda).
/// Packages state alongside requests, enabling zero-persistent-connection
/// telemetry streaming and stateless execution.
pub struct RelayMode {
    pub state_bucket_url: String,
}

impl RelayMode {
    pub fn new(state_bucket_url: &str) -> Self {
        Self {
            state_bucket_url: state_bucket_url.to_string(),
        }
    }

    /// Processes a single request with inline state injection
    pub async fn process_stateless(
        &self,
        inline_state: Option<serde_json::Value>,
        request_frame: AgentSocketFrame,
    ) -> Result<AgentSocketFrame, RelayModeError> {
        info!("RelayMode processing stateless lambda invocation");

        // In a real implementation:
        // 1. Inflate state from inline_state or via state_bucket_url
        // 2. Execute business logic on request_frame
        // 3. Deflate state and attach to response_frame

        let mut response = request_frame.clone();
        response.metadata = inline_state.unwrap_or_else(|| serde_json::json!({}));

        Ok(response)
    }
}
