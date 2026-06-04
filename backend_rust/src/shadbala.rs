use crate::models::{PlanetData, ShadbalaResponse, PlanetShadbala, GrahaYuddha};
use crate::constants::SIGNS;
use crate::chart::sign_index;
use std::collections::HashMap;
use chrono::Datelike;

/// Calculates the Shadbala (Six-fold planetary strength) for the 7 classical planets.
pub fn calculate_shadbala(
    planets: &[PlanetData],
    ascendant_degree: f64,
    date_str: &str,
) -> ShadbalaResponse {
    let mut planet_balas = HashMap::new();
    let classical_planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

    // Map sign name to lord name
    let sign_lord = |sign_idx: usize| -> &'static str {
        match sign_idx {
            0 | 7 => "Mars",      // Aries, Scorpio
            1 | 6 => "Venus",     // Taurus, Libra
            2 | 5 => "Mercury",   // Gemini, Virgo
            3 => "Moon",          // Cancer
            4 => "Sun",           // Leo
            8 | 11 => "Jupiter",  // Sagittarius, Pisces
            9 | 10 => "Saturn",   // Capricorn, Aquarius
            _ => "Unknown",
        }
    };

    // Gather coordinates
    let sun = planets.iter().find(|p| p.name == "Sun").cloned();
    let moon = planets.iter().find(|p| p.name == "Moon").cloned();
    
    let sun_long = sun.as_ref().map(|p| p.full_degree).unwrap_or(0.0);
    let moon_long = moon.as_ref().map(|p| p.full_degree).unwrap_or(0.0);

    // Determine Day/Night birth based on Sun's house placement relative to Lagna
    let sun_house = sun.as_ref().map(|p| p.house).unwrap_or(1);
    let is_day_birth = sun_house >= 7 && sun_house <= 12;

    // Weekday calculation for Dina Bala
    // Standard weekday parsing or default to Monday if unparsable
    let weekday_idx = parse_weekday_from_date(date_str);
    let weekday_lords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    let dina_lord = weekday_lords[weekday_idx];

    for &name in &classical_planets {
        let p = match planets.iter().find(|pl| pl.name == name) {
            Some(found) => found,
            None => continue,
        };

        let p_long = p.full_degree;
        let p_house = p.house;
        let p_sign_idx = sign_index(p_long);
        let deg_in_sign = p_long % 30.0;

        // ─── 1. Sthana Bala (Positional Strength) ───
        // A. Uchcha Bala (Exaltation / Debilitation distance)
        let exalt_deg = match name {
            "Sun" => 10.0,      // Aries 10
            "Moon" => 33.0,     // Taurus 3
            "Mars" => 298.0,    // Capricorn 28
            "Mercury" => 165.0, // Virgo 15
            "Jupiter" => 95.0,  // Cancer 5
            "Venus" => 357.0,   // Pisces 27
            "Saturn" => 200.0,  // Libra 20
            _ => 0.0,
        };
        let debil_deg = (exalt_deg + 180.0) % 360.0;
        let mut dist_debil = (p_long - debil_deg).abs();
        if dist_debil > 180.0 {
            dist_debil = 360.0 - dist_debil;
        }
        let uchcha_bala = (dist_debil / 180.0) * 60.0;

        // B. Kendra Bala (House Placement)
        let kendra_bala = match p_house {
            1 | 4 | 7 | 10 => 60.0,
            2 | 5 | 8 | 11 => 30.0,
            _ => 15.0,
        };

        // C. Oja Yugma Bala (Sign and Navamsa Odd/Even alignment)
        let rasi_odd = p_sign_idx % 2 == 1;
        let nav_sign_idx = SIGNS.iter().position(|&s| s == p.navamsa_sign).unwrap_or(0);
        let nav_odd = nav_sign_idx % 2 == 1;

        let mut oja_yugma = 0.0;
        if name == "Moon" || name == "Venus" {
            // Female planets get 15 points in even signs
            if !rasi_odd { oja_yugma += 15.0; }
            if !nav_odd { oja_yugma += 15.0; }
        } else {
            // Male/Neutral planets get 15 points in odd signs
            if rasi_odd { oja_yugma += 15.0; }
            if nav_odd { oja_yugma += 15.0; }
        }

        // D. Drekkana Bala (Decanate)
        let pd = (deg_in_sign / 10.0) as usize;
        let mut drekkana_bala = 0.0;
        if (pd == 0 && (name == "Sun" || name == "Mars" || name == "Jupiter")) ||
           (pd == 1 && (name == "Mercury" || name == "Saturn")) ||
           (pd == 2 && (name == "Moon" || name == "Venus")) {
            drekkana_bala = 15.0;
        }

        // E. Saptavargaja Bala (Dignity across Divisional Charts approximation)
        // High fidelity D1 & D9 lords relationship check
        let d1_lord = sign_lord(p_sign_idx);
        let d1_rel = get_friendship_score(name, d1_lord, p_house, planets);
        
        let d9_rel = get_friendship_score(name, sign_lord(nav_sign_idx), p_house, planets);
        
        // Exaltation / Moolatrikona / Own Sign check gets full 30 points
        let is_own_rasi = p.strength == "Own Sign" || p.strength == "Exalted" || p.strength == "Moolatrikona";
        let saptavargaja_bala = if is_own_rasi {
            30.0 + d9_rel
        } else {
            d1_rel + d9_rel
        };

        let sthana_bala = uchcha_bala + kendra_bala + oja_yugma + drekkana_bala + saptavargaja_bala;

        // ─── 2. Dig Bala (Directional Strength) ───
        let dig_bala = p.dig_bala_points.unwrap_or_else(|| {
            let powerless_house = match name {
                "Sun" | "Mars" => 4,
                "Moon" | "Venus" => 10,
                "Jupiter" | "Mercury" => 7,
                "Saturn" => 1,
                _ => 1,
            };
            let powerless_cusp = (ascendant_degree + (powerless_house - 1) as f64 * 30.0) % 360.0;
            let mut dist_powerless = (p_long - powerless_cusp).abs();
            if dist_powerless > 180.0 {
                dist_powerless = 360.0 - dist_powerless;
            }
            (dist_powerless / 180.0) * 60.0
        });

        // ─── 3. Kaala Bala (Temporal Strength) ───
        // A. Nathonnatha Bala
        let mut nathonnatha = 0.0;
        if is_day_birth {
            if name == "Sun" || name == "Jupiter" || name == "Venus" || name == "Mercury" {
                nathonnatha = 60.0;
            }
        } else {
            if name == "Moon" || name == "Mars" || name == "Saturn" || name == "Mercury" {
                nathonnatha = 60.0;
            }
        }

        // B. Paksha Bala
        let mut elongation = (moon_long - sun_long + 360.0) % 360.0;
        if elongation > 180.0 {
            elongation = 360.0 - elongation;
        }
        let is_waxing = (moon_long - sun_long + 360.0) % 360.0 <= 180.0;
        let paksha_val = elongation / 3.0;
        let is_benefic = name == "Jupiter" || name == "Venus" || 
                         (name == "Mercury" && !p.combust) || 
                         (name == "Moon" && is_waxing);
        let paksha_bala = if is_benefic {
            paksha_val
        } else {
            60.0 - paksha_val
        };

        // C. Tribhaga Bala
        let mut tribhaga = 0.0;
        if name == "Jupiter" {
            // Jupiter is always strong
            tribhaga = 60.0;
        } else if is_day_birth {
            if sun_house == 9 || sun_house == 10 {
                if name == "Mercury" { tribhaga = 60.0; }
            } else if sun_house == 11 || sun_house == 12 {
                if name == "Sun" { tribhaga = 60.0; }
            } else {
                if name == "Saturn" { tribhaga = 60.0; }
            }
        } else {
            if sun_house == 3 || sun_house == 4 {
                if name == "Moon" { tribhaga = 60.0; }
            } else if sun_house == 5 || sun_house == 6 {
                if name == "Venus" { tribhaga = 60.0; }
            } else {
                if name == "Mars" { tribhaga = 60.0; }
            }
        }

        // D. Weekday Lord (Dina Bala)
        let dina_bala = if name == dina_lord { 45.0 } else { 0.0 };

        // E. Ayana Bala (simplistic whole sign declination scaling)
        let ayana_bala = match name {
            "Sun" | "Mars" | "Jupiter" | "Venus" => {
                if p_sign_idx >= 2 && p_sign_idx <= 7 { 40.0 } else { 20.0 }
            }
            "Moon" | "Saturn" => {
                if p_sign_idx >= 8 || p_sign_idx <= 1 { 40.0 } else { 20.0 }
            }
            "Mercury" => 30.0,
            _ => 20.0,
        };

        let kaala_bala = nathonnatha + paksha_bala + tribhaga + dina_bala + ayana_bala;

        // ─── 4. Cheshta Bala (Motional Strength) ───
        let cheshta_bala = if p.retrograde {
            60.0
        } else {
            match name {
                "Sun" => paksha_bala,
                "Moon" => paksha_bala,
                _ => 30.0, // Baseline direct planet motion strength
            }
        };

        // ─── 5. Naisargika Bala (Natural Strength) ───
        let naisargika_bala = match name {
            "Sun" => 60.00,
            "Moon" => 51.43,
            "Venus" => 42.86,
            "Jupiter" => 34.29,
            "Mercury" => 25.71,
            "Mars" => 17.14,
            "Saturn" => 8.57,
            _ => 0.0,
        };

        // ─── 6. Drik Bala (Aspect Strength) ───
        // Safe, standard baseline aspect strength
        let drik_bala = 10.0;

        let total_shashtiamsa = sthana_bala + kaala_bala + dig_bala + cheshta_bala + naisargika_bala + drik_bala;
        let total_rupas = (total_shashtiamsa / 60.0 * 100.0).round() / 100.0;

        // Required strength in Rupas
        let req_rupas = match name {
            "Sun" => 5.0,
            "Moon" => 6.0,
            "Mars" => 5.0,
            "Mercury" => 7.0,
            "Jupiter" => 6.5,
            "Venus" => 5.5,
            "Saturn" => 5.0,
            _ => 1.0,
        };
        let strength_ratio = (total_rupas / req_rupas * 100.0).round() / 100.0;

        planet_balas.insert(
            name.to_string(),
            PlanetShadbala {
                sthana_bala: (sthana_bala * 100.0).round() / 100.0,
                kaala_bala: (kaala_bala * 100.0).round() / 100.0,
                dig_bala: (dig_bala * 100.0).round() / 100.0,
                cheshta_bala: (cheshta_bala * 100.0).round() / 100.0,
                naisargika_bala: (naisargika_bala * 100.0).round() / 100.0,
                drik_bala: (drik_bala * 100.0).round() / 100.0,
                total_shashtiamsa: (total_shashtiamsa * 100.0).round() / 100.0,
                total_rupas,
                strength_ratio,
            },
        );
    }

    ShadbalaResponse { planet_balas }
}

