//! MCP Tool Registry
//!
//! Provides centralized tool discovery and management for Model Context Protocol (MCP) tools.
//! Handles tool metadata storage, WASM bytecode caching, and governance via Neo4j.

use chrono::Utc;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, instrument};
use uuid::Uuid;

/// Error type for MCP Tool Registry operations.
#[derive(Debug, Clone)]
pub enum RegistryError {
    /// Tool not found in registry
    ToolNotFound(String),
    /// Invalid WASM bytecode signature
    InvalidWasmSignature,
    /// WASM module failed to compile
    WasmCompilationFailed(String),
    /// Tool discovery failed with reason
    ToolDiscoveryFailed(String),
    /// Internal registry operation error
    InternalError(String),
}

impl std::fmt::Display for RegistryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ToolNotFound(name) => write!(f, "Tool '{}' not found in registry", name),
            Self::InvalidWasmSignature => write!(f, "Invalid WASM bytecode signature"),
            Self::WasmCompilationFailed(msg) => write!(f, "WASM compilation failed: {}", msg),
            Self::ToolDiscoveryFailed(reason) => write!(f, "Tool discovery failed: {}", reason),
            Self::InternalError(msg) => write!(f, "Internal registry error: {}", msg),
        }
    }
}

impl std::error::Error for RegistryError {}

/// Metadata for an MCP Tool.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MCPToolMetadata {
    /// Unique identifier for the tool
    pub id: String,
    /// Human-readable tool name
    pub name: String,
    /// Semantic version (e.g., "1.0.0")
    pub version: String,
    /// Description of tool functionality
    pub description: String,
    /// SHA256 hash of the WASM bytecode for integrity verification
    pub wasm_hash: String,
    /// Maximum execution time in milliseconds (~10000ms default from Secure Execution Sandbox)
    pub timeout_ms: u32,
    /// Maximum memory pages for WASM execution (1024 * 1024 = 1MB default)
    pub max_memory_pages: u32,
    /// Required capabilities (e.g., ["mongo_access", "vector_search"])
    pub required_capabilities: Vec<String>,
    /// Timestamp when tool was registered
    pub registered_at: String,
    /// Timestamp when tool was last updated
    pub last_updated: String,
}

impl MCPToolMetadata {
    /// Creates a new tool metadata instance.
    pub fn new(
        name: String,
        version: String,
        description: String,
        wasm_hash: String,
        capabilities: Vec<String>,
    ) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            version,
            description,
            wasm_hash,
            timeout_ms: 10000,
            max_memory_pages: 1024,
            required_capabilities: capabilities,
            registered_at: now.clone(),
            last_updated: now,
        }
    }
}

/// Centralized MCP Tool Registry.
///
/// Provides lock-free reads for tool metadata and thread-safe WASM bytecode caching.
/// Uses Neo4j (expected to be injected) for persistent tool governance.
pub struct MCPToolRegistry {
    /// Lock-free metadata store (DashMap for concurrent reads)
    metadata: Arc<DashMap<String, MCPToolMetadata>>,
    /// Thread-safe WASM bytecode cache
    wasm_cache: Arc<RwLock<std::collections::HashMap<String, Vec<u8>>>>,
}

