mod auth;
mod config;
mod error;
mod middleware;
mod models;
mod rate_limit;
mod routes;
mod socket;

use axum::{
    extract::State,
    middleware::from_fn,
    routing::{delete, get, post},
    Router,
};
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{trace as sdktrace, Resource};
use std::sync::Arc;
use std::time::Duration;
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use itt_intent::TinyTransformer;
use itt_memory::{CorpusManager, MongoClient, Neo4jClient};
use itt_privacy::{SelfHygieneWorker, TokenizationEngine};

pub struct AppState {
    pub config: Arc<config::Config>,
    pub memory: Arc<CorpusManager>,
    pub privacy: Arc<TokenizationEngine>,
    pub intent: Arc<TinyTransformer>,
    pub jwt_manager: Arc<auth::JwtManager>,
    pub rate_limiter: Arc<rate_limit::RateLimiter>,
    pub melt_tx: tokio::sync::broadcast::Sender<serde_json::Value>,
    // Phase 5: Real Orchestration Components
    pub firewall: Arc<itt_middleware::Zone4SemanticFirewall>,
    pub sandbox: Arc<itt_middleware::SecureExecutionSandbox>,
    pub cost_arbitrage: Arc<itt_middleware::Zone4CostArbitrage>,
    pub mcp_registry: Arc<itt_core::MCPToolRegistry>,
}

// Helper to initialize OpenTelemetry
fn init_tracer() -> Result<opentelemetry_sdk::trace::Tracer, opentelemetry::trace::TraceError> {
    let otlp_endpoint = std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:4317".to_string());

    opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(otlp_endpoint),
        )
        .with_trace_config(
            sdktrace::config().with_resource(Resource::new(vec![KeyValue::new(
                "service.name",
                "itt-orchestrator-control-plane",
            )])),
        )
        .install_batch(opentelemetry_sdk::runtime::Tokio)
}

