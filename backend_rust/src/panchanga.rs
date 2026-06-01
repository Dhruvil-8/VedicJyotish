use axum::http::StatusCode;
use chrono::{Datelike, NaiveDateTime};

use crate::{
    models::{Panchanga, PanchangaElement, PlanetData},
    swiss, ApiError,
};

const TITHI_NAMES: [&str; 30] = [
    "Shukla Pratipada",
    "Shukla Dwitiya",
    "Shukla Tritiya",
    "Shukla Chaturthi",
    "Shukla Panchami",
    "Shukla Shashthi",
    "Shukla Saptami",
    "Shukla Ashtami",
    "Shukla Navami",
    "Shukla Dashami",
    "Shukla Ekadashi",
    "Shukla Dwadashi",
    "Shukla Trayodashi",
    "Shukla Chaturdashi",
    "Purnima",
    "Krishna Pratipada",
    "Krishna Dwitiya",
    "Krishna Tritiya",
    "Krishna Chaturthi",
    "Krishna Panchami",
    "Krishna Shashthi",
    "Krishna Saptami",
    "Krishna Ashtami",
    "Krishna Navami",
    "Krishna Dashami",
    "Krishna Ekadashi",
    "Krishna Dwadashi",
    "Krishna Trayodashi",
    "Krishna Chaturdashi",
    "Amavasya",
];

const YOGA_NAMES: [&str; 27] = [
    "Vishkambha",
    "Priti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shoola",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyana",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti",
];

const KARANA_NAMES: [&str; 11] = [
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Garaja",
    "Vanija",
    "Vishti",
    "Shakuni",
    "Chatushpada",
    "Naga",
    "Kimstughna",
];

const VARA_NAMES: [&str; 7] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

pub fn calculate(planets: &[PlanetData], local_dt: NaiveDateTime, jd_ut: f64) -> Result<Panchanga, ApiError> {
    let sun = planet_degree(planets, "Sun")?;
    let moon = planet_degree(planets, "Moon")?;
    let moon_sun = swiss::normalize_degree(moon - sun);
    let tithi_index = (moon_sun / 12.0).floor() as usize;
    let tithi_progress = (moon_sun % 12.0) / 12.0;

    let nak_span = 360.0 / 27.0;
    let nak_index = (moon / nak_span).floor() as usize;
    let nak_progress = (moon % nak_span) / nak_span;

    let yoga_degree = swiss::normalize_degree(sun + moon);
    let yoga_index = (yoga_degree / nak_span).floor() as usize;
    let yoga_progress = (yoga_degree % nak_span) / nak_span;

    let karana_index = karana_index((moon_sun / 6.0).floor() as usize);
    let karana_progress = (moon_sun % 6.0) / 6.0;

    let sun_sign = Some(planets.iter().find(|p| p.name == "Sun").map(|p| p.sign.clone()).unwrap_or_default());
    let moon_sign = Some(planets.iter().find(|p| p.name == "Moon").map(|p| p.sign.clone()).unwrap_or_default());

    let lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
    let nakshatra_lord = Some(lords[nak_index % 9].to_string());

    let tithi_lords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Ketu"];
    let tithi_lord = Some(match tithi_index {
        14 => "Saturn".to_string(), // Purnima
        29 => "Ketu".to_string(),   // Amavasya
        idx => tithi_lords[idx % 15].to_string(),
    });

    let yoga_lords = ["Jupiter", "Saturn", "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Mercury"];
    let yoga_lord = Some(yoga_lords[yoga_index % 9].to_string());

    let karana_lords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu", "Rahu", "Ketu"];
    let karana_lord = Some(karana_lords[karana_index].to_string());

    let vara_lord = Some(match VARA_NAMES[local_dt.weekday().num_days_from_monday() as usize] {
        "Monday" => "Moon",
        "Tuesday" => "Mars",
        "Wednesday" => "Mercury",
        "Thursday" => "Jupiter",
        "Friday" => "Venus",
        "Saturday" => "Saturn",
        "Sunday" => "Sun",
        _ => "Unknown",
    }.to_string());

    let ayanamsha = unsafe {
        let _guard = swiss::SWISS_LOCK.lock().expect("Swiss Ephemeris lock poisoned");
        Some(swiss_eph::swe_get_ayanamsa_ut(jd_ut))
    };

    Ok(Panchanga {
        vara: VARA_NAMES[local_dt.weekday().num_days_from_monday() as usize].to_string(),
        tithi: PanchangaElement {
            index: (tithi_index + 1) as u8,
            name: TITHI_NAMES[tithi_index.min(29)].to_string(),
            progress: round4(tithi_progress),
        },
        nakshatra: PanchangaElement {
            index: (nak_index + 1) as u8,
            name: crate::constants::NAKSHATRA_NAMES[nak_index.min(26)].to_string(),
            progress: round4(nak_progress),
        },
        yoga: PanchangaElement {
            index: (yoga_index + 1) as u8,
            name: YOGA_NAMES[yoga_index.min(26)].to_string(),
            progress: round4(yoga_progress),
        },
        karana: PanchangaElement {
            index: (karana_index + 1) as u8,
            name: KARANA_NAMES[karana_index].to_string(),
            progress: round4(karana_progress),
        },
        paksha: if tithi_index < 15 {
            "Shukla".to_string()
        } else {
            "Krishna".to_string()
        },
        sun_sign,
        moon_sign,
        nakshatra_lord,
        tithi_lord,
        yoga_lord,
        karana_lord,
        vara_lord,
        ayanamsha,
    })
}

fn planet_degree(planets: &[PlanetData], name: &str) -> Result<f64, ApiError> {
    planets
        .iter()
        .find(|planet| planet.name == name)
        .map(|planet| planet.full_degree)
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("{name} required for panchanga calculation."),
            )
        })
}

fn karana_index(half_tithi_index: usize) -> usize {
    match half_tithi_index {
        0 => 10,
        57 => 7,
        58 => 8,
        59 => 9,
        n => (n - 1) % 7,
    }
}

fn round4(value: f64) -> f64 {
    (value * 10_000.0).round() / 10_000.0
}
