use axum::{
    body::{Body, Bytes},
    extract::Request,
    http::{StatusCode, header},
    middleware::Next,
    response::{IntoResponse, Response},
};
use http_body_util::BodyExt;

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

    // Reconstruct the request with the validated body
    let req = Request::from_parts(parts, Body::from(bytes));

    Ok(next.run(req).await)
}
