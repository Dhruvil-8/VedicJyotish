//! VedicJyotish WebAssembly Engine
//!
//! Exposes pure Vedic calculation engines to WebAssembly running in browser
//! or edge environments. All calculations are delegated directly to `vedic_core`.

use wasm_bindgen::prelude::*;

use vedic_core::{
    calculator::{self, CoreChartInput, RawPlanetCoordinate},
    compatibility, context,
    models::AscendantInfo,
    muhurtha::{self, MuhurthaRequest},
    transit::{self, TransitPlanetRaw},
};

// Backwards-compatibility type aliases
pub type WasmChartInput = CoreChartInput;
pub type RawPlanetInput = RawPlanetCoordinate;
pub type WasmTransitPlanetRaw = TransitPlanetRaw;

#[wasm_bindgen]
pub fn calculate_guna_milan_wasm(
    boy_nakshatra: u8,
    boy_pada: u8,
    girl_nakshatra: u8,
    girl_pada: u8,
    method: &str,
) -> Result<String, JsValue> {
    let result = compatibility::compute_guna_milan(
        boy_nakshatra,
        boy_pada,
        girl_nakshatra,
        girl_pada,
        method,
    );
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {}", e)))
}

#[wasm_bindgen]
pub fn compute_chart_wasm(input_json: &str) -> Result<String, JsValue> {
    let input: CoreChartInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid chart input JSON: {}", e)))?;
    let chart_response = calculator::compute_chart_core(input)
        .map_err(|e| JsValue::from_str(&format!("Chart computation failed: {}", e)))?;
    serde_json::to_string(&chart_response)
        .map_err(|e| JsValue::from_str(&format!("Chart response serialization failed: {}", e)))
}

#[derive(serde::Deserialize)]
pub struct WasmMuhurthaInput {
    pub chart_input: CoreChartInput,
    #[serde(default = "default_activity")]
    pub activity: String,
    pub direction: Option<String>,
    pub birth_moon_nakshatra: Option<String>,
    pub birth_moon_sign: Option<String>,
}

fn default_activity() -> String {
    "general".to_string()
}

#[wasm_bindgen]
pub fn calculate_muhurtha_wasm(input_json: &str) -> Result<String, JsValue> {
    let input: WasmMuhurthaInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid Muhurtha input JSON: {}", e)))?;
    let chart_res = calculator::compute_chart_core(input.chart_input)
        .map_err(|e| JsValue::from_str(&format!("Chart computation for Muhurtha failed: {}", e)))?;
    let req = MuhurthaRequest {
        date: chart_res.birth_date.clone(),
        time: chart_res.birth_time.clone(),
        lat: chart_res.location.lat,
        lon: chart_res.location.lon,
        timezone: chart_res.location.tz,
        activity: input.activity,
        direction: input.direction,
        birth_moon_nakshatra: input.birth_moon_nakshatra,
        birth_moon_sign: input.birth_moon_sign,
    };
    let response = muhurtha::evaluate_muhurtha(
        &req,
        &chart_res.panchanga,
        Some(&chart_res.moon_intelligence.sign),
    )
    .map_err(|e| JsValue::from_str(&format!("Muhurtha computation failed: {}", e)))?;
    serde_json::to_string(&response)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {}", e)))
}

#[derive(serde::Deserialize)]
pub struct WasmTransitInput {
    pub natal_ascendant_degree: f64,
    pub natal_moon_sign: String,
    pub transit_date: String,
    pub transit_time: String,
    pub transit_planets: Vec<TransitPlanetRaw>,
}

#[wasm_bindgen]
pub fn compute_transits_wasm(input_json: &str) -> Result<String, JsValue> {
    let input: WasmTransitInput = serde_json::from_str(input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid Transit input JSON: {}", e)))?;
    let asc_idx = vedic_core::chart::sign_index(input.natal_ascendant_degree);
    let asc_sign = vedic_core::constants::SIGNS[asc_idx].to_string();
    let ascendant = AscendantInfo {
        degree: input.natal_ascendant_degree,
        sign: asc_sign,
    };
    let response = transit::evaluate_transits(
        ascendant,
        &input.natal_moon_sign,
        &input.transit_date,
        &input.transit_time,
        &input.transit_planets,
    )
    .map_err(|e| JsValue::from_str(&format!("Transit computation failed: {}", e)))?;
    serde_json::to_string(&response)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {}", e)))
}

#[wasm_bindgen]
pub fn build_ai_chart_context_wasm(chart_input_json: &str) -> Result<String, JsValue> {
    let input: CoreChartInput = serde_json::from_str(chart_input_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid chart input JSON: {}", e)))?;
    let chart_res = calculator::compute_chart_core(input)
        .map_err(|e| JsValue::from_str(&format!("Chart computation failed: {}", e)))?;
    let context = context::build_ai_chart_context(chart_res);
    serde_json::to_string(&context)
        .map_err(|e| JsValue::from_str(&format!("Serialization failed: {}", e)))
}
