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

    // Determine occupied signs for the 7 classical planets and Lagna
    let mut occupied = [false; 12];
    for &pos in positions {
        occupied[pos] = true;
    }

    // Classical Reductions: Trikona Shodhana and Ekadhipatya Shodhana
    let mut trikona_shodhana_map = HashMap::new();
    let mut ekadhipatya_shodhana_map = HashMap::new();
    let mut ekadhipatya_rows = Vec::new();

    for p_idx in 0..7 {
        let p_name = planets[p_idx].to_string();
        let bav_row = bhinnashtakavarga.get(&p_name).unwrap();

        let trikona_row = trikona_shodhana_for_row(bav_row);
        let ekadhipatya_row = ekadhipatya_shodhana_for_row(&trikona_row, &occupied);

        trikona_shodhana_map.insert(p_name.clone(), trikona_row);
        ekadhipatya_shodhana_map.insert(p_name.clone(), ekadhipatya_row.clone());
        ekadhipatya_rows.push((p_name, ekadhipatya_row));
    }

    let shodhya_pinda = compute_shodhya_pinda(&ekadhipatya_rows, positions);

    AshtakavargaResponse {
        bhinnashtakavarga,
        sarvashtakavarga,
        trikona_shodhana: Some(trikona_shodhana_map),
        ekadhipatya_shodhana: Some(ekadhipatya_shodhana_map),
        shodhya_pinda: Some(shodhya_pinda),
    }
}

pub fn trikona_shodhana_for_row(row: &[u8]) -> Vec<u8> {
    let mut res = row.to_vec();
    for r in 0..4 {
        let i1 = r;
        let i2 = r + 4;
        let i3 = r + 8;
        if res[i1] == 0 || res[i2] == 0 || res[i3] == 0 {
            continue;
        }
        let min_val = res[i1].min(res[i2]).min(res[i3]);
        res[i1] -= min_val;
        res[i2] -= min_val;
        res[i3] -= min_val;
    }
    res
}

pub fn ekadhipatya_shodhana_for_row(row: &[u8], occupied: &[bool; 12]) -> Vec<u8> {
    let mut res = row.to_vec();
    // Dual owned sign pairs:
    // Mars: 0 (Aries), 7 (Scorpio)
    // Venus: 1 (Taurus), 6 (Libra)
    // Mercury: 2 (Gemini), 5 (Virgo)
    // Jupiter: 8 (Sagittarius), 11 (Pisces)
    // Saturn: 9 (Capricorn), 10 (Aquarius)
    let dual_pairs = [(0, 7), (1, 6), (2, 5), (8, 11), (9, 10)];
    for &(r1, r2) in &dual_pairs {
        let r1_occ = occupied[r1];
        let r2_occ = occupied[r2];

        // Rule 1: If either sign has zero points, or both are occupied, no reduction
        if res[r1] == 0 || res[r2] == 0 || (r1_occ && r2_occ) {
            continue;
        }

        // Rule 2: Both signs unoccupied
        if !r1_occ && !r2_occ {
            if res[r1] != res[r2] {
                let min_val = res[r1].min(res[r2]);
                res[r1] = min_val;
                res[r2] = min_val;
            } else {
                res[r1] = 0;
                res[r2] = 0;
            }
        } else if r1_occ {
            // r1 is occupied, r2 is empty
            if res[r2] <= res[r1] {
                res[r2] = 0;
            } else {
                res[r2] = res[r1];
            }
        } else {
            // r2 is occupied, r1 is empty
            if res[r1] <= res[r2] {
                res[r1] = 0;
            } else {
                res[r1] = res[r2];
            }
        }
    }
    res
}

const RASIMANA_MULTIPLIERS: [u32; 12] = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];
const GRAHAMANA_MULTIPLIERS: [u32; 7] = [5, 5, 8, 5, 10, 7, 5];

pub fn compute_shodhya_pinda(
    ekadhipatya_rows: &[(String, Vec<u8>)],
    positions: &[usize; 8],
) -> crate::models::ShodhyaPindaResponse {
    let mut rasi_pinda = HashMap::new();
    let mut graha_pinda = HashMap::new();
    let mut shodhaya_pinda = HashMap::new();

    for (planet_name, row) in ekadhipatya_rows {
        let r_pinda: u32 = row
            .iter()
            .enumerate()
            .map(|(r, &val)| val as u32 * RASIMANA_MULTIPLIERS[r])
            .sum();

        let mut g_pinda: u32 = 0;
        for p in 0..7 {
            let occ_sign = positions[p];
            g_pinda += row[occ_sign] as u32 * GRAHAMANA_MULTIPLIERS[p];
        }

        let s_pinda = r_pinda + g_pinda;
        rasi_pinda.insert(planet_name.clone(), r_pinda);
        graha_pinda.insert(planet_name.clone(), g_pinda);
        shodhaya_pinda.insert(planet_name.clone(), s_pinda);
    }

    crate::models::ShodhyaPindaResponse {
        rasi_pinda,
        graha_pinda,
        shodhaya_pinda,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ashtakavarga_with_pvr_chart_7() {
        // From standard test case Chart 7:
        // Mesham (0): Moon, Saturn
        // Rishabam (1) to Kanni (5): Empty
        // Thulaam (6): Jupiter
        // Vrichigam (7): Lagna
        // Dhanusu (8): Mars, Mercury
        // Makaram (9): Sun
        // Kumbam (10): Venus
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

        // Verification of Trikona Shodhana and Ekadhipatya Shodhana
        let trikona = result.trikona_shodhana.as_ref().unwrap();
        assert_eq!(trikona.get("Sun").unwrap(), &vec![2, 0, 0, 2, 4, 3, 2, 1, 0, 4, 3, 0]);
        assert_eq!(trikona.get("Moon").unwrap(), &vec![3, 0, 1, 1, 2, 2, 2, 1, 0, 1, 0, 0]);

        let ekadhipatya = result.ekadhipatya_shodhana.as_ref().unwrap();
        assert_eq!(ekadhipatya.get("Sun").unwrap(), &vec![2, 0, 0, 2, 4, 3, 2, 1, 0, 4, 3, 0]);
        assert_eq!(ekadhipatya.get("Moon").unwrap(), &vec![3, 0, 1, 1, 2, 1, 2, 1, 0, 1, 0, 0]);

        // Verification of Shodhaya Pindas
        let sp = result.shodhya_pinda.as_ref().unwrap();
        assert_eq!(*sp.shodhaya_pinda.get("Sun").unwrap(), 233);
        assert_eq!(*sp.shodhaya_pinda.get("Moon").unwrap(), 140);
        assert_eq!(*sp.shodhaya_pinda.get("Mars").unwrap(), 95);
        assert_eq!(*sp.shodhaya_pinda.get("Mercury").unwrap(), 128);
        assert_eq!(*sp.shodhaya_pinda.get("Jupiter").unwrap(), 124);
        assert_eq!(*sp.shodhaya_pinda.get("Venus").unwrap(), 208);
        assert_eq!(*sp.shodhaya_pinda.get("Saturn").unwrap(), 225);
    }
}
