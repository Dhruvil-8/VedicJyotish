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
}
