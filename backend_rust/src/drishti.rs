use crate::models::{PlanetData, DrishtiResponse, PlanetDrishti, SignDrishti};
use crate::constants::SIGNS;
use crate::chart::sign_index;
use std::collections::HashMap;

/// Calculates both Graha Drishti (Planetary aspects) and Jaimini Rasi Drishti (Sign aspects)
/// for a given set of planets and ascendant sign index.
pub fn calculate_drishti(ascendant_sign_idx: usize, planets: &[PlanetData]) -> DrishtiResponse {
    let mut graha_drishti = HashMap::new();
    let mut rasi_drishti = HashMap::new();

    // Map sign name to list of planets occupied in that sign
    let mut sign_to_planets: HashMap<String, Vec<String>> = HashMap::new();
    for s in SIGNS.iter() {
        sign_to_planets.insert(s.to_string(), Vec::new());
    }
    
    // Track occupied signs and house positions from Lagna
    let mut planet_to_sign_idx = HashMap::new();
    for p in planets {
        let s_idx = sign_index(p.full_degree);
        planet_to_sign_idx.insert(p.name.clone(), s_idx);
        let s_name = SIGNS[s_idx].to_string();
        sign_to_planets.entry(s_name).or_insert(Vec::new()).push(p.name.clone());
    }

    // ─── 1. Graha Drishti (Planetary Aspects) ───
    // Sub-aspect mappings relative houses:
    // Sun, Moon, Mercury, Venus, Rahu, Ketu aspect 7
    // Mars aspects 4, 7, 8
    // Jupiter aspects 5, 7, 9
    // Saturn aspects 3, 7, 10
    let relative_aspects = |name: &str| -> Vec<usize> {
        match name {
            "Mars" => vec![4, 7, 8],
            "Jupiter" => vec![5, 7, 9],
            "Saturn" => vec![3, 7, 10],
            "Sun" | "Moon" | "Mercury" | "Venus" | "Rahu" | "Ketu" => vec![7],
            _ => vec![], // Non-classical planets aspect nothing classically
        }
    };

    for p in planets {
        if p.name == "Lagna" { continue; }
        
        let p_sign_idx = sign_index(p.full_degree);
        let relative_houses = relative_aspects(&p.name);
        
        let mut aspected_signs = Vec::new();
        let mut aspected_houses = Vec::new();
        let mut aspected_planets = Vec::new();
        
        for &rel_house in &relative_houses {
            // rel_house is 1-indexed relative house (e.g. 7th house is 7)
            let target_sign_idx = (p_sign_idx + rel_house - 1) % 12;
            let target_sign_name = SIGNS[target_sign_idx].to_string();
            aspected_signs.push(target_sign_name.clone());
            
            // House position from ascendant (whole sign)
            let house_from_lagna = ((target_sign_idx + 12 - ascendant_sign_idx) % 12 + 1) as u8;
            aspected_houses.push(house_from_lagna);
            
            if let Some(occ_planets) = sign_to_planets.get(&target_sign_name) {
                aspected_planets.extend(occ_planets.clone());
            }
        }
        
        graha_drishti.insert(p.name.clone(), PlanetDrishti {
            aspected_signs,
            aspected_houses,
            aspected_planets,
        });
    }

    // ─── 2. Jaimini Rasi Drishti (Sign Aspects) ───
    // Rules:
    // Movable signs aspect fixed signs except adjacent.
    // Fixed signs aspect movable signs except adjacent.
    // Dual signs aspect all other dual signs.
    let get_aspected_signs = |sign_idx: usize| -> Vec<usize> {
        let movable = [0, 3, 6, 9];   // Aries, Cancer, Libra, Capricorn
        let fixed = [1, 4, 7, 10];    // Taurus, Leo, Scorpio, Aquarius
        let dual = [2, 5, 8, 11];     // Gemini, Virgo, Sagittarius, Pisces

        if movable.contains(&sign_idx) {
            // Movable aspect fixed signs EXCEPT adjacent (i.e. +1 or -1)
            fixed.iter().copied().filter(|&f| f != (sign_idx + 1) % 12 && f != (sign_idx + 11) % 12).collect()
        } else if fixed.contains(&sign_idx) {
            // Fixed aspect movable signs EXCEPT adjacent
            movable.iter().copied().filter(|&m| m != (sign_idx + 1) % 12 && m != (sign_idx + 11) % 12).collect()
        } else {
            // Dual aspect other three dual signs
            dual.iter().copied().filter(|&d| d != sign_idx).collect()
        }
    };

    for sign_idx in 0..12 {
        let sign_name = SIGNS[sign_idx].to_string();
        let target_sign_indices = get_aspected_signs(sign_idx);
        
        let mut aspected_signs_names = Vec::new();
        let mut aspected_planets_names = Vec::new();
        
        for &t_sign_idx in &target_sign_indices {
            let t_sign_name = SIGNS[t_sign_idx].to_string();
            aspected_signs_names.push(t_sign_name.clone());
            
            if let Some(occ_planets) = sign_to_planets.get(&t_sign_name) {
                aspected_planets_names.extend(occ_planets.clone());
            }
        }
        
        rasi_drishti.insert(sign_name, SignDrishti {
            aspected_signs: aspected_signs_names,
            aspected_planets: aspected_planets_names,
        });
    }

    DrishtiResponse {
        graha_drishti,
        rasi_drishti,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graha_drishti_classical() {
        let planets = vec![
            PlanetData {
                name: "Sun".to_string(),
                sign: "Taurus".to_string(),
                house: 1,
                strength: "Neutral".to_string(),
                nature: "Functional Benefic".to_string(),
                nakshatra: "Krittika".to_string(),
                nakshatra_lord: "Sun".to_string(),
                nakshatra_pada: 1,
                full_degree: 35.0, // Taurus (sign 1)
                deg_in_sign: 5.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Capricorn".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
            },
            PlanetData {
                name: "Mars".to_string(),
                sign: "Cancer".to_string(),
                house: 3,
                strength: "Debilitated".to_string(),
                nature: "Functional Malefic".to_string(),
                nakshatra: "Pushya".to_string(),
                nakshatra_lord: "Saturn".to_string(),
                nakshatra_pada: 1,
                full_degree: 95.0, // Cancer (sign 3)
                deg_in_sign: 5.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Aries".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
            },
        ];

        let res = calculate_drishti(1, &planets); // Lagna is Taurus (sign 1)
        
        // Sun is in Taurus (sign 1) -> aspects Scorpio (sign 7) relative house 7
        let sun_drishti = res.graha_drishti.get("Sun").unwrap();
        assert_eq!(sun_drishti.aspected_signs, vec!["Scorpio"]);
        assert_eq!(sun_drishti.aspected_houses, vec![7]);

        // Mars is in Cancer (sign 3) -> aspects Libra (rel 4 -> 3+4-1=6), Capricorn (rel 7 -> 3+7-1=9), Aquarius (rel 8 -> 3+8-1=10)
        let mars_drishti = res.graha_drishti.get("Mars").unwrap();
        assert_eq!(mars_drishti.aspected_signs, vec!["Libra", "Capricorn", "Aquarius"]);
    }

    #[test]
    fn test_rasi_drishti_classical() {
        let planets = vec![
            PlanetData {
                name: "Moon".to_string(),
                sign: "Leo".to_string(),
                house: 1,
                strength: "Neutral".to_string(),
                nature: "Benefic".to_string(),
                nakshatra: "Magha".to_string(),
                nakshatra_lord: "Ketu".to_string(),
                nakshatra_pada: 1,
                full_degree: 125.0, // Leo (sign 4)
                deg_in_sign: 5.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Aries".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
            },
        ];

        let res = calculate_drishti(4, &planets); // Lagna is Leo (sign 4)
        
        // Leo is fixed (4). Movable signs are [0, 3, 6, 9] (Aries, Cancer, Libra, Capricorn).
        // Adjacent movable signs to Leo (4) is Cancer (3).
        // So Leo aspects Movable signs EXCEPT Cancer (3).
        // Movable signs to aspect: Aries (0), Libra (6), Capricorn (9).
        let leo_drishti = res.rasi_drishti.get("Leo").unwrap();
        assert_eq!(leo_drishti.aspected_signs, vec!["Aries", "Libra", "Capricorn"]);
    }
}
