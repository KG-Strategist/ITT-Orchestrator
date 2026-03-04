use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tracing::{info, error};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
pub struct ConnectivityRequest {
    pub apiVersion: String,
    pub kind: String,
    pub metadata: Metadata,
    pub spec: Spec,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Metadata {
    pub name: String,
    pub namespace: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Spec {
    pub budget_code: Option<String>,
    pub zero_trust_level: Option<String>,
    pub source: String,
    pub destination: String,
    pub protocol: String,
}

#[derive(Debug)]
pub enum GvmError {
    ParseError(String),
    ValidationError(String),
    IoError(String),
}

pub struct GvmEngine;

impl GvmEngine {
    pub async fn process_manifest(yaml_payload: &str) -> Result<String, GvmError> {
        // 1. Parse YAML
        let manifest: ConnectivityRequest = serde_yaml::from_str(yaml_payload)
            .map_err(|e| GvmError::ParseError(format!("Failed to parse YAML: {}", e)))?;

        // 2. Real OPA Validation Check
        let opa_url = std::env::var("OPA_URL").unwrap_or_else(|_| "http://localhost:8181/v1/data/gvm/allow".to_string());
        
        let client = reqwest::Client::new();
        let opa_payload = json!({
            "input": {
                "manifest": manifest
            }
        });

        // We attempt to call OPA. If it fails (e.g., OPA is not running), we fallback to simulated validation
        // to ensure the system remains functional during development.
        match client.post(&opa_url).json(&opa_payload).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    let result: serde_json::Value = response.json().await.unwrap_or_default();
                    let allowed = result.get("result").and_then(|v| v.as_bool()).unwrap_or(false);
                    if !allowed {
                        return Err(GvmError::ValidationError("OPA Validation Failed: Manifest violates policy".to_string()));
                    }
                    info!("OPA Validation Passed via external engine.");
                } else {
                    error!("OPA returned non-200 status: {}", response.status());
                    Self::fallback_validation(&manifest)?;
                }
            }
            Err(e) => {
                error!("Failed to connect to OPA engine: {}. Using fallback validation.", e);
                Self::fallback_validation(&manifest)?;
            }
        }

        // 3. GitOps Execution (Write to local folder)
        let gitops_dir = Path::new("gitops-state");
        if !gitops_dir.exists() {
            fs::create_dir_all(gitops_dir)
                .map_err(|e| GvmError::IoError(format!("Failed to create gitops directory: {}", e)))?;
        }

        let file_name = format!("{}-{}.yaml", manifest.metadata.namespace, manifest.metadata.name);
        let file_path = gitops_dir.join(file_name);

        fs::write(&file_path, yaml_payload)
            .map_err(|e| GvmError::IoError(format!("Failed to write manifest to disk: {}", e)))?;

        info!("GVM successfully processed and wrote manifest to {:?}", file_path);

        Ok(format!("Manifest {} deployed successfully", manifest.metadata.name))
    }

    fn fallback_validation(manifest: &ConnectivityRequest) -> Result<(), GvmError> {
        if manifest.spec.budget_code.is_none() {
            return Err(GvmError::ValidationError("Missing budget_code in spec".to_string()));
        }

        let zt_level = manifest.spec.zero_trust_level.as_deref().unwrap_or("none");
        if zt_level != "strict" && zt_level != "high" {
            return Err(GvmError::ValidationError("Zero Trust rules violated: level must be strict or high".to_string()));
        }
        info!("Fallback validation passed.");
        Ok(())
    }
}
