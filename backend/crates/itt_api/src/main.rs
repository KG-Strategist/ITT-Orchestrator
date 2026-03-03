mod auth;
mod config;
mod error;
mod middleware;
mod models;
mod rate_limit;
mod routes;
mod socket;

use std::sync::Arc;
use std::time::Duration;
use axum::{
    routing::{get, post, delete},
    Router,
    middleware::from_fn,
    extract::State,
};
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use itt_memory::{CorpusManager, MilvusClient, Neo4jClient};
use itt_privacy::{TokenizationEngine, SelfHygieneWorker};
use itt_intent::TinyTransformer;

pub struct AppState {
    pub config: Arc<config::Config>,
    pub memory: Arc<CorpusManager>,
    pub privacy: Arc<TokenizationEngine>,
    pub intent: Arc<TinyTransformer>,
    pub jwt_manager: Arc<auth::JwtManager>,
    pub rate_limiter: Arc<rate_limit::RateLimiter>,
}

#[tokio::main]
async fn main() {
    // Initialize tracing for MELT Observability
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
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
    tracing::info!("Rate limiter initialized: {} req/min per IP", config.rate_limit_per_minute);

    // Initialize Core Engines
    let vector_store = Arc::new(MilvusClient);
    let graph_store = Arc::new(Neo4jClient::new());
    
    let corpus_manager = Arc::new(CorpusManager::new(
        vector_store,
        graph_store,
        Duration::from_secs(600), // 10 min cache TTL
    ));

    let privacy_engine = Arc::new(TokenizationEngine::new("vault-key-ref-mock"));
    let intent_engine = Arc::new(TinyTransformer::new("v1.0.0-tiny"));

    // Start Self-Hygiene Daemon
    let hygiene_worker = SelfHygieneWorker::new(Duration::from_secs(3600), corpus_manager.clone());
    hygiene_worker.start_daemon().await;

    let app_state = Arc::new(AppState {
        config: config.clone(),
        memory: corpus_manager.clone(),
        privacy: privacy_engine,
        intent: intent_engine,
        jwt_manager: jwt_manager.clone(),
        rate_limiter: rate_limiter.clone(),
    });

    if std::env::var("TEST_MODE").unwrap_or_default() == "true" {
        itt_memory::seeder::run(&corpus_manager).await;
    }

    // Protected REST Routes (Require Governance Guardrails)
    let api_routes = Router::new()
        .route("/registry", get(routes::get_registry))
        .route("/registry/:id", delete(routes::delete_registry))
        .route("/integrations", get(routes::get_integrations).post(routes::post_integration))
        .route("/zones", get(routes::get_zones).post(routes::post_zone))
        .route("/mdm/rules", get(routes::get_mdm_rules).post(routes::post_mdm_rule))
        .route("/mdm/rules/:id", delete(routes::delete_mdm_rule))
        .route("/generate-dag", post(routes::post_generate_dag))
        .route("/health", get(health_check))
        .route("/readiness", get(readiness_check))
        .route_layer(from_fn(middleware::governance_guardrails))
        .with_state(app_state);

    // Public/Socket Routes
    let app = Router::new()
        .nest("/api/v1", api_routes)
        .route("/v1/agent-socket", get(socket::agent_socket_handler));

    let addr = format!("{}:{}", "0.0.0.0", config.port);
    
    let listener = TcpListener::bind(&addr).await.unwrap();
    tracing::info!("🚀 Control Plane listening on http://{}", listener.local_addr().unwrap());
    tracing::info!("📊 Environment: {}", config.node_env);
    tracing::info!("⚡ Rate limiting: {} requests/min", config.rate_limit_per_minute);

    axum::serve(listener, app).await.unwrap();
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
