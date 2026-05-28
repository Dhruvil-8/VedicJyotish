use crate::models::{
    DoshaResponse, GandaMoolaResult, GuruChandalaResult, KalaSarpaResult, ManglikResult, PitruResult,
};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct DoshaInputPlanet {
    pub name: String,
    pub sign_idx: usize,   // 0 = Aries, 11 = Pisces
    pub house: u8,         // 1-indexed relative to Lagna (1 = Lagna, 12 = 12th house)
    pub deg_in_sign: f64,  // 0.0 to 30.0
    pub retrograde: bool,
    pub combust: bool,
}

/// Evaluates if all classical planets (Sun through Saturn) are hemmed between the Rahu and Ketu axis.
pub fn calculate_kala_sarpa(p_houses: &HashMap<String, u8>) -> KalaSarpaResult {
    let Some(&rahu_h) = p_houses.get("Rahu") else {
        return KalaSarpaResult { has_dosha: false, type_index: None };
    };
    let Some(&ketu_h) = p_houses.get("Ketu") else {
        return KalaSarpaResult { has_dosha: false, type_index: None };
    };

    let classical = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

    // A: 7 houses starting from Rahu house (inclusive, modulo 12)
    // Relative house numbers in 1-based format (1..12). Let's convert to 0..11 for math.
    let r_0 = rahu_h as usize - 1;
    let k_0 = ketu_h as usize - 1;

    let kpdc1 = classical.iter().all(|&name| {
        if let Some(&h) = p_houses.get(name) {
            let h_0 = h as usize - 1;
            (0..7).any(|rkh| h_0 == (r_0 + rkh) % 12)
        } else {
            false
        }
    });

    let kpdc2 = classical.iter().all(|&name| {
        if let Some(&h) = p_houses.get(name) {
            let h_0 = h as usize - 1;
            (0..7).any(|rkh| h_0 == (k_0 + rkh) % 12)
        } else {
            false
        }
    });

    let has_dosha = kpdc1 || kpdc2;
    let type_index = if has_dosha { Some(rahu_h) } else { None };

    KalaSarpaResult {
        has_dosha,
        type_index,
    }
}

