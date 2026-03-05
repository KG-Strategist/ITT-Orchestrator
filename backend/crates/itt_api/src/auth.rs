use axum::{
    async_trait,
    extract::{FromRequestParts, TypedHeader},
    headers::{authorization::Bearer, Authorization},
    http::request::Parts,
    middleware::Next,
    response::IntoResponse,
    routing::post,
    Extension, Json, Router,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::config::Config;
use crate::error::ApiError;

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JwtClaims {
    pub sub: String,               // Subject (user ID)
    pub email: String,             // User email
    pub roles: Vec<String>,        // RBAC roles
    pub permissions: Vec<String>,  // Fine-grained permissions
    pub tenant_id: Option<String>, // Multi-tenancy support
    pub exp: i64,                  // Expiration time
    pub iat: i64,                  // Issued at
    pub nbf: i64,                  // Not before
}

/// Login request
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// Login response
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub expires_in: i64,
    pub token_type: String,
}

/// Token validation result
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub claims: JwtClaims,
}

/// JWT manager for token creation and validation
pub struct JwtManager {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
    expiry_duration: Duration,
}

impl JwtManager {
    /// Create new JWT manager from config
    pub fn new(config: &Config) -> Result<Self, String> {
        if config.jwt_secret.len() < 32 {
            return Err("JWT_SECRET must be at least 32 characters".to_string());
        }

        let encoding_key = EncodingKey::from_secret(config.jwt_secret.as_bytes());
        let decoding_key = DecodingKey::from_secret(config.jwt_secret.as_bytes());

        // Parse expiry duration (e.g., "24h", "7d")
        let expiry_duration =
            parse_duration(&config.jwt_expiry).or_else(|_| Ok::<_, String>(Duration::hours(24)))?;

        Ok(Self {
            encoding_key,
            decoding_key,
            expiry_duration,
        })
    }

    /// Create a new JWT token
    pub fn create_token(
        &self,
        user_id: &str,
        email: &str,
        roles: Vec<String>,
    ) -> Result<String, String> {
        let now = Utc::now();
        let exp = (now + self.expiry_duration).timestamp();

        let claims = JwtClaims {
            sub: user_id.to_string(),
            email: email.to_string(),
            roles,
            permissions: vec![],
            tenant_id: None,
            exp,
            iat: now.timestamp(),
            nbf: now.timestamp(),
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(|e| format!("Token creation failed: {}", e))
    }

    /// Validate and decode a token
    pub fn validate_token(&self, token: &str) -> Result<JwtClaims, String> {
        let validation = Validation::new(Algorithm::HS256);

        decode::<JwtClaims>(token, &self.decoding_key, &validation)
            .map(|data| data.claims)
            .map_err(|e| {
                tracing::debug!("Token validation failed: {}", e);
                format!("Invalid or expired token: {}", e)
            })
    }
}

/// Extractor for authenticated requests
#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // Try to extract Bearer token
        let TypedHeader(Authorization::<Bearer>(bearer)) =
            TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state)
                .await
                .map_err(|_| ApiError::Unauthorized {
                    message: "Missing authorization header".to_string(),
                })?;

        let token = bearer.0.to_string();

        // Get JWT manager from extensions (should be added in main.rs)
        let jwt_manager = parts
            .extensions
            .get::<Arc<JwtManager>>()
            .ok_or_else(|| ApiError::InternalServerError {
                message: "JWT manager not configured".to_string(),
                details: None,
            })?
            .clone();

        // Validate token
        let claims = jwt_manager
            .validate_token(&token)
            .map_err(|e| ApiError::InvalidToken { reason: e })?;

        Ok(AuthUser { claims })
    }
}

/// Middleware for role-based access control
#[derive(Clone)]
pub struct RequireRole(pub Vec<String>);

pub async fn role_check_middleware(
    Extension(required_roles): Extension<RequireRole>,
    AuthUser { claims }: AuthUser,
    next: Next,
) -> Result<impl IntoResponse, ApiError> {
    // Check if user has any of the required roles
    let has_role = required_roles
        .0
        .iter()
        .any(|role| claims.roles.contains(role));

    if !has_role {
        return Err(ApiError::Forbidden {
            message: format!("Required roles: {:?}", required_roles.0),
        });
    }

    Ok(next
        .run(axum::extract::Request::new(axum::body::Body::empty()))
        .await)
}

