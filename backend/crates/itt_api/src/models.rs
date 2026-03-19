use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct IntegrationRequest {
    pub name: String,
    pub r#type: String,
    pub subtype: String,
    #[serde(rename = "vaultPath")]
    pub vault_path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct IntegrationResponse {
    pub id: String,
    pub status: String,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ZoneRequest {
    pub name: String,
    pub description: String,
    pub ips: Vec<String>,
    pub filters: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ZoneResponse {
    pub id: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GenerateDagRequest {
    pub prompt: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GenerateDagResponse {
    pub nodes: Vec<serde_json::Value>,
    pub edges: Vec<serde_json::Value>,
    #[serde(rename = "fallbackMessage", skip_serializing_if = "Option::is_none")]
    pub fallback_message: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomReport {
    pub id: String,
    pub name: String,
    #[serde(rename = "dataSource")]
    pub data_source: String,
    #[serde(rename = "visualizationType")]
    pub visualization_type: String,
    #[serde(rename = "allowedRoles")]
    pub allowed_roles: Vec<String>,
}