/// Evaluates Manglik (Kuja) Dosha from a reference planet's house (1..12).
/// Standard Manglik houses are 1st, 2nd, 4th, 7th, 8th, and 12th from the reference.
pub fn calculate_manglik(
    planets: &[DoshaInputPlanet],
    p_houses: &HashMap<String, u8>,
    ref_planet: &str,
    asc_sign_idx: usize,
) -> ManglikResult {
    let Some(&ref_house) = p_houses.get(ref_planet) else {
        return ManglikResult { has_dosha: false, has_exceptions: false, exceptions_triggered: vec![] };
    };
    let Some(&mars_house) = p_houses.get("Mars") else {
        return ManglikResult { has_dosha: false, has_exceptions: false, exceptions_triggered: vec![] };
    };

    // Calculate Mars house position relative to reference (1-indexed relative house 1..12)
    // e.g. ref_house = 4, mars_house = 4 -> relative = 1
    // ref_house = 12, mars_house = 1 -> relative = 2
    let relative_mars = ((mars_house as i16 - ref_house as i16).rem_euclid(12) + 1) as u8;

    let manglik_houses = [1, 2, 4, 7, 8, 12];
    let is_base_manglik = manglik_houses.contains(&relative_mars);

    if !is_base_manglik {
        return ManglikResult {
            has_dosha: false,
            has_exceptions: false,
            exceptions_triggered: vec![],
        };
    }

    // Evaluate BV Raman exceptions
    let mars = planets.iter().find(|p| p.name == "Mars").unwrap();
    let jup = planets.iter().find(|p| p.name == "Jupiter");
    let sat = planets.iter().find(|p| p.name == "Saturn");
    let moon = planets.iter().find(|p| p.name == "Moon");
    let ven = planets.iter().find(|p| p.name == "Venus");

    let mut exceptions = vec![];

    // Exception 1: Mars in Leo (4) or Aquarius (10) signs
    if mars.sign_idx == 4 || mars.sign_idx == 10 {
        exceptions.push(1);
    }

    // Exception 2: Mars in 2nd relative house in Gemini (2) or Virgo (5)
    if relative_mars == 2 && (mars.sign_idx == 2 || mars.sign_idx == 5) {
        exceptions.push(2);
    }

    // Exception 3: Mars in 4th relative house in Aries (0) or Scorpio (7)
    if relative_mars == 4 && (mars.sign_idx == 0 || mars.sign_idx == 7) {
        exceptions.push(3);
    }

    // Exception 4: Mars in 7th relative house in Cancer (3) or Capricorn (9)
    if relative_mars == 7 && (mars.sign_idx == 3 || mars.sign_idx == 9) {
        exceptions.push(4);
    }

    // Exception 5: Mars in 8th relative house in Sagittarius (8) or Pisces (11)
    if relative_mars == 8 && (mars.sign_idx == 8 || mars.sign_idx == 11) {
        exceptions.push(5);
    }

    // Exception 6: Mars in 12th relative house in Taurus (1) or Libra (6)
    if relative_mars == 12 && (mars.sign_idx == 1 || mars.sign_idx == 6) {
        exceptions.push(6);
    }

    // Exception 7: Mars conjoined or aspected by Jupiter or Saturn
    let mut aspected = false;
    if let Some(jup_p) = jup {
        if jup_p.house == mars.house {
            aspected = true;
        } else {
            // Jupiter aspects 5th, 7th, 9th houses from itself (relative 5, 7, 9)
            let rel = ((mars.house as i16 - jup_p.house as i16).rem_euclid(12) + 1) as u8;
            if [5, 7, 9].contains(&rel) {
                aspected = true;
            }
        }
    }
    if let Some(sat_p) = sat {
        if sat_p.house == mars.house {
            aspected = true;
        } else {
            // Saturn aspects 3rd, 7th, 10th houses from itself (relative 3, 7, 10)
            let rel = ((mars.house as i16 - sat_p.house as i16).rem_euclid(12) + 1) as u8;
            if [3, 7, 10].contains(&rel) {
                aspected = true;
            }
        }
    }
    if aspected {
        exceptions.push(7);
    }

    // Exception 8: Retrograde Mars
    if mars.retrograde {
        exceptions.push(8);
    }

    // Exception 9: Mars combust or in Rasi Sandhi (within 1 degree of sign boundaries)
    if mars.combust || mars.deg_in_sign < 1.0 || mars.deg_in_sign > 29.0 {
        exceptions.push(9);
    }

    // Exception 10: Mars is Lagna lord (Aries/Scorpio ascendants)
    if asc_sign_idx == 0 || asc_sign_idx == 7 {
        exceptions.push(10);
    }

    // Exception 11: Mars in own (0, 7), exalted (9), or friendly (3, 4, 8, 11) sign
    if [0, 7, 9, 3, 4, 8, 11].contains(&mars.sign_idx) {
        exceptions.push(11);
    }

    // Exception 12: Mars in movable signs (Aries=0, Cancer=3, Libra=6, Capricorn=9)
    if [0, 3, 6, 9].contains(&mars.sign_idx) {
        exceptions.push(12);
    }

    // Exception 13: Lagna is Cancer (3) or Leo (4) (Mars becomes Yogakaraka)
    if asc_sign_idx == 3 || asc_sign_idx == 4 {
        exceptions.push(13);
    }

    // Exception 14: Mars conjoined with Jupiter or Moon
    let mut conjoined_benefic = false;
    if let Some(jup_p) = jup {
        if jup_p.house == mars.house {
            conjoined_benefic = true;
        }
    }
    if let Some(moon_p) = moon {
        if moon_p.house == mars.house {
            conjoined_benefic = true;
        }
    }
    if conjoined_benefic {
        exceptions.push(14);
    }

    // Exception 15: Jupiter or Venus in Lagna (House 1)
    let mut benefic_in_lagna = false;
    if let Some(jup_p) = jup {
        if jup_p.house == 1 {
            benefic_in_lagna = true;
        }
    }
    if let Some(ven_p) = ven {
        if ven_p.house == 1 {
            benefic_in_lagna = true;
        }
    }
    if benefic_in_lagna {
        exceptions.push(15);
    }

    let has_exceptions = !exceptions.is_empty();
    let has_dosha = is_base_manglik && !has_exceptions;

    ManglikResult {
        has_dosha,
        has_exceptions,
        exceptions_triggered: exceptions,
    }
}

