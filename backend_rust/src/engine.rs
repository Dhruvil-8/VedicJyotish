use std::collections::HashMap;

use axum::http::StatusCode;
use chrono::Datelike;

use crate::{
    atlas,
    constants::{
        AIR_SIGNS, COMBUSTION_DEGREES, DASHA_SEQ, FIRE_SIGNS, FUNCTIONAL_MALEFICS, MOOLATRIKONA,
        NAKSHATRA_NAMES, SIGNS, STRENGTH_CHART, WATER_SIGNS,
    },
    models::{
        AscendantInfo, BirthData, CalculationProfile, ChartResponse, HouseData, LocationInfo,
        MoonIntelligence, Nakshatra, NavamsaHouseData, PlanetData, PlanetaryRow, Yoga,
    },
    panchanga, service, swiss, timezones, ApiError,
};

pub async fn compute_chart(data: BirthData) -> Result<ChartResponse, ApiError> {
    compute_chart_with_profile(data, CalculationProfile::default()).await
}

pub async fn compute_chart_with_profile(
    mut data: BirthData,
    profile: CalculationProfile,
) -> Result<ChartResponse, ApiError> {
    validate_profile(&profile)?;
    normalize_birth_data(&mut data)?;
    let (lat, lon) = resolve_coordinates(&data).await?;
    let resolved_time = timezones::resolve(&data.date, &data.time, lat, lon, data.timezone)?;
    let snapshot = swiss::calculate_snapshot(resolved_time.jd_ut, lat, lon)?;

    let asc_idx = sign_index(snapshot.ascendant_degree);
    let sun_deg = snapshot
        .planets
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.longitude)
        .unwrap_or(0.0);

    let mut planets = Vec::new();
    for raw in snapshot.planets {
        planets.push(build_planet(
            raw.name,
            raw.longitude,
            raw.speed,
            asc_idx,
            sun_deg,
        ));
    }

    let rahu = planets.iter().find(|p| p.name == "Rahu").ok_or_else(|| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Rahu calculation missing.",
        )
    })?;
    let ketu_deg = swiss::normalize_degree(rahu.full_degree + 180.0);
    planets.push(build_planet("Ketu", ketu_deg, -1.0, asc_idx, sun_deg));

    let moon = planets
        .iter()
        .find(|p| p.name == "Moon")
        .cloned()
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Moon calculation missing.",
            )
        })?;
    let moon_nak = get_nakshatra(moon.full_degree);
    let timeline = service::vimshottari_timeline(&moon_nak, resolved_time.local_naive);

    let chart_data = build_rasi_chart(asc_idx, &planets);
    let navamsa_chart = build_navamsa_chart(snapshot.ascendant_degree, &planets);
    let panchanga = panchanga::calculate(&planets, resolved_time.local_naive)?;
    let yogas = detect_yogas(&planets, asc_idx);
    let planetary_table = planets
        .iter()
        .map(|p| PlanetaryRow {
            name: p.name.clone(),
            sign: p.sign.clone(),
            house: p.house,
            nakshatra: p.nakshatra.clone(),
            pada: p.nakshatra_pada,
            dignity: p.strength.clone(),
            retrograde: p.retrograde,
            combust: p.combust,
            navamsa_sign: p.navamsa_sign.clone(),
        })
        .collect();

    Ok(ChartResponse {
        profile,
        location: LocationInfo {
            city: data.city,
            lat,
            lon,
            tz: resolved_time.offset_hours,
            timezone_name: resolved_time.timezone_name,
        },
        ascendant: AscendantInfo {
            sign: SIGNS[asc_idx].to_string(),
            degree: snapshot.ascendant_degree,
        },
        panchanga,
        moon_intelligence: MoonIntelligence {
            nakshatra: moon.nakshatra,
            pada: moon.nakshatra_pada,
            sign: moon.sign,
            strength: moon.strength,
        },
        vimshottari_timeline: timeline,
        chart_data,
        navamsa_chart,
        planetary_table,
        yogas,
    })
}

fn validate_profile(profile: &CalculationProfile) -> Result<(), ApiError> {
    let ayanamsa_ok = profile.ayanamsa.eq_ignore_ascii_case("lahiri");
    let node_ok = profile.node_type.eq_ignore_ascii_case("mean");
    let house_ok = profile.house_system.eq_ignore_ascii_case("wholesign")
        || profile.house_system.eq_ignore_ascii_case("whole_sign");
    let dasha_ok = profile
        .dasha_year
        .eq_ignore_ascii_case("sidereal365.256363004");

    if !(ayanamsa_ok && node_ok && house_ok && dasha_ok) {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Unsupported calculation profile. Supported now: Lahiri ayanamsa, Mean nodes, WholeSign houses, Sidereal365.256363004 dasha year.",
        ));
    }
    Ok(())
}

