//! Federated Aggregator (Project Aurora)
//!
//! Orchestrates Collaborative Analysis and Learning (CAL 4) for Decentralized Cross-Border AML.
//! Supports receiving model weight updates (gradients) from distributed client nodes,
//! applying Local Differential Privacy (LDP) noise, and performing Federated Averaging (FedAvg).

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, warn, error, instrument};

use itt_middleware::error::AppError;
use crate::privacy::{LocalDifferentialPrivacy, LdpEngine};

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
    pub fn new(initial_weights: Vec<f32>, aggregation_threshold: usize, ldp_engine: Option<LdpEngine>) -> Self {
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
            info!("Applied LDP noise to gradients for client {}", update.client_id);
        }

        let mut pending = self.pending_updates.lock().await;
        pending.push(update);

        if pending.len() >= self.aggregation_threshold {
            info!("Aggregation threshold reached. Triggering FedAvg.");
            // In a real system, we might spawn a task to do this asynchronously
            // For now, we'll do it inline or signal a worker.
            // We can't easily call an async function that takes `&mut pending` while holding the lock,
            // so we'll clone the updates and clear the pending list.
            let updates_to_aggregate = pending.clone();
            pending.clear();
            drop(pending); // Release the lock before aggregating

            if let Err(e) = self.fed_avg(updates_to_aggregate).await {
                error!("FedAvg failed: {}", e);
            }
        }

        Ok(())
    }

    /// Performs Federated Averaging (FedAvg) on a batch of model updates.
    #[instrument(name = "FederatedAggregator::fed_avg", skip(self, updates))]
    pub async fn fed_avg(&self, updates: Vec<ModelUpdate>) -> Result<(), AppError> {
        if updates.is_empty() {
            return Ok(());
        }

        let mut global_weights = self.global_model_weights.lock().await;
        let num_weights = global_weights.len();

        // Ensure all updates have the correct dimensions
        for update in &updates {
            if update.gradients.len() != num_weights {
                return Err(AppError::InternalError(format!(
                    "Dimension mismatch: expected {}, got {} from client {}",
                    num_weights, update.gradients.len(), update.client_id
                )));
            }
        }

        let total_samples: usize = updates.iter().map(|u| u.num_samples).sum();
        if total_samples == 0 {
            return Err(AppError::InternalError("Total samples is zero.".to_string()));
        }

        // Calculate the weighted average of gradients
        let mut averaged_gradients = vec![0.0; num_weights];
        for update in &updates {
            let weight = update.num_samples as f32 / total_samples as f32;
            for (i, grad) in update.gradients.iter().enumerate() {
                averaged_gradients[i] += grad * weight;
            }
        }

        // Update the global model weights
        // In a real scenario, we might use a learning rate here: global_weights[i] -= lr * averaged_gradients[i]
        // For simplicity, we'll just add the averaged gradients (assuming they are weight deltas)
        for (i, avg_grad) in averaged_gradients.iter().enumerate() {
            global_weights[i] += avg_grad;
        }

        info!(
            num_clients = %updates.len(),
            total_samples = %total_samples,
            "Successfully completed FedAvg and updated global model."
        );

        Ok(())
    }
}
