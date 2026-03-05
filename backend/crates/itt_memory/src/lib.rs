pub mod models;
pub mod seeder;

use async_trait::async_trait;
use models::{ApiRegistryEntry, MdmRule, Zone};
use moka::future::Cache;
use mongodb::{
    bson::{doc, Document},
    Client, Collection,
};
use std::sync::Arc;
use std::time::Duration;
use tracing::{info, instrument};

#[derive(Debug)]
pub enum MemoryError {
    CacheMiss,
    StoreError(String),
}

#[async_trait]
pub trait VectorStore: Send + Sync {
    async fn insert_embedding(
        &self,
        id: &str,
        vector: &[f32],
        metadata: &str,
    ) -> Result<(), MemoryError>;
    async fn search_similar(
        &self,
        query_vector: &[f32],
        limit: usize,
    ) -> Result<Vec<serde_json::Value>, MemoryError>;
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

pub struct MongoClient {
    collection: Collection<Document>,
}

impl MongoClient {
    pub async fn new(
        uri: &str,
        db_name: &str,
        coll_name: &str,
    ) -> Result<Self, mongodb::error::Error> {
        let client = Client::with_uri_str(uri).await?;
        let db = client.database(db_name);
        let collection = db.collection::<Document>(coll_name);
        Ok(Self { collection })
    }
}

#[async_trait]
impl VectorStore for MongoClient {
    async fn insert_embedding(
        &self,
        id: &str,
        vector: &[f32],
        metadata: &str,
    ) -> Result<(), MemoryError> {
        let doc = doc! {
            "id": id,
            "embedding": vector.to_vec(),
            "metadata": metadata,
            "created_at": mongodb::bson::DateTime::now(),
        };
        self.collection
            .insert_one(doc, None)
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        Ok(())
    }

    async fn search_similar(
        &self,
        query_vector: &[f32],
        limit: usize,
    ) -> Result<Vec<serde_json::Value>, MemoryError> {
        use futures::stream::StreamExt;
        let pipeline = vec![
            doc! {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector.to_vec(),
                    "numCandidates": limit as i32 * 10,
                    "limit": limit as i32
                }
            },
            doc! {
                "$project": {
                    "embedding": 0,
                    "_id": 0,
                    "score": { "$meta": "vectorSearchScore" }
                }
            },
        ];

        let mut cursor = self
            .collection
            .aggregate(pipeline, None)
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        let mut results = Vec::new();
        while let Some(result) = cursor.next().await {
            match result {
                Ok(doc) => {
                    let json_val: serde_json::Value =
                        mongodb::bson::from_document(doc).unwrap_or_default();
                    results.push(json_val);
                }
                Err(e) => return Err(MemoryError::StoreError(e.to_string())),
            }
        }
        Ok(results)
    }

    async fn purge_expired(&self, _ttl: Duration) -> Result<usize, MemoryError> {
        Ok(0)
    }
}

use neo4rs::{query, Graph};

pub struct Neo4jClient {
    graph: Graph,
}

impl Neo4jClient {
    pub async fn new(uri: &str, user: &str, pass: &str) -> Result<Self, String> {
        let graph = Graph::new(uri, user, pass)
            .await
            .map_err(|e| e.to_string())?;
        Ok(Self { graph })
    }
}

#[async_trait]
impl GraphStore for Neo4jClient {
    async fn insert_api_node(&self, api: &ApiRegistryEntry) -> Result<(), MemoryError> {
        let q =
            query("CREATE (a:Api {id: $id, name: $name, category: $category, status: $status})")
                .param("id", api.id.clone())
                .param("name", api.name.clone())
                .param("category", api.category.clone())
                .param("status", api.status.clone());
        self.graph
            .run(q)
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        Ok(())
    }

    async fn get_all_apis(&self) -> Result<Vec<ApiRegistryEntry>, MemoryError> {
        let mut result = self
            .graph
            .execute(query("MATCH (a:Api) RETURN a"))
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        let mut apis = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            let node: neo4rs::Node = row
                .get("a")
                .map_err(|e| MemoryError::StoreError(e.to_string()))?;
            apis.push(ApiRegistryEntry {
                id: node.get("id").unwrap_or_default(),
                name: node.get("name").unwrap_or_default(),
                category: node.get("category").unwrap_or_default(),
                spec_link: String::new(),
                semantic_tags: vec![],
                auth_protocol: String::new(),
                status: node.get("status").unwrap_or_default(),
                depends_on: vec![],
                integration_id: String::new(),
            });
        }
        Ok(apis)
    }

    async fn insert_zone(&self, zone: &Zone) -> Result<(), MemoryError> {
        let q = query("CREATE (z:Zone {id: $id, name: $name, description: $description})")
            .param("id", zone.id.clone())
            .param("name", zone.name.clone())
            .param("description", zone.description.clone());
        self.graph
            .run(q)
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        Ok(())
    }

    async fn get_all_zones(&self) -> Result<Vec<Zone>, MemoryError> {
        let mut result = self
            .graph
            .execute(query("MATCH (z:Zone) RETURN z"))
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        let mut zones = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            let node: neo4rs::Node = row
                .get("z")
                .map_err(|e| MemoryError::StoreError(e.to_string()))?;
            zones.push(Zone {
                id: node.get("id").unwrap_or_default(),
                name: node.get("name").unwrap_or_default(),
                description: node.get("description").unwrap_or_default(),
                ips: vec![],
                filters: vec![],
            });
        }
        Ok(zones)
    }

    async fn insert_mdm_rule(&self, rule: &MdmRule) -> Result<(), MemoryError> {
        let q = query("CREATE (m:MdmRule {id: $id, name: $name, description: $description})")
            .param("id", rule.id as i64)
            .param("name", rule.name.clone())
            .param("description", rule.description.clone());
        self.graph
            .run(q)
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        Ok(())
    }

    async fn get_all_mdm_rules(&self) -> Result<Vec<MdmRule>, MemoryError> {
        let mut result = self
            .graph
            .execute(query("MATCH (m:MdmRule) RETURN m"))
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        let mut rules = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            let node: neo4rs::Node = row
                .get("m")
                .map_err(|e| MemoryError::StoreError(e.to_string()))?;
            let id: i64 = node.get("id").unwrap_or_default();
            rules.push(MdmRule {
                id: id as u64,
                name: node.get("name").unwrap_or_default(),
                description: node.get("description").unwrap_or_default(),
                conditions: vec![],
                actions: vec![],
                priority: 0,
                is_active: true,
            });
        }
        Ok(rules)
    }

    async fn delete_mdm_rule(&self, id: u64) -> Result<(), MemoryError> {
        let q = query("MATCH (m:MdmRule {id: $id}) DELETE m").param("id", id as i64);
        self.graph
            .run(q)
            .await
            .map_err(|e| MemoryError::StoreError(e.to_string()))?;
        Ok(())
    }

    async fn purge_expired(&self, _ttl: Duration) -> Result<usize, MemoryError> {
        Ok(0)
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
    pub fn new(
        vector_store: Arc<dyn VectorStore>,
        graph_store: Arc<dyn GraphStore>,
        cache_ttl: Duration,
    ) -> Self {
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
