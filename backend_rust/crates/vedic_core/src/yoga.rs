use crate::constants::SIGNS;
use crate::models::{
    DoshaResponse, GandaMoolaResult, GuruChandalaResult, KalaSarpaResult, ManglikResult,
    PitruResult, PlanetData, Yoga,
};
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct DoshaInputPlanet {
    pub name: String,
    pub sign_idx: usize,  // 0 = Aries, 11 = Pisces
    pub house: u8,        // 1-indexed relative to Lagna (1 = Lagna, 12 = 12th house)
    pub deg_in_sign: f64, // 0.0 to 30.0
    pub retrograde: bool,
    pub combust: bool,
}

// ─── Classical Yogas Helper Functions ────────────────────────────────────────

fn sign_index(degree: f64) -> usize {
    ((degree / 30.0).floor() as usize).min(11)
}

fn sign_lord(sign_idx: usize) -> &'static str {
    match sign_idx {
        0 => "Mars",     // Aries
        1 => "Venus",    // Taurus
        2 => "Mercury",  // Gemini
        3 => "Moon",     // Cancer
        4 => "Sun",      // Leo
        5 => "Mercury",  // Virgo
        6 => "Venus",    // Libra
        7 => "Mars",     // Scorpio
        8 => "Jupiter",  // Sagittarius
        9 => "Saturn",   // Capricorn
        10 => "Saturn",  // Aquarius
        11 => "Jupiter", // Pisces
        _ => "Unknown",
    }
}

fn same_house_yoga(
    yogas: &mut Vec<Yoga>,
    p_house: &HashMap<&str, u8>,
    p1: &str,
    p2: &str,
    name: &str,
    description: &str,
) {
    if let (Some(h1), Some(h2)) = (p_house.get(p1), p_house.get(p2)) {
        if h1 == h2 {
            yogas.push(yoga(name, description, "benefic"));
        }
    }
}

fn yoga(name: &str, description: &str, kind: &str) -> Yoga {
    Yoga {
        name: name.to_string(),
        description: description.to_string(),
        kind: kind.to_string(),
    }
}

// ─── Neechabhanga Raja Yoga Calculation ──────────────────────────────────────

pub fn check_neechabhanga(planets: &[PlanetData]) -> Vec<Yoga> {
    let mut neechabhanga_yogas = Vec::new();

    let get_sign_idx =
        |sign_name: &str| -> usize { SIGNS.iter().position(|&s| s == sign_name).unwrap_or(0) };

    let exaltation_sign_idx = |planet_name: &str| -> Option<usize> {
        match planet_name {
            "Sun" => Some(0),     // Aries
            "Moon" => Some(1),    // Taurus
            "Mars" => Some(9),    // Capricorn
            "Mercury" => Some(5), // Virgo
            "Jupiter" => Some(3), // Cancer
            "Venus" => Some(11),  // Pisces
            "Saturn" => Some(6),  // Libra
            _ => None,
        }
    };

    for p in planets {
        if p.strength == "Debilitated" {
            let p_sign_idx = get_sign_idx(&p.sign);
            let lord = sign_lord(p_sign_idx);
            let lord_house = planets.iter().find(|pl| pl.name == lord).map(|pl| pl.house);

            let mut is_neechabhanga = false;
            let mut reasons = Vec::new();

            // Rule 1: Sign lord of debilitated planet is in Kendra from Lagna
            if let Some(lh) = lord_house {
                if [1, 4, 7, 10].contains(&lh) {
                    is_neechabhanga = true;
                    reasons.push(format!(
                        "the lord of its sign ({lord}) is in Kendra (House {lh}) from Lagna"
                    ));
                }
            }

            // Rule 2: Sign lord is in Kendra from Moon
            if let Some(moon) = planets.iter().find(|pl| pl.name == "Moon") {
                if let Some(lh) = lord_house {
                    let rel_house = ((lh as i16 - moon.house as i16).rem_euclid(12) + 1) as u8;
                    if [1, 4, 7, 10].contains(&rel_house) {
                        is_neechabhanga = true;
                        reasons.push(format!("the lord of its sign ({lord}) is in Kendra (House {rel_house} from Moon)"));
                    }
                }
            }

            if let Some(ex_sign_idx) = exaltation_sign_idx(&p.name) {
                let ex_lord = sign_lord(ex_sign_idx);
                let ex_lord_house = planets
                    .iter()
                    .find(|pl| pl.name == ex_lord)
                    .map(|pl| pl.house);

                // Rule 3: Exaltation lord is in Kendra from Lagna
                if let Some(elh) = ex_lord_house {
                    if [1, 4, 7, 10].contains(&elh) {
                        is_neechabhanga = true;
                        reasons.push(format!("the lord of its exaltation sign ({ex_lord}) is in Kendra (House {elh}) from Lagna"));
                    }
                }

                // Rule 4: Exaltation lord is in Kendra from Moon
                if let Some(moon) = planets.iter().find(|pl| pl.name == "Moon") {
                    if let Some(elh) = ex_lord_house {
                        let rel_house = ((elh as i16 - moon.house as i16).rem_euclid(12) + 1) as u8;
                        if [1, 4, 7, 10].contains(&rel_house) {
                            is_neechabhanga = true;
                            reasons.push(format!("the lord of its exaltation sign ({ex_lord}) is in Kendra (House {rel_house} from Moon)"));
                        }
                    }
                }

                // Rule 5: Debilitated planet is exalted in Navamsa (D9)
                let ex_sign_name = SIGNS[ex_sign_idx];
                if p.navamsa_sign == ex_sign_name {
                    is_neechabhanga = true;
                    reasons.push(format!(
                        "it is exalted in the Navamsa (D9) chart ({ex_sign_name})"
                    ));
                }
            }

            if is_neechabhanga {
                neechabhanga_yogas.push(Yoga {
                    name: format!("Neechabhanga Raja Yoga ({})", p.name),
                    description: format!(
                        "Debilitation of {} in {} is cancelled because {}. This forms a Raja Yoga conferring ultimate authority, leadership, and great success after overcoming initial struggles.",
                        p.name, p.sign, reasons.join(", ")
                    ),
                    kind: "benefic".to_string(),
                });
            }
        }
    }

    neechabhanga_yogas
}