/// Evaluates Pitru Dosha based on standard conditions:
/// 1. Sun, Moon or Rahu in 9th house.
/// 2. Ketu in 4th house.
/// 3. Conjunctions of Sun, Moon, Rahu, or Ketu with Mars or Saturn.
/// 4. Any two of Venus, Mercury, Rahu in 2nd, 5th, 9th, or 12th.
/// 5. Sun or Moon conjoined with Rahu or Ketu.
pub fn calculate_pitru(p_houses: &HashMap<String, u8>) -> PitruResult {
    let mut rules = vec![];

    let sun_h = p_houses.get("Sun");
    let moon_h = p_houses.get("Moon");
    let rahu_h = p_houses.get("Rahu");
    let ketu_h = p_houses.get("Ketu");
    let mars_h = p_houses.get("Mars");
    let sat_h = p_houses.get("Saturn");
    let ven_h = p_houses.get("Venus");
    let mer_h = p_houses.get("Mercury");

    // Rule 1: Sun, Moon, or Rahu in 9th house
    if Some(&9) == sun_h || Some(&9) == moon_h || Some(&9) == rahu_h {
        rules.push(1);
    }

    // Rule 2: Ketu in 4th house
    if Some(&4) == ketu_h {
        rules.push(2);
    }

    // Rule 3: Sun, Moon, Rahu, Ketu afflicted by Mars or Saturn (conjoined in same house)
    let mut afflicted = false;
    for &p in &["Sun", "Moon", "Rahu", "Ketu"] {
        if let Some(&ph) = p_houses.get(p) {
            if Some(&ph) == mars_h || Some(&ph) == sat_h {
                afflicted = true;
                break;
            }
        }
    }
    if afflicted {
        rules.push(3);
    }

    // Rule 4: Venus, Mercury, Rahu (any two) in 2nd, 5th, 9th, or 12th
    let target_houses = [2, 5, 9, 12];
    let mut two_matched = false;
    for &h in &target_houses {
        let mut count = 0;
        if Some(&h) == ven_h { count += 1; }
        if Some(&h) == mer_h { count += 1; }
        if Some(&h) == rahu_h { count += 1; }
        if count >= 2 {
            two_matched = true;
            break;
        }
    }
    if two_matched {
        rules.push(4);
    }

    // Rule 5: Sun or Moon conjoined with Rahu or Ketu
    let mut conjoined_nodes = false;
    if let Some(&sh) = sun_h {
        if Some(&sh) == rahu_h || Some(&sh) == ketu_h {
            conjoined_nodes = true;
        }
    }
    if let Some(&mh) = moon_h {
        if Some(&mh) == rahu_h || Some(&mh) == ketu_h {
            conjoined_nodes = true;
        }
    }
    if conjoined_nodes {
        rules.push(5);
    }

    let has_dosha = !rules.is_empty();

    PitruResult {
        has_dosha,
        rules_triggered: rules,
    }
}

/// Evaluates Guru Chandala Dosha (Jupiter conjoined with Rahu or Ketu).
pub fn calculate_guru_chandala(
    p_houses: &HashMap<String, u8>,
    planets: &[DoshaInputPlanet],
) -> GuruChandalaResult {
    let Some(&jup_h) = p_houses.get("Jupiter") else {
        return GuruChandalaResult { has_dosha: false, jupiter_stronger: false };
    };
    let rahu_h = p_houses.get("Rahu");
    let ketu_h = p_houses.get("Ketu");

    let has_dosha = Some(&jup_h) == rahu_h || Some(&jup_h) == ketu_h;

    let mut jupiter_stronger = false;
    if has_dosha {
        if let Some(jup) = planets.iter().find(|p| p.name == "Jupiter") {
            // Jupiter is stronger if in own (8, 11), exalted (3), or moolatrikona (8) sign
            if [8, 11, 3].contains(&jup.sign_idx) {
                jupiter_stronger = true;
            }
        }
    }

    GuruChandalaResult {
        has_dosha,
        jupiter_stronger,
    }
}

/// Evaluates Kalathra Dosha (Malefic Sun, Mars, Saturn, Rahu, Ketu in 1, 2, 4, 7, 8, 12 from reference).
pub fn calculate_kalathra(p_houses: &HashMap<String, u8>, ref_planet: &str) -> bool {
    let Some(&ref_house) = p_houses.get(ref_planet) else {
        return false;
    };

    let malefics = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
    let kalathra_houses = [1, 2, 4, 7, 8, 12];

    malefics.iter().all(|&name| {
        if let Some(&h) = p_houses.get(name) {
            let relative = ((h as i16 - ref_house as i16).rem_euclid(12) + 1) as u8;
            kalathra_houses.contains(&relative)
        } else {
            false
        }
    })
}

/// Evaluates Ganda Moola Dosha (Moon placed in Ketu or Mercury ruled Nakshatras).
pub fn calculate_ganda_moola(moon_nakshatra: &str) -> GandaMoolaResult {
    let ganda_moola_stars = ["Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Moola", "Revati"];
    let has_dosha = ganda_moola_stars.contains(&moon_nakshatra);

    GandaMoolaResult {
        has_dosha,
        nakshatra_name: if has_dosha { Some(moon_nakshatra.to_string()) } else { None },
    }
}

