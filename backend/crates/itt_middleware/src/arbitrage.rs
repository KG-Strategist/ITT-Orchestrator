//! Cost Arbitrage (Financial Token Bucket)
//!
//! Implements a rate limiter based on mathematical Token Consumption (monetary spend),
//! not just requests-per-second. If an agent exhausts its budget, it triggers
//! "Graceful Degradation" (routing to a free internal SLM) or returns a 402-style
//! internal circuit-breaker response.

use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, warn, error, instrument};

/// Represents a financial token bucket for an agent or tenant.
#[derive(Debug, Clone)]
pub struct FinancialTokenBucket {
    pub current_spend: f64,
    pub max_budget: f64,
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
    pub async fn allocate_budget(&self, tenant_id: &str, budget: f64) {
        let mut budgets = self.budgets.lock().await;
        budgets.insert(tenant_id.to_string(), FinancialTokenBucket {
            current_spend: 0.0,
            max_budget: budget,
        });
    }

    /// Evaluates the cost of an intent and routes to the appropriate model.
    /// Triggers Graceful Degradation if the budget is exhausted.
    #[instrument(name = "CostArbitrage::evaluate_and_route", skip(self, tenant_id, estimated_cost))]
    pub async fn evaluate_and_route(&self, tenant_id: &str, estimated_cost: f64) -> Result<String, String> {
        let mut budgets = self.budgets.lock().await;
        
        if let Some(bucket) = budgets.get_mut(tenant_id) {
            if bucket.current_spend + estimated_cost > bucket.max_budget {
                warn!(
                    tenant_id = %tenant_id,
                    current_spend = %bucket.current_spend,
                    max_budget = %bucket.max_budget,
                    "Financial Token Bucket exhausted. Triggering Graceful Degradation."
                );
                // Graceful Degradation: Route to a free internal SLM
                return Ok("internal-slm-v5-free".to_string());
            } else {
                bucket.current_spend += estimated_cost;
                info!(
                    tenant_id = %tenant_id,
                    new_spend = %bucket.current_spend,
                    "Budget approved. Routing to Frontier LLM."
                );
                // Route to the requested Frontier LLM
                return Ok("frontier-llm-gpt4o".to_string());
            }
        }
        
        error!("Tenant {} not found in budget registry. Returning 402 Circuit Breaker.", tenant_id);
        Err("402 Payment Required: No financial token budget allocated for this tenant.".to_string())
    }
}
