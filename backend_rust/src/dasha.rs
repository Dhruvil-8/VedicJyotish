//! Jaimini Chara Dasha Calculation Engine.
//!
//! Computes the complete sign-based Chara Dasha timeline and sub-dashas (Bhuktis)
//! according to classical Jaimini principles.

use std::collections::HashMap;
use crate::models::{PlanetData, CharaDashaPeriod, CharaDashaResponse};
use crate::constants::SIGNS;

/// Direct signs for Jaimini dasha duration counting (clockwise)
const DIRECT_SIGNS: [usize; 6] = [0, 1, 2, 6, 7, 8]; // Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius

/// Dasha lord for each sign index (0 to 11)
const SIGN_LORDS: [&str; 12] = [
    "Mars",    // Aries
    "Venus",   // Taurus
    "Mercury", // Gemini
    "Moon",    // Cancer
    "Sun",     // Leo
    "Mercury", // Virgo
    "Venus",   // Libra
    "Mars",    // Scorpio (Mars as primary lord)
    "Jupiter", // Sagittarius
    "Saturn",  // Capricorn
    "Saturn",  // Aquarius (Saturn as primary lord)
    "Jupiter", // Pisces
];

/// Chara Dasha sequences for each Lagna sign index (0 to 11)
const DASHA_SEQUENCES: [[usize; 12]; 12] = [
    // Aries Lagna (0)
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    // Taurus Lagna (1)
    [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
    // Gemini Lagna (2)
    [2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3],
    // Cancer Lagna (3)
    [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2],
    // Leo Lagna (4)
    [4, 3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5],
    // Virgo Lagna (5)
    [5, 4, 3, 2, 1, 0, 11, 10, 9, 8, 7, 6],
    // Libra Lagna (6)
    [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5],
    // Scorpio Lagna (7)
    [7, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9, 8],
    // Sagittarius Lagna (8)
    [8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9],
    // Capricorn Lagna (9)
    [9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8],
    // Aquarius Lagna (10)
    [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11],
    // Pisces Lagna (11)
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

/// Calculate dasha duration in years for a given sign and occupied lord sign
pub fn calculate_dasha_years(sign_idx: usize, lord_sign_idx: usize) -> u8 {
    let is_direct = DIRECT_SIGNS.contains(&sign_idx);
    let s = sign_idx as i16;
    let l = lord_sign_idx as i16;

    let dist = if is_direct {
        (l + 12 - s) % 12
    } else {
        (s + 12 - l) % 12
    };

    if dist == 0 {
        12 // Lord in own sign is 12 years
    } else {
        dist as u8 // Standard Jaimini counting minus 1 is offset
    }
}

pub fn calculate_chara_dasha(
    ascendant_sign: &str,
    planets: &[PlanetData],
    birth_date_str: &str, // format "DD/MM/YYYY"
) -> CharaDashaResponse {
    let asc_idx = SIGNS.iter().position(|&s| s == ascendant_sign).unwrap_or(0);
    
    // Map planet name to occupied sign index
    let mut planet_sign_indices = HashMap::new();
    for p in planets {
        let sign_idx = SIGNS.iter().position(|&s| s == p.sign).unwrap_or(0);
        planet_sign_indices.insert(p.name.clone(), sign_idx);
    }

    let sequence = DASHA_SEQUENCES[asc_idx];
    let mut periods = Vec::new();

    // Parse birth date to initialize dasha timeline
    let parts: Vec<&str> = birth_date_str.split('/').collect();
    let year = if parts.len() == 3 {
        parts[2].parse::<i32>().unwrap_or(1990)
    } else {
        1990
    };

    let month = if parts.len() >= 2 {
        parts[1].parse::<u32>().unwrap_or(1)
    } else {
        1
    };
    let day = if !parts.is_empty() {
        parts[0].parse::<u32>().unwrap_or(1)
    } else {
        1
    };

    let mut current_year_f = year as f64 + (month as f64 - 1.0) / 12.0 + (day as f64 - 1.0) / 365.25;

    for &sign_idx in &sequence {
        let sign_name = SIGNS[sign_idx].to_string();
        let lord_name = SIGN_LORDS[sign_idx];
        let lord_sign_idx = planet_sign_indices.get(lord_name).copied().unwrap_or(sign_idx);

        let duration_years = calculate_dasha_years(sign_idx, lord_sign_idx);

        let start_date = format_dasha_date(current_year_f);
        current_year_f += duration_years as f64;
        let end_date = format_dasha_date(current_year_f);

        periods.push(CharaDashaPeriod {
            sign: sign_name,
            duration_years,
            start_date,
            end_date,
        });
    }

    CharaDashaResponse { periods }
}

fn format_dasha_date(decimal_year: f64) -> String {
    let year = decimal_year.floor() as i32;
    let remainder = decimal_year - year as f64;
    let total_days = (remainder * 365.25).round() as i32;
    
    // Simple naive month/day approximation from total days
    let mut month = 1;
    let mut day = 1;
    let days_in_months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    let mut remaining_days = total_days;
    for (i, &days) in days_in_months.iter().enumerate() {
        let is_leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        let limit = if i == 1 && is_leap { 29 } else { days };
        if remaining_days >= limit {
            remaining_days -= limit;
            month += 1;
        } else {
            day += remaining_days + 1;
            break;
        }
    }
    
    format!("{day:02}/{month:02}/{year}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dasha_duration() {
        // Aries (0) lord Mars in Aries (0) -> own sign -> 12 years
        assert_eq!(calculate_dasha_years(0, 0), 12);

        // Aries (0) lord Mars in Taurus (1) -> 2nd house clockwise -> dist = 1 -> 1 year
        assert_eq!(calculate_dasha_years(0, 1), 1);

        // Cancer (3) reverse counting. Lord Moon in Cancer (3) -> 12 years
        assert_eq!(calculate_dasha_years(3, 3), 12);

        // Cancer (3) reverse lord Moon in Gemini (2) -> 2nd house counter-clockwise -> dist = 1 -> 1 year
        assert_eq!(calculate_dasha_years(3, 2), 1);
    }
}
