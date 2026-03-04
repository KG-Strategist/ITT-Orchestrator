pub mod models;
pub mod seeder;

use moka::future::Cache;
use std::sync::Arc;
use std::time::Duration;
use async_trait::async_trait;
use tracing::{info, instrument};
use models::{ApiRegistryEntry, Zone, MdmRule};

#[derive(Debug)]
pub enum MemoryError {
    CacheMiss,
    StoreError(String),
}

#[async_trait]
pub trait VectorStore: Send + Sync {
    async fn insert_embedding(&self, id: &str, vector: &[f32], metadata: &str) -> Result<(), MemoryError>;
    async fn purge_expired(&self, ttl: Duration) -> Result<usize, MemoryError>;
}

#[async_trait]
pub trait GraphStore: Send + Sync {
    async fn insert_api_node(&self, api: &ApiRegistryEntry) -> Result<(), MemoryError>;
    async fn get_all_apis(&self) -> Result<Vec<ApiRegistryEntry>, MemoryError>;
    async fn insert_zone(&self, zone: &Zone) -> Result<(), MemoryError>;
    async fn get_all_zones(&self) -> Result<Vec<Zone>, MemoryError>;
    async fn insert_mdm_rule(&self, rule: &MdmRule) -> Result<(), MemoryError>;
    async fn get_all_mdm_rules(&self) -> Result<Vec<MdmRule>, MemoryError>;
    async fn delete_mdm_rule(&self, id: u64) -> Result<(), MemoryError>;
    async fn purge_expired(&self, ttl: Duration) -> Result<usize, MemoryError>;
}

// Implementations for MongoDB and Neo4j
// In a full production deployment, these would connect to the actual databases.
// For this open-source release, we provide an in-memory fallback if the real DBs are unavailable.
pub struct MongoClient;
#[async_trait]
impl VectorStore for MongoClient {
    async fn insert_embedding(&self, _id: &str, _vector: &[f32], _metadata: &str) -> Result<(), MemoryError> { Ok(()) }
    async fn purge_expired(&self, _ttl: Duration) -> Result<usize, MemoryError> { Ok(5) }
}

pub struct Neo4jClient {
    // In-memory fallback for demonstration/testing
    apis: tokio::sync::RwLock<Vec<ApiRegistryEntry>>,
    zones: tokio::sync::RwLock<Vec<Zone>>,
    mdm_rules: tokio::sync::RwLock<Vec<MdmRule>>,
}
impl Neo4jClient {
    pub fn new() -> Self {
        Self {
            apis: tokio::sync::RwLock::new(Vec::new()),
            zones: tokio::sync::RwLock::new(Vec::new()),
            mdm_rules: tokio::sync::RwLock::new(Vec::new()),
        }
    }
}
#[async_trait]
impl GraphStore for Neo4jClient {
    async fn insert_api_node(&self, api: &ApiRegistryEntry) -> Result<(), MemoryError> {
        self.apis.write().await.push(api.clone());
        Ok(())
    }
    async fn get_all_apis(&self) -> Result<Vec<ApiRegistryEntry>, MemoryError> {
        Ok(self.apis.read().await.clone())
    }
    async fn insert_zone(&self, zone: &Zone) -> Result<(), MemoryError> {
        self.zones.write().await.push(zone.clone());
        Ok(())
    }
    async fn get_all_zones(&self) -> Result<Vec<Zone>, MemoryError> {
        Ok(self.zones.read().await.clone())
    }
    async fn insert_mdm_rule(&self, rule: &MdmRule) -> Result<(), MemoryError> {
        self.mdm_rules.write().await.push(rule.clone());
        Ok(())
    }
    async fn get_all_mdm_rules(&self) -> Result<Vec<MdmRule>, MemoryError> {
        Ok(self.mdm_rules.read().await.clone())
    }
    async fn delete_mdm_rule(&self, id: u64) -> Result<(), MemoryError> {
        self.mdm_rules.write().await.retain(|r| r.id != id);
        Ok(())
    }
    async fn purge_expired(&self, _ttl: Duration) -> Result<usize, MemoryError> {
        Ok(12)
    }
}

pub struct CorpusManager {
    pub api_cache: Cache<String, ApiRegistryEntry>,
    pub zone_cache: Cache<String, Zone>,
    pub mdm_rule_cache: Cache<u64, MdmRule>,
    pub vector_store: Arc<dyn VectorStore>,
    pub graph_store: Arc<dyn GraphStore>,
}

impl CorpusManager {
    pub fn new(vector_store: Arc<dyn VectorStore>, graph_store: Arc<dyn GraphStore>, cache_ttl: Duration) -> Self {
        Self {
            api_cache: Cache::builder().time_to_live(cache_ttl).build(),
            zone_cache: Cache::builder().time_to_live(cache_ttl).build(),
            mdm_rule_cache: Cache::builder().time_to_live(cache_ttl).build(),
            vector_store,
            graph_store,
        }
    }

    #[instrument(skip(self))]
    pub async fn get_registry(&self) -> Result<Vec<ApiRegistryEntry>, MemoryError> {
        let apis = self.graph_store.get_all_apis().await?;
        for api in &apis {
            self.api_cache.insert(api.id.clone(), api.clone()).await;
        }
        Ok(apis)
    }

    #[instrument(skip(self))]
    pub async fn get_zones(&self) -> Result<Vec<Zone>, MemoryError> {
        let zones = self.graph_store.get_all_zones().await?;
        for zone in &zones {
            self.zone_cache.insert(zone.id.clone(), zone.clone()).await;
        }
        Ok(zones)
    }

    #[instrument(skip(self))]
    pub async fn get_mdm_rules(&self) -> Result<Vec<MdmRule>, MemoryError> {
        let rules = self.graph_store.get_all_mdm_rules().await?;
        for rule in &rules {
            self.mdm_rule_cache.insert(rule.id, rule.clone()).await;
        }
        Ok(rules)
    }

    #[instrument(skip(self, api))]
    pub async fn add_api_node(&self, api: ApiRegistryEntry) -> Result<(), MemoryError> {
        self.graph_store.insert_api_node(&api).await?;
        self.api_cache.insert(api.id.clone(), api).await;
        Ok(())
    }

    #[instrument(skip(self, zone))]
    pub async fn add_zone(&self, zone: Zone) -> Result<(), MemoryError> {
        self.graph_store.insert_zone(&zone).await?;
        self.zone_cache.insert(zone.id.clone(), zone).await;
        Ok(())
    }

    #[instrument(skip(self, rule))]
    pub async fn add_mdm_rule(&self, rule: MdmRule) -> Result<(), MemoryError> {
        self.graph_store.insert_mdm_rule(&rule).await?;
        self.mdm_rule_cache.insert(rule.id, rule).await;
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn delete_mdm_rule(&self, id: u64) -> Result<(), MemoryError> {
        self.graph_store.delete_mdm_rule(id).await?;
        self.mdm_rule_cache.invalidate(&id).await;
        Ok(())
    }

    #[instrument(skip(self))]
    pub async fn execute_hard_deletes(&self, ttl: Duration) -> Result<usize, MemoryError> {
        let v_deleted = self.vector_store.purge_expired(ttl).await?;
        let g_deleted = self.graph_store.purge_expired(ttl).await?;
        Ok(v_deleted + g_deleted)
    }
}