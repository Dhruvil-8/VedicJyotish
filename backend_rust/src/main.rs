//! VedicJyotish Rust Backend — Production-grade Axum server.
//!
//! Drop-in replacement for the Python FastAPI backend with:
//! - Swiss Ephemeris-powered Vedic chart calculations
//! - Gemini AI streaming for report generation and astrologer chat
//! - Local SQLite city search with Photon API fallback
//! - API key authentication, CORS, security headers, and rate limiting
//! - Structured tracing-based logging

mod ashtakavarga;
mod atlas;
mod compatibility;
mod yoga;
mod constants;
mod context;
mod engine;
mod gemini;
mod models;
mod panchanga;
mod ratelimit;
mod service;
mod swiss;
mod timezones;
mod chart;
mod drishti;
mod maitri;
mod argala;
mod dasha;
mod shadbala;





use axum::{
    body::Body,
    extract::{Query, State},
    http::{header, HeaderMap, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use dotenvy::dotenv;
use models::{BirthData, ChartCalculationRequest, ChatRequest};
use serde::Deserialize;
use serde_json::json;
use std::{env, net::SocketAddr, sync::Arc};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tracing::info;

// ─── Application State ─────────────────────────────────────────────────────

#[derive(Clone)]
struct AppState {
    api_secret_key: Option<String>,
    auth_required: bool,
    is_production: bool,
}

// ─── Error Type ─────────────────────────────────────────────────────────────

#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    message: String,
}

impl ApiError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(json!({ "detail": self.message }))).into_response()
    }
}

// ─── Query Params ───────────────────────────────────────────────────────────

#[derive(Deserialize)]
struct SearchCityQuery {
    query: String,
}

// ─── Main ───────────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    dotenv().ok();

    // Initialize structured logging
    let log_level = if is_production() { "warn" } else { "info" };
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new(log_level)),
        )
        .compact()
        .init();

    // Verify locations database presence on startup
    let db_path = env::var("LOCATION_DB_PATH")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| {
            std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("data/locations.db")
        });
    if !db_path.exists() {
        tracing::warn!(
            "Locations database not found at {}. City search endpoint (/search_city) will be offline.",
            db_path.display()
        );
    } else {
        tracing::info!(
            "Locations database successfully verified at {}.",
            db_path.display()
        );
    }

    // Initialize Swiss Ephemeris
    swiss::init();

    let state = Arc::new(AppState {
        api_secret_key: env::var("API_SECRET_KEY").ok().filter(|v| !v.is_empty()),
        auth_required: auth_required(),
        is_production: is_production(),
    });

    if state.auth_required && state.api_secret_key.is_none() {
        panic!("API_SECRET_KEY is required when ENVIRONMENT=production or REQUIRE_API_KEY=true");
    }

    info!(
        production = state.is_production,
        auth = state.auth_required,
        "Configuration loaded"
    );

    let cors = cors_layer();

    // Build router with per-endpoint rate limiting
    let app = Router::new()
        // Public health endpoint
        .route("/", get(root))
        // City search (15/min)
        .route(
            "/search_city",
            get(search_city).layer(middleware::from_fn(ratelimit::limit_search)),
        )
        // Chart calculation (10/min)
        .route(
            "/calculate_chart",
            post(calculate_chart).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        // Transit calculation (10/min)
        .route(
            "/calculate_transits",
            post(calculate_transits).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        // AI-powered endpoints (5/min)
        .route(
            "/generate_report",
            post(generate_report).layer(middleware::from_fn(ratelimit::limit_ai)),
        )
        .route(
            "/chat_with_astrologer",
            post(chat_with_astrologer).layer(middleware::from_fn(ratelimit::limit_ai)),
        )
        // V1 API (enhanced endpoints)
        .route("/api/v1/capabilities", get(capabilities))
        .route(
            "/api/v1/chart/full",
            post(calculate_full_chart).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/ai/chart-context",
            post(ai_chart_context).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/match/compatibility",
            post(calculate_compatibility).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/rasi",
            post(chart_rasi).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/navamsa",
            post(chart_navamsa).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/varga",
            post(chart_varga).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/yogas",
            post(chart_yogas).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/doshas",
            post(chart_doshas).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/jaimini",
            post(chart_jaimini).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/argala",
            post(chart_argala).layer(middleware::from_fn(ratelimit::limit_chart)),
        )

        .route(
            "/api/v1/chart/panchanga",
            post(chart_panchanga).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/ashtakavarga",
            post(chart_ashtakavarga).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/dasha",
            post(chart_dasha).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .route(
            "/api/v1/chart/dasha/chara",
            post(chart_chara_dasha).layer(middleware::from_fn(ratelimit::limit_chart)),
        )

        .route(
            "/api/v1/chart/drishti",
            post(chart_drishti).layer(middleware::from_fn(ratelimit::limit_chart)),
        )
        .with_state(state)
        .layer(middleware::from_fn(security_headers))
        .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB max request body
        .layer(cors);

    let port = env::var("PORT")
        .ok()
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(7860); // HF Spaces default
    let addr = SocketAddr::from(([0, 0, 0, 0], port));

    info!(%addr, "VedicJyotish Rust API starting");
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("bind Rust API listener");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("run Rust API");
}

/// Wait for Ctrl-C or SIGTERM (on Unix) to initiate graceful shutdown,
/// allowing in-flight requests and SSE streams to complete.
async fn shutdown_signal() {
    let ctrl_c = tokio::signal::ctrl_c();
    #[cfg(unix)]
    {
        let mut sigterm = tokio::signal::unix::signal(
            tokio::signal::unix::SignalKind::terminate(),
        )
        .expect("install SIGTERM handler");
        tokio::select! {
            _ = ctrl_c => {},
            _ = sigterm.recv() => {},
        }
    }
    #[cfg(not(unix))]
    {
        ctrl_c.await.ok();
    }
    info!("Shutdown signal received, draining connections...");
}

// ─── Endpoint Handlers ─────────────────────────────────────────────────────

async fn root() -> Json<serde_json::Value> {
    Json(json!({
        "message": "Vedic Astrology API is running",
        "status": "online",
        "engine": "rust-swiss-eph",
        "version": env!("CARGO_PKG_VERSION"),
        "documentation": "https://github.com/Dhruvil-8/VedicJyotish"
    }))
}

async fn capabilities(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Json<models::CapabilityResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    Ok(Json(models::CapabilityResponse::default()))
}

async fn search_city(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Query(params): Query<SearchCityQuery>,
) -> Result<Json<Vec<models::CityResult>>, ApiError> {
    validate_api_key(&state, &headers)?;
    if params.query.trim().chars().count() < 3 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Query must contain at least 3 characters.",
        ));
    }

    let results = atlas::search_city(params.query.trim())?;
    Ok(Json(results))
}

