use std::env;

/// Production-ready configuration loaded from environment variables
#[derive(Debug, Clone)]
pub struct Config {
    // Server
    pub port: u16,
    pub node_env: String,
    pub log_level: String,

    // Database: MongoDB
    pub mongodb_uri: String,
    pub mongodb_database: String,

    // Database: Neo4j
    pub neo4j_uri: String,
    pub neo4j_user: String,
    pub neo4j_password: String,

    // Security
    pub jwt_secret: String,
    pub jwt_expiry: String,
    pub cors_origins: Vec<String>,
    pub allowed_hosts: Vec<String>,

    // Vault (Secrets Management)
    pub vault_addr: String,
    pub vault_token: Option<String>,

    // API Keys
    pub gemini_api_key: Option<String>,

    // Compliance
    pub dpdp_enabled: bool,
    pub gdpr_enabled: bool,
    pub data_retention_days: u32,

    // Feature Flags
    pub test_mode: bool,
    pub enable_cost_arbitrage: bool,
    pub enable_semantic_firewall: bool,

    // Rate Limiting & Performance
    pub rate_limit_per_minute: u32,
    pub max_payload_size_mb: usize,
    pub request_timeout_secs: u64,
    pub cache_ttl_secs: u64,

    // Logging & Audit
    pub audit_log_enabled: bool,
    pub audit_log_path: String,

    // Workers
    pub database_pool_size: u32,
}

impl Config {
    /// Load configuration from environment variables with sensible defaults
    pub fn from_env() -> Self {
        dotenv::dotenv().ok(); // Load from .env if it exists

        Config {
            port: env::var("PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()
                .unwrap_or(3001),
            node_env: env::var("NODE_ENV").unwrap_or_else(|_| "production".to_string()),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),

            // MongoDB
            mongodb_uri: env::var("MONGODB_URI")
                .unwrap_or_else(|_| "mongodb://localhost:27017".to_string()),
            mongodb_database: env::var("MONGODB_DATABASE")
                .unwrap_or_else(|_| "itt_orchestrator".to_string()),

            // Neo4j
            neo4j_uri: env::var("NEO4J_URI")
                .unwrap_or_else(|_| "bolt://localhost:7687".to_string()),
            neo4j_user: env::var("NEO4J_USERNAME").unwrap_or_else(|_| "neo4j".to_string()),
            neo4j_password: env::var("NEO4J_PASSWORD").unwrap_or_else(|_| "neo4j".to_string()),

            // Security
            jwt_secret: env::var("JWT_SECRET").unwrap_or_else(|_| {
                tracing::warn!("JWT_SECRET not configured, using default. THIS IS INSECURE!");
                "default-secret-change-me-in-production-at-least-32-characters".to_string()
            }),
            jwt_expiry: env::var("JWT_EXPIRY").unwrap_or_else(|_| "24h".to_string()),
            cors_origins: env::var("CORS_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:3000".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
            allowed_hosts: env::var("ALLOWED_HOSTS")
                .unwrap_or_else(|_| "localhost".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),

            // Vault
            vault_addr: env::var("VAULT_ADDR")
                .unwrap_or_else(|_| "http://localhost:8200".to_string()),
            vault_token: env::var("VAULT_TOKEN").ok(),

            // API Keys
            gemini_api_key: env::var("GEMINI_API_KEY").ok(),

            // Compliance
            dpdp_enabled: env::var("DPDP_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            gdpr_enabled: env::var("GDPR_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            data_retention_days: env::var("DATA_RETENTION_DAYS")
                .unwrap_or_else(|_| "90".to_string())
                .parse()
                .unwrap_or(90),

            // Feature Flags
            test_mode: env::var("TEST_MODE")
                .unwrap_or_else(|_| "false".to_string())
                .parse()
                .unwrap_or(false),
            enable_cost_arbitrage: env::var("ENABLE_COST_ARBITRAGE")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            enable_semantic_firewall: env::var("ENABLE_SEMANTIC_FIREWALL")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),

            // Rate Limiting
            rate_limit_per_minute: env::var("RATE_LIMIT_PER_MINUTE")
                .unwrap_or_else(|_| "100".to_string())
                .parse()
                .unwrap_or(100),
            max_payload_size_mb: env::var("MAX_PAYLOAD_SIZE_MB")
                .unwrap_or_else(|_| "1".to_string())
                .parse()
                .unwrap_or(1),
            request_timeout_secs: env::var("REQUEST_TIMEOUT_SECS")
                .unwrap_or_else(|_| "30".to_string())
                .parse()
                .unwrap_or(30),
            cache_ttl_secs: env::var("CACHE_TTL_SECS")
                .unwrap_or_else(|_| "600".to_string())
                .parse()
                .unwrap_or(600),

            // Logging & Audit
            audit_log_enabled: env::var("AUDIT_LOG_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            audit_log_path: env::var("AUDIT_LOG_PATH")
                .unwrap_or_else(|_| "./logs/audit".to_string()),

            // Workers
            database_pool_size: env::var("DATABASE_POOL_SIZE")
                .unwrap_or_else(|_| "20".to_string())
                .parse()
                .unwrap_or(20),
        }
    }

    /// Validate critical configuration on startup
    pub fn validate(&self) -> Result<(), String> {
        if self.jwt_secret == "default-secret-change-me-in-production-at-least-32-characters" {
            if self.node_env == "production" {
                return Err("JWT_SECRET not configured for production!".to_string());
            }
        }

        if self.jwt_secret.len() < 32 {
            return Err("JWT_SECRET must be at least 32 characters".to_string());
        }

        if self.mongodb_uri.is_empty() {
            return Err("MONGODB_URI is required".to_string());
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_defaults() {
        let cfg = Config::from_env();
        assert_eq!(cfg.node_env, "production");
        assert_eq!(cfg.log_level, "info");
        assert!(cfg.dpdp_enabled);
        assert!(cfg.gdpr_enabled);
    }
}
