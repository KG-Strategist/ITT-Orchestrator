use axum::{
    async_trait,
    extract::{FromRequestParts, State},
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

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract Bearer token from Authorization header
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| ApiError::Unauthorized {
                message: "Missing authorization header".to_string(),
            })?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| ApiError::Unauthorized {
                message: "Invalid authorization header format".to_string(),
            })?
            .trim()
            .to_string();

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

/// Login endpoint — authenticates against MongoDB user store
pub async fn login(
    State(state): State<Arc<crate::AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    tracing::info!("Login attempt for user: {}", payload.username);

    if payload.password.is_empty() {
        return Err(ApiError::BadRequest {
            message: "Password is required".to_string(),
            details: None,
        });
    }

    // Look up user from MongoDB
    let user = state
        .user_store
        .find_by_username(&payload.username)
        .await
        .map_err(|e| ApiError::InternalServerError {
            message: format!("Database error: {}", e),
            details: None,
        })?
        .ok_or_else(|| ApiError::Unauthorized {
            message: "Invalid credentials".to_string(),
        })?;

    // CRITICAL: Verify password via bcrypt in a blocking task
    let is_valid = crate::user_store::UserStore::verify_password(
        &payload.password,
        &user.password_hash,
    )
    .await
    .map_err(|e| ApiError::InternalServerError {
        message: format!("Password verification error: {}", e),
        details: None,
    })?;

    if !is_valid {
        return Err(ApiError::Unauthorized {
            message: "Invalid credentials".to_string(),
        });
    }

    // Issue JWT with actual roles from the database
    let roles = match user.role {
        crate::user_store::CoERole::CoE_Super_Admin => {
            vec!["admin".to_string(), "user".to_string()]
        }
        _ => vec!["user".to_string()],
    };

    let token = state
        .jwt_manager
        .create_token(&user.id, &user.email, roles)
        .map_err(|e| ApiError::InternalServerError {
            message: e,
            details: None,
        })?;

    Ok(Json(serde_json::json!({
        "token": token,
        "expires_in": 86400,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.full_name,
            "role": user.role.to_string(),
        }
    })))
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

/// Authentication routes are now registered as public routes in main.rs.

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