/// Calculates the Bhava Bala (strength of the 12 houses).
pub fn calculate_bhava_bala(
    ascendant_degree: f64,
    _planets: &[PlanetData],
    shadbala: &ShadbalaResponse,
) -> Vec<f64> {
    let mut bhava_balas = Vec::new();
    let asc_sign_idx = sign_index(ascendant_degree);

    let sign_lord = |sign_idx: usize| -> &'static str {
        match sign_idx {
            0 | 7 => "Mars",
            1 | 6 => "Venus",
            2 | 5 => "Mercury",
            3 => "Moon",
            4 => "Sun",
            8 | 11 => "Jupiter",
            9 | 10 => "Saturn",
            _ => "Unknown",
        }
    };

    for house in 1..=12 {
        let house_sign_idx = (asc_sign_idx + house - 1) % 12;
        let lord = sign_lord(house_sign_idx);

        // 1. Lord's Shadbala
        let lord_shad = shadbala
            .planet_balas
            .get(lord)
            .map(|p| p.total_shashtiamsa)
            .unwrap_or(300.0);

        // 2. House Directional Strength
        let dig_bala = match house {
            1 | 4 | 7 | 10 => 60.0,
            2 | 5 | 8 | 11 => 30.0,
            _ => 15.0,
        };

        // 3. Aspects on house cusp
        let drik_bala = 10.0;

        let total = (lord_shad + dig_bala + drik_bala * 100.0).round() / 100.0;
        bhava_balas.push(total);
    }

    bhava_balas
}

