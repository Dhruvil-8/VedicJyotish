use crate::constants::SIGNS;
use crate::models::{PlanetData, VargaHouseData, VargaPlanetRow};
use std::collections::HashMap;

/// Helper to get sign index (0 to 11) from absolute longitude
fn sign_index(long: f64) -> usize {
    (long / 30.0).floor() as usize % 12
}

/// Helper to check sign category (Movable, Fixed, Dual)
fn is_movable(sign: usize) -> bool {
    matches!(sign, 0 | 3 | 6 | 9)
}

fn is_fixed(sign: usize) -> bool {
    matches!(sign, 1 | 4 | 7 | 10)
}

fn is_dual(sign: usize) -> bool {
    matches!(sign, 2 | 5 | 8 | 11)
}

/// Helper to check sign element (Fire, Earth, Air, Water)
fn is_fire(sign: usize) -> bool {
    matches!(sign, 0 | 4 | 8)
}

fn is_earth(sign: usize) -> bool {
    matches!(sign, 1 | 5 | 9)
}

fn is_air(sign: usize) -> bool {
    matches!(sign, 2 | 6 | 10)
}

fn is_water(sign: usize) -> bool {
    matches!(sign, 3 | 7 | 11)
}

// ─── Divisional Sign Calculators ─────────────────────────────────────────────

pub fn get_varga_sign(factor: usize, rasi_sign: usize, degree_in_sign: f64) -> usize {
    let d = factor as f64;
    let step = 30.0 / d;
    let l = (degree_in_sign / step).floor() as usize;

    match factor {
        2 => {
            // Traditional Parasara Hora
            let is_odd = rasi_sign % 2 == 1;
            if is_odd {
                if l == 0 { 4 } else { 3 } // Leo / Cancer
            } else {
                if l == 0 { 3 } else { 4 } // Cancer / Leo
            }
        }
        3 => {
            // Parashari Drekkana
            (rasi_sign + 4 * l) % 12
        }
        4 => {
            // Chaturthamsa
            (rasi_sign + 3 * l) % 12
        }
        5 => {
            // Panchamsa
            let odd = [0, 10, 8, 2, 6];
            let even = [1, 5, 11, 9, 7];
            let idx = l.min(4);
            if rasi_sign % 2 == 1 {
                odd[idx]
            } else {
                even[idx]
            }
        }
        6 => {
            // Shashthamsa
            if rasi_sign % 2 == 1 {
                l % 12
            } else {
                (l + 6) % 12
            }
        }
        7 => {
            // Saptamsa
            if rasi_sign % 2 == 1 {
                (rasi_sign + l) % 12
            } else {
                (rasi_sign + 6 + l) % 12
            }
        }
        8 => {
            // Ashtamsa
            if is_movable(rasi_sign) {
                l % 12
            } else if is_fixed(rasi_sign) {
                (l + 8) % 12
            } else if is_dual(rasi_sign) {
                (l + 4) % 12
            } else {
                0
            }
        }
        9 => {
            // Navamsa
            let seed = if is_fire(rasi_sign) {
                0
            } else if is_water(rasi_sign) {
                3
            } else if is_air(rasi_sign) {
                6
            } else {
                9
            };
            (seed + l) % 12
        }
        10 => {
            // Dasamsa
            if rasi_sign % 2 == 1 {
                (rasi_sign + l) % 12
            } else {
                (rasi_sign + 8 + l) % 12
            }
        }
        11 => {
            // Rudramsa
            (12 - rasi_sign + l) % 12
        }
        12 => {
            // Dwadasamsa
            (rasi_sign + l) % 12
        }
        16 => {
            // Shodasamsa (Kalamsa)
            if is_movable(rasi_sign) {
                l % 12
            } else if is_fixed(rasi_sign) {
                (l + 4) % 12
            } else if is_dual(rasi_sign) {
                (l + 8) % 12
            } else {
                0
            }
        }
        20 => {
            // Vimsamsa
            if is_movable(rasi_sign) {
                l % 12
            } else if is_fixed(rasi_sign) {
                (l + 8) % 12
            } else if is_dual(rasi_sign) {
                (l + 4) % 12
            } else {
                0
            }
        }
        24 => {
            // Siddhamsa / Chaturvimsamsa
            if rasi_sign % 2 == 1 {
                (4 + l) % 12
            } else {
                (3 + l) % 12
            }
        }
        27 => {
            // Nakshatramsa / Saptavimsamsa
            if is_fire(rasi_sign) {
                l % 12
            } else if is_earth(rasi_sign) {
                (l + 3) % 12
            } else if is_air(rasi_sign) {
                (l + 6) % 12
            } else {
                (l + 9) % 12
            }
        }
        30 => {
            // Trimsamsa
            if rasi_sign % 2 == 1 {
                if degree_in_sign < 5.0 {
                    0 // Aries
                } else if degree_in_sign < 10.0 {
                    10 // Aquarius
                } else if degree_in_sign < 18.0 {
                    8 // Sagittarius
                } else if degree_in_sign < 25.0 {
                    2 // Gemini
                } else {
                    6 // Libra
                }
            } else {
                if degree_in_sign < 5.0 {
                    1 // Taurus
                } else if degree_in_sign < 12.0 {
                    5 // Virgo
                } else if degree_in_sign < 20.0 {
                    11 // Pisces
                } else if degree_in_sign < 25.0 {
                    9 // Capricorn
                } else {
                    7 // Scorpio
                }
            }
        }
        40 => {
            // Khavedamsa
            if rasi_sign % 2 == 1 {
                l % 12
            } else {
                (l + 6) % 12
            }
        }
        45 => {
            // Akshavedamsa
            if is_movable(rasi_sign) {
                l % 12
            } else if is_fixed(rasi_sign) {
                (l + 4) % 12
            } else if is_dual(rasi_sign) {
                (l + 8) % 12
            } else {
                0
            }
        }
        60 => {
            // Shashtyamsa
            (rasi_sign + l) % 12
        }
        _ => rasi_sign,
    }
}

