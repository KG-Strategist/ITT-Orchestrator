use axum::{
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum ApiError {
    InternalServerError {
        message: String,
        details: Option<String>,
    },
    BadRequest {
        message: String,
        details: Option<String>,
    },
    Unauthorized {
        message: String,
    },
    InvalidToken {
        reason: String,
    },
    Forbidden {
        message: String,
    },
    TooManyRequests {
        retry_after: Option<u64>,
    },
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message, retry_after) = match self {
            ApiError::InternalServerError { message, .. } => {
                (StatusCode::INTERNAL_SERVER_ERROR, message, None)
            }
            ApiError::BadRequest { message, .. } => (StatusCode::BAD_REQUEST, message, None),
            ApiError::Unauthorized { message } => (StatusCode::UNAUTHORIZED, message, None),
            ApiError::InvalidToken { reason } => (
                StatusCode::UNAUTHORIZED,
                format!("Invalid token: {}", reason),
                None,
            ),
            ApiError::Forbidden { message } => (StatusCode::FORBIDDEN, message, None),
            ApiError::TooManyRequests { retry_after } => (
                StatusCode::TOO_MANY_REQUESTS,
                "Too many requests".to_string(),
                retry_after,
            ),
        };

        let body = Json(json!({
            "error": error_message,
        }));

        let mut response = (status, body).into_response();

        if let Some(secs) = retry_after {
            if let Ok(val) = header::HeaderValue::from_str(&secs.to_string()) {
                response.headers_mut().insert(header::RETRY_AFTER, val);
            }
        }

        response
    }
}