fn normalize_birth_data(data: &mut BirthData) -> Result<(), ApiError> {
    data.date = data.date.trim().replace(['-', '.'], "/");
    data.time = normalize_time(&data.time)?;
    data.city = data.city.as_ref().map(|city| title_case(city.trim()));

    // Validate date range (1900 to current year, not in future)
    if let Ok(parsed) = chrono::NaiveDate::parse_from_str(&data.date, "%d/%m/%Y") {
        let now = chrono::Local::now().date_naive();
        if parsed.year() < 1900 || parsed.year() > now.year() {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                format!(
                    "Birth year must be between 1900 and {}.",
                    now.year()
                ),
            ));
        }
        if parsed > now {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Birth date cannot be in the future.",
            ));
        }
    }

    if let Some(lat) = data.lat {
        if !(-90.0..=90.0).contains(&lat) {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Latitude out of range.",
            ));
        }
    }
    if let Some(lon) = data.lon {
        if !(-180.0..=180.0).contains(&lon) {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Longitude out of range.",
            ));
        }
    }
    Ok(())
}

async fn resolve_coordinates(data: &BirthData) -> Result<(f64, f64), ApiError> {
    match (data.lat, data.lon) {
        (Some(lat), Some(lon)) if lat != 0.0 || lon != 0.0 => Ok((lat, lon)),
        _ => {
            let city = data
                .city
                .as_deref()
                .ok_or_else(|| ApiError::new(StatusCode::BAD_REQUEST, "Need City or Lat/Lon."))?;
            let mut results = atlas::search_city(city)?;
            let first = results
                .drain(..)
                .next()
                .ok_or_else(|| ApiError::new(StatusCode::NOT_FOUND, "City not found."))?;
            Ok((first.lat, first.lon))
        }
    }
}

fn build_planet(
    name: &str,
    longitude: f64,
    speed: f64,
    asc_idx: usize,
    sun_deg: f64,
) -> PlanetData {
    let sign_idx = sign_index(longitude);
    let sign = SIGNS[sign_idx].to_string();
    let deg_in_sign = longitude % 30.0;
    let house = ((sign_idx + 12 - asc_idx) % 12 + 1) as u8;
    let nak = get_nakshatra(longitude);
    let (strength, nature) = get_dignity(name, &sign, deg_in_sign, asc_idx);
    let retrograde = if matches!(name, "Sun" | "Moon" | "Rahu") {
        name == "Rahu"
    } else {
        speed < 0.0
    };
    let combust = check_combustion(name, longitude, sun_deg);
    let navamsa_sign = SIGNS[get_navamsa_sign(sign_idx, deg_in_sign)].to_string();

    PlanetData {
        name: name.to_string(),
        sign,
        house,
        strength,
        nature,
        nakshatra: nak.name,
        nakshatra_lord: nak.lord,
        nakshatra_pada: nak.pada,
        full_degree: longitude,
        deg_in_sign: round2(deg_in_sign),
        retrograde,
        combust,
        navamsa_sign,
    }
}

