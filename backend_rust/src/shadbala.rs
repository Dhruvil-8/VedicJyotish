use crate::chart::sign_index;
use crate::constants::SIGNS;
use crate::models::{GrahaYuddha, PlanetData, PlanetShadbala, ShadbalaResponse};
use std::collections::HashMap;

/// Calculates the Shadbala (Six-fold planetary strength) for the 7 classical planets.
pub fn calculate_shadbala(
    planets: &[PlanetData],
    ascendant_degree: f64,
    vedic_weekday_idx: usize,
) -> ShadbalaResponse {
    let mut planet_balas = HashMap::new();
    let classical_planets = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    ];

    // Map sign name to lord name
    let sign_lord = |sign_idx: usize| -> &'static str {
        match sign_idx {
            0 | 7 => "Mars",     // Aries, Scorpio
            1 | 6 => "Venus",    // Taurus, Libra
            2 | 5 => "Mercury",  // Gemini, Virgo
            3 => "Moon",         // Cancer
            4 => "Sun",          // Leo
            8 | 11 => "Jupiter", // Sagittarius, Pisces
            9 | 10 => "Saturn",  // Capricorn, Aquarius
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
    let _is_day_birth = sun_house >= 7 && sun_house <= 12;

    // Weekday calculation for Dina Bala
    let weekday_lords = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    ];
    let dina_lord = weekday_lords[vedic_weekday_idx % 7];

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
        let mut dist_debil = (p_long - debil_deg + 360.0) % 360.0;
        if dist_debil > 180.0 {
            dist_debil = 360.0 - dist_debil;
        }
        let uchcha_bala = dist_debil / 3.0;

        // B. Kendra Bala (House Placement)
        let kendra_bala = match p_house {
            1 | 4 | 7 | 10 => 60.0,
            2 | 5 | 8 | 11 => 30.0,
            _ => 15.0,
        };

        // C. Oja Yugma Bala (Sign and Navamsa Odd/Even alignment)
        let rasi_odd = p_sign_idx % 2 == 0;
        let nav_sign_idx = SIGNS.iter().position(|&s| s == p.navamsa_sign).unwrap_or(0);
        let nav_odd = nav_sign_idx % 2 == 0;

        let mut oja_yugma = 0.0;
        if name == "Moon" || name == "Venus" {
            // Female planets get 15 points in even signs
            if !rasi_odd {
                oja_yugma += 15.0;
            }
            if !nav_odd {
                oja_yugma += 15.0;
            }
        } else {
            // Male/Neutral planets get 15 points in odd signs
            if rasi_odd {
                oja_yugma += 15.0;
            }
            if nav_odd {
                oja_yugma += 15.0;
            }
        }

        // D. Drekkana Bala (Decanate)
        let pd = (deg_in_sign / 10.0) as usize;
        let mut drekkana_bala = 0.0;
        if (pd == 0 && (name == "Sun" || name == "Mars" || name == "Jupiter"))
            || (pd == 1 && (name == "Mercury" || name == "Saturn"))
            || (pd == 2 && (name == "Moon" || name == "Venus"))
        {
            drekkana_bala = 15.0;
        }

        // E. Saptavargaja Bala (Dignity across Divisional Charts approximation)
        // High fidelity D1 & D9 lords relationship check
        let d1_lord = sign_lord(p_sign_idx);
        let d1_rel = get_friendship_score(name, d1_lord, p_house, planets);

        let d9_rel = get_friendship_score(name, sign_lord(nav_sign_idx), p_house, planets);

        // Exaltation / Moolatrikona / Own Sign check gets full 30 points
        let is_own_rasi =
            p.strength == "Own Sign" || p.strength == "Exalted" || p.strength == "Moolatrikona";
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
        if name == "Mercury" {
            nathonnatha = 60.0;
        } else {
            let ic = (ascendant_degree + 90.0) % 360.0;
            let mut dist_ic = (sun_long - ic + 360.0) % 360.0;
            if dist_ic > 180.0 {
                dist_ic = 360.0 - dist_ic;
            }
            let t_diff = (dist_ic / 180.0) * 60.0;
            if name == "Sun" || name == "Jupiter" || name == "Venus" {
                nathonnatha = t_diff;
            } else if name == "Moon" || name == "Mars" || name == "Saturn" {
                nathonnatha = 60.0 - t_diff;
            }
        }

        // B. Paksha Bala
        let mut elongation = (moon_long - sun_long + 360.0) % 360.0;
        if elongation > 180.0 {
            elongation = 360.0 - elongation;
        }
        let is_waxing = (moon_long - sun_long + 360.0) % 360.0 <= 180.0;
        let paksha_val = elongation / 3.0;
        let is_benefic = name == "Jupiter"
            || name == "Venus"
            || (name == "Mercury" && !p.combust)
            || (name == "Moon" && is_waxing);
        let mut paksha_bala = if is_benefic {
            paksha_val
        } else {
            60.0 - paksha_val
        };
        if name == "Moon" {
            paksha_bala *= 2.0;
        }

        // C. Tribhaga Bala
        let mut tribhaga = 0.0;
        if name == "Jupiter" {
            tribhaga = 60.0;
        } else {
            match sun_house {
                12 | 11 => {
                    if name == "Mercury" {
                        tribhaga = 60.0;
                    }
                }
                10 | 9 => {
                    if name == "Sun" {
                        tribhaga = 60.0;
                    }
                }
                8 | 7 => {
                    if name == "Saturn" {
                        tribhaga = 60.0;
                    }
                }
                6 | 5 => {
                    if name == "Moon" {
                        tribhaga = 60.0;
                    }
                }
                4 | 3 => {
                    if name == "Venus" {
                        tribhaga = 60.0;
                    }
                }
                2 | 1 => {
                    if name == "Mars" {
                        tribhaga = 60.0;
                    }
                }
                _ => {}
            }
        }

        // D. Weekday Lord (Dina Bala)
        let dina_bala = if name == dina_lord { 45.0 } else { 0.0 };

        // E. Hora Bala (Lord of the birth hour)
        // Hora lords cycle: Sun(0), Venus(5), Mercury(3), Moon(1), Saturn(6), Jupiter(4), Mars(2)
        let hora_lord_cycle = ["Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars"];
        // Approximate birth hour from Sun's position: IC = midnight, MC = noon
        let mc_long = (ascendant_degree + 180.0) % 360.0;
        let mut sun_from_mc = (sun_long - mc_long + 360.0) % 360.0;
        if sun_from_mc > 180.0 {
            sun_from_mc = 360.0 - sun_from_mc;
        }
        // Map 0..180 to approximate 0..24 hours relative to noon, then find hora index
        let approx_hour = (sun_from_mc / 180.0 * 24.0) as usize;
        // Hora lord starts from weekday lord and cycles through hora_lord_cycle
        let weekday_hora_start = match vedic_weekday_idx % 7 {
            0 => 0, // Sunday -> Sun
            1 => 3, // Monday -> Moon
            2 => 6, // Tuesday -> Mars
            3 => 2, // Wednesday -> Mercury
            4 => 5, // Thursday -> Jupiter
            5 => 1, // Friday -> Venus
            6 => 4, // Saturday -> Saturn
            _ => 0,
        };
        let hora_lord_idx = (weekday_hora_start + approx_hour) % 7;
        let hora_lord = hora_lord_cycle[hora_lord_idx];
        let hora_bala = if name == hora_lord { 60.0 } else { 0.0 };

        // F. Ayana Bala
        let sayana_long = (p_long + 24.0) % 360.0;
        let mut declination = 23.44 * (sayana_long.to_radians().sin());
        if name == "Moon" || name == "Saturn" {
            declination = -declination;
        }
        if name == "Mercury" {
            declination = declination.abs();
        }
        let mut ayana_bala = (24.0 + declination) * 1.25;
        if name == "Sun" {
            ayana_bala *= 2.0;
        }
        if ayana_bala < 0.0 {
            ayana_bala = 0.0;
        }

        let kaala_bala = nathonnatha + paksha_bala + tribhaga + dina_bala + hora_bala + ayana_bala;

        // ─── 4. Cheshta Bala (Motional Strength) ───
        // Per BV Raman: Sun's cheshta = ayana bala, Moon's cheshta = paksha bala (doubled already)
        // Retrograde planets get max 60. Direct planets use speed-ratio against mean daily motion.
        let cheshta_bala = if p.retrograde {
            60.0
        } else {
            match name {
                "Sun" => ayana_bala,
                "Moon" => paksha_bala,
                _ => {
                    // Speed-ratio based cheshta bala: slower motion = higher strength
                    // Mean daily motions from Surya Siddhanta (degrees/day)
                    let avg_speed = match name {
                        "Mars" => 0.524,
                        "Mercury" => 4.092,
                        "Jupiter" => 0.083,
                        "Venus" => 1.602,
                        "Saturn" => 0.033,
                        _ => 1.0,
                    };
                    // Use deg_in_sign as a proxy for apparent speed variation
                    // When planet's actual speed < mean speed, it's slowing (higher cheshta)
                    let speed_ratio = (deg_in_sign / 30.0).min(1.0);
                    let cheshta = 60.0 * (1.0 - speed_ratio * avg_speed / (avg_speed + 0.5));
                    cheshta.max(0.0).min(60.0)
                }
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
        // Computed from actual planetary aspects: benefic drishti - malefic drishti
        let drik_bala = compute_drik_bala(name, p_long, planets);

        let total_shashtiamsa =
            sthana_bala + kaala_bala + dig_bala + cheshta_bala + naisargika_bala + drik_bala;
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

        // 2. Bhava Dig Bala (Sign Nature at bhava madhya)
        // Based on the nature of the sign occupying this house:
        // Nara (human) rasis: Gemini, Virgo, Libra, first half of Sagittarius, Aquarius => strong in kendras
        // Jalachara (water) rasis: Cancer, 2nd half of Capricorn, Pisces => strong in panaparas
        // Chatushpada (quadruped) rasis: Aries, Taurus, Leo, 1st half of Capricorn, 2nd half of Sagittarius => strong in apoklimas
        // Keeta (insect) rasis: Scorpio => moderate everywhere
        let is_kendra = matches!(house, 1 | 4 | 7 | 10);
        let is_panapara = matches!(house, 2 | 5 | 8 | 11);
        let _is_apoklima = matches!(house, 3 | 6 | 9 | 12);
        let dig_bala = match house_sign_idx {
            // Nara rasis: Gemini(2), Virgo(5), Libra(6), Aquarius(10)
            2 | 5 | 6 | 10 => if is_kendra { 60.0 } else if is_panapara { 30.0 } else { 15.0 },
            // Jalachara rasis: Cancer(3), Pisces(11)
            3 | 11 => if is_panapara { 60.0 } else if is_kendra { 30.0 } else { 15.0 },
            // Chatushpada rasis: Aries(0), Taurus(1), Leo(4), Sagittarius(8)
            0 | 1 | 4 | 8 => if _is_apoklima { 60.0 } else if is_panapara { 30.0 } else { 15.0 },
            // Keeta rasi: Scorpio(7)
            7 => 30.0,
            // Capricorn(9) is mixed (1st half quadruped, 2nd half water)
            9 => if is_panapara { 45.0 } else { 30.0 },
            _ => 30.0,
        };

        // 3. Bhava Drik Bala (aspect-based strength on house cusp)
        let house_cusp_long = (ascendant_degree + (house as f64 - 1.0) * 30.0) % 360.0;
        let drik_bala = compute_drik_bala_for_cusp(house as u8, house_cusp_long, ascendant_degree, _planets);

        let total = (lord_shad + dig_bala + drik_bala).round();
        bhava_balas.push(total);
    }

    bhava_balas
}

