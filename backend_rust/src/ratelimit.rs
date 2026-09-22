//! Per-IP rate limiting using a token-bucket algorithm.
//!
//! Extracts the client's real IP behind Hugging Face Spaces reverse proxy (using the rightmost
//! entry of the x-forwarded-for header to prevent spoofing) and maintains per-IP rate limits:
//! - /search_city:          15/minute
//! - /calculate_chart:      10/minute
//! - /generate_report:       5/minute
//! - /chat_with_astrologer:  5/minute
//!
//! Stale entries (idle >10 min) are periodically evicted to prevent unbounded memory growth.

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
    time::{Duration, Instant},
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
    last_seen: Instant,
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
            last_seen: Instant::now(),
        }
    }
}

static IP_LIMITERS: Lazy<Mutex<HashMap<String, IpLimiters>>> = Lazy::new(|| {
    Mutex::new(HashMap::new())
});

/// Global AI limiter protecting the shared Gemini API quota:
/// Max burst: 10 requests, Refill rate: 10 requests / 60 seconds (~0.1667/sec).
/// This mathematically prevents exceeding Google's 15 RPM free tier limit during traffic spikes.
static GLOBAL_AI_LIMITER: Lazy<Mutex<TokenBucket>> = Lazy::new(|| {
    Mutex::new(TokenBucket::new(10.0, 10.0 / 60.0))
});

/// Evict IP entries idle for longer than the cutoff to prevent unbounded memory growth.
/// Runs probabilistically when the map exceeds a threshold to minimize overhead.
const STALE_CUTOFF: Duration = Duration::from_secs(600); // 10 minutes
const CLEANUP_THRESHOLD: usize = 100;

fn maybe_cleanup(limiters: &mut HashMap<String, IpLimiters>) {
    if limiters.len() > CLEANUP_THRESHOLD {
        let cutoff = Instant::now() - STALE_CUTOFF;
        limiters.retain(|_, v| v.last_seen > cutoff);
    }
}

fn is_private_ip(ip_str: &str) -> bool {
    if let Ok(ip) = ip_str.parse::<std::net::IpAddr>() {
        match ip {
            std::net::IpAddr::V4(ipv4) => {
                ipv4.is_loopback()
                    || ipv4.is_private()
                    || ipv4.is_link_local()
                    || ipv4.is_broadcast()
                    || ipv4.is_unspecified()
            }
            std::net::IpAddr::V6(ipv6) => {
                ipv6.is_loopback() || ipv6.is_unspecified()
            }
        }
    } else {
        false
    }
}

/// Extract real client IP behind reverse proxy (Cloudflare, Hugging Face Spaces, Ingress, etc.)
fn get_real_ip(headers: &header::HeaderMap) -> String {
    // 1. Cloudflare Connecting IP (Hugging Face Spaces runs behind Cloudflare)
    if let Some(cf_ip) = headers.get("cf-connecting-ip").and_then(|v| v.to_str().ok()) {
        let trimmed = cf_ip.trim();
        if !trimmed.is_empty() && !is_private_ip(trimmed) {
            return trimmed.to_string();
        }
    }

    // 2. X-Real-IP header set by upstream reverse proxy
    if let Some(real_ip) = headers.get("x-real-ip").and_then(|v| v.to_str().ok()) {
        let trimmed = real_ip.trim();
        if !trimmed.is_empty() && !is_private_ip(trimmed) {
            return trimmed.to_string();
        }
    }

    // 3. X-Forwarded-For: find the first non-private public IP address
    if let Some(xff) = headers.get("x-forwarded-for").and_then(|v| v.to_str().ok()) {
        let parts: Vec<&str> = xff
            .split(',')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .collect();

        // Check for the first legitimate public client IP
        for &part in &parts {
            if !is_private_ip(part) {
                return part.to_string();
            }
        }

        // Fallback to first part if all are internal/test IPs
        if let Some(&first) = parts.first() {
            return first.to_string();
        }
    }

    "127.0.0.1".to_string()
}

fn rate_limit_response(detail: &str) -> Response {
    (
        StatusCode::TOO_MANY_REQUESTS,
        axum::Json(json!({"detail": detail})),
    )
        .into_response()
}

/// Rate-limit middleware for search endpoints (15/min per IP).
pub async fn limit_search(request: Request, next: Next) -> Response {
    let ip = get_real_ip(request.headers());
    
    let allowed = {
        let mut limiters = IP_LIMITERS.lock().unwrap();
        let ip_limiter = limiters.entry(ip).or_insert_with(IpLimiters::new);
        ip_limiter.last_seen = Instant::now();
        let result = ip_limiter.search.check_and_consume(1.0);
        maybe_cleanup(&mut limiters);
        result
    };
    
    if !allowed {
        return rate_limit_response("Rate limit exceeded for city search. Please slow down and try again.");
    }
    
    next.run(request).await
}

/// Rate-limit middleware for chart calculation endpoints (10/min per IP).
pub async fn limit_chart(request: Request, next: Next) -> Response {
    let ip = get_real_ip(request.headers());
    
    let allowed = {
        let mut limiters = IP_LIMITERS.lock().unwrap();
        let ip_limiter = limiters.entry(ip).or_insert_with(IpLimiters::new);
        ip_limiter.last_seen = Instant::now();
        let result = ip_limiter.chart.check_and_consume(1.0);
        maybe_cleanup(&mut limiters);
        result
    };
    
    if !allowed {
        return rate_limit_response("Rate limit exceeded for chart calculation. Please slow down and try again.");
    }
    
    next.run(request).await
}

/// Rate-limit middleware for AI-powered endpoints (5/min per IP + 10/min global protection).
pub async fn limit_ai(request: Request, next: Next) -> Response {
    let ip = get_real_ip(request.headers());
    
    // Check per-IP limit first
    let allowed_ip = {
        let mut limiters = IP_LIMITERS.lock().unwrap();
        let ip_limiter = limiters.entry(ip).or_insert_with(IpLimiters::new);
        ip_limiter.last_seen = Instant::now();
        let result = ip_limiter.ai.check_and_consume(1.0);
        maybe_cleanup(&mut limiters);
        result
    };
    
    if !allowed_ip {
        return rate_limit_response("AI request limit reached for your connection (max 5/minute). Please wait a moment.");
    }

    // Check global capacity to safeguard the shared Gemini API 15 RPM quota
    let allowed_global = {
        let mut global = GLOBAL_AI_LIMITER.lock().unwrap();
        global.check_and_consume(1.0)
    };

    if !allowed_global {
        return rate_limit_response("The AI astrologer is currently handling multiple requests. Please retry in a few seconds.");
    }
    
    next.run(request).await
}
