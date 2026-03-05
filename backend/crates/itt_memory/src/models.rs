use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ApiRegistryEntry {
    pub id: String,
    pub name: String,
    pub category: String,
    #[serde(rename = "specLink")]
    pub spec_link: String,
    #[serde(rename = "semanticTags")]
    pub semantic_tags: Vec<String>,
    #[serde(rename = "authProtocol")]
    pub auth_protocol: String,
    pub status: String,
    #[serde(rename = "dependsOn")]
    pub depends_on: Vec<String>,
    #[serde(rename = "integrationId")]
    pub integration_id: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Zone {
    pub id: String,
    pub name: String,
    pub description: String,
    pub ips: Vec<String>,
    pub filters: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MdmRule {
    pub id: u64,
    pub name: String,
    pub pattern: String,
    pub token: String,
}