#[tokio::main]
async fn main() {
    // Initialize tracing for MELT Observability
    let tracer = init_tracer().expect("Failed to initialize OTLP tracer");
    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .with(telemetry)
        .init();

    tracing::info!("Initializing ITT-Orchestrator Control Plane (itt_api)...");

    // Load configuration from environment
    let config = Arc::new(config::Config::from_env());

    // Validate configuration
    if let Err(e) = config.validate() {
        tracing::error!("Configuration validation failed: {}", e);
        std::process::exit(1);
    }
    tracing::info!("Configuration loaded and validated successfully");

    // Initialize JWT Manager
    let jwt_manager = match auth::JwtManager::new(&config) {
        Ok(jm) => {
            tracing::info!("JWT Manager initialized");
            Arc::new(jm)
        }
        Err(e) => {
            tracing::error!("Failed to initialize JWT manager: {}", e);
            std::process::exit(1);
        }
    };

    // Initialize Rate Limiter
    let rate_limiter = Arc::new(rate_limit::RateLimiter::from_config(&config));
    tracing::info!(
        "Rate limiter initialized: {} req/min per IP",
        config.rate_limit_per_minute
    );

    // Initialize Core Engines
    let vector_store = Arc::new(
        MongoClient::new(&config.mongodb_uri, &config.mongodb_database, "embeddings")
            .await
            .expect("Failed to connect to MongoDB"),
    );
    let graph_store = match Neo4jClient::new(
        &config.neo4j_uri,
        &config.neo4j_user,
        &config.neo4j_password,
    )
    .await
    {
        Ok(client) => Arc::new(client),
        Err(e) => {
            tracing::warn!(
                "Failed to connect to Neo4j: {}. Using fallback/mock if applicable.",
                e
            );
            // For this specific build, if neo4j fails, we might want to just panic or use a mock.
            // Since we removed the mock, let's panic to ensure the environment is set up correctly.
            panic!("Neo4j connection is required: {}", e);
        }
    };

    let corpus_manager = Arc::new(CorpusManager::new(
        vector_store,
        graph_store,
        Duration::from_secs(600), // 10 min cache TTL
    ));

    let vault_key_ref =
        std::env::var("VAULT_KEY_REF").unwrap_or_else(|_| "default-vault-key-ref".to_string());
    let privacy_engine = Arc::new(TokenizationEngine::new(&vault_key_ref));
    let intent_engine = Arc::new(TinyTransformer::new("v1.0.0-tiny"));

    // Start Self-Hygiene Daemon
    let hygiene_worker = SelfHygieneWorker::new(Duration::from_secs(3600), corpus_manager.clone());
    hygiene_worker.start_daemon().await;

    let (melt_tx, _) = tokio::sync::broadcast::channel(100);

    // Phase 5: Initialize Real Orchestration Components
    let firewall = Arc::new(itt_middleware::Zone4SemanticFirewall::new(80.0)); // 80% trust threshold
    let sandbox = Arc::new(
        itt_middleware::SecureExecutionSandbox::new()
            .expect("Failed to initialize Secure Execution Sandbox"),
    );
    let cost_arbitrage = Arc::new(itt_middleware::Zone4CostArbitrage::new());
    let mcp_registry = Arc::new(itt_core::MCPToolRegistry::new());

    // Allocate default tenant budget (1000 INR)
    cost_arbitrage
        .allocate_budget("default-tenant", 1000.0)
        .await;

    let app_state = Arc::new(AppState {
        config: config.clone(),
        memory: corpus_manager.clone(),
        privacy: privacy_engine,
        intent: intent_engine,
        jwt_manager: jwt_manager.clone(),
        rate_limiter: rate_limiter.clone(),
        melt_tx,
        firewall,
        sandbox,
        cost_arbitrage,
        mcp_registry,
    });

    if std::env::var("TEST_MODE").unwrap_or_default() == "true" {
        itt_memory::seeder::run(&corpus_manager).await;
    }

    // Protected REST Routes (Require Governance Guardrails)
    let api_routes = Router::new()
        .route("/registry", get(routes::get_registry))
        .route("/registry/:id", delete(routes::delete_registry))
        .route(
            "/integrations",
            get(routes::get_integrations).post(routes::post_integration),
        )
        .route("/zones", get(routes::get_zones).post(routes::post_zone))
        .route(
            "/mdm/rules",
            get(routes::get_mdm_rules).post(routes::post_mdm_rule),
        )
        .route("/mdm/rules/:id", delete(routes::delete_mdm_rule))
        .route("/generate-dag", post(routes::post_generate_dag))
        .route("/gvm/manifest", post(routes::post_gvm_manifest))
        .route("/health", get(health_check))
        .route("/readiness", get(readiness_check))
        .route_layer(from_fn(middleware::governance_guardrails))
        .with_state(app_state);

    // Public/Socket Routes
    let app = Router::new()
        .nest("/api/v1", api_routes)
        .route("/v1/agent-socket", get(socket::agent_socket_handler))
        .with_state(app_state);

    let addr = format!("{}:{}", "0.0.0.0", config.port);

    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            tracing::error!("Failed to bind to address {}: {}", addr, e);
            std::process::exit(1);
        }
    };

    match listener.local_addr() {
        Ok(local_addr) => tracing::info!("🚀 Control Plane listening on http://{}", local_addr),
        Err(e) => tracing::warn!(
            "🚀 Control Plane listening on {}, but failed to get local address: {}",
            addr,
            e
        ),
    }
    tracing::info!("📊 Environment: {}", config.node_env);
    tracing::info!(
        "⚡ Rate limiting: {} requests/min",
        config.rate_limit_per_minute
    );

    if let Err(e) = axum::serve(listener, app).await {
        tracing::error!("Server error: {}", e);
        std::process::exit(1);
    }
}

/// Health check endpoint for k8s liveness probe
async fn health_check() -> &'static str {
    "OK"
}

/// Readiness check endpoint for k8s readiness probe
async fn readiness_check(State(state): State<Arc<AppState>>) -> &'static str {
    // In production, check database connections here
    "READY"
}
