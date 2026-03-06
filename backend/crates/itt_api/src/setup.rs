//! Setup Endpoints — First-Time Admin Initialization
//!
//! Provides two public (unprotected) endpoints:
//! - `GET /api/v1/setup/status` — Returns whether first-time setup is required
//! - `POST /api/v1/setup/init` — Creates the initial Super Admin user
//!
//! The init endpoint is a **one-shot** endpoint: once any admin exists, it
//! returns 403 Forbidden permanently.

use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::info;

use crate::user_store::{CoERole, CreateUserPayload};

/// Response for GET /setup/status
#[derive(Serialize)]
pub struct SetupStatusResponse {
    pub setup_required: bool,
}

/// Request payload for POST /setup/init
#[derive(Debug, Deserialize)]
pub struct SetupInitRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub confirm_password: String,
    pub full_name: String,
    pub organization: String,
}

/// Response for successful POST /setup/init
#[derive(Serialize)]
pub struct SetupInitResponse {
    pub token: String,
    pub expires_in: i64,
    pub token_type: String,
    pub user: SetupUserInfo,
}

/// User info returned after setup (matches frontend User interface)
#[derive(Serialize)]
pub struct SetupUserInfo {
    pub id: String,
    pub username: String,
    pub name: String,
    pub role: String,
}

/// GET /api/v1/setup/status
///
/// Returns `{ "setup_required": true }` if no admin user exists in the database.
/// This endpoint is always public and unprotected.
pub async fn setup_status(
    State(state): State<Arc<crate::AppState>>,
) -> Result<Json<SetupStatusResponse>, (StatusCode, Json<serde_json::Value>)> {
    let has_admin = state.user_store.has_any_admin().await.map_err(|e| {
        tracing::error!("Failed to check admin status: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Failed to check setup status" })),
        )
    })?;

    Ok(Json(SetupStatusResponse {
        setup_required: !has_admin,
    }))
}

/// POST /api/v1/setup/init
///
/// Creates the initial Super Admin user. This endpoint is permanently locked
/// once any admin exists in the database.
///
/// # Security
/// - Returns 403 if any admin already exists
/// - Validates password strength (min 8 chars, uppercase, lowercase, digit, special)
/// - Validates password confirmation match
/// - Hashes password using bcrypt via `spawn_blocking`
/// - Returns a JWT token so the user is logged in immediately after setup
pub async fn setup_init(
    State(state): State<Arc<crate::AppState>>,
    Json(payload): Json<SetupInitRequest>,
) -> Result<(StatusCode, Json<SetupInitResponse>), (StatusCode, Json<serde_json::Value>)> {
    // GUARD: Reject if any admin already exists
    let has_admin = state.user_store.has_any_admin().await.map_err(|e| {
        tracing::error!("Failed to check admin status: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Internal server error" })),
        )
    })?;

    if has_admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(serde_json::json!({
                "error": "Setup has already been completed. An admin user already exists."
            })),
        ));
    }

    // Validate required fields
    if payload.username.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Username is required" })),
        ));
    }

    if payload.email.trim().is_empty() || !payload.email.contains('@') {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "A valid email address is required" })),
        ));
    }

    if payload.full_name.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Full name is required" })),
        ));
    }

    if payload.organization.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Organization name is required" })),
        ));
    }

    // Validate password confirmation
    if payload.password != payload.confirm_password {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Passwords do not match" })),
        ));
    }

    // Validate password strength
    if let Err(msg) = validate_password_strength(&payload.password) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": msg })),
        ));
    }

    // Create the Super Admin user
    let create_payload = CreateUserPayload {
        username: payload.username.trim().to_string(),
        email: payload.email.trim().to_lowercase(),
        password: payload.password,
        full_name: payload.full_name.trim().to_string(),
        organization: payload.organization.trim().to_string(),
    };

    let user = state
        .user_store
        .create_user(create_payload, CoERole::CoE_Super_Admin)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create admin user: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": e })),
            )
        })?;

    info!(
        "🔐 First-time setup complete. Super Admin '{}' created for organization '{}'",
        user.username, user.organization
    );

    // Issue JWT token so user is logged in immediately
    let token = state
        .jwt_manager
        .create_token(
            &user.id,
            &user.email,
            vec!["admin".to_string(), "user".to_string()],
        )
        .map_err(|e| {
            tracing::error!("Failed to create JWT token: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "Failed to generate authentication token" })),
            )
        })?;

    Ok((
        StatusCode::CREATED,
        Json(SetupInitResponse {
            token,
            expires_in: 86400,
            token_type: "Bearer".to_string(),
            user: SetupUserInfo {
                id: user.id,
                username: user.username,
                name: user.full_name,
                role: user.role.to_string(),
            },
        }),
    ))
}

/// Validates password strength against enterprise security requirements.
///
/// Requirements:
/// - Minimum 8 characters
/// - At least one uppercase letter
/// - At least one lowercase letter
/// - At least one digit
/// - At least one special character (!@#$%^&*()_+-=[]{}|;:'",.<>?/`~)
fn validate_password_strength(password: &str) -> Result<(), String> {
    if password.len() < 8 {
        return Err("Password must be at least 8 characters long".to_string());
    }

    if !password.chars().any(|c| c.is_uppercase()) {
        return Err("Password must contain at least one uppercase letter".to_string());
    }

    if !password.chars().any(|c| c.is_lowercase()) {
        return Err("Password must contain at least one lowercase letter".to_string());
    }

    if !password.chars().any(|c| c.is_ascii_digit()) {
        return Err("Password must contain at least one digit".to_string());
    }

    if !password.chars().any(|c| !c.is_alphanumeric()) {
        return Err("Password must contain at least one special character".to_string());
    }

    Ok(())
}
