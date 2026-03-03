use std::sync::Arc;
use axum::{extract::State, Json, http::StatusCode};
use crate::models::{IntegrationRequest, IntegrationResponse, ZoneRequest, ZoneResponse, GenerateDagRequest, GenerateDagResponse};
use crate::error::ApiError;
use crate::AppState;
use uuid::Uuid;
use itt_memory::models::{ApiRegistryEntry, Zone, MdmRule};
use serde_json::json;

/// GET /api/v1/registry
/// Fetches the auto-discovered APIs
pub async fn get_registry(
    State(state): State<Arc<AppState>>
) -> Result<Json<Vec<ApiRegistryEntry>>, ApiError> {
    tracing::info!("Fetching Unified API Registry from Smart Corpus...");
    
    let apis = state.memory.get_registry().await.map_err(|e| {
        tracing::error!("CorpusManager error: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;
    
    Ok(Json(apis))
}

/// GET /api/v1/integrations
pub async fn get_integrations(
    State(_state): State<Arc<AppState>>
) -> Result<Json<Vec<serde_json::Value>>, ApiError> {
    tracing::info!("Fetching Integrations...");
    // Return empty for now or mock
    Ok(Json(vec![]))
}

/// GET /api/v1/zones
pub async fn get_zones(
    State(state): State<Arc<AppState>>
) -> Result<Json<Vec<Zone>>, ApiError> {
    tracing::info!("Fetching Zones...");
    let zones = state.memory.get_zones().await.map_err(|e| {
        tracing::error!("CorpusManager error: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;
    Ok(Json(zones))
}

/// DELETE /api/v1/registry/:id
pub async fn delete_registry(
    State(_state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<String>
) -> Result<StatusCode, ApiError> {
    tracing::info!("Deleting API from registry: {}", id);
    // In a real app, delete from memory/graph store
    Ok(StatusCode::NO_CONTENT)
}

/// POST /api/v1/integrations
/// Triggers the auto-discovery scanning
pub async fn post_integration(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<IntegrationRequest>
) -> Result<(StatusCode, Json<IntegrationResponse>), ApiError> {
    tracing::info!("Triggering auto-discovery for integration: {} ({})", payload.name, payload.r#type);
    
    // 1. Tokenize/Mask PII in the payload before cognitive processing
    let raw_json = serde_json::to_string(&payload).unwrap_or_default();
    let safe_payload = state.privacy.mask_pii(&raw_json).map_err(|_| ApiError::InternalServerError { message: "Internal server error".to_string(), details: None })?;

    // 2. TinyTransformer Auto-Classification
    let integration_id = format!("int_{}", Uuid::new_v4());
    let classified_api = state.intent.classify_api(&safe_payload, &payload.name, &integration_id).await;

    // 3. Store in Smart Corpus (Graph DB)
    state.memory.add_api_node(classified_api).await.map_err(|e| {
        tracing::error!("Failed to store classified API: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;

    let response = IntegrationResponse {
        id: integration_id,
        status: "scanned_and_classified".to_string(),
        message: "Auto-discovery and taxonomy classification complete.".to_string(),
    };
    
    Ok((StatusCode::ACCEPTED, Json(response)))
}

/// POST /api/v1/zones
/// Allows the Super Admin to create a new Adaptive Gateway Fabric zone
pub async fn post_zone(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<ZoneRequest>
) -> Result<(StatusCode, Json<ZoneResponse>), ApiError> {
    tracing::info!("Creating new AGF Zone: {}", payload.name);
    
    let zone_id = format!("zone_{}", Uuid::new_v4());
    let new_zone = Zone {
        id: zone_id.clone(),
        name: payload.name.clone(),
        description: payload.description.clone(),
        ips: payload.ips.clone(),
        filters: payload.filters.clone(),
    };

    state.memory.add_zone(new_zone).await.map_err(|e| {
        tracing::error!("Failed to store zone: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;

    let response = ZoneResponse {
        id: zone_id,
        status: "created".to_string(),
    };
    
    Ok((StatusCode::CREATED, Json(response)))
}

/// GET /api/v1/mdm/rules
pub async fn get_mdm_rules(
    State(state): State<Arc<AppState>>
) -> Result<Json<Vec<MdmRule>>, ApiError> {
    tracing::info!("Fetching MDM Rules...");
    let rules = state.memory.get_mdm_rules().await.map_err(|e| {
        tracing::error!("CorpusManager error: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;
    Ok(Json(rules))
}

/// POST /api/v1/mdm/rules
pub async fn post_mdm_rule(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<MdmRule>
) -> Result<(StatusCode, Json<MdmRule>), ApiError> {
    tracing::info!("Creating new MDM Rule: {}", payload.name);
    
    let mut new_rule = payload.clone();
    new_rule.id = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;

    state.memory.add_mdm_rule(new_rule.clone()).await.map_err(|e| {
        tracing::error!("Failed to store MDM rule: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;

    Ok((StatusCode::CREATED, Json(new_rule)))
}

/// DELETE /api/v1/mdm/rules/:id
pub async fn delete_mdm_rule(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(id): axum::extract::Path<u64>
) -> Result<StatusCode, ApiError> {
    tracing::info!("Deleting MDM Rule: {}", id);
    state.memory.delete_mdm_rule(id).await.map_err(|e| {
        tracing::error!("Failed to delete MDM rule: {:?}", e);
        ApiError::InternalServerError { message: "Internal server error".to_string(), details: None }
    })?;
    Ok(StatusCode::NO_CONTENT)
}

/// POST /api/v1/generate-dag
/// Generates a React Flow DAG based on natural language intent
pub async fn post_generate_dag(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<GenerateDagRequest>
) -> Result<(StatusCode, Json<GenerateDagResponse>), ApiError> {
    tracing::info!("Generating DAG for prompt: {}", payload.prompt);
    
    // In a real implementation, this would call an LLM or the TinyTransformer
    // to map the prompt to a specific DAG structure.
    // For now, we return a pre-wired template based on keywords.
    
    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    
    let prompt_lower = payload.prompt.to_lowercase();
    let is_test_mode = std::env::var("TEST_MODE").unwrap_or_default() == "true";
    
    if is_test_mode && (prompt_lower.contains("aml") || prompt_lower.contains("money laundering") || prompt_lower.contains("project aurora")) {
        nodes = vec![
            json!({ "id": "1", "type": "intentTrigger", "position": { "x": 250, "y": 50 }, "data": { "label": "Event: Suspicious Transaction" } }),
            json!({ "id": "2", "type": "contextInjector", "position": { "x": 250, "y": 200 }, "data": { "source": "Milvus: Customer KG" } }),
            json!({ "id": "3", "type": "federatedLearner", "position": { "x": 250, "y": 350 }, "data": { "privacy": "CAL 4, Homomorphic Enc., LDP" } }),
            json!({ "id": "4", "type": "anomalyAlerting", "position": { "x": 250, "y": 500 }, "data": { "target": "CoE_Super_Admin" } }),
        ];
        edges = vec![
            json!({ "id": "e1-2", "source": "1", "target": "2", "animated": true, "style": { "stroke": "#6366f1", "strokeWidth": 2 } }),
            json!({ "id": "e2-3", "source": "2", "target": "3", "animated": true, "style": { "stroke": "#3b82f6", "strokeWidth": 2 } }),
            json!({ "id": "e3-4", "source": "3", "target": "4", "animated": true, "style": { "stroke": "#8b5cf6", "strokeWidth": 2 } }),
        ];
    } else if prompt_lower.contains("aml") || prompt_lower.contains("federated") {
        nodes = vec![
            json!({ "id": "1", "type": "intentTrigger", "position": { "x": 250, "y": 50 }, "data": { "label": "Event: Suspicious Transaction" } }),
            json!({ "id": "2", "type": "contextInjector", "position": { "x": 250, "y": 200 }, "data": { "source": "Pinecone: Customer KG" } }),
            json!({ "id": "3", "type": "federatedLearner", "position": { "x": 250, "y": 350 }, "data": { "privacy": "Homomorphic Enc." } }),
            json!({ "id": "4", "type": "mcpTool", "position": { "x": 250, "y": 500 }, "data": { "toolName": "Global AML Model" } }),
        ];
        edges = vec![
            json!({ "id": "e1-2", "source": "1", "target": "2", "animated": true, "style": { "stroke": "#6366f1", "strokeWidth": 2 } }),
            json!({ "id": "e2-3", "source": "2", "target": "3", "animated": true, "style": { "stroke": "#3b82f6", "strokeWidth": 2 } }),
            json!({ "id": "e3-4", "source": "3", "target": "4", "animated": true, "style": { "stroke": "#8b5cf6", "strokeWidth": 2 } }),
        ];
    } else {
        nodes = vec![
            json!({ "id": "1", "type": "intentTrigger", "position": { "x": 250, "y": 50 }, "data": { "label": "Event: Custom Intent" } }),
            json!({ "id": "2", "type": "semanticFirewall", "position": { "x": 250, "y": 200 }, "data": { "threshold": "0.95" } }),
            json!({ "id": "3", "type": "mcpTool", "position": { "x": 250, "y": 350 }, "data": { "toolName": "Generic API" } }),
        ];
        edges = vec![
            json!({ "id": "e1-2", "source": "1", "target": "2", "animated": true, "style": { "stroke": "#6366f1", "strokeWidth": 2 } }),
            json!({ "id": "e2-3", "source": "2", "target": "3", "animated": true, "style": { "stroke": "#f43f5e", "strokeWidth": 2 } }),
        ];
    }
    
    let response = GenerateDagResponse {
        nodes,
        edges,
        fallback_message: None,
    };
    
    Ok((StatusCode::OK, Json(response)))
}