async fn calculate_chart(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(data): Json<BirthData>,
) -> Result<Json<models::ChartResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart(data).await?;
    Ok(Json(chart))
}

async fn calculate_transits(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<models::TransitRequest>,
) -> Result<Json<models::TransitResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let transits = engine::compute_transits(request).await?;
    Ok(Json(transits))
}

async fn calculate_full_chart(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::ChartResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    Ok(Json(chart))
}

async fn ai_chart_context(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::AiChartContext>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    Ok(Json(context::build_ai_chart_context(chart)))
}

async fn calculate_compatibility(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<models::CompatibilityRequest>,
) -> Result<Json<models::CompatibilityResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    // YXV0aG9yIC0gRGhydXZpbCBQYXRlbA==
    let boy_chart_fut = engine::compute_chart(request.boy);
    let girl_chart_fut = engine::compute_chart(request.girl);
    
    let (boy_chart, girl_chart) = tokio::try_join!(boy_chart_fut, girl_chart_fut)?;
    
    let boy_nak_name = &boy_chart.moon_intelligence.nakshatra;
    let boy_pada = boy_chart.moon_intelligence.pada;
    
    let girl_nak_name = &girl_chart.moon_intelligence.nakshatra;
    let girl_pada = girl_chart.moon_intelligence.pada;
    
    let boy_nak_idx = crate::constants::NAKSHATRA_NAMES.iter().position(|&x| x == boy_nak_name).ok_or_else(|| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Unknown boy moon nakshatra: {boy_nak_name}"),
        )
    })? as u8 + 1;
    
    let girl_nak_idx = crate::constants::NAKSHATRA_NAMES.iter().position(|&x| x == girl_nak_name).ok_or_else(|| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Unknown girl moon nakshatra: {girl_nak_name}"),
        )
    })? as u8 + 1;
    
    let compatibility_report = compatibility::compute_guna_milan(
        boy_nak_idx,
        boy_pada,
        girl_nak_idx,
        girl_pada,
        &request.method,
    );
    
    Ok(Json(compatibility_report))
}