// ─── Classical Yogas Detector ────────────────────────────────────────────────

pub fn detect_yogas(planets: &[PlanetData], asc_idx: usize) -> Vec<Yoga> {
    let mut yogas = Vec::new();
    let p_house: HashMap<&str, u8> = planets
        .iter()
        .map(|planet| (planet.name.as_str(), planet.house))
        .collect();
    let mut house_planets: HashMap<u8, Vec<&str>> = HashMap::new();
    for planet in planets {
        house_planets
            .entry(planet.house)
            .or_default()
            .push(planet.name.as_str());
    }

    if let (Some(jupiter), Some(moon)) = (p_house.get("Jupiter"), p_house.get("Moon")) {
        let diff = ((*jupiter as i16 - *moon as i16).rem_euclid(12)) as u8;
        if [0, 3, 6, 9].contains(&diff) {
            yogas.push(yoga(
                "Gaja Kesari Yoga",
                "Jupiter in Kendra from Moon. Bestows wisdom, wealth, and fame.",
                "benefic",
            ));
        }
    }

    same_house_yoga(
        &mut yogas,
        &p_house,
        "Sun",
        "Mercury",
        "Budhaditya Yoga",
        "Sun and Mercury conjoined. Gives sharp intellect and communication skills.",
    );
    same_house_yoga(
        &mut yogas,
        &p_house,
        "Moon",
        "Mars",
        "Chandra Mangal Yoga",
        "Moon and Mars conjoined. Gives financial prosperity through courage.",
    );

    for (planet_name, yoga_name, description) in [
        (
            "Mars",
            "Ruchaka Yoga",
            "Mars in own/exalted sign in Kendra. Gives courage, strength, and leadership.",
        ),
        (
            "Mercury",
            "Bhadra Yoga",
            "Mercury in own/exalted sign in Kendra. Gives eloquence and intelligence.",
        ),
        (
            "Jupiter",
            "Hamsa Yoga",
            "Jupiter in own/exalted sign in Kendra. Gives spirituality and wisdom.",
        ),
        (
            "Venus",
            "Malavya Yoga",
            "Venus in own/exalted sign in Kendra. Gives luxury, beauty, and comfort.",
        ),
        (
            "Saturn",
            "Sasa Yoga",
            "Saturn in own/exalted sign in Kendra. Gives authority and discipline.",
        ),
    ] {
        if let Some(planet) = planets.iter().find(|planet| planet.name == planet_name) {
            if [1, 4, 7, 10].contains(&planet.house)
                && matches!(
                    planet.strength.as_str(),
                    "Exalted" | "Own Sign" | "Moolatrikona"
                )
            {
                yogas.push(yoga(yoga_name, description, "benefic"));
            }
        }
    }

    if let Some(moon_house) = p_house.get("Moon") {
        let second = (*moon_house % 12) + 1;
        let twelfth = ((*moon_house as i16 - 2).rem_euclid(12) + 1) as u8;
        let empty_second = house_planets
            .get(&second)
            .map(|items| items.iter().all(|p| matches!(*p, "Moon" | "Rahu" | "Ketu")))
            .unwrap_or(true);
        let empty_twelfth = house_planets
            .get(&twelfth)
            .map(|items| items.iter().all(|p| matches!(*p, "Moon" | "Rahu" | "Ketu")))
            .unwrap_or(true);
        if empty_second && empty_twelfth {
            yogas.push(yoga(
                "Kemadruma Yoga",
                "No planets in 2nd or 12th from Moon. May indicate financial struggles or loneliness.",
                "malefic",
            ));
        }
    }

    // Vipareeta Raja Yoga
    let lord_6 = sign_lord((asc_idx + 5) % 12);
    let lord_8 = sign_lord((asc_idx + 7) % 12);
    let lord_12 = sign_lord((asc_idx + 11) % 12);
    let mut vipareeta_yogas = Vec::new();

    for (lord_name, house_num) in [
        (lord_6, "6th Lord"),
        (lord_8, "8th Lord"),
        (lord_12, "12th Lord"),
    ] {
        if let Some(&h) = p_house.get(lord_name) {
            if h == 6 || h == 8 || h == 12 {
                vipareeta_yogas.push(format!("{} ({}) in House {}", house_num, lord_name, h));
            }
        }
    }

    if !vipareeta_yogas.is_empty() {
        yogas.push(yoga(
            "Vipareeta Raja Yoga",
            &format!(
                "Dusthana lord conjoined or placed in another dusthana house: {}. Neutralizes adversity and brings sudden rise, unexpected gains, and stellar resilience.",
                vipareeta_yogas.join(", ")
            ),
            "benefic",
        ));
    }

    // Vipareeta Sub-Yogas: Harsha, Sarala, Vimala
    if let Some(&h6) = p_house.get(lord_6) {
        if h6 == 6 {
            yogas.push(yoga(
                "Harsha Yoga",
                &format!(
                    "6th Lord ({lord_6}) resides in the 6th house. Confers invincible physical immunity, victory over rivals, freedom from debts, and triumph in competitive arenas.",
                ),
                "benefic",
            ));
        }
    }
    if let Some(&h8) = p_house.get(lord_8) {
        if h8 == 8 {
            yogas.push(yoga(
                "Sarala Yoga",
                &format!(
                    "8th Lord ({lord_8}) resides in the 8th house. Confers fearlessness, profound longevity, resolute determination, scholarly acumen, and sudden prosperity.",
                ),
                "benefic",
            ));
        }
    }
    if let Some(&h12) = p_house.get(lord_12) {
        if h12 == 12 {
            yogas.push(yoga(
                "Vimala Yoga",
                &format!(
                    "12th Lord ({lord_12}) resides in the 12th house. Confers noble independence, virtuous expenditures, peace of mind, freedom from malicious enemies, and spiritual enlightenment.",
                ),
                "benefic",
            ));
        }
    }

    // Sunapha / Anapha / Durudhara Yogas
    if let Some(&moon_house) = p_house.get("Moon") {
        let second_from_moon = (moon_house % 12) + 1;
        let twelfth_from_moon = if moon_house == 1 { 12 } else { moon_house - 1 };

        let has_planets_in_second = house_planets
            .get(&second_from_moon)
            .map(|list| {
                list.iter()
                    .any(|&p| !matches!(p, "Moon" | "Sun" | "Rahu" | "Ketu"))
            })
            .unwrap_or(false);

        let has_planets_in_twelfth = house_planets
            .get(&twelfth_from_moon)
            .map(|list| {
                list.iter()
                    .any(|&p| !matches!(p, "Moon" | "Sun" | "Rahu" | "Ketu"))
            })
            .unwrap_or(false);

        if has_planets_in_second && has_planets_in_twelfth {
            yogas.push(yoga(
                "Durudhara Yoga",
                "Planets occupy both the 2nd and 12th houses from the Moon. Confers financial abundance, sharp intellect, immense wisdom, and natural leadership capabilities.",
                "benefic",
            ));
        } else if has_planets_in_second {
            yogas.push(yoga(
                "Sunapha Yoga",
                "Planets occupy the 2nd house from the Moon. Bestows mental strength, self-earned wealth, fame, and a prosperous, comfortable life.",
                "benefic",
            ));
        } else if has_planets_in_twelfth {
            yogas.push(yoga(
                "Anapha Yoga",
                "Planets occupy the 12th house from the Moon. Confers a highly magnetic personality, excellent health, spiritual inclinations, and refined tastes.",
                "benefic",
            ));
        }
    }

    // Adhi Yoga
    if let Some(&moon_house) = p_house.get("Moon") {
        let h6 = ((moon_house + 5 - 1) % 12) + 1;
        let h7 = ((moon_house + 6 - 1) % 12) + 1;
        let h8 = ((moon_house + 7 - 1) % 12) + 1;

        let mut benefics_found = Vec::new();
        for p in &["Jupiter", "Venus", "Mercury"] {
            if let Some(&h) = p_house.get(p) {
                if h == h6 || h == h7 || h == h8 {
                    benefics_found.push(*p);
                }
            }
        }
        if !benefics_found.is_empty() {
            yogas.push(yoga(
                "Adhi Yoga",
                &format!(
                    "Natural benefics ({}) occupy the 6th, 7th, or 8th houses from the Moon. Grants high status, fame, prosperity, leadership, and a highly influential life.",
                    benefics_found.join(", ")
                ),
                "benefic",
            ));
        }
    }

    // Amala Yoga
    let h10_lagna = 10;
    let mut amala_lagna = Vec::new();
    let mut amala_moon = Vec::new();

    if let Some(&moon_house) = p_house.get("Moon") {
        let h10_moon = ((moon_house + 9 - 1) % 12) + 1;

        for p in &["Jupiter", "Venus", "Mercury"] {
            if let Some(&h) = p_house.get(p) {
                if h == h10_lagna {
                    amala_lagna.push(*p);
                }
                if h == h10_moon {
                    amala_moon.push(*p);
                }
            }
        }
    }

    if !amala_lagna.is_empty() || !amala_moon.is_empty() {
        let mut sources = Vec::new();
        if !amala_lagna.is_empty() {
            sources.push(format!("{} in 10th from Lagna", amala_lagna.join(", ")));
        }
        if !amala_moon.is_empty() {
            sources.push(format!("{} in 10th from Moon", amala_moon.join(", ")));
        }
        yogas.push(yoga(
            "Amala Yoga",
            &format!(
                "Natural benefics occupy the 10th house from Lagna or Moon: {}. Bestows professional success, dynamic wealth, a pure reputation, and philanthropic disposition.",
                sources.join(" & ")
            ),
            "benefic",
        ));
    }

    // Guru Mangala Yoga
    if let (Some(&jup_h), Some(&mars_h)) = (p_house.get("Jupiter"), p_house.get("Mars")) {
        let diff = (jup_h as i16 - mars_h as i16).abs();
        if diff == 0 || diff == 6 {
            let relationship = if diff == 0 {
                "conjoined"
            } else {
                "mutually aspecting (7th house opposition)"
            };
            yogas.push(yoga(
                "Guru Mangala Yoga",
                &format!(
                    "Jupiter and Mars are {} in the chart. Bestows dynamic energy, strong leadership, success in business/enterprises, and great prosperity.",
                    relationship
                ),
                "benefic",
            ));
        }
    }

    // Nabhasa Ashraya Yogas
    let main_planets = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    ];
    let mut all_movable = true;
    let mut all_fixed = true;
    let mut all_dual = true;

    for p_name in &main_planets {
        if let Some(p_data) = planets.iter().find(|p| p.name == *p_name) {
            let sign_idx = sign_index(p_data.full_degree);
            if ![0, 3, 6, 9].contains(&sign_idx) {
                all_movable = false;
            }
            if ![1, 4, 7, 10].contains(&sign_idx) {
                all_fixed = false;
            }
            if ![2, 5, 8, 11].contains(&sign_idx) {
                all_dual = false;
            }
        } else {
            all_movable = false;
            all_fixed = false;
            all_dual = false;
        }
    }

    if all_movable {
        yogas.push(yoga(
            "Rajju Yoga",
            "All main planets are in movable signs (Aries, Cancer, Libra, Capricorn). Bestows an active, enterprising life, fondness for travel, and rapid progress.",
            "benefic",
        ));
    } else if all_fixed {
        yogas.push(yoga(
            "Musala Yoga",
            "All main planets are in fixed signs (Taurus, Leo, Scorpio, Aquarius). Confers determination, stability, focus, self-respect, and steady long-term accumulation of wealth.",
            "benefic",
        ));
    } else if all_dual {
        yogas.push(yoga(
            "Nala Yoga",
            "All main planets are in dual signs (Gemini, Virgo, Sagittarius, Pisces). Bestows high intellect, multi-dimensional skills, adaptability, and an analytical mind.",
            "benefic",
        ));
    }

    // Solar Yogas: Vesi, Vasi, Ubhayachari (Planets in 2nd and/or 12th from Sun)
    if let Some(&sun_house) = p_house.get("Sun") {
        let second_from_sun = (sun_house % 12) + 1;
        let twelfth_from_sun = if sun_house == 1 { 12 } else { sun_house - 1 };

        let qualifying_second: Vec<&str> = house_planets
            .get(&second_from_sun)
            .map(|list| {
                list.iter()
                    .copied()
                    .filter(|&p| !matches!(p, "Sun" | "Moon" | "Rahu" | "Ketu"))
                    .collect()
            })
            .unwrap_or_default();

        let qualifying_twelfth: Vec<&str> = house_planets
            .get(&twelfth_from_sun)
            .map(|list| {
                list.iter()
                    .copied()
                    .filter(|&p| !matches!(p, "Sun" | "Moon" | "Rahu" | "Ketu"))
                    .collect()
            })
            .unwrap_or_default();

        if !qualifying_second.is_empty() && !qualifying_twelfth.is_empty() {
            yogas.push(yoga(
                "Ubhayachari Yoga",
                &format!(
                    "Planets occupy both the 2nd ({}) and 12th ({}) houses from the Sun (excluding Moon & nodes). Confers high executive prestige, eloquence, symmetry in life, and respected authority.",
                    qualifying_second.join(", "),
                    qualifying_twelfth.join(", ")
                ),
                "benefic",
            ));
        } else if !qualifying_second.is_empty() {
            yogas.push(yoga(
                "Vesi Yoga",
                &format!(
                    "Planets occupy the 2nd house from the Sun: {}. Bestows truthful speech, steady prosperity, moral rectitude, and recognized skill in enterprise.",
                    qualifying_second.join(", ")
                ),
                "benefic",
            ));
        } else if !qualifying_twelfth.is_empty() {
            yogas.push(yoga(
                "Vasi Yoga",
                &format!(
                    "Planets occupy the 12th house from the Sun: {}. Confers intellectual dexterity, physical resilience, artistic talent, and respected fame.",
                    qualifying_twelfth.join(", ")
                ),
                "benefic",
            ));
        }
    }

    // Dharma-Karmadhipati Yoga (9th & 10th lords relationship)
    let lord_1 = sign_lord(asc_idx);
    let lord_9 = sign_lord((asc_idx + 8) % 12);
    let lord_10 = sign_lord((asc_idx + 9) % 12);
    if lord_9 != lord_10 {
        if let (Some(&h9), Some(&h10)) = (p_house.get(lord_9), p_house.get(lord_10)) {
            if h9 == h10 {
                yogas.push(yoga(
                    "Dharma-Karmadhipati Yoga",
                    &format!(
                        "9th Lord ({lord_9}) and 10th Lord ({lord_10}) are conjoined in House {h9}. Paramount Parashari Raja Yoga conferring executive authority, high civic distinction, ethical leadership, and lasting success.",
                    ),
                    "benefic",
                ));
            } else if (h9 as i16 - h10 as i16).abs() == 6 {
                yogas.push(yoga(
                    "Dharma-Karmadhipati Yoga",
                    &format!(
                        "9th Lord ({lord_9}) in House {h9} and 10th Lord ({lord_10}) in House {h10} mutually aspect each other. Grants high public stature, ethical governance, and professional eminence.",
                    ),
                    "benefic",
                ));
            }
        }
    }

    // Saraswati Yoga (Benefics in Kendra, Trikona, or 2nd house with strong Jupiter)
    let auspicious_houses = [1, 2, 4, 5, 7, 9, 10];
    let jup_h = p_house.get("Jupiter").copied();
    let ven_h = p_house.get("Venus").copied();
    let mer_h = p_house.get("Mercury").copied();
    if let (Some(jh), Some(vh), Some(mh)) = (jup_h, ven_h, mer_h) {
        if auspicious_houses.contains(&jh)
            && auspicious_houses.contains(&vh)
            && auspicious_houses.contains(&mh)
        {
            let jup_strong = planets
                .iter()
                .find(|p| p.name == "Jupiter")
                .map(|p| matches!(p.strength.as_str(), "Exalted" | "Own Sign" | "Moolatrikona") || [1, 4, 7, 10].contains(&p.house))
                .unwrap_or(false);
            if jup_strong {
                yogas.push(yoga(
                    "Saraswati Yoga",
                    "All natural benefics (Jupiter, Venus, Mercury) occupy auspicious Kendras, Trikonas, or 2nd house with an empowered Jupiter. Bestows profound wisdom, poetic eloquence, scholarly mastery, and deep learning.",
                    "benefic",
                ));
            }
        }
    }

    // Lakshmi Yoga (9th lord exalted or in own sign in Kendra/Trikona, and Lagna lord well-placed)
    if let Some(p_9) = planets.iter().find(|p| p.name == lord_9) {
        if [1, 4, 5, 7, 9, 10].contains(&p_9.house)
            && matches!(p_9.strength.as_str(), "Exalted" | "Own Sign" | "Moolatrikona")
        {
            let lagna_lord_strong = planets
                .iter()
                .find(|p| p.name == lord_1)
                .map(|p| [1, 4, 5, 7, 9, 10].contains(&p.house))
                .unwrap_or(false);
            if lagna_lord_strong {
                yogas.push(yoga(
                    "Lakshmi Yoga",
                    &format!(
                        "9th Lord ({lord_9}) is fortified in House {} in an auspicious dignity with a well-placed Lagna Lord ({lord_1}). Bestows the eternal grace of Goddess Lakshmi: righteous wealth, sovereign honor, and lasting happiness.",
                        p_9.house
                    ),
                    "benefic",
                ));
            }
        }
    }

    // Vasumathi Yoga (Benefics in Upachaya houses 3, 6, 10, 11 from Lagna)
    let upachaya_benefics: Vec<&str> = ["Jupiter", "Venus", "Mercury"]
        .iter()
        .copied()
        .filter(|&p| {
            p_house
                .get(p)
                .map(|&h| [3, 6, 10, 11].contains(&h))
                .unwrap_or(false)
        })
        .collect();

    if upachaya_benefics.len() == 3 {
        yogas.push(yoga(
            "Vasumathi Yoga",
            "All natural benefics (Jupiter, Venus, Mercury) occupy Upachaya growth houses (3, 6, 10, 11). Confers vast self-earned wealth, financial independence, and immunity from debt.",
            "benefic",
        ));
    } else if upachaya_benefics.len() == 2 {
        yogas.push(yoga(
            "Partial Vasumathi Yoga",
            &format!(
                "Benefics ({}) occupy Upachaya growth houses (3, 6, 10, 11). Fosters steady financial growth through enterprise and self-effort.",
                upachaya_benefics.join(", ")
            ),
            "benefic",
        ));
    }

    // Pushkala Yoga (Chandra Lagna lord conjoined or aspecting Lagna lord in Kendra/benefic house)
    if let Some(moon_planet) = planets.iter().find(|p| p.name == "Moon") {
        let moon_sign_idx = sign_index(moon_planet.full_degree);
        let chandra_lord = sign_lord(moon_sign_idx);
        if chandra_lord != lord_1 {
            if let (Some(&cl_h), Some(&ll_h)) = (p_house.get(chandra_lord), p_house.get(lord_1)) {
                if cl_h == ll_h && [1, 4, 5, 7, 9, 10].contains(&cl_h) {
                    yogas.push(yoga(
                        "Pushkala Yoga",
                        &format!(
                            "Lord of the Moon sign ({chandra_lord}) and Lagna Lord ({lord_1}) are conjoined in auspicious House {cl_h}. Confers sweet, persuasive speech, royal favor, widespread renown, and noble demeanor.",
                        ),
                        "benefic",
                    ));
                }
            }
        }
    }

    // Kahala Yoga (4th and 9th lords in mutual Kendras)
    let lord_4 = sign_lord((asc_idx + 3) % 12);
    if let (Some(&h4), Some(&h9)) = (p_house.get(lord_4), p_house.get(lord_9)) {
        let diff = (h4 as i16 - h9 as i16).abs();
        if [0, 3, 6, 9].contains(&diff) {
            yogas.push(yoga(
                "Kahala Yoga",
                &format!(
                    "4th Lord ({lord_4}) and 9th Lord ({lord_9}) occupy mutual Kendra positions. Confers tenacious determination, command over organizations or teams, and fearless fortitude.",
                ),
                "benefic",
            ));
        }
    }

    // Parvata Yoga (Benefics in Kendras and Dusthanas 6 & 8 free of malefics)
    let kendra_has_benefic = ["Jupiter", "Venus", "Mercury"]
        .iter()
        .any(|p| p_house.get(*p).map(|&h| [1, 4, 7, 10].contains(&h)).unwrap_or(false));
    let dusthana_has_malefic = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"]
        .iter()
        .any(|p| p_house.get(*p).map(|&h| h == 6 || h == 8).unwrap_or(false));
    if kendra_has_benefic && !dusthana_has_malefic {
        yogas.push(yoga(
            "Parvata Yoga",
            "Natural benefics occupy Kendra angles while 6th and 8th houses are free from malefic affliction. Bestows an unshakeable reputation, immovable assets, charitable generosity, and high administrative stature.",
            "benefic",
        ));
    }

    // Chamara Yoga (Lagna lord fortified in Kendra)
    if let Some(ll_data) = planets.iter().find(|p| p.name == lord_1) {
        if [1, 4, 7, 10].contains(&ll_data.house)
            && matches!(ll_data.strength.as_str(), "Exalted" | "Own Sign" | "Moolatrikona")
        {
            yogas.push(yoga(
                "Chamara Yoga",
                &format!(
                    "Lagna Lord ({lord_1}) is fortified in Kendra House {} in own/exalted sign. Royal emblem yoga conferring high civic honors, eloquence in assemblies, and long-lasting distinction.",
                    ll_data.house
                ),
                "benefic",
            ));
        }
    }

    // Shankha Yoga (5th and 6th lords in mutual Kendras)
    let lord_5 = sign_lord((asc_idx + 4) % 12);
    if let (Some(&h5), Some(&h6)) = (p_house.get(lord_5), p_house.get(lord_6)) {
        let diff = (h5 as i16 - h6 as i16).abs();
        if [0, 3, 6, 9].contains(&diff) {
            yogas.push(yoga(
                "Shankha Yoga",
                &format!(
                    "5th Lord ({lord_5}) and 6th Lord ({lord_6}) occupy mutual Kendra houses. Bestows scholastic mastery, profound philosophical and humanitarian pursuits, high morality, and wealth.",
                ),
                "benefic",
            ));
        }
    }

    // Bheri Yoga (Lagna lord, 9th lord, and Jupiter in Kendras)
    if let (Some(&h1), Some(&h9), Some(&hj)) = (p_house.get(lord_1), p_house.get(lord_9), p_house.get("Jupiter")) {
        if [1, 4, 7, 10].contains(&h1) && [1, 4, 7, 10].contains(&h9) && [1, 4, 7, 10].contains(&hj) {
            yogas.push(yoga(
                "Bheri Yoga",
                &format!(
                    "Lagna Lord ({lord_1}), 9th Lord ({lord_9}), and Jupiter all occupy Kendra angles. Confers lasting joy, regal fame, high status, and freedom from danger.",
                ),
                "benefic",
            ));
        }
    }

    // Append any Neechabhanga Yogas
    let mut neechabhanga = check_neechabhanga(planets);
    yogas.append(&mut neechabhanga);

    yogas
}

