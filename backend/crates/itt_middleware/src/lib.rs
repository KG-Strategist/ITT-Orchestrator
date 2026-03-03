//! ITT-Orchestrator Middleware
//!
//! This crate implements the core middleware for Zone 4 (The Cognitive Edge)
//! of the Adaptive Gateway Fabric (AGF), adhering to the SEAG specifications.

pub mod gvm;
pub mod firewall;
pub mod arbitrage;
pub mod toon;

// Re-exporting the modules for easier access
pub use gvm::{VirtualTrustZone, ConnectivityRequest};
pub use firewall::{Zone4SemanticFirewall, RealTimeTrustScore};
pub use arbitrage::{Zone4CostArbitrage, FinancialTokenBucket};
pub use toon::ToonTransformer;

/// MELT Observability (OpenTelemetry)
///
/// Ensures the middleware expects to operate over a full-duplex binary WebSocket
/// stream (Agent Socket Protocol) and utilizes OpenTelemetry (MELT) to log the AI's
/// specific "Chain of Thought" (Prompt → Trust Score → Tool Selected → Output).
pub mod telemetry {
    use tracing::{info, instrument};

    /// Logs the AI's specific "Chain of Thought" using OpenTelemetry tracing.
    #[instrument(name = "AgentSocket::chain_of_thought", skip(prompt, output))]
    pub fn log_chain_of_thought(
        prompt: &str,
        trust_score: f32,
        tool_selected: &str,
        output: &str,
    ) {
        info!(
            prompt_len = prompt.len(),
            trust_score = %trust_score,
            tool_selected = %tool_selected,
            output_len = output.len(),
            "Chain of Thought Logged"
        );
    }
}
