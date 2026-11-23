//! Muhurtha (Electional Astrology) Server Handler
//!
//! Evaluates electional auspiciousness by orchestrating full chart
//! calculation and invoking the pure `vedic_core::muhurtha` engine.

use crate::error::ApiError;
use chrono::NaiveTime;
use reqwest::StatusCode;

pub use vedic_core::muhurtha::*;

pub async fn calculate_muhurtha(req: MuhurthaRequest) -> Result<MuhurthaResponse, ApiError> {
    let _parsed_time = NaiveTime::parse_from_str(&req.time, "%H:%M").map_err(|_| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time format. Please use HH:MM.",
        )
    })?;

    let birth_data = crate::models::BirthData {
        date: req.date.clone(),
        time: req.time.clone(),
        lat: Some(req.lat),
        lon: Some(req.lon),
        timezone: Some(req.timezone),
        city: None,
    };

    let chart = crate::engine::compute_chart(birth_data).await?;
    let p_calc = chart.panchanga;

    vedic_core::muhurtha::evaluate_muhurtha(
        &req,
        &p_calc,
        Some(&chart.moon_intelligence.sign),
    )
    .map_err(|e| ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, e))
}
