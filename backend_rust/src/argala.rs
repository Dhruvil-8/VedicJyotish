//! Jaimini Argala & Virodhargala Solver.
//!
//! Calculates planetary interventions (Argala) and obstructions (Virodhargala)
//! for all 12 houses and 9 planets.

use std::collections::HashMap;
use crate::models::{ArgalaResponse, HouseArgalaDetails, PlanetArgalaDetails, ArgalaContributor, PlanetData};

fn is_malefic_planet(name: &str) -> bool {
    matches!(name, "Mars" | "Saturn" | "Rahu" | "Ketu")
}

/// Helper to get house position at a specific distance from a reference house
fn get_house_at_distance(ref_house: u8, dist: u8, reverse: bool) -> u8 {
    let r = ref_house as i16;
    let d = dist as i16;
    if !reverse {
        (((r + d - 1 - 1).rem_euclid(12)) + 1) as u8
    } else {
        (((r - d + 1 + 12 - 1).rem_euclid(12)) + 1) as u8
    }
}

pub fn calculate_argala(
    planets: &[PlanetData],
) -> ArgalaResponse {

    let mut house_argalas = HashMap::new();
    let mut planet_argalas = HashMap::new();

    // Map house index (1-12) to list of planets occupied in that house
    let mut house_to_planets: HashMap<u8, Vec<&PlanetData>> = HashMap::new();
    for h in 1..=12 {
        house_to_planets.insert(h, Vec::new());
    }
    for p in planets {
        house_to_planets.entry(p.house).or_insert(Vec::new()).push(p);
    }

    // ─── Helper Solver function ───
    let solve_argala = |ref_house: u8, ref_name: &str| -> (Vec<ArgalaContributor>, Vec<ArgalaContributor>, String) {
        let is_ketu = ref_name == "Ketu";
        
        let mut argala_contributors = Vec::new();
        let mut virodhargala_contributors = Vec::new();

        // 1. Primary Argala mapping (2nd, 4th, 5th, 11th)
        let primary_pairs = [(2, 12), (4, 10), (5, 9), (11, 3)];
        for &(arg_dist, vir_dist) in &primary_pairs {
            let arg_house = get_house_at_distance(ref_house, arg_dist, is_ketu);
            let vir_house = get_house_at_distance(ref_house, vir_dist, is_ketu);

            // Fetch planets in Argala house
            if let Some(occ_planets) = house_to_planets.get(&arg_house) {
                for p in occ_planets {
                    argala_contributors.push(ArgalaContributor {
                        planet_name: p.name.clone(),
                        sign: p.sign.clone(),
                        house: p.house,
                        argala_house: arg_dist,
                        is_malefic: is_malefic_planet(&p.name),
                    });
                }
            }

            // Fetch planets in Virodhargala house (if not empty)
            if let Some(occ_planets) = house_to_planets.get(&vir_house) {
                for p in occ_planets {
                    // Exception: Planets in the 12th house do not cause Virodhargala if they are alone, but we apply standard whole sign rules
                    virodhargala_contributors.push(ArgalaContributor {
                        planet_name: p.name.clone(),
                        sign: p.sign.clone(),
                        house: p.house,
                        argala_house: vir_dist,
                        is_malefic: is_malefic_planet(&p.name),
                    });
                }
            }
        }

        // 2. Special Malefic Argala (3rd house malefic Argala, obstructed by 11th house)
        let arg_house_3 = get_house_at_distance(ref_house, 3, is_ketu);
        let vir_house_11 = get_house_at_distance(ref_house, 11, is_ketu);
        if let Some(occ_planets) = house_to_planets.get(&arg_house_3) {
            for p in occ_planets {
                if is_malefic_planet(&p.name) {
                    argala_contributors.push(ArgalaContributor {
                        planet_name: p.name.clone(),
                        sign: p.sign.clone(),
                        house: p.house,
                        argala_house: 3,
                        is_malefic: true,
                    });
                }
            }
        }
        let has_malefic_in_3rd = house_to_planets
            .get(&arg_house_3)
            .map(|ps| ps.iter().any(|p| is_malefic_planet(&p.name)))
            .unwrap_or(false);

        if has_malefic_in_3rd {
            if let Some(occ_planets) = house_to_planets.get(&vir_house_11) {
                for p in occ_planets {
                    // If there are malefics in the 3rd, any planet in the 11th can obstruct it
                    virodhargala_contributors.push(ArgalaContributor {
                        planet_name: p.name.clone(),
                        sign: p.sign.clone(),
                        house: p.house,
                        argala_house: 11,
                        is_malefic: is_malefic_planet(&p.name),
                    });
                }
            }
        }

        // 3. Compute net status
        let arg_strength = argala_contributors.len();
        let vir_strength = virodhargala_contributors.len();
        
        let net_argala_status = if arg_strength == 0 {
            "None".to_string()
        } else if vir_strength == 0 {
            "Clear".to_string()
        } else if arg_strength > vir_strength {
            "Beneficial".to_string()
        } else {
            "Obstructed".to_string()
        };

        (argala_contributors, virodhargala_contributors, net_argala_status)
    };

    // Calculate house argalas
    for h in 1..=12 {
        let (arg, vir, status) = solve_argala(h, "");
        house_argalas.insert(h, HouseArgalaDetails {
            argala_contributors: arg,
            virodhargala_contributors: vir,
            net_argala_status: status,
        });
    }

    // Calculate planet argalas
    for p in planets {
        let (arg, vir, status) = solve_argala(p.house, &p.name);
        planet_argalas.insert(p.name.clone(), PlanetArgalaDetails {
            argala_contributors: arg,
            virodhargala_contributors: vir,
            net_argala_status: status,
        });
    }

    ArgalaResponse {
        house_argalas,
        planet_argalas,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_planet(name: &str, house: u8, full_degree: f64) -> PlanetData {
        PlanetData {
            name: name.to_string(),
            sign: "Taurus".to_string(),
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
    fn test_house_distance() {
        // Direct
        assert_eq!(get_house_at_distance(1, 2, false), 2);
        assert_eq!(get_house_at_distance(1, 12, false), 12);
        assert_eq!(get_house_at_distance(12, 2, false), 1);

        // Reverse (for Ketu)
        assert_eq!(get_house_at_distance(1, 2, true), 12);
        assert_eq!(get_house_at_distance(1, 12, true), 2);
    }

    #[test]
    fn test_conditional_virodhargala() {
        let mercury = create_test_planet("Mercury", 11, 300.0);
        
        // Scenario 1: Only Mercury in 11th (no malefics in 3rd).
        // Virodhargala from 11th should be empty for House 1 because there is no 3rd house malefic argala to obstruct.
        let res1 = calculate_argala(&[mercury.clone()]);
        let house_1 = res1.house_argalas.get(&1).unwrap();
        assert_eq!(house_1.virodhargala_contributors.len(), 0);

        // Scenario 2: Mercury in 11th + Mars (malefic) in 3rd.
        // Now virodhargala from 11th should be present.
        let mars = create_test_planet("Mars", 3, 60.0);
        let res2 = calculate_argala(&[mercury.clone(), mars.clone()]);
        let house_1_new = res2.house_argalas.get(&1).unwrap();
        
        assert_eq!(house_1_new.argala_contributors.len(), 2);
        let names: Vec<&str> = house_1_new.argala_contributors.iter().map(|c| c.planet_name.as_str()).collect();
        assert!(names.contains(&"Mars"));
        assert!(names.contains(&"Mercury"));
        
        assert_eq!(house_1_new.virodhargala_contributors.len(), 2);
        let vir_names: Vec<&str> = house_1_new.virodhargala_contributors.iter().map(|c| c.planet_name.as_str()).collect();
        assert!(vir_names.contains(&"Mars"));
        assert!(vir_names.contains(&"Mercury"));
    }
}
