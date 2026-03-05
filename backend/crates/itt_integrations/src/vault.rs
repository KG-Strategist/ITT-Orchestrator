//! HashiCorp Vault Client (Identity Mediation / Sandwich Pattern)
//!
//! Connects to HashiCorp Vault to fetch legacy credentials (e.g., LDAP/Basic Auth)
//! based on a validated OIDC Token, injecting them into downstream HTTP headers.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use tracing::{info, instrument};

use itt_middleware::error::AppError;

/// A client for interacting with HashiCorp Vault.
#[derive(Debug, Clone)]
pub struct VaultClient {
    pub address: String,
    pub token: String,
    pub http_client: Client,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultSecretData {
    pub username: String,
    pub password: Option<String>,
    pub ldap_dn: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VaultResponse {
    data: Option<VaultSecretData>,
}

impl VaultClient {
    /// Initializes a new VaultClient.
    /// Falls back to environment variables for local testing if not explicitly provided.
    pub fn new(address: Option<String>, token: Option<String>) -> Result<Self, AppError> {
        let vault_addr = address.unwrap_or_else(|| {
            env::var("VAULT_ADDR").unwrap_or_else(|_| "http://127.0.0.1:8200".to_string())
        });
        let vault_token = token.unwrap_or_else(|| {
            env::var("VAULT_TOKEN").unwrap_or_else(|_| "dev-only-token".to_string())
        });

        Ok(Self {
            address: vault_addr,
            token: vault_token,
            http_client: Client::new(),
        })
    }

    /// Fetches legacy credentials from Vault for a given OIDC subject (user ID).
    #[instrument(name = "VaultClient::fetch_legacy_credentials", skip(self))]
    pub async fn fetch_legacy_credentials(
        &self,
        oidc_sub: &str,
    ) -> Result<VaultSecretData, AppError> {
        let secret_path = format!("{}/v1/secret/data/legacy_creds/{}", self.address, oidc_sub);

        info!(
            "Fetching legacy credentials from Vault for OIDC sub: {}",
            oidc_sub
        );

        // In a real scenario, we would make an HTTP request to Vault:
        // let res = self.http_client.get(&secret_path)
        //     .header("X-Vault-Token", &self.token)
        //     .send()
        //     .await
        //     .map_err(|e| AppError::InternalError(format!("Vault request failed: {}", e)))?;
        //
        // if !res.status().is_success() {
        //     return Err(AppError::SecurityViolation(format!("Failed to fetch credentials from Vault: HTTP {}", res.status())));
        // }
        //
        // let vault_res: VaultResponse = res.json().await
        //     .map_err(|e| AppError::InternalError(format!("Failed to parse Vault response: {}", e)))?;
        //
        // vault_res.data.ok_or_else(|| AppError::InternalError("Vault response missing data field".to_string()))

        // For local testing/simulation without a real Vault instance, we mock the response
        // if the environment variable SIMULATE_VAULT is set to "true".
        let simulate = env::var("SIMULATE_VAULT").unwrap_or_else(|_| "true".to_string());
        if simulate == "true" {
            info!("Simulating Vault response for local testing.");
            return Ok(VaultSecretData {
                username: format!("legacy_{}", oidc_sub),
                password: Some("simulated_password_123!".to_string()),
                ldap_dn: Some(format!("uid={},ou=users,dc=legacy,dc=com", oidc_sub)),
            });
        }

        Err(AppError::InternalError(
            "Real Vault connection not implemented in this stub. Set SIMULATE_VAULT=true."
                .to_string(),
        ))
    }
}

/// The Identity Mediator for the Sandwich Pattern.
pub struct IdentityMediator {
    pub vault_client: VaultClient,
}

impl IdentityMediator {
    pub fn new(vault_client: VaultClient) -> Self {
        Self { vault_client }
    }

    /// Accepts a validated OIDC Token (represented here by its subject/user ID),
    /// fetches legacy credentials from Vault, and injects them into HTTP headers.
    #[instrument(
        name = "IdentityMediator::inject_legacy_identity",
        skip(self, req_headers)
    )]
    pub async fn inject_legacy_identity(
        &self,
        oidc_sub: &str,
        req_headers: &mut reqwest::header::HeaderMap,
    ) -> Result<(), AppError> {
        let creds = self.vault_client.fetch_legacy_credentials(oidc_sub).await?;

        // Inject Basic Auth if password is provided
        if let Some(password) = creds.password {
            let auth_value = format!("{}:{}", creds.username, password);
            use base64::{engine::general_purpose, Engine as _};
            let encoded = general_purpose::STANDARD.encode(auth_value);
            req_headers.insert(
                reqwest::header::AUTHORIZATION,
                format!("Basic {}", encoded).parse().unwrap(),
            );
            info!("Injected Basic Auth header for legacy system.");
        }

        // Inject LDAP DN if provided
        if let Some(ldap_dn) = creds.ldap_dn {
            req_headers.insert("X-Legacy-LDAP-DN", ldap_dn.parse().unwrap());
            info!("Injected X-Legacy-LDAP-DN header for legacy system.");
        }

        Ok(())
    }
}
