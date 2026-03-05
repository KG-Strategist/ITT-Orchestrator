use itt_memory::CorpusManager;
use regex::Regex;
use sha2::{Digest, Sha256};
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing::{info, instrument, warn};

pub struct TokenizationEngine {
    vault_key_ref: String,
}

impl TokenizationEngine {
    pub fn new(vault_key_ref: &str) -> Self {
        Self {
            vault_key_ref: vault_key_ref.to_string(),
        }
    }

    #[instrument(name = "TokenizationEngine::mask_pii", skip(self, raw_payload))]
    pub fn mask_pii(&self, raw_payload: &str) -> Result<String, String> {
        let mut masked = raw_payload.to_string();

        // Regex for Aadhaar (12 digits, optional dashes)
        let aadhaar_re =
            Regex::new(r"\b\d{4}-\d{4}-\d{4}\b").map_err(|e| format!("Invalid regex: {}", e))?;
        masked = aadhaar_re
            .replace_all(&masked, |caps: &regex::Captures| {
                let hash = hex::encode(Sha256::digest(caps[0].as_bytes()));
                info!("PII Detected: Aadhaar tokenized cryptographically.");
                format!("TKN-AADHAAR-{}", &hash[0..8])
            })
            .to_string();

        // Regex for PAN (5 letters, 4 digits, 1 letter)
        let pan_re = Regex::new(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b")
            .map_err(|e| format!("Invalid regex: {}", e))?;
        masked = pan_re
            .replace_all(&masked, |caps: &regex::Captures| {
                let hash = hex::encode(Sha256::digest(caps[0].as_bytes()));
                info!("PII Detected: PAN tokenized cryptographically.");
                format!("TKN-PAN-{}", &hash[0..8])
            })
            .to_string();

        Ok(masked)
    }
}

pub struct SelfHygieneWorker {
    pub strict_ttl: Duration,
    pub corpus_manager: Arc<CorpusManager>,
}

impl SelfHygieneWorker {
    pub fn new(strict_ttl: Duration, corpus_manager: Arc<CorpusManager>) -> Self {
        Self {
            strict_ttl,
            corpus_manager,
        }
    }

    pub async fn start_daemon(self) {
        let mut interval = time::interval(self.strict_ttl);
        info!(
            "Self-Hygiene Worker started. Strict TTL: {:?}",
            self.strict_ttl
        );

        tokio::spawn(async move {
            loop {
                interval.tick().await;
                info!("Initiating DPDP Compliance Hygiene Sweep...");
                match self
                    .corpus_manager
                    .execute_hard_deletes(self.strict_ttl)
                    .await
                {
                    Ok(deleted) => info!(
                        "Hygiene Sweep Complete. {} records permanently purged.",
                        deleted
                    ),
                    Err(e) => warn!("Hygiene sweep encountered an error: {:?}", e),
                }
            }
        });
    }
}
