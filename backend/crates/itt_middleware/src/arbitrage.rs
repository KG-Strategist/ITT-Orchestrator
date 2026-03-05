//! Cost Arbitrage (Financial Token Bucket)
//!
//! Implements a rate limiter based on mathematical Token Consumption (monetary spend),
//! not just requests-per-second. If an agent exhausts its budget, it triggers
//! "Graceful Degradation" (routing to a free internal SLM) or returns a 402-style
//! internal circuit-breaker response.

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{error, info, instrument, warn};

use crate::error::AppError;

/// Represents a financial token bucket for an agent or tenant.
#[derive(Debug, Clone)]
pub struct FinancialTokenBucket {
    pub accumulated_spend_inr: f64,
    pub daily_budget_inr: f64,
}

/// The Cost Arbitrage Middleware for Zone 4.
pub struct Zone4CostArbitrage {
    pub budgets: Arc<Mutex<std::collections::HashMap<String, FinancialTokenBucket>>>,
}

impl Zone4CostArbitrage {
    pub fn new() -> Self {
        Self {
            budgets: Arc::new(Mutex::new(std::collections::HashMap::new())),
        }
    }

    /// Allocates a budget for a specific tenant or agent.
    pub async fn allocate_budget(&self, tenant_id: &str, budget_inr: f64) {
        let mut budgets = self.budgets.lock().await;
        budgets.insert(
            tenant_id.to_string(),
            FinancialTokenBucket {
                accumulated_spend_inr: 0.0,
                daily_budget_inr: budget_inr,
            },
        );
    }

    /// Evaluates the cost of an intent and routes to the appropriate model.
    /// Triggers Graceful Degradation if the budget is >95% exhausted.
    #[instrument(
        name = "CostArbitrage::evaluate_and_route",
        skip(self, tenant_id, estimated_cost_inr)
    )]
    pub async fn evaluate_and_route(
        &self,
        tenant_id: &str,
        estimated_cost_inr: f64,
        requested_model: &str,
        fallback_model: &str,
    ) -> Result<String, AppError> {
        let mut budgets = self.budgets.lock().await;

        if let Some(bucket) = budgets.get_mut(tenant_id) {
            let new_spend = bucket.accumulated_spend_inr + estimated_cost_inr;

            // Hard limit: 100% exhaustion
            if new_spend >= bucket.daily_budget_inr {
                error!(
                    tenant_id = %tenant_id,
                    current_spend = %bucket.accumulated_spend_inr,
                    max_budget = %bucket.daily_budget_inr,
                    "Financial Token Bucket fully exhausted. Returning 402 Circuit Breaker."
                );
                return Err(AppError::RateLimitExceeded(format!(
                    "Wallet Drained: Daily budget of ₹{} exceeded.",
                    bucket.daily_budget_inr
                )));
            }

            // Graceful Degradation: >95% exhaustion
            let exhaustion_ratio = new_spend / bucket.daily_budget_inr;
            if exhaustion_ratio > 0.95 {
                warn!(
                    tenant_id = %tenant_id,
                    exhaustion_ratio = %exhaustion_ratio,
                    "Budget >95% exhausted. Triggering Graceful Degradation to SLM."
                );
                bucket.accumulated_spend_inr = new_spend;
                return Ok(fallback_model.to_string());
            }

            // Normal routing
            bucket.accumulated_spend_inr = new_spend;
            info!(
                tenant_id = %tenant_id,
                new_spend = %bucket.accumulated_spend_inr,
                "Budget approved. Routing to requested model."
            );
            return Ok(requested_model.to_string());
        }

        error!(
            "Tenant {} not found in budget registry. Returning 402 Circuit Breaker.",
            tenant_id
        );
        Err(AppError::RateLimitExceeded(
            "402 Payment Required: No financial token budget allocated for this tenant."
                .to_string(),
        ))
    }
}
