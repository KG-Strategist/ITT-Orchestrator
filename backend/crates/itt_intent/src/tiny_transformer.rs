use tracing::{info, instrument};
use itt_memory::models::ApiRegistryEntry;
use uuid::Uuid;

pub struct TinyTransformer {
    pub model_version: String,
}

impl TinyTransformer {
    pub fn new(model_version: &str) -> Self {
        Self {
            model_version: model_version.to_string(),
        }
    }

    #[instrument(name = "TinyTransformer::classify_api", skip(self, payload))]
    pub async fn classify_api(&self, payload: &str, integration_name: &str, integration_id: &str) -> ApiRegistryEntry {
        info!("TinyTransformer analyzing payload for taxonomy auto-classification...");
        
        let payload_lower = payload.to_lowercase();
        
        let category = if payload_lower.contains("graphql") || payload_lower.contains("bff") || payload_lower.contains("mobile") {
            "experience"
        } else if payload_lower.contains("asyncapi") || payload_lower.contains("process") || payload_lower.contains("loan") {
            "process"
        } else {
            "system"
        };

        let mut semantic_tags = vec!["Auto-Discovered".to_string()];
        if category == "system" { semantic_tags.push("Core".to_string()); }
        if category == "experience" { semantic_tags.push("Aggregator".to_string()); }

        info!("Classification complete: Mapped to {} taxonomy.", category);

        ApiRegistryEntry {
            id: format!("api_{}", Uuid::new_v4()),
            name: format!("{}.AutoEndpoint", integration_name.replace(" ", "")),
            category: category.to_string(),
            spec_link: "auto-discovered.json".to_string(),
            semantic_tags,
            auth_protocol: "OAuth2".to_string(),
            status: "Active".to_string(),
            depends_on: vec![],
            integration_id: integration_id.to_string(),
        }
    }
}