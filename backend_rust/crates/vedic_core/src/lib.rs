//! vedic_core: Pure, portable Vedic astrology calculation engine.
//!
//! Zero C-dependencies, zero I/O, zero network calls.
//! Compiles natively and to WebAssembly (wasm32-unknown-unknown).

pub mod argala;
pub mod ashtakavarga;
pub mod calculator;
pub mod chart;
pub mod classical_rules;
pub mod compatibility;
pub mod constants;
pub mod context;
pub mod dasha;
pub mod drishti;
pub mod maitri;
pub mod models;
pub mod muhurtha;
pub mod panchanga;
pub mod service;
pub mod shadbala;
pub mod transit;
pub mod yoga;
