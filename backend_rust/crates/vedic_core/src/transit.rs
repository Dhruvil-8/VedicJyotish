//! Pure Planetary Transit (Gochar) Evaluation Engine
//!
//! Calculates planetary transits from natal Lagna & Moon,
//! combustion, retrograde state, and Sade Sati analysis.

use serde::{Deserialize, Serialize};
use crate::constants::{COMBUSTION_DEGREES, SIGNS};
use crate::models::{AscendantInfo, SadeSatiResponse, TransitPlanetData, TransitResponse};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitPlanetRaw {
    pub name: String,
    pub longitude: f64,
    pub speed: f64,
}

pub fn normalize_degree(deg: f64) -> f64 {
    deg.rem_euclid(360.0)
}

pub fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

fn check_combustion(name: &str, planet_deg: f64, sun_deg: f64) -> bool {
    let Some(range) = COMBUSTION_DEGREES.get(name) else {
        return false;
    };
    let mut diff = (planet_deg - sun_deg).abs();
    if diff > 180.0 {
        diff = 360.0 - diff;
    }
    diff <= *range
}

pub fn calculate_sade_sati(
    natal_moon_sign: &str,
    transit_saturn_sign: &str,
) -> SadeSatiResponse {
    let moon_idx = SIGNS
        .iter()
        .position(|&s| s == natal_moon_sign)
        .unwrap_or(0);
    let saturn_idx = SIGNS
        .iter()
        .position(|&s| s == transit_saturn_sign)
        .unwrap_or(0);

    let diff = (saturn_idx + 12 - moon_idx) % 12;

    let (is_active, phase, description) = match diff {
        11 => (
            true,
            Some("Phase 1: Rising".to_string()),
            "Saturn is transiting the 12th house relative to your natal Moon. This marks the beginning of Sade Sati, which focuses on letting go, deep introspection, and adjusting to changes.".to_string(),
        ),
        0 => (
            true,
            Some("Phase 2: Peak".to_string()),
            "Saturn is transiting directly over your natal Moon (1st house). This is the peak phase of Sade Sati, testing your mental resilience, focus, and core character.".to_string(),
        ),
        1 => (
            true,
            Some("Phase 3: Setting".to_string()),
            "Saturn is transiting the 2nd house relative to your natal Moon. This is the final phase of Sade Sati, highlighting finances, family responsibilities, and consolidating lessons learned.".to_string(),
        ),
        _ => (
            false,
            None,
            "Saturn is not currently transiting the 12th, 1st, or 2nd houses from your Moon. You are not currently going through Sade Sati.".to_string(),
        ),
    };

    SadeSatiResponse {
        is_active,
        phase,
        saturn_sign: transit_saturn_sign.to_string(),
        moon_sign: natal_moon_sign.to_string(),
        description,
    }
}

pub fn evaluate_transits(
    natal_ascendant: AscendantInfo,
    natal_moon_sign: &str,
    transit_date: &str,
    transit_time: &str,
    transit_planets_raw: &[TransitPlanetRaw],
) -> Result<TransitResponse, String> {
    let asc_idx = SIGNS
        .iter()
        .position(|&s| s == natal_ascendant.sign)
        .unwrap_or_else(|| crate::chart::sign_index(natal_ascendant.degree));

    let moon_idx = SIGNS
        .iter()
        .position(|&s| s == natal_moon_sign)
        .unwrap_or(0);

    let sun_deg = transit_planets_raw
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.longitude)
        .unwrap_or(0.0);

    let mut transit_planets = Vec::new();

    for raw in transit_planets_raw {
        let t_idx = crate::chart::sign_index(raw.longitude);
        let sign = SIGNS[t_idx].to_string();
        let deg_in_sign = raw.longitude % 30.0;
        let house_lagna = ((t_idx + 12 - asc_idx) % 12 + 1) as u8;
        let house_moon = ((t_idx + 12 - moon_idx) % 12 + 1) as u8;

        let retrograde = if raw.name == "Sun" || raw.name == "Moon" || raw.name == "Rahu" {
            raw.name == "Rahu"
        } else {
            raw.speed < 0.0
        };
        let combust = check_combustion(&raw.name, raw.longitude, sun_deg);

        transit_planets.push(TransitPlanetData {
            name: raw.name.clone(),
            transit_sign: sign,
            transit_degree: round2(deg_in_sign),
            transit_house_from_lagna: house_lagna,
            transit_house_from_moon: house_moon,
            retrograde,
            combust,
        });
    }

    let rahu = transit_planets
        .iter()
        .find(|p| p.name == "Rahu")
        .ok_or_else(|| "Transit Rahu calculation missing.".to_string())?;

    let rahu_idx = SIGNS
        .iter()
        .position(|&s| s == rahu.transit_sign)
        .unwrap_or(0);
    let rahu_full = rahu_idx as f64 * 30.0 + rahu.transit_degree;
    let ketu_deg = normalize_degree(rahu_full + 180.0);

    let k_idx = crate::chart::sign_index(ketu_deg);
    let k_sign = SIGNS[k_idx].to_string();
    let k_deg_in_sign = ketu_deg % 30.0;
    let k_house_lagna = ((k_idx + 12 - asc_idx) % 12 + 1) as u8;
    let k_house_moon = ((k_idx + 12 - moon_idx) % 12 + 1) as u8;

    transit_planets.push(TransitPlanetData {
        name: "Ketu".to_string(),
        transit_sign: k_sign,
        transit_degree: round2(k_deg_in_sign),
        transit_house_from_lagna: k_house_lagna,
        transit_house_from_moon: k_house_moon,
        retrograde: true,
        combust: false,
    });

    let saturn_sign = transit_planets
        .iter()
        .find(|p| p.name == "Saturn")
        .map(|p| p.transit_sign.as_str())
        .unwrap_or("Aries");

    let ss_res = calculate_sade_sati(natal_moon_sign, saturn_sign);

    Ok(TransitResponse {
        transit_date: transit_date.to_string(),
        transit_time: transit_time.to_string(),
        natal_ascendant,
        transit_planets,
        sade_sati: Some(ss_res),
    })
}