// ─── Classical Doshas Calculations ───────────────────────────────────────────

pub fn calculate_kala_sarpa(p_houses: &HashMap<String, u8>) -> KalaSarpaResult {
    let Some(&rahu_h) = p_houses.get("Rahu") else {
        return KalaSarpaResult {
            has_dosha: false,
            type_index: None,
        };
    };
    let Some(&ketu_h) = p_houses.get("Ketu") else {
        return KalaSarpaResult {
            has_dosha: false,
            type_index: None,
        };
    };

    let classical = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
    ];
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

pub fn calculate_manglik(
    planets: &[DoshaInputPlanet],
    p_houses: &HashMap<String, u8>,
    ref_planet: &str,
    asc_sign_idx: usize,
) -> ManglikResult {
    let Some(&ref_house) = p_houses.get(ref_planet) else {
        return ManglikResult {
            has_dosha: false,
            has_exceptions: false,
            exceptions_triggered: vec![],
        };
    };
    let Some(&mars_house) = p_houses.get("Mars") else {
        return ManglikResult {
            has_dosha: false,
            has_exceptions: false,
            exceptions_triggered: vec![],
        };
    };

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

    let mars = planets.iter().find(|p| p.name == "Mars").unwrap();
    let jup = planets.iter().find(|p| p.name == "Jupiter");
    let sat = planets.iter().find(|p| p.name == "Saturn");
    let moon = planets.iter().find(|p| p.name == "Moon");
    let ven = planets.iter().find(|p| p.name == "Venus");

    let mut exceptions = vec![];

    if mars.sign_idx == 4 || mars.sign_idx == 10 {
        exceptions.push(1);
    }
    if relative_mars == 2 && (mars.sign_idx == 2 || mars.sign_idx == 5) {
        exceptions.push(2);
    }
    if relative_mars == 4 && (mars.sign_idx == 0 || mars.sign_idx == 7) {
        exceptions.push(3);
    }
    if relative_mars == 7 && (mars.sign_idx == 3 || mars.sign_idx == 9) {
        exceptions.push(4);
    }
    if relative_mars == 8 && (mars.sign_idx == 8 || mars.sign_idx == 11) {
        exceptions.push(5);
    }
    if relative_mars == 12 && (mars.sign_idx == 1 || mars.sign_idx == 6) {
        exceptions.push(6);
    }

    let mut aspected = false;
    if let Some(jup_p) = jup {
        if jup_p.house == mars.house {
            aspected = true;
        } else {
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
            let rel = ((mars.house as i16 - sat_p.house as i16).rem_euclid(12) + 1) as u8;
            if [3, 7, 10].contains(&rel) {
                aspected = true;
            }
        }
    }
    if aspected {
        exceptions.push(7);
    }

    if mars.retrograde {
        exceptions.push(8);
    }
    if mars.combust || mars.deg_in_sign < 1.0 || mars.deg_in_sign > 29.0 {
        exceptions.push(9);
    }
    if asc_sign_idx == 0 || asc_sign_idx == 7 {
        exceptions.push(10);
    }
    if [0, 4, 7, 8, 9, 11].contains(&mars.sign_idx) {
        exceptions.push(12);
    }
    if [0, 3, 6, 9].contains(&mars.sign_idx) {
        exceptions.push(13);
    }
    if asc_sign_idx == 3 || asc_sign_idx == 4 {
        exceptions.push(15);
    }

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
        exceptions.push(16);
    }

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
        exceptions.push(17);
    }

    let has_exceptions = !exceptions.is_empty();
    let has_dosha = is_base_manglik && !has_exceptions;

    ManglikResult {
        has_dosha,
        has_exceptions,
        exceptions_triggered: exceptions,
    }
}

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

    if Some(&9) == sun_h || Some(&9) == moon_h || Some(&9) == rahu_h {
        rules.push(1);
    }
    if Some(&4) == ketu_h {
        rules.push(2);
    }

    let mut afflicted = false;
    for &p in &["Sun", "Moon", "Rahu", "Ketu"] {
        if let Some(&ph) = p_houses.get(p) {
            // 1. Conjunction
            if Some(&ph) == mars_h || Some(&ph) == sat_h {
                afflicted = true;
                break;
            }
            // 2. Mars aspects (4th, 7th, 8th from Mars position)
            if let Some(&mh) = mars_h {
                let mars_0 = mh as i16 - 1;
                let aspect_4 = (mars_0 + 3).rem_euclid(12) + 1;
                let aspect_7 = (mars_0 + 6).rem_euclid(12) + 1;
                let aspect_8 = (mars_0 + 7).rem_euclid(12) + 1;
                if ph as i16 == aspect_4 || ph as i16 == aspect_7 || ph as i16 == aspect_8 {
                    afflicted = true;
                    break;
                }
            }
            // 3. Saturn aspects (3rd, 7th, 10th from Saturn position)
            if let Some(&sth) = sat_h {
                let sat_0 = sth as i16 - 1;
                let aspect_3 = (sat_0 + 2).rem_euclid(12) + 1;
                let aspect_7 = (sat_0 + 6).rem_euclid(12) + 1;
                let aspect_10 = (sat_0 + 9).rem_euclid(12) + 1;
                if ph as i16 == aspect_3 || ph as i16 == aspect_7 || ph as i16 == aspect_10 {
                    afflicted = true;
                    break;
                }
            }
        }
    }
    if afflicted {
        rules.push(3);
    }

    let target_houses = [2, 5, 9, 12];
    let mut two_matched = false;
    for &h in &target_houses {
        let mut count = 0;
        if Some(&h) == ven_h {
            count += 1;
        }
        if Some(&h) == mer_h {
            count += 1;
        }
        if Some(&h) == rahu_h {
            count += 1;
        }
        if count >= 2 {
            two_matched = true;
            break;
        }
    }
    if two_matched {
        rules.push(4);
    }

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

