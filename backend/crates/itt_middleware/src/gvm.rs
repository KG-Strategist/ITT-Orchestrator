//! Adaptive Gateway Fabric (AGF) & Gateway Vending Machine (GVM)
//!
//! This module defines the 4 Virtual Trust Zones and the declarative
//! Intent Manifests used by the GVM to translate intent into infrastructure state.

use serde::{Deserialize, Serialize};

/// The 4 Virtual Trust Zones of the Adaptive Gateway Fabric (AGF)
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VirtualTrustZone {
    /// Zone 1: External ingress. Decryption Trust Anchor terminating TLS.
    TheFortress,
    /// Zone 2: Legacy integration. Sovereign Sidecar (eBPF) for Identity Injection.
    TheCoreGuard,
    /// Zone 3: Internal microservices. Sidecar-less ambient mesh (gRPC/TCP/ISO 8583).
    TheVelocityMesh,
    /// Zone 4: AI Governance. Where the SEAG resides.
    TheCognitiveEdge,
}

/// Declarative Intent Manifest for the Gateway Vending Machine (GVM)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectivityRequest {
    pub zone_intent: VirtualTrustZone,
    pub protocol: String, // e.g., "gRPC", "SSE", "ISO8583"
    pub finops_budget: f64, // Financial budget in USD/INR
    pub dpdp_masking_required: bool,
}

impl ConnectivityRequest {
    /// Validates the request against an Open Policy Agent (OPA) integration.
    /// In a real implementation, this would make a fast gRPC call to an OPA sidecar.
    pub async fn validate_against_opa(&self) -> Result<(), String> {
        // Simulated OPA Policy-as-Code check
        if self.zone_intent == VirtualTrustZone::TheCognitiveEdge && !self.dpdp_masking_required {
            return Err("OPA Policy Violation: DPDP data masking is mandatory for Zone 4 (The Cognitive Edge).".to_string());
        }
        Ok(())
    }
}