/// Detects Graha Yuddha (planetary war) between Mars, Mercury, Jupiter, Venus, and Saturn.
pub fn detect_graha_yuddha(planets: &[PlanetData]) -> Vec<GrahaYuddha> {
    let mut results = Vec::new();
    let combatants = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

    for i in 0..planets.len() {
        let p1 = &planets[i];
        if !combatants.contains(&p1.name.as_str()) { continue; }

        for j in (i + 1)..planets.len() {
            let p2 = &planets[j];
            if !combatants.contains(&p2.name.as_str()) { continue; }

            // Check if they are in the same sign
            let sign_1 = sign_index(p1.full_degree);
            let sign_2 = sign_index(p2.full_degree);

            if sign_1 == sign_2 {
                let diff = (p1.full_degree - p2.full_degree).abs();
                if diff <= 1.0 {
                    // Planetary War! Winner is the one with lower degree in the sign, except Venus always wins
                    let deg_1 = p1.full_degree % 30.0;
                    let deg_2 = p2.full_degree % 30.0;
                    let winner = if p1.name == "Venus" {
                        p1.name.clone()
                    } else if p2.name == "Venus" {
                        p2.name.clone()
                    } else if deg_1 < deg_2 {
                        p1.name.clone()
                    } else {
                        p2.name.clone()
                    };

                    results.push(GrahaYuddha {
                        planet_1: p1.name.clone(),
                        planet_2: p2.name.clone(),
                        degree_diff: (diff * 100.0).round() / 100.0,
                        winner,
                    });
                }
            }
        }
    }

    results
}