/// Detects Graha Yuddha (planetary war) between Mars, Mercury, Jupiter, Venus, and Saturn.
pub fn detect_graha_yuddha(
    planets: &[PlanetData],
    shadbala: &ShadbalaResponse,
) -> Vec<GrahaYuddha> {
    let mut results = Vec::new();
    let combatants = ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

    for i in 0..planets.len() {
        let p1 = &planets[i];
        if !combatants.contains(&p1.name.as_str()) {
            continue;
        }

        for j in (i + 1)..planets.len() {
            let p2 = &planets[j];
            if !combatants.contains(&p2.name.as_str()) {
                continue;
            }

            // Check if they are in the same sign
            let sign_1 = sign_index(p1.full_degree);
            let sign_2 = sign_index(p2.full_degree);

            if sign_1 == sign_2 {
                let diff = (p1.full_degree - p2.full_degree).abs();
                if diff <= 1.0 {
                    // Planetary War! Winner is determined by comparing their total Shadbala.
                    let p1_strength = shadbala
                        .planet_balas
                        .get(&p1.name)
                        .map(|pb| pb.total_shashtiamsa)
                        .unwrap_or(0.0);
                    let p2_strength = shadbala
                        .planet_balas
                        .get(&p2.name)
                        .map(|pb| pb.total_shashtiamsa)
                        .unwrap_or(0.0);

                    let winner = if p1_strength >= p2_strength {
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
    if p == lord {
        return 15.0;
    } // Own sign

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
    let lord_house = planets
        .iter()
        .find(|pl| pl.name == lord)
        .map(|pl| pl.house)
        .unwrap_or(1);

    let diff = (p_house as i8 - lord_house as i8).abs();
    let temp = if matches!(diff, 1 | 2 | 3 | 9 | 10 | 11) {
        1
    } else {
        -1
    };

    let total = natural + temp;
    match total {
        2 => 22.5,  // Great Friend
        1 => 15.0,  // Friend
        0 => 7.5,   // Neutral
        -1 => 3.75, // Enemy
        _ => 1.875, // Great Enemy
    }
}

// ─── Drik Bala Aspect Helper Functions ─────────────────────────

fn planet_id(name: &str) -> usize {
    match name {
        "Sun" => 0,
        "Moon" => 1,
        "Mars" => 2,
        "Mercury" => 3,
        "Jupiter" => 4,
        "Venus" => 5,
        "Saturn" => 6,
        _ => 99,
    }
}

fn drik_bala_calc_1(angle: f64, aspecting_id: usize) -> f64 {
    let a = angle;
    let mut v;
    if a >= 0.0 && a < 30.0 {
        v = 0.0;
    } else if a >= 30.0 && a < 60.0 {
        v = 0.5 * (a - 30.0);
    } else if a >= 60.0 && a < 90.0 {
        v = (a - 60.0) + 15.0;
        if aspecting_id == 6 { // Saturn
            v += 45.0;
        }
    } else if a >= 90.0 && a < 120.0 {
        v = 0.5 * (120.0 - a) + 30.0;
        if aspecting_id == 2 { // Mars
            v += 15.0;
        }
    } else if a >= 120.0 && a < 150.0 {
        v = 150.0 - a;
        if aspecting_id == 4 { // Jupiter
            v += 30.0;
        }
    } else if a >= 150.0 && a < 180.0 {
        v = 2.0 * (a - 150.0);
    } else if a >= 180.0 && a < 300.0 {
        v = 0.5 * (300.0 - a);
        if aspecting_id == 2 && (a >= 210.0 && a < 240.0) { // Mars
            v += 15.0;
        }
        if aspecting_id == 4 && (a >= 240.0 && a < 270.0) { // Jupiter
            v += 30.0;
        }
        if aspecting_id == 6 && (a >= 270.0 && a < 300.0) { // Saturn
            v += 45.0;
        }
    } else {
        v = 0.0;
    }
    v
}

fn bhava_drik_bala_calc_1(angle: f64, aspecting_id: usize) -> f64 {
    let a = angle;
    let mut v;
    if a > 0.0 && a <= 30.0 {
        v = 0.0;
    } else if a >= 30.01 && a <= 60.0 {
        v = 0.5 * (a - 30.0);
    } else if a >= 60.01 && a <= 90.0 {
        v = (a - 60.0) + 15.0;
        if aspecting_id == 6 { // Saturn
            v += 45.0;
        }
    } else if a >= 90.01 && a <= 120.0 {
        v = 0.5 * (120.0 - a) + 30.0;
        if aspecting_id == 2 { // Mars
            v += 15.0;
        }
    } else if a >= 120.01 && a <= 150.0 {
        v = 150.0 - a;
        if aspecting_id == 4 { // Jupiter
            v += 30.0;
        }
    } else if a >= 150.01 && a <= 180.0 {
        v = 2.0 * (a - 150.0);
    } else if a >= 180.01 && a <= 300.0 {
        v = 0.5 * (300.0 - a);
        if aspecting_id == 2 && (a > 210.01 && a < 240.01) { // Mars
            v += 15.0;
        }
        if aspecting_id == 4 && (a > 240.01 && a < 270.01) { // Jupiter
            v += 30.0;
        }
        if aspecting_id == 6 && (a > 270.01 && a < 300.01) { // Saturn
            v += 45.0;
        }
    } else {
        v = 0.0;
    }
    if aspecting_id != 3 && aspecting_id != 4 {
        v = (v * 0.25 * 100.0).round() / 100.0;
    }
    v
}

fn get_aspected_signs_rasi(sign_idx: usize) -> Vec<usize> {
    let movable = [0, 3, 6, 9];   // Aries, Cancer, Libra, Capricorn
    let fixed = [1, 4, 7, 10];    // Taurus, Leo, Scorpio, Aquarius
    let dual = [2, 5, 8, 11];     // Gemini, Virgo, Sagittarius, Pisces

    if movable.contains(&sign_idx) {
        fixed.iter().copied().filter(|&f| f != (sign_idx + 1) % 12 && f != (sign_idx + 11) % 12).collect()
    } else if fixed.contains(&sign_idx) {
        movable.iter().copied().filter(|&m| m != (sign_idx + 1) % 12 && m != (sign_idx + 11) % 12).collect()
    } else {
        dual.iter().copied().filter(|&d| d != sign_idx).collect()
    }
}

fn planet_aspects_sign(planet_name: &str, planet_sign_idx: usize, target_sign_idx: usize) -> bool {
    let relative_houses = match planet_name {
        "Mars" => vec![4, 7, 8],
        "Jupiter" => vec![5, 7, 9],
        "Saturn" => vec![3, 7, 10],
        "Sun" | "Moon" | "Mercury" | "Venus" => vec![7],
        _ => vec![],
    };
    
    // Check Graha Drishti
    for rel_house in relative_houses {
        let t_idx = (planet_sign_idx + rel_house - 1) % 12;
        if t_idx == target_sign_idx {
            return true;
        }
    }
    
    // Check Jaimini Rasi Drishti
    let aspected_rasis = get_aspected_signs_rasi(planet_sign_idx);
    if aspected_rasis.contains(&target_sign_idx) {
        return true;
    }
    
    false
}

fn get_benefics_malefics(planets: &[PlanetData], sun_long: f64, moon_long: f64) -> (Vec<String>, Vec<String>) {
    let is_waxing = ((moon_long - sun_long + 360.0) % 360.0) <= 180.0;
    
    let mut benefics = vec!["Jupiter".to_string(), "Venus".to_string()];
    let mut malefics = vec!["Sun".to_string(), "Mars".to_string(), "Saturn".to_string()];
    
    if is_waxing {
        benefics.push("Moon".to_string());
    } else {
        malefics.push("Moon".to_string());
    }
    
    if let Some(mercury) = planets.iter().find(|p| p.name == "Mercury") {
        let merc_sign = mercury.sign.clone();
        let merc_long = mercury.full_degree;
        
        let mut merc_co_benefics = Vec::new();
        let mut merc_co_malefics = Vec::new();
        
        for p in planets {
            if p.name == "Mercury" || p.name == "Lagna" || p.name == "Rahu" || p.name == "Ketu" {
                continue;
            }
            if p.sign == merc_sign {
                if benefics.contains(&p.name) {
                    merc_co_benefics.push(p);
                } else if malefics.contains(&p.name) {
                    merc_co_malefics.push(p);
                }
            }
        }
        
        let merc_is_benefic = if merc_co_benefics.is_empty() && merc_co_malefics.is_empty() {
            true
        } else if merc_co_benefics.len() > merc_co_malefics.len() {
            true
        } else if merc_co_malefics.len() > merc_co_benefics.len() {
            false
        } else {
            let mut closest_planet = &merc_co_benefics[0];
            let mut min_diff = (closest_planet.full_degree - merc_long).abs();
            
            for p in &merc_co_benefics {
                let diff = (p.full_degree - merc_long).abs();
                if diff < min_diff {
                    min_diff = diff;
                    closest_planet = p;
                }
            }
            for p in &merc_co_malefics {
                let diff = (p.full_degree - merc_long).abs();
                if diff < min_diff {
                    min_diff = diff;
                    closest_planet = p;
                }
            }
            
            benefics.contains(&closest_planet.name)
        };
        
        if merc_is_benefic {
            benefics.push("Mercury".to_string());
        } else {
            malefics.push("Mercury".to_string());
        }
    } else {
        benefics.push("Mercury".to_string());
    }
    
    (benefics, malefics)
}

pub fn compute_drik_bala(target_name: &str, target_long: f64, planets: &[PlanetData]) -> f64 {
    let classical_planets = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    ];
    if !classical_planets.contains(&target_name) {
        return 0.0;
    }
    
    let sun = planets.iter().find(|p| p.name == "Sun");
    let moon = planets.iter().find(|p| p.name == "Moon");
    let sun_long = sun.map(|p| p.full_degree).unwrap_or(0.0);
    let moon_long = moon.map(|p| p.full_degree).unwrap_or(0.0);
    
    let (benefics, malefics) = get_benefics_malefics(planets, sun_long, moon_long);
    
    let mut dkp = 0.0;
    let mut dkm = 0.0;
    
    for &aspecting_name in &classical_planets {
        let aspecting = match planets.iter().find(|p| p.name == aspecting_name) {
            Some(p) => p,
            None => continue,
        };
        
        let aspecting_long = aspecting.full_degree;
        let diff = (target_long - aspecting_long + 360.0) % 360.0;
        let val = drik_bala_calc_1(diff, planet_id(aspecting_name));
        
        if benefics.contains(&aspecting_name.to_string()) {
            dkp += val;
        }
        if malefics.contains(&aspecting_name.to_string()) {
            dkm += val;
        }
    }
    
    let final_val = (dkp - dkm) / 4.0;
    (final_val * 100.0).round() / 100.0
}

pub fn compute_drik_bala_for_cusp(
    house: u8,
    house_cusp_long: f64,
    ascendant_degree: f64,
    planets: &[PlanetData],
) -> f64 {
    let classical_planets = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    ];
    let asc_sign_idx = sign_index(ascendant_degree);
    let target_sign_idx = (asc_sign_idx + (house as usize) - 1) % 12;
    
    let subha_grahas = ["Moon", "Mercury", "Jupiter", "Venus"];
    let asubha_grahas = ["Sun", "Mars", "Saturn"];
    
    let mut dkp = 0.0;
    let mut dkm = 0.0;
    
    for &aspecting_name in &classical_planets {
        let aspecting = match planets.iter().find(|p| p.name == aspecting_name) {
            Some(p) => p,
            None => continue,
        };
        
        let aspecting_sign_idx = sign_index(aspecting.full_degree);
        if planet_aspects_sign(aspecting_name, aspecting_sign_idx, target_sign_idx) {
            let aspecting_long = aspecting.full_degree;
            let diff = (house_cusp_long - aspecting_long + 360.0) % 360.0;
            let val = bhava_drik_bala_calc_1(diff, planet_id(aspecting_name));
            
            if subha_grahas.contains(&aspecting_name) {
                dkp += val;
            }
            if asubha_grahas.contains(&aspecting_name) {
                dkm += val;
            }
        }
    }
    
    let final_val = (dkp - dkm) / 4.0;
    (final_val * 100.0).round() / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_planet(name: &str, house: u8, full_degree: f64) -> PlanetData {
        let sign_names = [
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
        ];
        let sign_idx = (full_degree / 30.0) as usize % 12;
        PlanetData {
            name: name.to_string(),
            sign: sign_names[sign_idx].to_string(),
            house,
            strength: "Neutral".to_string(),
            nature: "Functional Benefic".to_string(),
            nakshatra: "Dummy".to_string(),
            nakshatra_lord: "Sun".to_string(),
            nakshatra_pada: 1,
            full_degree,
            deg_in_sign: 5.0,
            retrograde: false,
            combust: false,
            navamsa_sign: "Capricorn".to_string(),
            chara_karaka: None,
            dig_bala_points: None,
            dig_bala_percentage: None,
        }
    }

    #[test]
    fn test_drik_bala_piecewise() {
        // Test planet_id helper
        assert_eq!(planet_id("Sun"), 0);
        assert_eq!(planet_id("Saturn"), 6);

        // Test drik_bala_calc_1 with specific angles and aspecting planet IDs
        // Mars (2) at 90 deg has aspect value + 15
        let val_mars_90 = drik_bala_calc_1(90.0, 2);
        // Base is 0.5 * (120 - 90) + 30 = 45. Mars adds 15. Total = 60.
        assert_eq!(val_mars_90, 60.0);

        // Saturn (6) at 60 deg has aspect value + 45
        let val_sat_60 = drik_bala_calc_1(60.0, 6);
        // Base is (60 - 60) + 15 = 15. Saturn adds 45. Total = 60.
        assert_eq!(val_sat_60, 60.0);
    }

    #[test]
    fn test_get_benefics_malefics() {
        let sun = create_test_planet("Sun", 1, 10.0);
        let moon = create_test_planet("Moon", 2, 45.0); // waxing (elongation 35 deg)
        let jupiter = create_test_planet("Jupiter", 3, 90.0);
        let venus = create_test_planet("Venus", 4, 120.0);
        let saturn = create_test_planet("Saturn", 5, 150.0);
        let mars = create_test_planet("Mars", 6, 180.0);
        let mercury = create_test_planet("Mercury", 7, 210.0);
        
        let planets = vec![sun, moon, jupiter, venus, saturn, mars, mercury];
        let (benefics, malefics) = get_benefics_malefics(&planets, 10.0, 45.0);

        assert!(benefics.contains(&"Jupiter".to_string()));
        assert!(benefics.contains(&"Venus".to_string()));
        assert!(benefics.contains(&"Moon".to_string())); // waxing
        assert!(benefics.contains(&"Mercury".to_string())); // alone in its sign

        assert!(malefics.contains(&"Sun".to_string()));
        assert!(malefics.contains(&"Mars".to_string()));
        assert!(malefics.contains(&"Saturn".to_string()));
    }
}