fn build_rasi_chart(asc_idx: usize, planets: &[PlanetData]) -> HashMap<String, HouseData> {
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

fn build_navamsa_chart(
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

fn get_nakshatra(degree: f64) -> Nakshatra {
    let span = 13.333_333_333_f64;
    let idx = (degree / span).floor() as usize;
    let degree_in_nak = degree % span;
    let pada = (degree_in_nak / (span / 4.0)).floor() as u8 + 1;

    Nakshatra {
        name: NAKSHATRA_NAMES[idx % 27].to_string(),
        lord: DASHA_SEQ[idx % 9].to_string(),
        pada,
        fraction: degree_in_nak / span,
    }
}

fn get_dignity(name: &str, sign: &str, deg_in_sign: f64, asc_idx: usize) -> (String, String) {
    let mut status = "Neutral";
    if let Some(rule) = STRENGTH_CHART.get(name) {
        if sign == rule.exalt {
            status = "Exalted";
        } else if sign == rule.debilit {
            status = "Debilitated";
        } else if rule.own.iter().any(|own| *own == sign) {
            status = "Own Sign";
        }
    }
    if let Some((mt_sign, start, end)) = MOOLATRIKONA.get(name) {
        if sign == *mt_sign && deg_in_sign >= *start && deg_in_sign <= *end {
            status = "Moolatrikona";
        }
    }

    let mut nature = if FUNCTIONAL_MALEFICS
        .get(&asc_idx)
        .map(|items| items.iter().any(|item| *item == name))
        .unwrap_or(false)
    {
        "Functional Malefic"
    } else {
        "Functional Benefic"
    };
    if matches!(name, "Rahu" | "Ketu") {
        nature = "Natural Malefic";
    }

    (status.to_string(), nature.to_string())
}

fn check_combustion(name: &str, planet_deg: f64, sun_deg: f64) -> bool {
    let Some(range) = COMBUSTION_DEGREES.get(name) else {
        return false;
    };
    let mut diff = (planet_deg - sun_deg).abs();
    if diff > 180.0 {
        diff = 360.0 - diff;
    }
    diff <= *range
}

fn get_navamsa_sign(sign_idx: usize, degree_in_sign: f64) -> usize {
    let pada = (degree_in_sign / (30.0 / 9.0)).floor() as usize;
    let seed = if FIRE_SIGNS.contains(&sign_idx) {
        0
    } else if WATER_SIGNS.contains(&sign_idx) {
        3
    } else if AIR_SIGNS.contains(&sign_idx) {
        6
    } else {
        9
    };
    (seed + pada) % 12
}

fn sign_lord(sign_idx: usize) -> &'static str {
    match sign_idx {
        0 => "Mars",      // Aries
        1 => "Venus",     // Taurus
        2 => "Mercury",   // Gemini
        3 => "Moon",      // Cancer
        4 => "Sun",       // Leo
        5 => "Mercury",   // Virgo
        6 => "Venus",     // Libra
        7 => "Mars",      // Scorpio
        8 => "Jupiter",   // Sagittarius
        9 => "Saturn",    // Capricorn
        10 => "Saturn",   // Aquarius
        11 => "Jupiter",  // Pisces
        _ => "Unknown",
    }
}

fn detect_yogas(planets: &[PlanetData], asc_idx: usize) -> Vec<Yoga> {
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

    // ─── Vipareeta Raja Yoga ───────────────────────────────────────────────
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

    // ─── Sunapha / Anapha / Durudhara Yogas ────────────────────────────────
    if let Some(&moon_house) = p_house.get("Moon") {
        let second_from_moon = (moon_house % 12) + 1;
        let twelfth_from_moon = if moon_house == 1 { 12 } else { moon_house - 1 };

        let has_planets_in_second = house_planets
            .get(&second_from_moon)
            .map(|list| list.iter().any(|&p| !matches!(p, "Moon" | "Sun" | "Rahu" | "Ketu")))
            .unwrap_or(false);

        let has_planets_in_twelfth = house_planets
            .get(&twelfth_from_moon)
            .map(|list| list.iter().any(|&p| !matches!(p, "Moon" | "Sun" | "Rahu" | "Ketu")))
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

    // ─── Adhi Yoga ─────────────────────────────────────────────────────────
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

    // ─── Amala Yoga ────────────────────────────────────────────────────────
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

    // ─── Guru Mangala Yoga ──────────────────────────────────────────────────
    if let (Some(&jup_h), Some(&mars_h)) = (p_house.get("Jupiter"), p_house.get("Mars")) {
        let diff = (jup_h as i16 - mars_h as i16).abs();
        if diff == 0 || diff == 6 {
            let relationship = if diff == 0 { "conjoined" } else { "mutually aspecting (7th house opposition)" };
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

    // ─── Nabhasa Ashraya Yogas (Rajju / Musala / Nala) ─────────────────────
    let main_planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
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

    yogas
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

fn sign_index(degree: f64) -> usize {
    ((degree / 30.0).floor() as usize).min(11)
}

fn normalize_time(input: &str) -> Result<String, ApiError> {
    let mut normalized = String::new();
    for c in input.trim().chars() {
        if c.is_ascii_digit() || c == ':' {
            normalized.push(c);
        } else if matches!(c, ';' | '.' | ',' | '-' | ' ') {
            normalized.push(':');
        }
    }
    let parts: Vec<&str> = normalized.split(':').filter(|v| !v.is_empty()).collect();
    if parts.len() < 2 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        ));
    }
    let hour = parts[0]
        .parse::<u8>()
        .map_err(|_| ApiError::new(StatusCode::UNPROCESSABLE_ENTITY, "Invalid time."))?;
    let minute = parts[1]
        .parse::<u8>()
        .map_err(|_| ApiError::new(StatusCode::UNPROCESSABLE_ENTITY, "Invalid time."))?;
    if hour > 23 || minute > 59 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "Invalid time. Please use HH:MM format.",
        ));
    }
    Ok(format!("{hour:02}:{minute:02}"))
}

