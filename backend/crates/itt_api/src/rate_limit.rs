use axum::{
    extract::Request,
    middleware::Next,
    response::IntoResponse,
};
use std::net::IpAddr;
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use std::time::{Duration, SystemTime};

use crate::error::ApiError;
use crate::config::Config;

/// Rate limit entry containing request count and window start time
#[derive(Clone, Debug)]
struct RateLimitEntry {
    count: u32,
    window_start: SystemTime,
}

/// Token bucket rate limiter
pub struct RateLimiter {
    /// Per-IP rate limit store
    limits: Arc<RwLock<HashMap<String, RateLimitEntry>>>,
    /// Maximum requests per minute
    max_requests: u32,
    /// Time window in seconds
    window_secs: u64,
}

impl RateLimiter {
    /// Create a new rate limiter from config
    pub fn from_config(config: &Config) -> Self {
        Self {
            limits: Arc::new(RwLock::new(HashMap::new())),
            max_requests: config.rate_limit_per_minute,
            window_secs: 60,
        }
    }

    /// Check if a request from given IP should be allowed
    pub async fn check_limit(&self, client_ip: &str) -> Result<(), (u16, u64)> {
        let now = SystemTime::now();
        let mut limits = self.limits.write().await;

        match limits.get_mut(client_ip) {
            Some(entry) => {
                // Check if window has expired
                if let Ok(elapsed) = now.duration_since(entry.window_start) {
                    if elapsed.as_secs() > self.window_secs {
                        // Reset window
                        entry.count = 1;
                        entry.window_start = now;
                        Ok(())
                    } else if entry.count < self.max_requests {
                        entry.count += 1;
                        Ok(())
                    } else {
                        // Rate limit exceeded
                        let retry_after = self.window_secs
                            - elapsed.as_secs().min(self.window_secs);
                        Err((429, retry_after))
                    }
                } else {
                    Err((500, 60))
                }
            }
            None => {
                // New client
                limits.insert(
                    client_ip.to_string(),
                    RateLimitEntry {
                        count: 1,
                        window_start: now,
                    },
                );
                Ok(())
            }
        }
    }

    /// Get current request count for an IP
    pub async fn get_count(&self, client_ip: &str) -> u32 {
        self.limits
            .read()
            .await
            .get(client_ip)
            .map(|e| e.count)
            .unwrap_or(0)
    }

    /// Clear rate limit store (useful for testing)
    #[allow(dead_code)]
    pub async fn clear(&self) {
        self.limits.write().await.clear();
    }
}

/// Extract client IP from request
pub fn get_client_ip(request: &Request) -> String {
    request
        .headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.split(',').next())
        .and_then(|ip| ip.trim().parse::<IpAddr>().ok())
        .map(|ip| ip.to_string())
        .or_else(|| {
            request
                .headers()
                .get("x-real-ip")
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "unknown".to_string())
}

/// Rate limiting middleware
pub async fn rate_limit_middleware(
    request: Request,
    next: Next,
    rate_limiter: Arc<RateLimiter>,
) -> Result<impl IntoResponse, ApiError> {
    let client_ip = get_client_ip(&request);

    match rate_limiter.check_limit(&client_ip).await {
        Ok(_) => {
            tracing::debug!(client_ip = %client_ip, "Rate limit check passed");
            Ok(next.run(request).await)
        }
        Err((status_code, retry_after)) => {
            tracing::warn!(
                client_ip = %client_ip,
                retry_after = retry_after,
                "Rate limit exceeded"
            );

            let api_error = ApiError::TooManyRequests {
                retry_after: Some(retry_after),
            };

            Err(api_error)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limiter_basic() {
        let mut config = Config::from_env();
        config.rate_limit_per_minute = 3;

        let limiter = RateLimiter::from_config(&config);
        let ip = "192.168.1.1";

        // First 3 requests should pass
        assert!(limiter.check_limit(ip).await.is_ok());
        assert!(limiter.check_limit(ip).await.is_ok());
        assert!(limiter.check_limit(ip).await.is_ok());

        // 4th should fail
        assert!(limiter.check_limit(ip).await.is_err());
    }

    #[tokio::test]
    async fn test_rate_limit_window_reset() {
        let mut config = Config::from_env();
        config.rate_limit_per_minute = 1;

        let limiter = RateLimiter::from_config(&config);
        limiter.window_secs = 1; // 1 second window
        let ip = "192.168.1.2";

        // First request passes
        assert!(limiter.check_limit(ip).await.is_ok());

        // Second request fails
        assert!(limiter.check_limit(ip).await.is_err());

        // Wait for window to reset
        tokio::time::sleep(Duration::from_secs(2)).await;

        // Third request should pass (new window)
        assert!(limiter.check_limit(ip).await.is_ok());
    }

    #[tokio::test]
    async fn test_multiple_ips() {
        let mut config = Config::from_env();
        config.rate_limit_per_minute = 2;

        let limiter = RateLimiter::from_config(&config);
        let ip1 = "192.168.1.1";
        let ip2 = "192.168.1.2";

        // Both IPs should have separate limits
        assert!(limiter.check_limit(ip1).await.is_ok());
        assert!(limiter.check_limit(ip1).await.is_ok());
        assert!(limiter.check_limit(ip1).await.is_err());

        // But ip2 still has requests available
        assert!(limiter.check_limit(ip2).await.is_ok());
        assert!(limiter.check_limit(ip2).await.is_ok());
        assert!(limiter.check_limit(ip2).await.is_err());
    }
}