// ─── Orchestrator Function ───────────────────────────────────────────────────

pub fn calculate_varga_charts(
    ascendant_degree: f64,
    planets: &[PlanetData],
) -> (
    HashMap<String, HashMap<String, VargaHouseData>>,
    HashMap<String, Vec<VargaPlanetRow>>,
) {
    let mut charts_res = HashMap::new();
    let mut planets_res = HashMap::new();

    let factors = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60];

    let asc_sign = sign_index(ascendant_degree);
    let asc_deg_in_sign = ascendant_degree % 30.0;

    for &factor in &factors {
        let v_key = format!("D{factor}");
        let v_asc_sign = get_varga_sign(factor, asc_sign, asc_deg_in_sign);

        // 1. Calculate planetary details in this varga
        let mut v_planets = Vec::new();
        for p in planets {
            let p_rasi_sign = sign_index(p.full_degree);
            let p_deg_in_sign = p.full_degree % 30.0;
            let p_varga_sign = get_varga_sign(factor, p_rasi_sign, p_deg_in_sign);
            let deg_in_varga = (p_deg_in_sign * factor as f64) % 30.0;

            v_planets.push(VargaPlanetRow {
                name: p.name.clone(),
                sign: SIGNS[p_varga_sign].to_string(),
                deg_in_sign: (deg_in_varga * 100.0).round() / 100.0,
            });
        }
        planets_res.insert(v_key.clone(), v_planets);

        // 2. Arrange into a 12-house chart relative to varga ascendant
        let mut v_houses = HashMap::new();
        for house in 1..=12 {
            let target_sign_idx = (v_asc_sign + house - 1) % 12;
            let target_sign = SIGNS[target_sign_idx].to_string();

            let mut house_planets = Vec::new();
            for p in planets {
                let p_rasi_sign = sign_index(p.full_degree);
                let p_deg_in_sign = p.full_degree % 30.0;
                let p_varga_sign = get_varga_sign(factor, p_rasi_sign, p_deg_in_sign);

                if p_varga_sign == target_sign_idx {
                    house_planets.push(p.name.clone());
                }
            }

            v_houses.insert(
                format!("house_{house}"),
                VargaHouseData {
                    sign: target_sign,
                    planets: house_planets,
                },
            );
        }
        charts_res.insert(v_key, v_houses);
    }

    (charts_res, planets_res)
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_drekkana_d3() {
        // Sun at 12 deg Taurus. Taurus is fixed sign (1).
        // Degree 12.0 falls in 2nd Drekkana (l = 1).
        // Sign = (1 + 4 * 1) % 12 = 5 (Virgo).
        assert_eq!(get_varga_sign(3, 1, 12.0), 5);
    }

    #[test]
    fn test_navamsa_d9() {
        // Jupiter at 19 deg Cancer (water sign, index 3).
        // 19 deg / (30/9) = 19 / 3.333 = 5.7 -> l = 5.
        // Seed for Water sign = 3 (Cancer).
        // Navamsa Sign = (3 + 5) % 12 = 8 (Sagittarius).
        assert_eq!(get_varga_sign(9, 3, 19.0), 8);
    }
}
