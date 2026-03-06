//! Adaptive Gateway Fabric (AGF) & Gateway Vending Machine (GVM)
//!
//! This module defines the 4 Virtual Trust Zones and the declarative
//! Intent Manifests used by the GVM to translate intent into infrastructure state.

use serde::{Deserialize, Serialize};
use dashmap::DashMap;
use std::sync::Arc;

/// The 4 Virtual Trust Zones of the Adaptive Gateway Fabric (AGF)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VirtualTrustZone {
    TheFortress,
    TheCoreGuard,
    TheVelocityMesh,
    TheCognitiveEdge,
}

/// Declarative Intent Manifest for the Gateway Vending Machine (GVM)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectivityRequest {
    pub zone_intent: VirtualTrustZone,
    pub protocol: String,
    pub budget_code: String,
    pub finops_budget: f64,
    pub dpdp_masking_required: bool,
}

impl ConnectivityRequest {
    pub async fn validate_against_opa(&self) -> Result<(), String> {
        if self.zone_intent == VirtualTrustZone::TheCognitiveEdge && !self.dpdp_masking_required {
            return Err("OPA Policy Violation: DPDP data masking is mandatory for Zone 4 (The Cognitive Edge).".to_string());
        }
        Ok(())
    }
}

/// Physicalized Gateway FinOps Module (Chargeback & Budgets)
#[derive(Debug, Clone)]
pub struct GatewayFinOps {
    /// Maps `budget_code` to total consumed USD budget
    pub consumed_budgets: Arc<DashMap<String, f64>>,
    /// Maps `budget_code` to total LLM tokens consumed
    pub token_consumption: Arc<DashMap<String, u64>>,
    /// Maps `budget_code` to total API calls made
    pub api_throughput: Arc<DashMap<String, u64>>,
}

impl Default for GatewayFinOps {
    fn default() -> Self {
        Self {
            consumed_budgets: Arc::new(DashMap::new()),
            token_consumption: Arc::new(DashMap::new()),
            api_throughput: Arc::new(DashMap::new()),
        }
    }
}

impl GatewayFinOps {
    pub fn new() -> Self {
        Self::default()
    }

    /// Evaluates if an incoming API request can proceed based on throughput and token budget
    pub fn record_api_call(&self, manifest: &ConnectivityRequest) -> Result<(), String> {
        let code = &manifest.budget_code;
        
        // 1. Check current financial budget limit
        let current_spend = *self.consumed_budgets.entry(code.clone()).or_insert(0.0);
        if current_spend >= manifest.finops_budget {
            return Err(format!("FINOPS_BREACH: Budget code '{}' has exceeded its {} USD limit.", code, manifest.finops_budget));
        }

        // 2. Increment API throughput counter
        *self.api_throughput.entry(code.clone()).or_insert(0) += 1;
        
        // 3. Add base flat cost for API routing (e.g. $0.0001 per request)
        *self.consumed_budgets.get_mut(code).unwrap() += 0.0001;

        Ok(())
    }

    /// Records token consumption post-inference and applies dynamic chargeback
    pub fn record_llm_tokens(&self, manifest: &ConnectivityRequest, tokens_used: u64, cost_per_1k: f64) -> Result<(), String> {
        let code = &manifest.budget_code;
        
        // 1. Increment token counter
        *self.token_consumption.entry(code.clone()).or_insert(0) += tokens_used;
        
        // 2. Calculate execution cost and append to total spend
        let inference_cost = (tokens_used as f64 / 1000.0) * cost_per_1k;
        let mut spend_ref = self.consumed_budgets.entry(code.clone()).or_insert(0.0);
        *spend_ref += inference_cost;
        
        // 3. Hard 402 Circuit Breaker Check
        if *spend_ref >= manifest.finops_budget {
            tracing::warn!("Cost Arbitrage Circuit Breaker tripped for {}. Total spend: {}", code, *spend_ref);
            return Err("HTTP 402 Payment Required: Strict FinOps budget exceeded.".to_string());
        }
        
        Ok(())
    }
}
