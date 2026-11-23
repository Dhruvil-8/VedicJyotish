//! VedicJyotish Rust Core Library & JNI Native Interface.
//!
//! Provides Swiss Ephemeris calculations, Parashara/Jaimini Vedic astrology math,
//! Panchanga, Shadbala, Ashtakavarga, Dashas, and Yogas for:
//! - Axum Web API server
//! - Android Native Library (via JNI)
//! - WebAssembly (WASM) for frontend & NPM

pub use vedic_core::{
    argala, ashtakavarga, calculator, chart, classical_rules, compatibility, constants, context,
    dasha, drishti, maitri, models, service, shadbala, transit, yoga,
};

pub mod atlas;
pub mod engine;
pub mod error;
pub mod gemini;
pub mod muhurtha;
pub mod panchanga;
pub mod ratelimit;
pub mod swiss;
pub mod timezones;
pub mod jni_bridge;

pub use error::ApiError;