/// Evaluates overall Doshas and builds the responsive structure.
pub fn calculate_doshas(
    planets: &[DoshaInputPlanet],
    asc_sign_idx: usize,
    moon_nakshatra: &str,
) -> DoshaResponse {
    let mut p_houses = HashMap::new();
    for p in planets {
        p_houses.insert(p.name.clone(), p.house);
    }
    // Insert Lagna as a virtual planet for house mapping
    p_houses.insert("Lagna".to_string(), 1);

    let kala_sarpa = calculate_kala_sarpa(&p_houses);
    let manglik_lagna = calculate_manglik(planets, &p_houses, "Lagna", asc_sign_idx);
    let manglik_moon = calculate_manglik(planets, &p_houses, "Moon", asc_sign_idx);
    let manglik_venus = calculate_manglik(planets, &p_houses, "Venus", asc_sign_idx);
    let pitru = calculate_pitru(&p_houses);
    let guru_chandala = calculate_guru_chandala(&p_houses, planets);
    let kalathra_lagna = calculate_kalathra(&p_houses, "Lagna");
    let kalathra_moon = calculate_kalathra(&p_houses, "Moon");
    let ganda_moola = calculate_ganda_moola(moon_nakshatra);

    let mars_h = p_houses.get("Mars");
    let sat_h = p_houses.get("Saturn");
    let rahu_h = p_houses.get("Rahu");

    let ghata = mars_h.is_some() && mars_h == sat_h;
    let shrapit = rahu_h.is_some() && rahu_h == sat_h;

    DoshaResponse {
        kala_sarpa,
        manglik_lagna,
        manglik_moon,
        manglik_venus,
        pitru,
        guru_chandala,
        kalathra_lagna,
        kalathra_moon,
        ganda_moola,
        ghata,
        shrapit,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dosha_calculations_with_chart_7() {
        // Standard coordinates setup (Aries=0, Taurus=1, ..., Capricorn=9, Aquarius=10)
        // Sun (Capricorn=9, House 3 from Scorpio Lagna)
        // Moon (Aries=0, House 6)
        // Mars (Sagittarius=8, House 2)
        // Mercury (Sagittarius=8, House 2)
        // Jupiter (Libra=6, House 12)
        // Venus (Aquarius=10, House 4)
        // Saturn (Aries=0, House 6)
        // Rahu (Libra=6, House 12)
        // Ketu (Aquarius=10, House 4)

        let input_planets = vec![
            DoshaInputPlanet { name: "Sun".to_string(), sign_idx: 9, house: 3, deg_in_sign: 15.0, retrograde: false, combust: false },
            DoshaInputPlanet { name: "Moon".to_string(), sign_idx: 0, house: 6, deg_in_sign: 12.0, retrograde: false, combust: false },
            DoshaInputPlanet { name: "Mars".to_string(), sign_idx: 8, house: 2, deg_in_sign: 8.0, retrograde: false, combust: false },
            DoshaInputPlanet { name: "Mercury".to_string(), sign_idx: 8, house: 2, deg_in_sign: 18.0, retrograde: false, combust: true },
            DoshaInputPlanet { name: "Jupiter".to_string(), sign_idx: 11, house: 12, deg_in_sign: 5.0, retrograde: true, combust: false },
            DoshaInputPlanet { name: "Venus".to_string(), sign_idx: 10, house: 4, deg_in_sign: 22.0, retrograde: false, combust: false },
            DoshaInputPlanet { name: "Saturn".to_string(), sign_idx: 0, house: 6, deg_in_sign: 25.0, retrograde: false, combust: false },
            DoshaInputPlanet { name: "Rahu".to_string(), sign_idx: 6, house: 12, deg_in_sign: 1.0, retrograde: true, combust: false },
            DoshaInputPlanet { name: "Ketu".to_string(), sign_idx: 10, house: 4, deg_in_sign: 1.0, retrograde: true, combust: false },
        ];

        let res = calculate_doshas(&input_planets, 7, "Ashwini");

        // 1. Verify Ganda Moola
        assert!(res.ganda_moola.has_dosha);
        assert_eq!(res.ganda_moola.nakshatra_name.unwrap(), "Ashwini");

        // 2. Verify Guru Chandala
        assert!(res.guru_chandala.has_dosha);
        assert!(res.guru_chandala.jupiter_stronger); // Jupiter is in Pisces (own sign)

        // 3. Verify Kala Sarpa
        // In Chart 7, planets are hemmed between houses 4 (Ketu) and 12 (Rahu)
        assert!(res.kala_sarpa.has_dosha);

        // 4. Verify Ghata
        assert!(!res.ghata); // Mars is in 2, Saturn is in 6

        // 5. Verify Shrapit
        assert!(!res.shrapit); // Rahu is in 12, Saturn is in 6
    }
}
