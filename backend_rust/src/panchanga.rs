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

fn julian_to_local_time(jd_ut: f64, offset_hours: f64) -> String {
    let unix_timestamp = (jd_ut - 2440587.5) * 86400.0;
    if let Some(naive_utc) = chrono::DateTime::from_timestamp(unix_timestamp.round() as i64, 0).map(|dt| dt.naive_utc()) {
        let local_dt = naive_utc + chrono::Duration::seconds((offset_hours * 3600.0).round() as i64);
        local_dt.format("%H:%M").to_string()
    } else {
        "Unknown".to_string()
    }
}

pub fn calculate(
    planets: &[PlanetData],
    local_dt: NaiveDateTime,
    jd_ut: f64,
    offset_hours: f64,
    lat: f64,
    lon: f64,
) -> Result<Panchanga, ApiError> {
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

    let (sunrise_jd, sunset_jd) = crate::swiss::calculate_sunrise_sunset(jd_ut, lat, lon)?;
    let sunrise = Some(julian_to_local_time(sunrise_jd, offset_hours));
    let sunset = Some(julian_to_local_time(sunset_jd, offset_hours));

    let weekday_idx = local_dt.weekday().num_days_from_monday() as usize;
    let rahu_slots = [2, 7, 5, 6, 4, 3, 8];
    let yama_slots = [5, 4, 3, 2, 1, 8, 7];
    let gulika_slots = [6, 5, 4, 3, 2, 1, 8];

    let r_slot = rahu_slots[weekday_idx % 7];
    let y_slot = yama_slots[weekday_idx % 7];
    let g_slot = gulika_slots[weekday_idx % 7];

    let daytime_jd = sunset_jd - sunrise_jd;
    let slot_jd = daytime_jd / 8.0;

    let get_slot_range = |slot_num: usize| -> String {
        let s_start = sunrise_jd + (slot_num - 1) as f64 * slot_jd;
        let s_end = sunrise_jd + slot_num as f64 * slot_jd;
        format!(
            "{} - {}",
            julian_to_local_time(s_start, offset_hours),
            julian_to_local_time(s_end, offset_hours)
        )
    };

    let rahu_kaal = Some(get_slot_range(r_slot));
    let yama_ganda = Some(get_slot_range(y_slot));
    let gulika_kaal = Some(get_slot_range(g_slot));

    // Abhijit Muhurat: +/- 24 minutes from solar noon (noon = midpoint between rise and set)
    let solar_noon_jd = sunrise_jd + daytime_jd / 2.0;
    let abhijit_start = solar_noon_jd - (24.0 / 1440.0);
    let abhijit_end = solar_noon_jd + (24.0 / 1440.0);
    let abhijit_muhurat = Some(format!(
        "{} - {}",
        julian_to_local_time(abhijit_start, offset_hours),
        julian_to_local_time(abhijit_end, offset_hours)
    ));

    // Vijaya Muhurta: 11th Muhurta of the day (starts 10/15 of daytime, ends 11/15)
    let vijaya_start = sunrise_jd + daytime_jd * 10.0 / 15.0;
    let vijaya_end = sunrise_jd + daytime_jd * 11.0 / 15.0;
    let vijaya_muhurta = Some(format!(
        "{} - {}",
        julian_to_local_time(vijaya_start, offset_hours),
        julian_to_local_time(vijaya_end, offset_hours)
    ));

    // Brahma Muhurta: 96 to 48 minutes before sunrise
    let brahma_start = sunrise_jd - (96.0 / 1440.0);
    let brahma_end = sunrise_jd - (48.0 / 1440.0);
    let brahma_muhurta = Some(format!(
        "{} - {}",
        julian_to_local_time(brahma_start, offset_hours),
        julian_to_local_time(brahma_end, offset_hours)
    ));

    // Pradosh Kaal: Sunset to 96 minutes after sunset
    let pradosh_start = sunset_jd;
    let pradosh_end = sunset_jd + (96.0 / 1440.0);
    let pradosh_kaal = Some(format!(
        "{} - {}",
        julian_to_local_time(pradosh_start, offset_hours),
        julian_to_local_time(pradosh_end, offset_hours)
    ));

    // Tomorrow's sunrise to calculate exact nighttime duration
    let (tomorrow_sunrise_jd, _) = crate::swiss::calculate_sunrise_sunset(jd_ut + 1.0, lat, lon)?;
    let night_dur = tomorrow_sunrise_jd - sunset_jd;

    // Dur Muhurtham: Calculated using standard daily astronomical offsets
    let vaara_idx = (weekday_idx + 1) % 7; // Sunday = 0, Monday = 1, ..., Saturday = 6
    let dur_offsets = [
        [10.4, 0.0],  // Sunday
        [6.4, 8.8],   // Monday
        [2.4, 4.8],   // Tuesday
        [5.6, 0.0],   // Wednesday
        [4.0, 8.8],   // Thursday
        [2.4, 6.4],   // Friday
        [1.6, 0.0],   // Saturday
    ];

    let mut dur_muhurtham_slots = Vec::new();
    for i in 0..2 {
        let offset = dur_offsets[vaara_idx][i];
        if offset > 0.0 {
            let (base_jd, dur) = if vaara_idx == 2 && i == 1 {
                (sunset_jd, night_dur)
            } else {
                (sunrise_jd, daytime_jd)
            };
            let start_jd = base_jd + dur * offset / 12.0;
            let end_jd = start_jd + daytime_jd * 0.8 / 12.0;
            dur_muhurtham_slots.push(format!(
                "{} - {}",
                julian_to_local_time(start_jd, offset_hours),
                julian_to_local_time(end_jd, offset_hours)
            ));
        }
    }
    let dur_muhurtham = Some(dur_muhurtham_slots);

    // Choghadiya Daytime
    let choghadiya_sequence = ["Amrit", "Kala", "Shubh", "Rog", "Udveg", "Char", "Labh"];
    let choghadiya_starts = [0, 3, 6, 2, 5, 1, 4]; // Monday to Sunday starts
    let day_start_idx = choghadiya_starts[weekday_idx % 7];

    let mut choghadiya_slots = Vec::new();
    for k in 1..=8 {
        let name = choghadiya_sequence[(day_start_idx + k - 1) % 7].to_string();
        let nature = match name.as_str() {
            "Amrit" | "Shubh" | "Labh" | "Char" => "Auspicious".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunrise_jd + (k - 1) as f64 * slot_jd;
        let s_end = sunrise_jd + k as f64 * slot_jd;
        choghadiya_slots.push(crate::models::ChoghadiyaSlot {
            name,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let choghadiya = Some(choghadiya_slots);

    // Choghadiya Nighttime
    let night_choghadiya_starts = [5, 1, 4, 0, 3, 6, 2];
    let night_start_idx = night_choghadiya_starts[weekday_idx % 7];
    let night_slot_jd = night_dur / 8.0;

    let mut choghadiya_night_slots = Vec::new();
    for k in 1..=8 {
        let name_idx = (night_start_idx + (k - 1) * 5) % 7;
        let name = choghadiya_sequence[name_idx].to_string();
        let nature = match name.as_str() {
            "Amrit" | "Shubh" | "Labh" | "Char" => "Auspicious".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunset_jd + (k - 1) as f64 * night_slot_jd;
        let s_end = sunset_jd + k as f64 * night_slot_jd;
        choghadiya_night_slots.push(crate::models::ChoghadiyaSlot {
            name,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let choghadiya_night = Some(choghadiya_night_slots);

    // Planetary Horas (Day & Night)
    let hora_planets = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"];
    let hora_starts = [3, 6, 2, 5, 1, 4, 0];
    let start_idx = hora_starts[weekday_idx % 7];

    let day_hora_dur = daytime_jd / 12.0;
    let mut horas_day_slots = Vec::new();
    for h in 1..=12 {
        let planet_idx = (start_idx + h - 1) % 7;
        let planet = hora_planets[planet_idx].to_string();
        let nature = match planet.as_str() {
            "Jupiter" => "Highly Auspicious".to_string(),
            "Venus" | "Mercury" | "Moon" => "Auspicious".to_string(),
            "Sun" => "Neutral".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunrise_jd + (h - 1) as f64 * day_hora_dur;
        let s_end = sunrise_jd + h as f64 * day_hora_dur;
        horas_day_slots.push(crate::models::HoraSlot {
            hora_num: h as u8,
            planet,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let horas_day = Some(horas_day_slots);

    let night_hora_dur = night_dur / 12.0;
    let mut horas_night_slots = Vec::new();
    for h in 13..=24 {
        let planet_idx = (start_idx + h - 1) % 7;
        let planet = hora_planets[planet_idx].to_string();
        let nature = match planet.as_str() {
            "Jupiter" => "Highly Auspicious".to_string(),
            "Venus" | "Mercury" | "Moon" => "Auspicious".to_string(),
            "Sun" => "Neutral".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunset_jd + (h - 13) as f64 * night_hora_dur;
        let s_end = sunset_jd + (h - 12) as f64 * night_hora_dur;
        horas_night_slots.push(crate::models::HoraSlot {
            hora_num: h as u8,
            planet,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let horas_night = Some(horas_night_slots);

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
        sunrise,
        sunset,
        rahu_kaal,
        yama_ganda,
        gulika_kaal,
        abhijit_muhurat,
        choghadiya,
        vijaya_muhurta,
        brahma_muhurta,
        pradosh_kaal,
        dur_muhurtham,
        choghadiya_night,
        horas_day,
        horas_night,
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
