//! User Store — MongoDB-backed user persistence layer
//!
//! Provides CRUD operations for the `users` collection with bcrypt password
//! hashing. All cryptographic operations are wrapped in `tokio::task::spawn_blocking`
//! to avoid blocking the async Tokio worker threads.

use chrono::Utc;
use mongodb::{
    bson::{doc, Document},
    Collection, Database,
};
use serde::{Deserialize, Serialize};
use tracing::{info, instrument};

/// Enterprise user roles aligned with the CoE RBAC model.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CoERole {
    CoE_Super_Admin,
    CoE_Fortress_Admin,
    CoE_CoreGuard_Admin,
    CoE_Agentic_GW_Admin,
    CoE_Unified_LLM_Admin,
}

impl std::fmt::Display for CoERole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CoERole::CoE_Super_Admin => write!(f, "CoE_Super_Admin"),
            CoERole::CoE_Fortress_Admin => write!(f, "CoE_Fortress_Admin"),
            CoERole::CoE_CoreGuard_Admin => write!(f, "CoE_CoreGuard_Admin"),
            CoERole::CoE_Agentic_GW_Admin => write!(f, "CoE_Agentic_GW_Admin"),
            CoERole::CoE_Unified_LLM_Admin => write!(f, "CoE_Unified_LLM_Admin"),
        }
    }
}

/// Persistent user document stored in MongoDB `users` collection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    pub password_hash: String,
    pub full_name: String,
    pub organization: String,
    pub role: CoERole,
    pub created_at: String,
    pub updated_at: String,
}

/// Payload for creating a new user (received from setup/registration endpoints).
#[derive(Debug, Deserialize)]
pub struct CreateUserPayload {
    pub username: String,
    pub email: String,
    pub password: String,
    pub full_name: String,
    pub organization: String,
}

/// Thread-safe MongoDB user store.
pub struct UserStore {
    collection: Collection<Document>,
}

impl UserStore {
    /// Initialize the user store, connected to the `users` collection.
    pub fn new(db: &Database) -> Self {
        let collection = db.collection::<Document>("users");
        info!("UserStore initialized (collection: users)");
        Self { collection }
    }

    /// Check if any user with a Super Admin role exists in the database.
    /// Used by the setup status endpoint to determine if first-time setup is required.
    #[instrument(name = "UserStore::has_any_admin", skip(self))]
    pub async fn has_any_admin(&self) -> Result<bool, String> {
        let filter = doc! { "role": "CoE_Super_Admin" };
        let result = self
            .collection
            .find_one(filter, None)
            .await
            .map_err(|e| format!("MongoDB query failed: {}", e))?;
        Ok(result.is_some())
    }

    /// Create a new user with bcrypt-hashed password.
    ///
    /// **CRITICAL**: The bcrypt hash is computed inside `tokio::task::spawn_blocking`
    /// to avoid blocking the async Tokio worker threads.
    #[instrument(name = "UserStore::create_user", skip(self, payload), fields(username = %payload.username))]
    pub async fn create_user(
        &self,
        payload: CreateUserPayload,
        role: CoERole,
    ) -> Result<User, String> {
        // Check for duplicate username
        let existing = self
            .collection
            .find_one(doc! { "username": &payload.username }, None)
            .await
            .map_err(|e| format!("MongoDB query failed: {}", e))?;

        if existing.is_some() {
            return Err(format!(
                "User '{}' already exists",
                payload.username
            ));
        }

        // Check for duplicate email
        let existing_email = self
            .collection
            .find_one(doc! { "email": &payload.email }, None)
            .await
            .map_err(|e| format!("MongoDB query failed: {}", e))?;

        if existing_email.is_some() {
            return Err(format!(
                "Email '{}' is already registered",
                payload.email
            ));
        }

        // CRITICAL: Hash password in a blocking task to avoid starving the Tokio runtime.
        let plain_password = payload.password.clone();
        let password_hash = tokio::task::spawn_blocking(move || {
            bcrypt::hash(plain_password, bcrypt::DEFAULT_COST)
                .map_err(|e| format!("Password hashing failed: {}", e))
        })
        .await
        .map_err(|e| format!("Blocking task panicked: {}", e))??;

        let now = Utc::now().to_rfc3339();
        let user_id = uuid::Uuid::new_v4().to_string();

        let user = User {
            id: user_id.clone(),
            username: payload.username,
            email: payload.email,
            password_hash,
            full_name: payload.full_name,
            organization: payload.organization,
            role,
            created_at: now.clone(),
            updated_at: now,
        };

        // Serialize to BSON document
        let doc = doc! {
            "id": &user.id,
            "username": &user.username,
            "email": &user.email,
            "password_hash": &user.password_hash,
            "full_name": &user.full_name,
            "organization": &user.organization,
            "role": user.role.to_string(),
            "created_at": &user.created_at,
            "updated_at": &user.updated_at,
        };

        self.collection
            .insert_one(doc, None)
            .await
            .map_err(|e| format!("Failed to insert user: {}", e))?;

        info!("User '{}' created successfully (id: {})", user.username, user.id);
        Ok(user)
    }

    /// Look up a user by username.
    #[instrument(name = "UserStore::find_by_username", skip(self), fields(username = %username))]
    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>, String> {
        let filter = doc! { "username": username };
        let result = self
            .collection
            .find_one(filter, None)
            .await
            .map_err(|e| format!("MongoDB query failed: {}", e))?;

        match result {
            Some(doc) => {
                let user = User {
                    id: doc.get_str("id").unwrap_or_default().to_string(),
                    username: doc.get_str("username").unwrap_or_default().to_string(),
                    email: doc.get_str("email").unwrap_or_default().to_string(),
                    password_hash: doc.get_str("password_hash").unwrap_or_default().to_string(),
                    full_name: doc.get_str("full_name").unwrap_or_default().to_string(),
                    organization: doc.get_str("organization").unwrap_or_default().to_string(),
                    role: match doc.get_str("role").unwrap_or_default() {
                        "CoE_Super_Admin" => CoERole::CoE_Super_Admin,
                        "CoE_Fortress_Admin" => CoERole::CoE_Fortress_Admin,
                        "CoE_CoreGuard_Admin" => CoERole::CoE_CoreGuard_Admin,
                        "CoE_Agentic_GW_Admin" => CoERole::CoE_Agentic_GW_Admin,
                        "CoE_Unified_LLM_Admin" => CoERole::CoE_Unified_LLM_Admin,
                        _ => CoERole::CoE_Super_Admin, // fallback
                    },
                    created_at: doc.get_str("created_at").unwrap_or_default().to_string(),
                    updated_at: doc.get_str("updated_at").unwrap_or_default().to_string(),
                };
                Ok(Some(user))
            }
            None => Ok(None),
        }
    }

    /// Verify a plaintext password against a bcrypt hash.
    ///
    /// **CRITICAL**: The bcrypt verification is computed inside `tokio::task::spawn_blocking`
    /// to avoid blocking the async Tokio worker threads.
    pub async fn verify_password(plain: &str, hash: &str) -> Result<bool, String> {
        let plain = plain.to_string();
        let hash = hash.to_string();
        tokio::task::spawn_blocking(move || {
            bcrypt::verify(plain, &hash).map_err(|e| format!("Password verification failed: {}", e))
        })
        .await
        .map_err(|e| format!("Blocking task panicked: {}", e))?
    }
}