/// Login endpoint
pub async fn login(
    Json(payload): Json<LoginRequest>,
    Extension(jwt_manager): Extension<Arc<JwtManager>>,
) -> Result<Json<LoginResponse>, ApiError> {
    tracing::info!("Login attempt for user: {}", payload.username);

    if payload.password.is_empty() {
        return Err(ApiError::BadRequest {
            message: "Password is required".to_string(),
            details: None,
        });
    }

    // In a real enterprise system, this would integrate with an Identity Provider (IdP)
    // like Okta, Ping Identity, or Active Directory via SAML/OIDC.
    // For this open-source release, we use a basic validation against environment variables
    // or a secure database. Here we simulate a secure check.
    let is_valid_admin = payload.username == "admin"
        && payload.password
            == std::env::var("ADMIN_PASSWORD")
                .unwrap_or_else(|_| "secure_admin_pass_123!".to_string());
    let is_valid_user = payload.username == "user"
        && payload.password
            == std::env::var("USER_PASSWORD")
                .unwrap_or_else(|_| "secure_user_pass_123!".to_string());

    if !is_valid_admin && !is_valid_user {
        return Err(ApiError::Unauthorized {
            message: "Invalid credentials".to_string(),
        });
    }

    let roles = if is_valid_admin {
        vec!["admin".to_string(), "user".to_string()]
    } else {
        vec!["user".to_string()]
    };

    let token = jwt_manager
        .create_token(
            &format!("user_{}", payload.username),
            &format!("{}@example.com", payload.username),
            roles,
        )
        .map_err(|e| ApiError::InternalServerError {
            message: e,
            details: None,
        })?;

    Ok(Json(LoginResponse {
        token,
        expires_in: 86400, // 24 hours in seconds
        token_type: "Bearer".to_string(),
    }))
}

/// Helper to parse duration strings like "24h", "7d"
fn parse_duration(s: &str) -> Result<Duration, String> {
    let s = s.trim().to_lowercase();

    if let Some(hours) = s.strip_suffix('h') {
        hours
            .parse::<i64>()
            .map(Duration::hours)
            .map_err(|_| "Invalid hour value".to_string())
    } else if let Some(days) = s.strip_suffix('d') {
        days.parse::<i64>()
            .map(Duration::days)
            .map_err(|_| "Invalid day value".to_string())
    } else if let Some(mins) = s.strip_suffix('m') {
        mins.parse::<i64>()
            .map(Duration::minutes)
            .map_err(|_| "Invalid minute value".to_string())
    } else {
        Err("Invalid duration format. Use: 24h, 7d, 30m".to_string())
    }
}

/// Create authentication routes
pub fn create_auth_routes(jwt_manager: Arc<JwtManager>) -> Router {
    Router::new()
        .route("/login", post(login))
        .layer(Extension(jwt_manager))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_duration_parsing() {
        assert!(parse_duration("24h").is_ok());
        assert!(parse_duration("7d").is_ok());
        assert!(parse_duration("30m").is_ok());
        assert!(parse_duration("invalid").is_err());
    }

    #[test]
    fn test_jwt_creation() {
        let mut config = Config::from_env();
        config.jwt_secret = "a".repeat(32);
        config.jwt_expiry = "24h".to_string();

        let manager = JwtManager::new(&config).expect("Failed to create JwtManager");
        let token = manager
            .create_token("user123", "test@example.com", vec!["user".to_string()])
            .expect("Failed to create token");

        // Should be able to validate created token
        assert!(manager.validate_token(&token).is_ok());
    }

    #[test]
    fn test_invalid_token() {
        let mut config = Config::from_env();
        config.jwt_secret = "a".repeat(32);

        let manager = JwtManager::new(&config).expect("Failed to create JwtManager");
        assert!(manager.validate_token("invalid.token.here").is_err());
    }
}