pub fn calculate_guru_chandala(
    p_houses: &HashMap<String, u8>,
    planets: &[DoshaInputPlanet],
) -> GuruChandalaResult {
    let Some(&jup_h) = p_houses.get("Jupiter") else {
        return GuruChandalaResult {
            has_dosha: false,
            jupiter_stronger: false,
        };
    };
    let rahu_h = p_houses.get("Rahu");
    let ketu_h = p_houses.get("Ketu");

    let has_dosha = Some(&jup_h) == rahu_h || Some(&jup_h) == ketu_h;
    let mut jupiter_stronger = false;
    if has_dosha {
        if let Some(jup) = planets.iter().find(|p| p.name == "Jupiter") {
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

pub fn calculate_kalathra(p_houses: &HashMap<String, u8>, ref_planet: &str) -> bool {
    let Some(&ref_house) = p_houses.get(ref_planet) else {
        return false;
    };

    let malefics = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"];
    let kalathra_houses = [1, 2, 4, 7, 8, 12];

    malefics.iter().any(|&name| {
        if let Some(&h) = p_houses.get(name) {
            let relative = ((h as i16 - ref_house as i16).rem_euclid(12) + 1) as u8;
            kalathra_houses.contains(&relative)
        } else {
            false
        }
    })
}

pub fn calculate_ganda_moola(moon_nakshatra: &str) -> GandaMoolaResult {
    let ganda_moola_stars = [
        "Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Moola", "Revati",
    ];
    let has_dosha = ganda_moola_stars.contains(&moon_nakshatra);

    GandaMoolaResult {
        has_dosha,
        nakshatra_name: if has_dosha {
            Some(moon_nakshatra.to_string())
        } else {
            None
        },
    }
}

pub fn calculate_doshas(
    planets: &[DoshaInputPlanet],
    asc_sign_idx: usize,
    moon_nakshatra: &str,
) -> DoshaResponse {
    let mut p_houses = HashMap::new();
    for p in planets {
        p_houses.insert(p.name.clone(), p.house);
    }
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
        let input_planets = vec![
            DoshaInputPlanet {
                name: "Sun".to_string(),
                sign_idx: 9,
                house: 3,
                deg_in_sign: 15.0,
                retrograde: false,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Moon".to_string(),
                sign_idx: 0,
                house: 6,
                deg_in_sign: 12.0,
                retrograde: false,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Mars".to_string(),
                sign_idx: 8,
                house: 2,
                deg_in_sign: 8.0,
                retrograde: false,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Mercury".to_string(),
                sign_idx: 8,
                house: 2,
                deg_in_sign: 18.0,
                retrograde: false,
                combust: true,
            },
            DoshaInputPlanet {
                name: "Jupiter".to_string(),
                sign_idx: 11,
                house: 12,
                deg_in_sign: 5.0,
                retrograde: true,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Venus".to_string(),
                sign_idx: 10,
                house: 4,
                deg_in_sign: 22.0,
                retrograde: false,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Saturn".to_string(),
                sign_idx: 0,
                house: 6,
                deg_in_sign: 25.0,
                retrograde: false,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Rahu".to_string(),
                sign_idx: 6,
                house: 12,
                deg_in_sign: 1.0,
                retrograde: true,
                combust: false,
            },
            DoshaInputPlanet {
                name: "Ketu".to_string(),
                sign_idx: 10,
                house: 4,
                deg_in_sign: 1.0,
                retrograde: true,
                combust: false,
            },
        ];

        let res = calculate_doshas(&input_planets, 7, "Ashwini");

        assert!(res.ganda_moola.has_dosha);
        assert_eq!(res.ganda_moola.nakshatra_name.unwrap(), "Ashwini");
        assert!(res.guru_chandala.has_dosha);
        assert!(res.guru_chandala.jupiter_stronger);
        assert!(res.kala_sarpa.has_dosha);
        assert!(!res.ghata);
        assert!(!res.shrapit);
    }

    #[test]
    fn test_neechabhanga_raja_yoga() {
        let planets = vec![
            PlanetData {
                name: "Mars".to_string(),
                sign: "Cancer".to_string(),
                house: 1,
                strength: "Debilitated".to_string(),
                nature: "Functional Malefic".to_string(),
                nakshatra: "Pushya".to_string(),
                nakshatra_lord: "Saturn".to_string(),
                nakshatra_pada: 1,
                full_degree: 95.0,
                deg_in_sign: 5.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Aries".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
                speed: None,
            },
            PlanetData {
                name: "Moon".to_string(),
                sign: "Libra".to_string(),
                house: 4,
                strength: "Neutral".to_string(),
                nature: "Functional Benefic".to_string(),
                nakshatra: "Chitra".to_string(),
                nakshatra_lord: "Mars".to_string(),
                nakshatra_pada: 3,
                full_degree: 185.0,
                deg_in_sign: 5.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Gemini".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
                speed: None,
            },
        ];

        let yogas = detect_yogas(&planets, 3);
        let nb_yoga = yogas
            .iter()
            .find(|y| y.name.contains("Neechabhanga Raja Yoga (Mars)"));
        assert!(
            nb_yoga.is_some(),
            "Neechabhanga Raja Yoga for Mars should be detected"
        );
    }
}
