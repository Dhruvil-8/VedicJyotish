use std::collections::HashMap;
use crate::models::AshtakavargaResponse;

// The 8 classical contributors in Ashtakavarga relative placement rules.
// First dimension: Planet being evaluated (0 = Sun, 1 = Moon, 2 = Mars, 3 = Mercury, 4 = Jupiter, 5 = Venus, 6 = Saturn, 7 = Lagna)
// Second dimension: Contributor planet (0 = Sun, 1 = Moon, 2 = Mars, 3 = Mercury, 4 = Jupiter, 5 = Venus, 6 = Saturn, 7 = Lagna)
// Inside: The relative house numbers (1-indexed, representing relative houses from the contributor planet)

const SUN_RULES: [&[u8]; 8] = [
    &[1, 2, 4, 7, 8, 9, 10, 11],
    &[3, 6, 10, 11],
    &[1, 2, 4, 7, 8, 9, 10, 11],
    &[3, 5, 6, 9, 10, 11, 12],
    &[5, 6, 9, 11],
    &[6, 7, 12],
    &[1, 2, 4, 7, 8, 9, 10, 11],
    &[3, 4, 6, 10, 11, 12],
];

const MOON_RULES: [&[u8]; 8] = [
    &[3, 6, 7, 8, 10, 11],
    &[1, 3, 6, 7, 9, 10, 11],
    &[2, 3, 5, 6, 10, 11],
    &[1, 3, 4, 5, 7, 8, 10, 11],
    &[1, 2, 4, 7, 8, 10, 11],
    &[3, 4, 5, 7, 9, 10, 11],
    &[3, 5, 6, 11],
    &[3, 6, 10, 11],
];

const MARS_RULES: [&[u8]; 8] = [
    &[3, 5, 6, 10, 11],
    &[3, 6, 11],
    &[1, 2, 4, 7, 8, 10, 11],
    &[3, 5, 6, 11],
    &[6, 10, 11, 12],
    &[6, 8, 11, 12],
    &[1, 4, 7, 8, 9, 10, 11],
    &[1, 3, 6, 10, 11],
];

const MERCURY_RULES: [&[u8]; 8] = [
    &[5, 6, 9, 11, 12],
    &[2, 4, 6, 8, 10, 11],
    &[1, 2, 4, 7, 8, 9, 10, 11],
    &[1, 3, 5, 6, 9, 10, 11, 12],
    &[6, 8, 11, 12],
    &[1, 2, 3, 4, 5, 8, 9, 11],
    &[1, 2, 4, 7, 8, 9, 10, 11],
    &[1, 2, 4, 6, 8, 10, 11],
];

const JUPITER_RULES: [&[u8]; 8] = [
    &[1, 2, 3, 4, 7, 8, 9, 10, 11],
    &[2, 5, 7, 9, 11],
    &[1, 2, 4, 7, 8, 10, 11],
    &[1, 2, 4, 5, 6, 9, 10, 11],
    &[1, 2, 3, 4, 7, 8, 10, 11],
    &[2, 5, 6, 9, 10, 11],
    &[3, 5, 6, 12],
    &[1, 2, 4, 5, 6, 7, 9, 10, 11],
];

const VENUS_RULES: [&[u8]; 8] = [
    &[8, 11, 12],
    &[1, 2, 3, 4, 5, 8, 9, 11, 12],
    &[3, 4, 6, 9, 11, 12],
    &[3, 5, 6, 9, 11],
    &[5, 8, 9, 10, 11],
    &[1, 2, 3, 4, 5, 8, 9, 10, 11],
    &[3, 4, 5, 8, 9, 10, 11],
    &[1, 2, 3, 4, 5, 8, 9, 11],
];

const SATURN_RULES: [&[u8]; 8] = [
    &[1, 2, 4, 7, 8, 10, 11],
    &[3, 6, 11],
    &[3, 5, 6, 10, 11, 12],
    &[6, 8, 9, 10, 11, 12],
    &[5, 6, 11, 12],
    &[6, 11, 12],
    &[3, 5, 6, 11],
    &[1, 3, 4, 6, 10, 11],
];

const LAGNA_RULES: [&[u8]; 8] = [
    &[3, 4, 6, 10, 11, 12],
    &[3, 6, 10, 11, 12],
    &[1, 3, 6, 10, 11],
    &[1, 2, 4, 6, 8, 10, 11],
    &[1, 2, 4, 5, 6, 7, 9, 10, 11],
    &[1, 2, 3, 4, 5, 8, 9],
    &[1, 3, 4, 6, 10, 11],
    &[3, 6, 10, 11],
];