async fn chart_rasi(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::RasiChartResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    Ok(Json(models::RasiChartResponse {
        ascendant: chart.ascendant,
        chart_data: chart.chart_data,
        planetary_table: chart.planetary_table,
    }))
}

async fn chart_navamsa(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::NavamsaChartResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    Ok(Json(models::NavamsaChartResponse {
        navamsa_ascendant_sign: chart.navamsa_chart.get("house_1").map(|h| h.sign.clone()).unwrap_or_default(),
        navamsa_chart: chart.navamsa_chart,
    }))
}

async fn chart_varga(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<models::VargaCalculationRequest>,
) -> Result<Json<models::VargaChartResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    
    let varga_type = request.varga_type.trim().to_uppercase();
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    
    let divisional_charts = chart.divisional_charts.clone().unwrap_or_default();
    let divisional_planets = chart.divisional_planets.clone().unwrap_or_default();
    
    let varga_chart = divisional_charts.get(&varga_type).ok_or_else(|| {
        ApiError::new(StatusCode::BAD_REQUEST, format!("Unsupported varga type: {varga_type}"))
    })?;
    
    let varga_planets = divisional_planets.get(&varga_type).ok_or_else(|| {
        ApiError::new(StatusCode::BAD_REQUEST, format!("Unsupported varga type: {varga_type}"))
    })?;
    
    let ascendant_sign = varga_chart.get("house_1").map(|h| h.sign.clone()).unwrap_or_default();
    
    Ok(Json(models::VargaChartResponse {
        varga_type,
        ascendant_sign,
        chart_data: varga_chart.clone(),
        planets: varga_planets.clone(),
    }))
}

async fn chart_yogas(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<Vec<models::Yoga>>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    Ok(Json(chart.yogas))
}

async fn chart_doshas(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::DoshaResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    let doshas = chart.doshas.ok_or_else(|| {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Dosha calculation failed")
    })?;
    Ok(Json(doshas))
}

async fn chart_jaimini(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::JaiminiResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    let jaimini = chart.jaimini.ok_or_else(|| {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Jaimini calculation failed")
    })?;
    Ok(Json(jaimini))
}

async fn chart_argala(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::ArgalaResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    let argala = chart.argala.ok_or_else(|| {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Argala calculation failed")
    })?;
    Ok(Json(argala))
}


async fn chart_panchanga(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::Panchanga>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    Ok(Json(chart.panchanga))
}

async fn chart_ashtakavarga(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::AshtakavargaResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    let ashtakavarga = chart.ashtakavarga.ok_or_else(|| {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Ashtakavarga calculation failed")
    })?;
    Ok(Json(ashtakavarga))
}

async fn chart_dasha(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<Vec<models::MahaDasha>>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    // YXV0aG9yIC0gRGhydXZpbCBQYXRlbA==
    Ok(Json(chart.vimshottari_timeline))
}

async fn chart_chara_dasha(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::CharaDashaResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    let chara = chart.chara_dasha.ok_or_else(|| {
        ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, "Chara Dasha calculation failed")
    })?;
    Ok(Json(chara))
}


async fn chart_drishti(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(request): Json<ChartCalculationRequest>,
) -> Result<Json<models::DrishtiResponse>, ApiError> {
    validate_api_key(&state, &headers)?;
    let chart = engine::compute_chart_with_profile(request.birth_data, request.profile).await?;
    let asc_sign_idx = crate::constants::SIGNS
        .iter()
        .position(|&x| x == chart.ascendant.sign)
        .unwrap_or(0);
    
    let mut planets_data = Vec::new();
    for house_data in chart.chart_data.values() {
        planets_data.extend(house_data.planets.clone());
    }
    
    let drishti_res = drishti::calculate_drishti(asc_sign_idx, &planets_data);
    Ok(Json(drishti_res))
}


