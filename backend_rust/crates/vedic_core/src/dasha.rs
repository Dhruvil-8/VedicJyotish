//! Jaimini Chara Dasha Calculation Engine.
//!
//! Computes the complete sign-based Chara Dasha timeline and sub-dashas (Bhuktis)
//! according to classical Jaimini principles.

use crate::constants::SIGNS;
use crate::models::{CharaDashaPeriod, CharaDashaResponse, PlanetData};
use chrono::{Duration, NaiveDate};
use std::collections::HashMap;

/// Direct signs for Jaimini dasha duration counting (clockwise)
const ODD_FOOTED_SIGNS: [usize; 6] = [0, 1, 2, 6, 7, 8]; // Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius
const EVEN_FOOTED_SIGNS: [usize; 6] = [3, 4, 5, 9, 10, 11]; // Cancer, Leo, Virgo, Capricorn, Aquarius, Pisces
const SIDEREAL_YEAR_DAYS: f64 = 365.256_363_004;

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

/// Calculate dasha duration in years for a given sign and occupied lord sign
pub fn calculate_dasha_years(sign_idx: usize, lord_sign_idx: usize) -> u8 {
    let is_direct = ODD_FOOTED_SIGNS.contains(&sign_idx);
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

fn calculate_dasha_sequence(asc_idx: usize) -> [usize; 12] {
    let ninth_sign = (asc_idx + 8) % 12;
    let step: i16 = if EVEN_FOOTED_SIGNS.contains(&ninth_sign) {
        -1
    } else {
        1
    };
    let mut sequence = [0_usize; 12];
    for (i, sign) in sequence.iter_mut().enumerate() {
        *sign = (asc_idx as i16 + step * i as i16).rem_euclid(12) as usize;
    }
    sequence
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

    let sequence = calculate_dasha_sequence(asc_idx);
    let mut periods = Vec::new();

    // Parse birth date to initialize dasha timeline
    let mut current_date = NaiveDate::parse_from_str(birth_date_str, "%d/%m/%Y")
        .unwrap_or_else(|_| NaiveDate::from_ymd_opt(1990, 1, 1).unwrap());

    for &sign_idx in &sequence {
        let sign_name = SIGNS[sign_idx].to_string();
        let lord_name = if sign_idx == 7 {
            crate::chart::get_stronger_co_lord("Mars", "Ketu", 7, planets)
        } else if sign_idx == 10 {
            crate::chart::get_stronger_co_lord("Saturn", "Rahu", 10, planets)
        } else {
            SIGN_LORDS[sign_idx].to_string()
        };
        let lord_sign_idx = planet_sign_indices
            .get(&lord_name)
            .copied()
            .unwrap_or(sign_idx);

        let mut duration_years = calculate_dasha_years(sign_idx, lord_sign_idx) as i16;
        if let Some(lord) = planets.iter().find(|p| p.name == lord_name) {
            if lord.strength == "Exalted" {
                duration_years += 1;
            } else if lord.strength == "Debilitated" {
                duration_years -= 1;
            }
        }
        if duration_years <= 0 {
            duration_years = 12;
        }
        let duration_years = duration_years as u8;

        let start_date = format_dasha_date(current_date);
        let days = (duration_years as f64 * SIDEREAL_YEAR_DAYS).round() as i64;
        current_date += Duration::days(days);
        let end_date = format_dasha_date(current_date);

        periods.push(CharaDashaPeriod {
            sign: sign_name,
            duration_years,
            start_date,
            end_date,
        });
    }

    CharaDashaResponse { periods }
}

fn format_dasha_date(date: NaiveDate) -> String {
    date.format("%d/%m/%Y").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_planet(name: &str, sign: &str, strength: &str) -> PlanetData {
        PlanetData {
            name: name.to_string(),
            sign: sign.to_string(),
            house: 1,
            strength: strength.to_string(),
            nature: String::new(),
            nakshatra: String::new(),
            nakshatra_lord: String::new(),
            nakshatra_pada: 1,
            full_degree: 0.0,
            deg_in_sign: 0.0,
            retrograde: false,
            combust: false,
            navamsa_sign: "Aries".to_string(),
            chara_karaka: None,
            dig_bala_points: None,
            dig_bala_percentage: None,
            speed: None,
        }
    }

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

    #[test]
    fn test_kn_rao_sequence_uses_ninth_sign_direction() {
        assert_eq!(
            calculate_dasha_sequence(0),
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        );
        assert_eq!(
            calculate_dasha_sequence(3),
            [3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5, 4]
        );
        assert_eq!(
            calculate_dasha_sequence(4),
            [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3]
        );
        assert_eq!(
            calculate_dasha_sequence(9),
            [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10]
        );
        assert_eq!(
            calculate_dasha_sequence(10),
            [10, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        );
    }

    #[test]
    fn test_chara_dasha_periods_use_sidereal_year_and_strength_adjustment() {
        let planets = vec![
            test_planet("Mars", "Taurus", "Exalted"),
            test_planet("Venus", "Taurus", "Own Sign"),
            test_planet("Mercury", "Gemini", "Own Sign"),
            test_planet("Moon", "Cancer", "Own Sign"),
            test_planet("Sun", "Leo", "Own Sign"),
            test_planet("Jupiter", "Sagittarius", "Own Sign"),
            test_planet("Saturn", "Capricorn", "Own Sign"),
        ];

        let res = calculate_chara_dasha("Aries", &planets, "01/01/2000");
        assert_eq!(res.periods[0].sign, "Aries");
        assert_eq!(res.periods[0].duration_years, 2);
        assert_eq!(res.periods[0].start_date, "01/01/2000");
        assert_eq!(res.periods[0].end_date, "01/01/2002");
        assert_eq!(res.periods[1].sign, "Taurus");
    }

    #[test]
    fn test_chara_dasha_co_lord_resolution() {
        fn make_planet(name: &str, sign: &str, full_degree: f64) -> PlanetData {
            PlanetData {
                name: name.to_string(),
                sign: sign.to_string(),
                house: 1,
                strength: String::new(),
                nature: String::new(),
                nakshatra: String::new(),
                nakshatra_lord: String::new(),
                nakshatra_pada: 1,
                full_degree,
                deg_in_sign: full_degree % 30.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Aries".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
                speed: None,
            }
        }

        // Scorpio (7): Mars in Scorpio (215.0), Ketu in Pisces (335.0) -> basic rule: Ketu is stronger!
        // Scorpio (7) to Ketu (11) is 4 years.
        let planets = vec![
            make_planet("Mars", "Scorpio", 215.0),
            make_planet("Ketu", "Pisces", 335.0),
            make_planet("Venus", "Taurus", 45.0),
            make_planet("Mercury", "Gemini", 75.0),
            make_planet("Moon", "Cancer", 105.0),
            make_planet("Sun", "Leo", 135.0),
            make_planet("Jupiter", "Sagittarius", 255.0),
            make_planet("Saturn", "Capricorn", 285.0),
            make_planet("Rahu", "Virgo", 165.0), // Rahu opposite to Ketu (335 - 180 = 155) or whatever, doesn't matter for this test
        ];

        // Let's run Chara Dasha for Scorpio ascendant
        let res = calculate_chara_dasha("Scorpio", &planets, "01/01/2000");
        // Scorpio is the 1st dasha period (starts with Scorpio since ascendant is Scorpio, or whichever direction)
        // Wait, for Scorpio ascendant, ninth house direction:
        // Ninth from Scorpio is Cancer (3) (which is even-footed, so reverse sequence: Scorpio (7), Libra (6), Virgo (5), ...)
        assert_eq!(res.periods[0].sign, "Scorpio");
        assert_eq!(res.periods[0].duration_years, 4); // Ketu resolved as lord (Pisces) -> 4 years (Scorpio to Pisces is 4)
    }
}