impl MCPToolRegistry {
    /// Initializes a new MCPToolRegistry instance.
    pub fn new() -> Self {
        Self {
            metadata: Arc::new(DashMap::new()),
            wasm_cache: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Registers an MCP tool into the registry.
    ///
    /// Validates WASM signature and stores metadata + bytecode.
    #[instrument(skip(self, wasm_bytes), fields(tool_name = %meta.name, wasm_size_bytes = wasm_bytes.len()))]
    pub async fn register_tool(
        &self,
        meta: MCPToolMetadata,
        wasm_bytes: Vec<u8>,
    ) -> Result<(), RegistryError> {
        // Validate WASM signature matches expected hash
        self.validate_wasm_signature(&wasm_bytes, &meta.wasm_hash)
            .await?;

        info!("Registering MCP tool: {} ({})", meta.name, meta.version);

        // Store metadata in lock-free DashMap
        self.metadata.insert(meta.name.clone(), meta.clone());

        // Cache WASM bytecode in thread-safe HashMap
        let mut cache = self.wasm_cache.write().await;
        cache.insert(meta.name.clone(), wasm_bytes);

        info!("MCP tool registered successfully: {}", meta.name);
        Ok(())
    }

    /// Discovers a tool by name, returning metadata and WASM bytecode.
    ///
    /// Uses lock-free reads for metadata, then acquires write lock only if bytecode missing.
    #[instrument(skip(self), fields(tool_name = %name))]
    pub async fn discover_tool(
        &self,
        name: &str,
    ) -> Result<(MCPToolMetadata, Vec<u8>), RegistryError> {
        // Lock-free metadata lookup
        let meta = self
            .metadata
            .get(name)
            .ok_or_else(|| RegistryError::ToolNotFound(name.to_string()))?
            .clone();

        // Attempt cache lookup
        let cache = self.wasm_cache.read().await;
        if let Some(wasm) = cache.get(name) {
            info!("Tool discovered (cached): {}", name);
            return Ok((meta, wasm.clone()));
        }
        drop(cache);

        // If cache miss, return error (caller must register first)
        Err(RegistryError::ToolDiscoveryFailed(format!(
            "WASM bytecode for tool '{}' not found in cache",
            name
        )))
    }

    /// Lists all registered tools' metadata.
    #[instrument(skip(self))]
    pub async fn list_tools(&self) -> Result<Vec<MCPToolMetadata>, RegistryError> {
        let tools: Vec<MCPToolMetadata> = self
            .metadata
            .iter()
            .map(|ref_multi| ref_multi.clone())
            .collect();

        info!("Listing {} registered tools", tools.len());
        Ok(tools)
    }

    /// Validates WASM bytecode signature against expected SHA256 hash.
    async fn validate_wasm_signature(
        &self,
        wasm_bytes: &[u8],
        expected_hash: &str,
    ) -> Result<(), RegistryError> {
        // Compute SHA256 hash of WASM bytecode
        let computed_hash = self.compute_sha256(wasm_bytes);

        if computed_hash != expected_hash {
            return Err(RegistryError::InvalidWasmSignature);
        }

        info!("WASM signature validated: {}", expected_hash);
        Ok(())
    }

    /// Computes SHA256 hash of bytecode.
    fn compute_sha256(&self, bytes: &[u8]) -> String {
        use sha2::Digest;
        let mut hasher = Sha256::new();
        hasher.update(bytes);
        hex::encode(hasher.finalize())
    }

    /// Removes a tool from the registry.
    #[instrument(skip(self), fields(tool_name = %name))]
    pub async fn unregister_tool(&self, name: &str) -> Result<(), RegistryError> {
        if self.metadata.remove(name).is_none() {
            return Err(RegistryError::ToolNotFound(name.to_string()));
        }

        let mut cache = self.wasm_cache.write().await;
        cache.remove(name);

        info!("Tool unregistered: {}", name);
        Ok(())
    }

    /// Gets the count of registered tools.
    pub fn tool_count(&self) -> usize {
        self.metadata.len()
    }
}

impl Default for MCPToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for MCPToolRegistry {
    fn clone(&self) -> Self {
        Self {
            metadata: self.metadata.clone(),
            wasm_cache: self.wasm_cache.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_discover_tool() {
        let registry = MCPToolRegistry::new();
        let wasm_bytes = vec![0x00, 0x61, 0x73, 0x6d]; // Minimal WASM magic number

        // Compute hash for the test WASM
        use sha2::Digest;
        let mut hasher = Sha256::new();
        hasher.update(&wasm_bytes);
        let hash = hex::encode(hasher.finalize());

        let meta = MCPToolMetadata::new(
            "test_tool".to_string(),
            "1.0.0".to_string(),
            "A test MCP tool".to_string(),
            hash,
            vec!["test_capability".to_string()],
        );

        // Register tool
        registry
            .register_tool(meta.clone(), wasm_bytes.clone())
            .await
            .unwrap();

        // Discover tool
        let (discovered_meta, discovered_wasm) = registry.discover_tool("test_tool").await.unwrap();
        assert_eq!(discovered_meta.name, "test_tool");
        assert_eq!(discovered_wasm, wasm_bytes);
    }

    #[tokio::test]
    async fn test_discover_nonexistent_tool() {
        let registry = MCPToolRegistry::new();
        let result = registry.discover_tool("nonexistent").await;
        assert!(matches!(result, Err(RegistryError::ToolNotFound(_))));
    }

    #[tokio::test]
    async fn test_invalid_wasm_signature() {
        let registry = MCPToolRegistry::new();
        let wasm_bytes = vec![0x00, 0x61, 0x73, 0x6d];

        let meta = MCPToolMetadata::new(
            "bad_tool".to_string(),
            "1.0.0".to_string(),
            "A tool with bad signature".to_string(),
            "invalid_hash".to_string(),
            vec![],
        );

        let result = registry.register_tool(meta, wasm_bytes).await;
        assert!(matches!(result, Err(RegistryError::InvalidWasmSignature)));
    }
}