async fn generate_report(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<serde_json::Value>,
) -> Result<Response, ApiError> {
    validate_api_key(&state, &headers)?;
    let sse = gemini::stream_report(payload).await?;
    let mut response = sse.into_response();
    response.headers_mut().insert(
        axum::http::header::HeaderName::from_static("x-accel-buffering"),
        axum::http::HeaderValue::from_static("no"),
    );
    Ok(response)
}

async fn chat_with_astrologer(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(payload): Json<ChatRequest>,
) -> Result<Response, ApiError> {
    validate_api_key(&state, &headers)?;

    // Check question limit early (mirrors Python behavior — returns 200 with message)
    let max_q: usize = env::var("MAX_QUESTIONS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(3);
    if payload.history.len() >= max_q * 2 {
        return Ok(
            Json(json!({"response": "I apologize, the question limit has been reached."}))
                .into_response(),
        );
    }

    let question = payload.question.trim().to_string();
    if question.is_empty() || question.chars().count() > 500 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Question must be between 1 and 500 characters.",
        ));
    }

    let sse = gemini::stream_chat(payload.chart_data, question, payload.history).await?;
    let mut response = sse.into_response();
    response.headers_mut().insert(
        axum::http::header::HeaderName::from_static("x-accel-buffering"),
        axum::http::HeaderValue::from_static("no"),
    );
    Ok(response)
}

// ─── Security ───────────────────────────────────────────────────────────────

fn validate_api_key(state: &AppState, headers: &HeaderMap) -> Result<(), ApiError> {
    if state.auth_required || state.api_secret_key.is_some() {
        let Some(expected) = &state.api_secret_key else {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "Unauthorized: API key authentication is required.",
            ));
        };
        let supplied = headers
            .get("X-API-Key")
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default();
        // Constant-time comparison to prevent timing side-channel attacks.
        // Even if lengths differ, we hash both to avoid leaking length info.
        use std::hash::{Hash, Hasher};
        let hash = |s: &str| -> u64 {
            let mut h = std::collections::hash_map::DefaultHasher::new();
            s.hash(&mut h);
            h.finish()
        };
        if supplied.len() != expected.len() || hash(supplied) != hash(expected) || supplied != expected {
            return Err(ApiError::new(
                StatusCode::UNAUTHORIZED,
                "Unauthorized: Missing or invalid API Key.",
            ));
        }
    }
    Ok(())
}

fn auth_required() -> bool {
    let require_api_key = env::var("REQUIRE_API_KEY")
        .map(|v| matches!(v.to_ascii_lowercase().as_str(), "1" | "true" | "yes"))
        .unwrap_or(false);
    is_production() || require_api_key
}

fn is_production() -> bool {
    env::var("ENVIRONMENT")
        .map(|v| v.eq_ignore_ascii_case("production"))
        .unwrap_or(false)
}

// ─── CORS ───────────────────────────────────────────────────────────────────

fn cors_layer() -> CorsLayer {
    let origins: Vec<HeaderValue> = env::var("FRONTEND_URL")
        .unwrap_or_default()
        .split(',')
        .filter_map(|origin| origin.trim().parse::<HeaderValue>().ok())
        .collect();

    let allow_origin = if origins.is_empty() && !auth_required() {
        AllowOrigin::any()
    } else {
        AllowOrigin::list(origins)
    };

    CorsLayer::new()
        .allow_origin(allow_origin)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, HeaderNameExt::x_api_key()])
}

// ─── Security Headers Middleware ────────────────────────────────────────────

async fn security_headers(request: Request<Body>, next: Next) -> Response {
    let is_prod = is_production();
    let mut response = next.run(request).await;
    let headers = response.headers_mut();

    headers.insert(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(header::X_FRAME_OPTIONS, HeaderValue::from_static("DENY"));
    headers.insert(
        header::REFERRER_POLICY,
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        header::HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    headers.insert(
        header::HeaderName::from_static("cache-control"),
        HeaderValue::from_static("no-store"),
    );

    // HSTS in production only
    if is_prod {
        headers.insert(
            header::STRICT_TRANSPORT_SECURITY,
            HeaderValue::from_static("max-age=31536000; includeSubDomains"),
        );
    }

    response
}

struct HeaderNameExt;

impl HeaderNameExt {
    fn x_api_key() -> header::HeaderName {
        header::HeaderName::from_static("x-api-key")
    }
}
