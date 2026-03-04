use axum::{
    body::{Body, Bytes},
    extract::Request,
    http::{StatusCode, header},
    middleware::Next,
    response::{IntoResponse, Response},
};
use http_body_util::BodyExt;
use serde_json::json;
use std::env;

const MAX_PAYLOAD_SIZE: usize = 1024 * 1024; // 1 MB

pub async fn governance_guardrails(
    req: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    // 1. Authentication: Require OAuth 2.0 Bearer Token
    let auth_header = req.headers().get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");

    if !auth_header.starts_with("Bearer ") {
        tracing::error!("Governance Block: Missing or invalid Bearer token.");
        return Err(StatusCode::UNAUTHORIZED);
    }

    // 2. Payload Limits & Threat Protection
    let (parts, body) = req.into_parts();

    let bytes = match body.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(_) => {
            tracing::error!("Governance Block: Failed to read request body.");
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    // Enforce strict Maximum Payload Size Limit
    if bytes.len() > MAX_PAYLOAD_SIZE {
        tracing::error!("Governance Block: Payload Too Large ({} bytes).", bytes.len());
        return Err(StatusCode::PAYLOAD_TOO_LARGE);
    }

    // Inline Payload Scanning (SQLi, XXE, XSS)
    let payload_str = String::from_utf8_lossy(&bytes).to_lowercase();
    if payload_str.contains("select * from") || 
       payload_str.contains("<!entity") || 
       payload_str.contains("<script>") {
        tracing::error!("Governance Block: Malicious payload detected (SQLi, XXE, or XSS).");
        return Err(StatusCode::FORBIDDEN);
    }

    // 3. OPA Policy Enforcement
    let opa_url = env::var("OPA_URL").unwrap_or_else(|_| "http://localhost:8181/v1/data/itt/authz/allow".to_string());
    
    // Extract token for OPA
    let token = auth_header.trim_start_matches("Bearer ").trim();
    
    let opa_input = json!({
        "input": {
            "method": parts.method.as_str(),
            "path": parts.uri.path(),
            "token": token,
            "client_ip": parts.headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("unknown")
        }
    });

    // In a real production environment, we would use a connection pool and handle timeouts
    // For this release, we do a simple HTTP POST to OPA
    let client = reqwest::Client::new();
    match client.post(&opa_url).json(&opa_input).send().await {
        Ok(res) => {
            if let Ok(opa_result) = res.json::<serde_json::Value>().await {
                if opa_result["result"].as_bool() == Some(false) {
                    tracing::error!("Governance Block: OPA Policy Denied Access.");
                    return Err(StatusCode::FORBIDDEN);
                }
            } else {
                tracing::warn!("Governance Warning: Failed to parse OPA response. Failing open for demo purposes.");
            }
        },
        Err(e) => {
            tracing::warn!("Governance Warning: OPA unreachable ({}). Failing open for demo purposes.", e);
        }
    }

    // Reconstruct the request with the validated body
    let req = Request::from_parts(parts, Body::from(bytes));

    Ok(next.run(req).await)
}
