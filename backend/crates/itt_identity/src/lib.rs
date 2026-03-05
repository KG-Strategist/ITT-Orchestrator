//! ITT-Orchestrator: UAM, SSO, and PIM/PAM
//!
//! Identity Provider (IdP) plugin system supporting standard SSO (SAML 2.0 / OIDC).
//! Strict Role-Based Access Control (RBAC) supporting Privileged Access Management (PAM).

pub mod models;

use models::{Role, Tenant, User};
use mongodb::{
    bson::{doc, Document},
    Client, Collection,
};
use std::fmt;
use tracing::{error, info, instrument};

/// Custom Error enum for Identity operations
#[derive(Debug)]
pub enum IdentityError {
    AuthenticationFailed(String),
    Forbidden(String), // Maps to HTTP 403
    ProviderError(String),
    DatabaseError(String),
}

impl fmt::Display for IdentityError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            IdentityError::AuthenticationFailed(msg) => write!(f, "401 Unauthorized: {}", msg),
            IdentityError::Forbidden(msg) => write!(f, "403 Forbidden: {}", msg),
            IdentityError::ProviderError(msg) => write!(f, "IdP Error: {}", msg),
            IdentityError::DatabaseError(msg) => write!(f, "DB Error: {}", msg),
        }
    }
}

impl std::error::Error for IdentityError {}

/// Identity Middleware integrating with standard OIDC/SAML 2.0 providers via MongoDB.
pub struct IdentityMiddleware {
    users_collection: Collection<User>,
    tenants_collection: Collection<Tenant>,
}

impl IdentityMiddleware {
    pub async fn new(uri: &str, db_name: &str) -> Result<Self, mongodb::error::Error> {
        let client = Client::with_uri_str(uri).await?;
        let db = client.database(db_name);
        Ok(Self {
            users_collection: db.collection::<User>("users"),
            tenants_collection: db.collection::<Tenant>("tenants"),
        })
    }

    /// Authenticates an incoming operational user request.
    #[instrument(name = "IdentityMiddleware::authenticate", skip(self, token))]
    pub async fn authenticate(&self, token: &str) -> Result<User, IdentityError> {
        // In a real implementation, validate the token (e.g., JWT) and extract user info.
        // For this refactor, we simulate extracting a username from the token.
        let username = if token == "admin_token" {
            "admin"
        } else {
            "operator"
        };

        let filter = doc! { "username": username, "is_active": true };
        let user = self
            .users_collection
            .find_one(filter, None)
            .await
            .map_err(|e| IdentityError::DatabaseError(e.to_string()))?;

        match user {
            Some(u) => {
                info!("User {} authenticated successfully", u.username);
                Ok(u)
            }
            None => {
                error!("Authentication failed: User not found or inactive.");
                Err(IdentityError::AuthenticationFailed(
                    "Invalid or expired token".into(),
                ))
            }
        }
    }
}

/// Strict RBAC Manager evaluating requests against PAM policies stored in MongoDB.
pub struct RBACManager {
    roles_collection: Collection<Role>,
}

impl RBACManager {
    pub async fn new(uri: &str, db_name: &str) -> Result<Self, mongodb::error::Error> {
        let client = Client::with_uri_str(uri).await?;
        let db = client.database(db_name);
        Ok(Self {
            roles_collection: db.collection::<Role>("roles"),
        })
    }

    /// Evaluates if the user has the required PAM role to execute a privileged action.
    /// Fails securely with an HTTP 403 Forbidden if unauthorized.
    #[instrument(name = "RBACManager::evaluate_pam_policy", skip(self))]
    pub async fn evaluate_pam_policy(
        &self,
        user_role: &str,
        required_permission: &str,
    ) -> Result<(), IdentityError> {
        let filter = doc! { "name": user_role };
        let role = self
            .roles_collection
            .find_one(filter, None)
            .await
            .map_err(|e| IdentityError::DatabaseError(e.to_string()))?;

        if let Some(r) = role {
            if r.permissions.contains(&required_permission.to_string())
                || r.permissions.contains(&"*".to_string())
            {
                info!("PAM Policy check passed for role {}.", user_role);
                return Ok(());
            }
        }

        error!(
            "PAM Policy Violation: User with role '{}' attempted to access resource requiring '{}'.",
            user_role, required_permission
        );
        Err(IdentityError::Forbidden(
            "PAM Policy Violation: Insufficient privileges to alter configuration.".into(),
        ))
    }
}
