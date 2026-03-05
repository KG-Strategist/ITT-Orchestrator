//! Federated Learning (FL) Updates & Privacy
//!
//! Allows individual Data Planes (execution edges) to compute localized model
//! weight updates. Applies Local Differential Privacy (LDP) or Homomorphic
//! Encryption (HE) to these weights before sending them back to the Central
//! Control Plane for global aggregation, ensuring raw PII is never exposed.

use std::future::Future;

/// Represents localized model weight updates computed on the edge.
#[derive(Debug, Clone)]
pub struct LocalModelWeights {
    pub gradients: Vec<f32>,
}

/// Represents the encrypted/privatized weights ready for global aggregation.
#[derive(Debug, Clone)]
pub struct PrivatizedModelWeights {
    pub encrypted_gradients: Vec<u8>,
    pub privacy_epsilon: f64,
}

/// The Federated Learner trait for the Orchestrator.
pub trait FederatedLearner: Send + Sync {
    type Error;

    /// Computes localized model weight updates based on recent edge executions.
    fn compute_local_updates(
        &self,
    ) -> impl Future<Output = Result<LocalModelWeights, Self::Error>> + Send;

    /// Applies Local Differential Privacy (LDP) or Homomorphic Encryption (HE)
    /// to the localized weights, ensuring raw PII is never exposed.
    fn apply_privacy_mechanisms(
        &self,
        weights: LocalModelWeights,
    ) -> impl Future<Output = Result<PrivatizedModelWeights, Self::Error>> + Send;

    /// Syncs the privatized weights with the Central Control Plane for global aggregation.
    fn sync_with_control_plane(
        &self,
        privatized_weights: PrivatizedModelWeights,
    ) -> impl Future<Output = Result<(), Self::Error>> + Send;
}
