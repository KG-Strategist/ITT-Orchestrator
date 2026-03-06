//! Federated Aggregator (Project Aurora)
//!
//! Orchestrates Collaborative Analysis and Learning (CAL 4) for Decentralized Cross-Border AML.
//! Supports receiving model weight updates (gradients) from distributed client nodes,
//! applying Local Differential Privacy (LDP) noise, and performing Federated Averaging (FedAvg).

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, instrument, warn};

use crate::privacy::{LdpEngine, LocalDifferentialPrivacy};
use itt_middleware::error::AppError;

/// Represents a model update from a client node.
#[derive(Debug, Clone)]
pub struct ModelUpdate {
    pub client_id: String,
    pub gradients: Vec<f32>,
    pub num_samples: usize,
}

/// The Federated Aggregator orchestrating CAL 4.
pub struct FederatedAggregator {
    pub global_model_weights: Arc<Mutex<Vec<f32>>>,
    pub pending_updates: Arc<Mutex<Vec<ModelUpdate>>>,
    pub ldp_engine: Option<LdpEngine>,
    pub aggregation_threshold: usize,
}

impl FederatedAggregator {
    pub fn new(
        initial_weights: Vec<f32>,
        aggregation_threshold: usize,
        ldp_engine: Option<LdpEngine>,
    ) -> Self {
        Self {
            global_model_weights: Arc::new(Mutex::new(initial_weights)),
            pending_updates: Arc::new(Mutex::new(Vec::new())),
            ldp_engine,
            aggregation_threshold,
        }
    }

    /// Asynchronously receives a model update from a client node.
    #[instrument(name = "FederatedAggregator::receive_update", skip(self, update))]
    pub async fn receive_update(&self, mut update: ModelUpdate) -> Result<(), AppError> {
        info!(
            client_id = %update.client_id,
            num_samples = %update.num_samples,
            "Received model update from client."
        );

        // Apply Local Differential Privacy (LDP) noise if configured
        if let Some(ref ldp) = self.ldp_engine {
            ldp.apply_noise(&mut update.gradients);
            info!(
                "Applied LDP Laplace noise to gradients for client {}",
                update.client_id
            );
        }

        let mut pending = self.pending_updates.lock().await;
        pending.push(update);

        if pending.len() >= self.aggregation_threshold {
            info!("Aggregation threshold reached. Triggering FedAvg.");
            let updates_to_aggregate = pending.clone();
            pending.clear();
            drop(pending); // Release the lock before aggregating

            if let Err(e) = self.fed_avg(updates_to_aggregate).await {
                error!("FedAvg failed: {}", e);
            }
        }

        Ok(())
    }

    /// Performs true Federated Averaging (FedAvg) mathematical aggregation on client weight updates.
    /// Aggregation function: w_(t+1) = \sum_{k=1}^K (n_k / n) w_{t+1}^k
    #[instrument(name = "FederatedAggregator::fed_avg", skip(self, updates))]
    pub async fn fed_avg(&self, updates: Vec<ModelUpdate>) -> Result<Vec<f32>, AppError> {
        if updates.is_empty() {
            return Err(AppError::InternalError("No updates provided.".to_string()));
        }

        let mut global_weights = self.global_model_weights.lock().await;
        let num_weights = global_weights.len();

        for update in &updates {
            if update.gradients.len() != num_weights {
                return Err(AppError::InternalError(format!(
                    "Dimension mismatch: expected {}, got {} from client {}",
                    num_weights,
                    update.gradients.len(),
                    update.client_id
                )));
            }
        }

        // Sum(n_k) -> Total samples across all reporting clients
        let total_samples: usize = updates.iter().map(|u| u.num_samples).sum();
        if total_samples == 0 {
            return Err(AppError::InternalError("Total samples is zero.".to_string()));
        }

        // Calculate the accurate weighted average of model gradients based on client sample magnitude
        let mut averaged_gradients = vec![0.0; num_weights];
        for update in &updates {
            let fractional_weight = update.num_samples as f32 / total_samples as f32;
            for (i, grad) in update.gradients.iter().enumerate() {
                averaged_gradients[i] += grad * fractional_weight;
            }
        }

        // Standard FedAvg dictates we update the global schema incrementally
        let learning_rate = 1.0; // In pure FedAvg with no server momentum, LR=1.0 is direct replacement or offset
        for (i, avg_grad) in averaged_gradients.iter().enumerate() {
            global_weights[i] += learning_rate * avg_grad;
        }

        info!(
            num_clients = %updates.len(),
            total_samples = %total_samples,
            learning_rate = %learning_rate,
            "Successfully completed mathematical FedAvg and updated global model."
        );

        Ok(global_weights.clone())
    }
}
