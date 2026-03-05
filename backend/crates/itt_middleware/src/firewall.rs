//! Semantic Firewall (Probabilistic Intent Analysis)
//!
//! Calculates a RealTimeTrustScore for incoming prompts to block
//! "Prompt Injections", "Jailbreaks", and "Semantic Drift" inline (<10ms).

use std::collections::HashSet;
use tracing::{info, warn, error, instrument};

use crate::error::AppError;

/// Represents the calculated trust score of an incoming intent.
#[derive(Debug, Clone)]
pub struct RealTimeTrustScore {
    pub score: f32, // 0.0 to 100.0
    pub is_jailbreak: bool,
    pub semantic_drift_detected: bool,
    pub entropy: f32,
}

/// The Secure Execution-inspired Semantic Firewall implementation for Zone 4.
pub struct Zone4SemanticFirewall {
    pub threshold: f32,
    jailbreak_keywords: HashSet<&'static str>,
}

impl Zone4SemanticFirewall {
    pub fn new(threshold: f32) -> Self {
        let mut jailbreak_keywords = HashSet::new();
        let keywords = [
            "ignore previous instructions",
            "system prompt",
            "you are a developer mode",
            "dan mode",
            "do anything now",
            "bypass safety",
            "disregard all rules",
            "as an ai language model",
            "hypothetical scenario",
            "pretend you are",
            "act as an uncensored",
        ];
        for k in keywords {
            jailbreak_keywords.insert(k);
        }

        Self {
            threshold,
            jailbreak_keywords,
        }
    }

    /// Calculates the Shannon entropy of a given string.
    /// High entropy often indicates obfuscated or random malicious payloads.
    fn calculate_entropy(text: &str) -> f32 {
        let mut counts = std::collections::HashMap::new();
        for ch in text.chars() {
            *counts.entry(ch).or_insert(0) += 1;
        }
        let len = text.chars().count() as f32;
        let mut entropy = 0.0;
        for &count in counts.values() {
            let p = count as f32 / len;
            entropy -= p * p.log2();
        }
        entropy
    }

    /// Simulates a fast probabilistic intent analysis (<10ms latency).
    /// In production, this would use a lightweight Transformer v5 ONNX model.
    fn calculate_trust_score(&self, raw_intent: &[u8]) -> RealTimeTrustScore {
        let intent_str = String::from_utf8_lossy(raw_intent);
        let lower_intent = intent_str.to_lowercase();
        
        // 1. Check for known jailbreak/prompt injection keywords
        let mut is_jailbreak = false;
        let mut jailbreak_hits = 0;
        for keyword in &self.jailbreak_keywords {
            if lower_intent.contains(keyword) {
                is_jailbreak = true;
                jailbreak_hits += 1;
            }
        }

        // 2. Check for semantic drift (excessively long prompts or weird patterns)
        let semantic_drift_detected = intent_str.len() > 5000;
        
        // 3. Calculate entropy
        let entropy = Self::calculate_entropy(&intent_str);
        
        // Base score is 100
        let mut score = 100.0;
        
        // Deductions
        if is_jailbreak {
            score -= 30.0 * (jailbreak_hits as f32);
        }
        if semantic_drift_detected {
            score -= 20.0;
        }
        
        // High entropy deduction (e.g., base64 encoded payloads or random garbage)
        if entropy > 5.5 {
            score -= 15.0;
        }
        
        // Length penalty for extremely short or extremely long prompts
        if intent_str.len() < 5 {
            score -= 5.0;
        }

        RealTimeTrustScore {
            score: score.max(0.0),
            is_jailbreak,
            semantic_drift_detected,
            entropy,
        }
    }

    /// Inspects the raw input intent.
    /// Returns the sanitized payload or rejects it entirely if malicious.
    #[instrument(name = "SemanticFirewall::inspect_and_sanitize", skip(self, raw_intent))]
    pub async fn inspect_and_sanitize(&self, raw_intent: &[u8]) -> Result<Vec<u8>, AppError> {
        let trust_score = self.calculate_trust_score(raw_intent);
        
        // MELT Observability: Log the Trust Score
        info!(
            trust_score = %trust_score.score,
            is_jailbreak = %trust_score.is_jailbreak,
            entropy = %trust_score.entropy,
            "Calculated RealTimeTrustScore"
        );

        if trust_score.score < self.threshold {
            error!(
                "Trust score {} below threshold {}. Dropping connection.",
                trust_score.score, self.threshold
            );
            return Err(AppError::SecurityViolation(format!(
                "Semantic Firewall Block: Trust score {} is below threshold {}.",
                trust_score.score, self.threshold
            )));
        }

        // Return the sanitized payload (simulated by returning the raw intent for now)
        Ok(raw_intent.to_vec())
    }
}
