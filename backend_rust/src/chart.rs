use crate::constants::SIGNS;
use crate::models::{PlanetData, HouseData, NavamsaHouseData, VargaHouseData, VargaPlanetRow};
use std::collections::HashMap;

// ─── Coordinate Helper Functions ─────────────────────────────────────────────

pub fn sign_index(long: f64) -> usize {
    ((long / 30.0).floor() as usize) % 12
}

pub fn get_navamsa_sign(sign_idx: usize, degree_in_sign: f64) -> usize {
    let pada = (degree_in_sign / (30.0 / 9.0)).floor() as usize;
    let seed = if is_fire(sign_idx) {
        0
    } else if is_water(sign_idx) {
        3
    } else if is_air(sign_idx) {
        6
    } else {
        9
    };
    (seed + pada) % 12
}

// ─── Sign Classification Helpers ─────────────────────────────────────────────

fn is_movable(sign: usize) -> bool {
    matches!(sign, 0 | 3 | 6 | 9)
}

fn is_fixed(sign: usize) -> bool {
    matches!(sign, 1 | 4 | 7 | 10)
}

fn is_dual(sign: usize) -> bool {
    matches!(sign, 2 | 5 | 8 | 11)
}

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

// ─── Rasi and Navamsa Building Functions ──────────────────────────────────────

pub fn build_rasi_chart(asc_idx: usize, planets: &[PlanetData]) -> HashMap<String, HouseData> {
    let mut chart = HashMap::new();
    for house in 1..=12 {
        let sign = SIGNS[(asc_idx + house - 1) % 12].to_string();
        let house_planets = planets
            .iter()
            .filter(|planet| planet.house == house as u8)
            .cloned()
            .collect();
        chart.insert(
            format!("house_{house}"),
            HouseData {
                sign,
                planets: house_planets,
            },
        );
    }
    chart
}

pub fn build_navamsa_chart(
    ascendant_degree: f64,
    planets: &[PlanetData],
) -> HashMap<String, NavamsaHouseData> {
    let asc_idx = sign_index(ascendant_degree);
    let nav_asc_idx = get_navamsa_sign(asc_idx, ascendant_degree % 30.0);
    let mut chart = HashMap::new();

    for house in 1..=12 {
        let sign = SIGNS[(nav_asc_idx + house - 1) % 12].to_string();
        let house_planets = planets
            .iter()
            .filter(|planet| planet.navamsa_sign == sign)
            .map(|planet| planet.name.clone())
            .collect();
        chart.insert(
            format!("house_{house}"),
            NavamsaHouseData {
                sign,
                planets: house_planets,
            },
        );
    }

    chart
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

fn is_supportive(planet: &str, sign: &str) -> bool {

    use crate::constants::{STRENGTH_CHART, MOOLATRIKONA};
    if let Some(rule) = STRENGTH_CHART.get(planet) {
        if sign == rule.exalt {
            return true;
        }
        if rule.own.iter().any(|&own| own == sign) {
            return true;
        }
    }
    if let Some((mt_sign, _, _)) = MOOLATRIKONA.get(planet) {
        if sign == *mt_sign {
            return true;
        }
    }
    false
}

pub fn calculate_vaisheshikamsa(
    planets: &[PlanetData],
    divisional_planets: &HashMap<String, Vec<VargaPlanetRow>>,
) -> HashMap<String, crate::models::VaisheshikamsaResponse> {
    let mut res = HashMap::new();

    let saptavarga_keys = ["D1", "D2", "D3", "D7", "D9", "D12", "D30"];
    let dashavarga_keys = ["D1", "D2", "D3", "D7", "D9", "D10", "D12", "D16", "D30", "D60"];
    let shodasavarga_keys = [
        "D1", "D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60",
    ];

    for p in planets {
        let name = &p.name;
        if name == "Ketu" || name == "Lagna" {
            // Shadowy nodes like Ketu and non-planet points are usually skipped in standard Vaisheshikamsa, but we can return 0
            res.insert(name.clone(), crate::models::VaisheshikamsaResponse {
                saptavarga_count: 0,
                saptavarga_grade: "None".to_string(),
                dashavarga_count: 0,
                dashavarga_grade: "None".to_string(),
                shodasavarga_count: 0,
                shodasavarga_grade: "None".to_string(),
            });
            continue;
        }

        let mut sap_count = 0;
        let mut dash_count = 0;
        let mut shod_count = 0;

        // Check Rasi D1 first
        let is_d1_supportive = is_supportive(name, &p.sign);
        if is_d1_supportive {
            sap_count += 1;
            dash_count += 1;
            shod_count += 1;
        }

        // Check other Vargas
        for (v_key, p_rows) in divisional_planets {

            if let Some(row) = p_rows.iter().find(|r| r.name == *name) {
                let is_sup = is_supportive(name, &row.sign);
                if is_sup {
                    if saptavarga_keys.contains(&v_key.as_str()) {
                        sap_count += 1;
                    }
                    if dashavarga_keys.contains(&v_key.as_str()) {
                        dash_count += 1;
                    }
                    if shodasavarga_keys.contains(&v_key.as_str()) {
                        shod_count += 1;
                    }
                }
            }
        }

        // Map grades
        let saptavarga_grade = match sap_count {
            2 => "Parijata",
            3 => "Uttama",
            4 => "Gopura",
            5 => "Simhasana",
            6 => "Paravata",
            7 => "Devaloka",
            _ => "None",
        }.to_string();

        let dashavarga_grade = match dash_count {
            2 => "Parijata",
            3 => "Uttama",
            4 => "Gopura",
            5 => "Simhasana",
            6 => "Paravata",
            7 => "Devaloka",
            8 => "Brahmalokamsa",
            9 => "Indrasana",
            10 => "Shridhama",
            _ => "None",
        }.to_string();

        let shodasavarga_grade = match shod_count {
            2 => "Bhedaka",
            3 => "Kusuma",
            4 => "Nagapushpa",
            5 => "Kanduka",
            6 => "Kerala",
            7 => "Kalpavriksha",
            8 => "Chandanavana",
            9 => "Purnachandra",
            10 => "Uchchaisrava",
            11 => "Dhanvantari",
            12 => "Suryakanta",
            13 => "Vidruma",
            14 => "Indrasana",
            15 => "Goloka",
            16 => "Shrivallabha",
            _ => "None",
        }.to_string();

        res.insert(name.clone(), crate::models::VaisheshikamsaResponse {
            saptavarga_count: sap_count,
            saptavarga_grade,
            dashavarga_count: dash_count,
            dashavarga_grade,
            shodasavarga_count: shod_count,
            shodasavarga_grade,
        });
    }

    res
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_drekkana_d3() {
        assert_eq!(get_varga_sign(3, 1, 12.0), 5);
    }

    #[test]
    fn test_navamsa_d9() {
        assert_eq!(get_varga_sign(9, 3, 19.0), 8);
    }
}
