//! Per-IP rate limiting using a token-bucket algorithm.
//!
//! Extracts the client's real IP behind Hugging Face Spaces reverse proxy (using the rightmost
//! entry of the x-forwarded-for header to prevent spoofing) and maintains per-IP rate limits:
//! - /search_city:          15/minute
//! - /calculate_chart:      10/minute
//! - /generate_report:       5/minute
//! - /chat_with_astrologer:  5/minute

use axum::{
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    extract::Request,
};
use once_cell::sync::Lazy;
use serde_json::json;
use std::{
    collections::HashMap,
    sync::Mutex,
    time::Instant,
};

struct TokenBucket {
    tokens: f64,
    last_refill: Instant,
    max_tokens: f64,
    refill_rate: f64, // tokens per second
}

impl TokenBucket {
    fn new(max_tokens: f64, refill_rate: f64) -> Self {
        Self {
            tokens: max_tokens,
            last_refill: Instant::now(),
            max_tokens,
            refill_rate,
        }
    }

    fn check_and_consume(&mut self, amount: f64) -> bool {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.last_refill = now;

        self.tokens = (self.tokens + elapsed * self.refill_rate).min(self.max_tokens);

        if self.tokens >= amount {
            self.tokens -= amount;
            true
        } else {
            false
        }
    }
}

struct IpLimiters {
    search: TokenBucket,
    chart: TokenBucket,
    ai: TokenBucket,
}

impl IpLimiters {
    fn new() -> Self {
        Self {
            // 15/minute -> max 15, refill rate 15/60 = 0.25/sec
            search: TokenBucket::new(15.0, 0.25),
            // 10/minute -> max 10, refill rate 10/60 = 0.1667/sec
            chart: TokenBucket::new(10.0, 10.0 / 60.0),
            // 5/minute -> max 5, refill rate 5/60 = 0.0833/sec
            ai: TokenBucket::new(5.0, 5.0 / 60.0),
        }
    }
}

static IP_LIMITERS: Lazy<Mutex<HashMap<String, IpLimiters>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

/// Extract real client IP behind proxy (e.g. Hugging Face Space reverse proxy)
fn get_real_ip(headers: &header::HeaderMap) -> String {
    if let Some(xff) = headers.get("x-forwarded-for") {
        if let Ok(xff_str) = xff.to_str() {
            let parts: Vec<&str> = xff_str
                .split(',')
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .collect();
            // Take the rightmost IP address added by the trusted reverse proxy to prevent spoofing
            if let Some(rightmost) = parts.last() {
                return rightmost.to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}

fn rate_limit_response() -> Response {
    (
        StatusCode::TOO_MANY_REQUESTS,
        axum::Json(json!({"detail": "Rate limit exceeded. Please slow down and try again."})),
    )
        .into_response()
}

/// Rate-limit middleware for search endpoints (15/min per IP).
pub async fn limit_search(request: Request, next: Next) -> Response {
    let ip = get_real_ip(request.headers());
    
    // Wrap MutexGuard in a tight scope to guarantee it is dropped before `.await` boundary,
    // ensuring the future returned is strictly Send and satisfies Axum MethodRouter layer bounds.
    let allowed = {
        let mut limiters = IP_LIMITERS.lock().unwrap();
        let ip_limiter = limiters.entry(ip).or_insert_with(IpLimiters::new);
        ip_limiter.search.check_and_consume(1.0)
    };
    
    if !allowed {
        return rate_limit_response();
    }
    
    next.run(request).await
}

/// Rate-limit middleware for chart calculation endpoints (10/min per IP).
pub async fn limit_chart(request: Request, next: Next) -> Response {
    let ip = get_real_ip(request.headers());
    
    let allowed = {
        let mut limiters = IP_LIMITERS.lock().unwrap();
        let ip_limiter = limiters.entry(ip).or_insert_with(IpLimiters::new);
        ip_limiter.chart.check_and_consume(1.0)
    };
    
    if !allowed {
        return rate_limit_response();
    }
    
    next.run(request).await
}

/// Rate-limit middleware for AI-powered endpoints (5/min per IP).
pub async fn limit_ai(request: Request, next: Next) -> Response {
    let ip = get_real_ip(request.headers());
    
    let allowed = {
        let mut limiters = IP_LIMITERS.lock().unwrap();
        let ip_limiter = limiters.entry(ip).or_insert_with(IpLimiters::new);
        ip_limiter.ai.check_and_consume(1.0)
    };
    
    if !allowed {
        return rate_limit_response();
    }
    
    next.run(request).await
}