// ─── Friendship Helper Functions ───────────

fn get_friendship_score(p: &str, lord: &str, p_house: u8, planets: &[PlanetData]) -> f64 {
    if p == lord { return 15.0; } // Own sign

    let natural = match p {
        "Sun" => match lord {
            "Moon" | "Mars" | "Jupiter" => 1,
            "Venus" | "Saturn" => -1,
            _ => 0,
        },
        "Moon" => match lord {
            "Sun" | "Mercury" => 1,
            _ => 0,
        },
        "Mars" => match lord {
            "Sun" | "Moon" | "Jupiter" => 1,
            "Mercury" => -1,
            _ => 0,
        },
        "Mercury" => match lord {
            "Sun" | "Venus" => 1,
            "Moon" => -1,
            _ => 0,
        },
        "Jupiter" => match lord {
            "Sun" | "Moon" | "Mars" => 1,
            "Mercury" | "Venus" => -1,
            _ => 0,
        },
        "Venus" => match lord {
            "Mercury" | "Saturn" => 1,
            "Sun" | "Moon" => -1,
            _ => 0,
        },
        "Saturn" => match lord {
            "Mercury" | "Venus" => 1,
            "Sun" | "Moon" | "Mars" => -1,
            _ => 0,
        },
        _ => 0,
    };

    // Find the house of the lord
    let lord_house = planets.iter()
        .find(|pl| pl.name == lord)
        .map(|pl| pl.house)
        .unwrap_or(1);

    let diff = (p_house as i8 - lord_house as i8).abs();
    let temp = if matches!(diff, 1 | 2 | 3 | 9 | 10 | 11) { 1 } else { -1 };

    let total = natural + temp;
    match total {
        2 => 22.5,  // Great Friend
        1 => 15.0,  // Friend
        0 => 7.5,   // Neutral
        -1 => 3.75, // Enemy
        _ => 1.875, // Great Enemy
    }
}

fn parse_weekday_from_date(date_str: &str) -> usize {
    // Expected formats: DD/MM/YYYY or YYYY-MM-DD
    let parts: Vec<&str> = if date_str.contains('/') {
        date_str.split('/').collect()
    } else {
        date_str.split('-').collect()
    };

    if parts.len() == 3 {
        let (d, m, y) = if date_str.contains('/') {
            (
                parts[0].parse::<u32>().unwrap_or(15),
                parts[1].parse::<u32>().unwrap_or(8),
                parts[2].parse::<i32>().unwrap_or(1947),
            )
        } else {
            (
                parts[2].parse::<u32>().unwrap_or(15),
                parts[1].parse::<u32>().unwrap_or(8),
                parts[0].parse::<i32>().unwrap_or(1947),
            )
        };

        if let Some(nd) = chrono::NaiveDate::from_ymd_opt(y, m, d) {
            return nd.weekday().num_days_from_sunday() as usize;
        }
    }
    1 // Default to Monday (Moon)
}
