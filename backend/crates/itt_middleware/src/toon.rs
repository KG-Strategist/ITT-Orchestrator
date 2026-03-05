//! TOON Transformation (Text-Object Notation)
//!
//! A lightweight interceptor that transparently converts verbose JSON payloads
//! into token-efficient TOON formats before sending them to the LLM, reducing
//! token density.

use serde_json::Value;
use tracing::{debug, instrument};

use crate::error::AppError;

/// The TOON Transformer for Zone 4.
pub struct ToonTransformer;

impl ToonTransformer {
    /// Converts a verbose JSON payload into a token-efficient TOON format.
    /// Strips unnecessary JSON syntax (quotes, commas, array brackets) and
    /// compresses it into a dense, LLM-readable text format.
    #[instrument(name = "ToonTransformer::json_to_toon", skip(json_payload))]
    pub fn json_to_toon(json_payload: &str) -> Result<String, AppError> {
        let parsed: Value = serde_json::from_str(json_payload).map_err(|e| {
            AppError::InternalError(format!("Failed to parse JSON for TOON conversion: {}", e))
        })?;

        let toon_str = Self::flatten_value(&parsed);

        debug!(
            original_len = json_payload.len(),
            toon_len = toon_str.len(),
            compression_ratio = format!(
                "{:.2}%",
                (1.0 - (toon_str.len() as f64 / json_payload.len() as f64)) * 100.0
            ),
            "Transformed JSON to TOON"
        );

        Ok(toon_str)
    }

    fn flatten_value(val: &Value) -> String {
        match val {
            Value::Object(map) => {
                let mut out = String::from("(");
                let mut first = true;
                for (k, v) in map {
                    if !first {
                        out.push(' ');
                    }
                    out.push_str(k);
                    out.push_str(": ");
                    out.push_str(&Self::flatten_value(v));
                    first = false;
                }
                out.push(')');
                out
            }
            Value::Array(arr) => {
                let mut out = String::new();
                let mut first = true;
                for v in arr {
                    if !first {
                        out.push(' ');
                    }
                    out.push_str(&Self::flatten_value(v));
                    first = false;
                }
                out
            }
            Value::String(s) => s.clone(),
            Value::Number(n) => n.to_string(),
            Value::Bool(b) => b.to_string(),
            Value::Null => "null".to_string(),
        }
    }
}