/// Computes the Bhinnashtakavarga (BAV) for the 7 classical planets and the Lagna,
/// along with the collective Sarvashtakavarga (SAV) points.
///
/// `positions` is an array representing the 0-indexed sign positions (Aries=0, Pisces=11)
/// of the planets/Lagna in the following order:
/// [Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Lagna]
pub fn calculate(positions: &[usize; 8]) -> AshtakavargaResponse {
    let mut bhinnashtakavarga = HashMap::new();
    let mut sarvashtakavarga = vec![0; 12];

    let planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"];
    let all_rules = [
        SUN_RULES,
        MOON_RULES,
        MARS_RULES,
        MERCURY_RULES,
        JUPITER_RULES,
        VENUS_RULES,
        SATURN_RULES,
        LAGNA_RULES,
    ];

    for p_idx in 0..8 {
        let mut rasi_scores = vec![0; 12];
        let planet_rules = all_rules[p_idx];

        for op_idx in 0..8 {
            let pr = positions[op_idx]; // 0-indexed sign position of contributor planet
            let other_planet_rules = planet_rules[op_idx];

            for &relative_house in other_planet_rules {
                let target_sign = (relative_house as usize - 1 + pr) % 12;
                rasi_scores[target_sign] += 1;
            }
        }

        bhinnashtakavarga.insert(planets[p_idx].to_string(), rasi_scores.clone());

        // Sum classical planets BAVs (indices 0..6) to form the SAV
        if p_idx < 7 {
            for r in 0..12 {
                sarvashtakavarga[r] += rasi_scores[r];
            }
        }
    }

    AshtakavargaResponse {
        bhinnashtakavarga,
        sarvashtakavarga,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ashtakavarga_with_pvr_chart_7() {
        // From PyJHora test case Chart 7:
        // Mesham (0): Mars, Moon, Saturn
        // Rishabam (1) to Kanni (5): Empty
        // Thulaam (6): Rahu, Jupiter
        // Vrichigam (7): Lagna
        // Dhanusu (8): Mercury, Venus
        // Makaram (9): Sun
        // Kumbam (10): Ketu
        // Meenam (11): Empty
        
        let positions = [
            9,  // Sun (Capricorn = 9)
            0,  // Moon (Aries = 0)
            8,  // Mars (Sagittarius = 8)
            8,  // Mercury (Sagittarius = 8)
            6,  // Jupiter (Libra = 6)
            10, // Venus (Aquarius = 10)
            0,  // Saturn (Aries = 0)
            7,  // Lagna (Scorpio = 7)
        ];

        let result = calculate(&positions);

        // Verification of BAV (Bhinnashtakavarga) for each planet
        let sun_bav = result.bhinnashtakavarga.get("Sun").unwrap();
        assert_eq!(sun_bav, &vec![4, 2, 3, 4, 6, 5, 5, 3, 2, 6, 6, 2]);

        let moon_bav = result.bhinnashtakavarga.get("Moon").unwrap();
        assert_eq!(moon_bav, &vec![6, 3, 5, 3, 5, 5, 6, 3, 3, 4, 4, 2]);

        let mars_bav = result.bhinnashtakavarga.get("Mars").unwrap();
        assert_eq!(mars_bav, &vec![3, 2, 3, 4, 2, 5, 4, 3, 3, 4, 3, 3]);

        let merc_bav = result.bhinnashtakavarga.get("Mercury").unwrap();
        assert_eq!(merc_bav, &vec![4, 6, 4, 3, 4, 7, 4, 5, 6, 3, 5, 3]);

        let jup_bav = result.bhinnashtakavarga.get("Jupiter").unwrap();
        assert_eq!(jup_bav, &vec![4, 4, 3, 5, 6, 5, 6, 4, 6, 4, 3, 6]);

        let ven_bav = result.bhinnashtakavarga.get("Venus").unwrap();
        assert_eq!(ven_bav, &vec![3, 5, 5, 4, 6, 2, 3, 6, 5, 2, 7, 4]);

        let sat_bav = result.bhinnashtakavarga.get("Saturn").unwrap();
        assert_eq!(sat_bav, &vec![3, 2, 2, 3, 5, 6, 3, 4, 1, 3, 6, 1]);

        // Verification of SAV (Sarvashtakavarga) values
        let expected_sav = vec![27, 24, 25, 26, 34, 35, 31, 28, 26, 26, 34, 21];
        assert_eq!(&result.sarvashtakavarga, &expected_sav);

        // Verification of total SAV points (must be exactly 337)
        let total_sav_points: u32 = result.sarvashtakavarga.iter().map(|&x| x as u32).sum();
        assert_eq!(total_sav_points, 337);
    }
}
