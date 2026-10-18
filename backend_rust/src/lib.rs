//! VedicJyotish Rust Core Library & JNI Native Interface.
//!
//! Provides Swiss Ephemeris calculations, Parashara/Jaimini Vedic astrology math,
//! Panchanga, Shadbala, Ashtakavarga, Dashas, and Yogas for:
//! - Axum Web API server
//! - Android Native Library (via JNI)
//! - WebAssembly (WASM) for frontend & NPM

pub mod argala;
pub mod ashtakavarga;
pub mod atlas;
pub mod chart;
pub mod compatibility;
pub mod constants;
pub mod context;
pub mod dasha;
pub mod drishti;
pub mod engine;
pub mod error;
pub mod gemini;
pub mod maitri;
pub mod models;
pub mod panchanga;
pub mod ratelimit;
pub mod service;
pub mod shadbala;
pub mod swiss;
pub mod timezones;
pub mod yoga;

pub mod jni_bridge;

pub use error::ApiError;
