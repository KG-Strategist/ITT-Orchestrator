use regex::Regex;
use sha2::{Digest, Sha256};
use std::sync::Arc;
use tracing::{info, instrument};

use crate::error::AppError;

/// DPDP Tokenizer (Data Protection and Digital Privacy)
///
/// Actively scans incoming payloads for PII (Personally Identifiable Information)
/// and replaces them with deterministic cryptographic tokens.
#[derive(Clone)]
pub struct DpdpTokenizer {
    aadhaar_regex: Arc<Regex>,
    pan_regex: Arc<Regex>,
    email_regex: Arc<Regex>,
}

impl DpdpTokenizer {
    pub fn new() -> Self {
        // Aadhaar: 12 digit number, optionally separated by spaces or dashes
        let aadhaar_regex = Arc::new(Regex::new(r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b").unwrap());
        
        // PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
        let pan_regex = Arc::new(Regex::new(r"\b[A-Z]{5}\d{4}[A-Z]{1}\b").unwrap());
        
        // Email: Standard email pattern
        let email_regex = Arc::new(Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b").unwrap());

        Self {
            aadhaar_regex,
            pan_regex,
            email_regex,
        }
    }

    /// Generates a deterministic token for a given matched string and prefix.
    /// Uses SHA-256 to ensure the same PII always maps to the same token.
    fn generate_token(prefix: &str, raw_value: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(raw_value.as_bytes());
        let result = hasher.finalize();
        // Use the first 4 bytes (8 hex chars) for a short, deterministic token
        let hash_hex = hex::encode(&result[..4]);
        format!("[TKN-{}-{}]", prefix, hash_hex.to_uppercase())
    }

    /// Tokenizes the payload by replacing PII with deterministic tokens.
    #[instrument(name = "DpdpTokenizer::tokenize", skip(self, payload))]
    pub fn tokenize(&self, payload: &str) -> Result<String, AppError> {
        let mut tokenized = payload.to_string();
        let mut replacements_made = 0;

        // Tokenize Aadhaar
        tokenized = self.aadhaar_regex.replace_all(&tokenized, |caps: &regex::Captures| {
            replacements_made += 1;
            Self::generate_token("AADHAAR", &caps[0].replace(&['-', ' '][..], ""))
        }).to_string();

        // Tokenize PAN
        tokenized = self.pan_regex.replace_all(&tokenized, |caps: &regex::Captures| {
            replacements_made += 1;
            Self::generate_token("PAN", &caps[0])
        }).to_string();

        // Tokenize Email
        tokenized = self.email_regex.replace_all(&tokenized, |caps: &regex::Captures| {
            replacements_made += 1;
            Self::generate_token("EMAIL", &caps[0])
        }).to_string();

        if replacements_made > 0 {
            info!(
                replacements = replacements_made,
                "DPDP Tokenizer intercepted and masked PII"
            );
        }

        Ok(tokenized)
    }
}

impl Default for DpdpTokenizer {
    fn default() -> Self {
        Self::new()
    }
}
