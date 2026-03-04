use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Security Violation: {0}")]
    SecurityViolation(String),

    #[error("Privacy Violation: {0}")]
    PrivacyViolation(String),

    #[error("Rate Limit Exceeded: {0}")]
    RateLimitExceeded(String),

    #[error("Internal Error: {0}")]
    InternalError(String),
}