fn title_case(value: &str) -> String {
    value
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

pub async fn compute_transits(
    request: crate::models::TransitRequest,
) -> Result<crate::models::TransitResponse, ApiError> {
    // 1. Calculate natal chart
    let natal = compute_chart(request.birth_data.clone()).await?;
    let asc_sign = &natal.ascendant.sign;
    let asc_idx = SIGNS
        .iter()
        .position(|&s| s == asc_sign)
        .unwrap_or(0);
        
    let moon_sign = &natal.moon_intelligence.sign;
    let moon_idx = SIGNS
        .iter()
        .position(|&s| s == moon_sign)
        .unwrap_or(0);

    // 2. Resolve coordinates of birth location to calculate transits at that coordinate
    let (lat, lon) = resolve_coordinates(&request.birth_data).await?;
    
    // Resolve transit time
    let mut transit_data = BirthData {
        date: request.transit_date.clone(),
        time: request.transit_time.clone(),
        city: request.birth_data.city.clone(),
        lat: Some(lat),
        lon: Some(lon),
        timezone: request.birth_data.timezone,
    };
    normalize_birth_data(&mut transit_data)?;
    
    let resolved_time = timezones::resolve(
        &transit_data.date,
        &transit_data.time,
        lat,
        lon,
        transit_data.timezone,
    )?;
    
    let snapshot = swiss::calculate_snapshot(resolved_time.jd_ut, lat, lon)?;
    let transit_sun_deg = snapshot
        .planets
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.longitude)
        .unwrap_or(0.0);

    let mut transit_planets = Vec::new();
    
    // Build standard planets
    for raw in snapshot.planets {
        let t_idx = sign_index(raw.longitude);
        let sign = SIGNS[t_idx].to_string();
        let deg_in_sign = raw.longitude % 30.0;
        let house_lagna = ((t_idx + 12 - asc_idx) % 12 + 1) as u8;
        let house_moon = ((t_idx + 12 - moon_idx) % 12 + 1) as u8;
        
        let retrograde = if raw.name == "Sun" || raw.name == "Moon" || raw.name == "Rahu" {
            raw.name == "Rahu"
        } else {
            raw.speed < 0.0
        };
        let combust = check_combustion(&raw.name, raw.longitude, transit_sun_deg);
        
        transit_planets.push(crate::models::TransitPlanetData {
            name: raw.name.to_string(),
            transit_sign: sign,
            transit_degree: round2(deg_in_sign),
            transit_house_from_lagna: house_lagna,
            transit_house_from_moon: house_moon,
            retrograde,
            combust,
        });
    }
    
    // Build Ketu (180 degrees from Rahu)
    let rahu = transit_planets
        .iter()
        .find(|p| p.name == "Rahu")
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Transit Rahu calculation missing.",
            )
        })?;
    
    // Get full degree of Rahu
    let rahu_idx = SIGNS
        .iter()
        .position(|&s| s == rahu.transit_sign)
        .unwrap_or(0);
    let rahu_full = rahu_idx as f64 * 30.0 + rahu.transit_degree;
    let ketu_deg = swiss::normalize_degree(rahu_full + 180.0);
    
    let k_idx = sign_index(ketu_deg);
    let k_sign = SIGNS[k_idx].to_string();
    let k_deg_in_sign = ketu_deg % 30.0;
    let k_house_lagna = ((k_idx + 12 - asc_idx) % 12 + 1) as u8;
    let k_house_moon = ((k_idx + 12 - moon_idx) % 12 + 1) as u8;
    
    transit_planets.push(crate::models::TransitPlanetData {
        name: "Ketu".to_string(),
        transit_sign: k_sign,
        transit_degree: round2(k_deg_in_sign),
        transit_house_from_lagna: k_house_lagna,
        transit_house_from_moon: k_house_moon,
        retrograde: true,
        combust: false,
    });

    Ok(crate::models::TransitResponse {
        transit_date: transit_data.date,
        transit_time: transit_data.time,
        natal_ascendant: natal.ascendant,
        transit_planets,
    })
}

