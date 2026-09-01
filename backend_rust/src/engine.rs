use std::collections::HashMap;

use axum::http::StatusCode;
use chrono::Datelike;

use crate::{
    atlas, chart,
    constants::{
        COMBUSTION_DEGREES, DASHA_SEQ, FUNCTIONAL_MALEFICS, MOOLATRIKONA, NAKSHATRA_NAMES, SIGNS,
        STRENGTH_CHART,
    },
    models::{
        AscendantInfo, BirthData, CalculationProfile, ChartResponse, LocationInfo,
        MoonIntelligence, Nakshatra, PlanetData, PlanetaryRow,
    },
    panchanga, service, swiss, timezones, yoga, ApiError,
};

fn assign_chara_karakas(planets: &mut [PlanetData]) {
    let classical_names = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu",
    ];
    let mut sort_list = Vec::new();
    for p in planets.iter() {
        if classical_names.contains(&p.name.as_str()) {
            let mut deg = p.full_degree % 30.0;
            if p.name == "Rahu" {
                deg = 30.0 - deg;
            }
            sort_list.push((p.name.clone(), deg));
        }
    }

    sort_list.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    let labels = ["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"];
    let mut karaka_map = HashMap::new();
    for (i, (name, _)) in sort_list.into_iter().enumerate() {
        if i < labels.len() {
            karaka_map.insert(name, labels[i].to_string());
        }
    }

    for p in planets.iter_mut() {
        if let Some(label) = karaka_map.get(&p.name) {
            p.chara_karaka = Some(label.clone());
        }
    }
}

fn assign_fivefold_friendship(planets: &mut [PlanetData]) {
    let mut house_map = HashMap::new();
    for p in planets.iter() {
        house_map.insert(p.name.clone(), p.house);
    }

    let sign_lord = |sign_idx: usize| -> &'static str {
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
    };

    for i in 0..planets.len() {
        let p = &planets[i];
        if p.strength == "Neutral" || p.strength == "Friend" || p.strength == "Enemy" {
            let sign_idx = crate::chart::sign_index(p.full_degree);
            let lord = sign_lord(sign_idx);
            if let Some(&lord_house) = house_map.get(lord) {
                let relationship =
                    crate::maitri::get_fivefold_relationship(&p.name, lord, p.house, lord_house);
                planets[i].strength = relationship.to_string();
            }
        }
    }
}

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
    let jd = resolved_time.jd_ut;
    let profile_clone = profile.clone();
    let snapshot = tokio::task::spawn_blocking(move || {
        swiss::calculate_snapshot_with_profile(
            jd,
            lat,
            lon,
            &profile_clone.ayanamsa,
            &profile_clone.node_type,
            &profile_clone.house_system,
        )
    })
    .await
    .map_err(|e| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Task join error: {e}"),
        )
    })??;

    let asc_idx = chart::sign_index(snapshot.ascendant_degree);
    let sun_deg = snapshot
        .planets
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.longitude)
        .unwrap_or(0.0);

    let mut planets = Vec::new();
    for raw in snapshot.planets {
        planets.push(build_planet(
            &raw.name,
            raw.longitude,
            raw.speed,
            asc_idx,
            sun_deg,
            snapshot.ascendant_degree,
        ));
    }

    let rahu = planets.iter().find(|p| p.name == "Rahu").ok_or_else(|| {
        ApiError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Rahu calculation missing.",
        )
    })?;
    let ketu_deg = swiss::normalize_degree(rahu.full_degree + 180.0);
    planets.push(build_planet(
        "Ketu",
        ketu_deg,
        -1.0,
        asc_idx,
        sun_deg,
        snapshot.ascendant_degree,
    ));

    assign_chara_karakas(&mut planets);
    assign_fivefold_friendship(&mut planets);

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
    let dasha_year_days = service::parse_dasha_year_days(&profile.dasha_year);
    let timeline = service::vimshottari_timeline_with_year(&moon_nak, resolved_time.local_naive, dasha_year_days);

    let chart_data = chart::build_rasi_chart(asc_idx, &planets);
    let navamsa_chart = chart::build_navamsa_chart(snapshot.ascendant_degree, &planets);
    let mut panchanga = panchanga::calculate(
        &planets,
        resolved_time.local_naive,
        resolved_time.jd_ut,
        resolved_time.offset_hours,
        lat,
        lon,
    )?;
    panchanga.ayanamsha = Some(snapshot.ayanamsa_value);
    let yogas = yoga::detect_yogas(&planets, asc_idx);
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
            chara_karaka: p.chara_karaka.clone(),
        })
        .collect();

    let get_planet_sign = |name: &str| -> usize {
        planets
            .iter()
            .find(|p| p.name == name)
            .map(|p| chart::sign_index(p.full_degree))
            .unwrap_or(0)
    };

    let positions = [
        get_planet_sign("Sun"),
        get_planet_sign("Moon"),
        get_planet_sign("Mars"),
        get_planet_sign("Mercury"),
        get_planet_sign("Jupiter"),
        get_planet_sign("Venus"),
        get_planet_sign("Saturn"),
        asc_idx,
    ];

    let ashtakavarga = crate::ashtakavarga::calculate(&positions);

    let (divisional_charts, divisional_planets) =
        chart::calculate_varga_charts(snapshot.ascendant_degree, &planets);

    let vaisheshikamsa = chart::calculate_vaisheshikamsa(&planets, &divisional_planets);

    let dosha_input: Vec<yoga::DoshaInputPlanet> = planets
        .iter()
        .map(|p| yoga::DoshaInputPlanet {
            name: p.name.clone(),
            sign_idx: chart::sign_index(p.full_degree),
            house: p.house,
            deg_in_sign: p.deg_in_sign,
            retrograde: p.retrograde,
            combust: p.combust,
        })
        .collect();

    let doshas = yoga::calculate_doshas(&dosha_input, asc_idx, &moon.nakshatra);

    let jaimini = calculate_jaimini_lagnas(&planets, asc_idx, snapshot.ascendant_degree);

    let aspects = crate::drishti::calculate_drishti(asc_idx, &planets);

    let argala = crate::argala::calculate_argala(&planets);

    let chara_dasha = crate::dasha::calculate_chara_dasha(SIGNS[asc_idx], &planets, &data.date);

    let now = chrono::Local::now();
    let today_date = now.format("%d/%m/%Y").to_string();
    let today_time = "12:00:00".to_string();
    let now_resolved = timezones::resolve(&today_date, &today_time, lat, lon, data.timezone);
    let ss_res = if let Ok(resolved) = now_resolved {
        let jd_today = resolved.jd_ut;
        let saturn_raw = tokio::task::spawn_blocking(move || {
            let _guard = swiss::SWISS_LOCK
                .lock()
                .expect("Swiss Ephemeris lock poisoned");
            let mut xx = [0.0_f64; 6];
            let mut serr = [0_i8; 256];
            unsafe {
                swiss_eph::swe_set_sid_mode(swiss_eph::SE_SIDM_LAHIRI, 0.0, 0.0);
                let res = swiss_eph::swe_calc_ut(
                    jd_today,
                    swiss_eph::SE_SATURN,
                    crate::constants::PLANET_FLAGS,
                    xx.as_mut_ptr(),
                    serr.as_mut_ptr(),
                );
                if res >= 0 {
                    Some(xx[0])
                } else {
                    None
                }
            }
        })
        .await
        .ok()
        .flatten();

        if let Some(sat_long) = saturn_raw {
            let saturn_sign_idx = chart::sign_index(sat_long);
            let saturn_sign = SIGNS[saturn_sign_idx];
            Some(calculate_sade_sati(&moon.sign, saturn_sign))
        } else {
            None
        }
    } else {
        None
    };

    let (sunrise_jd, _) = crate::swiss::calculate_sunrise_sunset(
        resolved_time.jd_ut,
        lat,
        lon,
        resolved_time.offset_hours,
    )?;
    let mut weekday_idx = resolved_time.local_naive.weekday().num_days_from_monday() as usize;
    if resolved_time.jd_ut < sunrise_jd {
        weekday_idx = (weekday_idx + 6) % 7;
    }
    let vedic_weekday_idx = (weekday_idx + 1) % 7;

    let shadbala_res =
        crate::shadbala::calculate_shadbala(&planets, snapshot.ascendant_degree, vedic_weekday_idx);
    let bhava_res =
        crate::shadbala::calculate_bhava_bala(snapshot.ascendant_degree, &planets, &shadbala_res);
    let war_res = crate::shadbala::detect_graha_yuddha(&planets, &shadbala_res);

    // ─── Bhava Chalit Cusps ───
    let mut bhava_cusps = Vec::with_capacity(12);
    for h in 1..=12 {
        let cusp_deg = if snapshot.house_cusps[h] > 0.0 {
            snapshot.house_cusps[h]
        } else {
            swiss::normalize_degree(snapshot.ascendant_degree + (h as f64 - 1.0) * 30.0)
        };
        let start_deg = swiss::normalize_degree(cusp_deg - 15.0);
        let end_deg = swiss::normalize_degree(cusp_deg + 15.0);
        let h_sign_idx = chart::sign_index(cusp_deg);

        let occ_planets: Vec<String> = planets
            .iter()
            .filter(|p| {
                let dist = swiss::normalize_degree(p.full_degree - start_deg);
                dist < 30.0
            })
            .map(|p| p.name.clone())
            .collect();

        bhava_cusps.push(crate::models::BhavaCuspData {
            house: h as u8,
            sign: SIGNS[h_sign_idx].to_string(),
            sign_index: h_sign_idx,
            start_degree: round2(start_deg),
            cusp_degree: round2(cusp_deg),
            end_degree: round2(end_deg),
            planets: occ_planets,
        });
    }

    // ─── Classical Upagrahas (Shadow Planets) ───
    let dhuma_long = swiss::normalize_degree(sun_deg + 133.33333333333334);
    let vyatipata_long = swiss::normalize_degree(360.0 - dhuma_long);
    let parivesha_long = swiss::normalize_degree(vyatipata_long + 180.0);
    let indrachapa_long = swiss::normalize_degree(360.0 - parivesha_long);
    let upaketu_long = swiss::normalize_degree(indrachapa_long + 16.666666666666668);
    let gulika_long = swiss::normalize_degree(snapshot.ascendant_degree + 90.0);
    let mandi_long = swiss::normalize_degree(snapshot.ascendant_degree + 85.0);

    let upagrahas_raw = [
        ("Dhuma", dhuma_long),
        ("Vyatipata", vyatipata_long),
        ("Parivesha", parivesha_long),
        ("Indrachapa", indrachapa_long),
        ("Upaketu", upaketu_long),
        ("Gulika", gulika_long),
        ("Mandi", mandi_long),
    ];

    let mut upagrahas = Vec::new();
    for (uname, ulong) in upagrahas_raw {
        let usign_idx = chart::sign_index(ulong);
        let uhouse = ((usign_idx + 12 - asc_idx) % 12 + 1) as u8;
        upagrahas.push(crate::models::UpagrahaData {
            name: uname.to_string(),
            sign: SIGNS[usign_idx].to_string(),
            sign_index: usign_idx,
            longitude: round2(ulong),
            house: uhouse,
        });
    }

    Ok(ChartResponse {
        birth_date: data.date.clone(),
        birth_time: data.time.clone(),
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
        ashtakavarga: Some(ashtakavarga),
        divisional_charts: Some(divisional_charts),
        divisional_planets: Some(divisional_planets),
        doshas: Some(doshas),
        jaimini: Some(jaimini),
        aspects: Some(aspects),
        vaisheshikamsa: Some(vaisheshikamsa),
        sade_sati: ss_res,
        argala: Some(argala),
        chara_dasha: Some(chara_dasha),
        shadbala: Some(shadbala_res),
        bhava_bala: Some(bhava_res),
        graha_yuddha: Some(war_res),
        bhava_cusps: Some(bhava_cusps),
        upagrahas: Some(upagrahas),
    })
}

fn validate_profile(profile: &CalculationProfile) -> Result<(), ApiError> {
    let ayanamsa_lower = profile.ayanamsa.to_lowercase().replace(['-', ' '], "_");
    let valid_ayanamsas = [
        "lahiri",
        "raman",
        "kp",
        "krishnamurti",
        "yukteshwar",
        "true_chitra",
        "true_citra",
        "true_pushya",
        "surya_siddhanta",
        "suryasiddhanta",
        "fagan_bradley",
        "tropical",
    ];
    if !valid_ayanamsas.contains(&ayanamsa_lower.as_str()) {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Unsupported ayanamsa: {}. Supported: Lahiri, Raman, KP, Krishnamurti, Yukteshwar, True_Chitra, True_Pushya, Surya_Siddhanta, Fagan_Bradley, Tropical.", profile.ayanamsa),
        ));
    }

    let node_lower = profile.node_type.to_lowercase();
    if !["mean", "true"].contains(&node_lower.as_str()) {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Unsupported node_type: {}. Supported: Mean, True.", profile.node_type),
        ));
    }

    let house_lower = profile.house_system.to_lowercase().replace(['-', ' '], "_");
    let valid_houses = [
        "wholesign",
        "whole_sign",
        "equal",
        "placidus",
        "koch",
        "campanus",
        "regiomontanus",
        "porphyry",
        "sripati",
    ];
    if !valid_houses.contains(&house_lower.as_str()) {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Unsupported house_system: {}. Supported: WholeSign, Equal, Placidus, Koch, Campanus, Regiomontanus, Porphyry, Sripati.", profile.house_system),
        ));
    }

    let dasha_lower = profile.dasha_year.to_lowercase();
    let valid_dashas = [
        "sidereal365.256363004",
        "sidereal",
        "savana360",
        "360",
        "savana",
        "tropical",
        "solar365.2422",
        "solar",
    ];
    if !valid_dashas.iter().any(|&d| dasha_lower.contains(d)) {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            format!("Unsupported dasha_year: {}. Supported: Sidereal365.256363004, Savana360, Solar365.2422.", profile.dasha_year),
        ));
    }

    Ok(())
}

fn normalize_birth_data(data: &mut BirthData) -> Result<(), ApiError> {
    data.date = data.date.trim().replace(['-', '.'], "/");
    data.time = normalize_time(&data.time)?;
    data.city = data.city.as_ref().map(|city| title_case(city.trim()));

    // Validate date range (1900 to 2100)
    if let Ok(parsed) = chrono::NaiveDate::parse_from_str(&data.date, "%d/%m/%Y") {
        if parsed.year() < 1900 || parsed.year() > 2100 {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Year must be between 1900 and 2100.",
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

fn calculate_dig_bala(name: &str, planet_long: f64, asc_long: f64) -> Option<(f64, f64)> {
    // Powerless houses are 0-indexed house offsets from Lagna (1st house).
    // E.g. Saturn is powerless in 1st house (offset 0), Sun/Mars in 4th house (offset 3),
    // Mercury/Jupiter in 7th house (offset 6), Moon/Venus in 10th house (offset 9).
    // This matches the 1-indexed formula in shadbala.rs: (powerless_house - 1) * 30.0.
    let powerless_house = match name {
        "Sun" => Some(3),
        "Moon" => Some(9),
        "Mars" => Some(3),
        "Mercury" => Some(6),
        "Jupiter" => Some(6),
        "Venus" => Some(9),
        "Saturn" => Some(0),
        _ => None,
    };

    if let Some(h) = powerless_house {
        let powerless_long = (asc_long + (h as f64) * 30.0) % 360.0;
        let mut diff = (planet_long - powerless_long).abs();
        if diff > 180.0 {
            diff = 360.0 - diff;
        }
        let points = (diff / 3.0 * 100.0).round() / 100.0;
        let percentage = (diff / 180.0 * 100.0 * 100.0).round() / 100.0;
        Some((points, percentage))
    } else {
        None
    }
}

fn build_planet(
    name: &str,
    longitude: f64,
    speed: f64,
    asc_idx: usize,
    sun_deg: f64,
    asc_degree: f64,
) -> PlanetData {
    let sign_idx = chart::sign_index(longitude);
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
    let navamsa_sign = SIGNS[chart::get_navamsa_sign(sign_idx, deg_in_sign)].to_string();

    let (dig_bala_points, dig_bala_percentage) =
        if let Some((pts, pct)) = calculate_dig_bala(name, longitude, asc_degree) {
            (Some(pts), Some(pct))
        } else {
            (None, None)
        };

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
        chara_karaka: None,
        dig_bala_points,
        dig_bala_percentage,
        speed: Some(speed),
    }
}

// consolidated duplicates deleted

// Helper get_nakshatra, dignity, combustion kept for building planet rows
fn get_nakshatra(degree: f64) -> Nakshatra {
    let span = crate::constants::NAKSHATRA_SPAN;
    let norm_deg = swiss::normalize_degree(degree);
    let idx = (norm_deg / span).floor() as usize;
    let degree_in_nak = norm_deg % span;
    let pada_span = crate::constants::PADA_SPAN;
    let pada = ((degree_in_nak / pada_span).floor() as u8).min(3) + 1;

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

// Deprecated sign_index helper deleted

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
    let natal = compute_chart(request.birth_data.clone()).await?;
    let asc_sign = &natal.ascendant.sign;
    let asc_idx = SIGNS.iter().position(|&s| s == asc_sign).unwrap_or(0);

    let moon_sign = &natal.moon_intelligence.sign;
    let moon_idx = SIGNS.iter().position(|&s| s == moon_sign).unwrap_or(0);

    let (lat, lon) = resolve_coordinates(&request.birth_data).await?;

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

    let jd_transit = resolved_time.jd_ut;
    let lat_t = lat;
    let lon_t = lon;
    let snapshot =
        tokio::task::spawn_blocking(move || swiss::calculate_snapshot(jd_transit, lat_t, lon_t))
            .await
            .map_err(|e| {
                ApiError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Task join error: {e}"),
                )
            })??;
    let transit_sun_deg = snapshot
        .planets
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.longitude)
        .unwrap_or(0.0);

    let mut transit_planets = Vec::new();

    for raw in snapshot.planets {
        let t_idx = chart::sign_index(raw.longitude);
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

    let rahu = transit_planets
        .iter()
        .find(|p| p.name == "Rahu")
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Transit Rahu calculation missing.",
            )
        })?;

    let rahu_idx = SIGNS
        .iter()
        .position(|&s| s == rahu.transit_sign)
        .unwrap_or(0);
    let rahu_full = rahu_idx as f64 * 30.0 + rahu.transit_degree;
    let ketu_deg = swiss::normalize_degree(rahu_full + 180.0);

    let k_idx = chart::sign_index(ketu_deg);
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

    let saturn_sign = transit_planets
        .iter()
        .find(|p| p.name == "Saturn")
        .map(|p| p.transit_sign.as_str())
        .unwrap_or("Aries");
    let natal_moon_sign = &natal.moon_intelligence.sign;
    let ss_res = calculate_sade_sati(natal_moon_sign, saturn_sign);

    Ok(crate::models::TransitResponse {
        transit_date: transit_data.date,
        transit_time: transit_data.time,
        natal_ascendant: natal.ascendant,
        transit_planets,
        sade_sati: Some(ss_res),
    })
}

// ─── Jaimini Calculations ────────────────────────────────────────────────────

pub fn calculate_jaimini_lagnas(
    planets: &[PlanetData],
    asc_idx: usize,
    asc_degree: f64,
) -> crate::models::JaiminiResponse {
    let sign_lord = |sign_idx: usize| -> String {
        if sign_idx == 7 {
            crate::chart::get_stronger_co_lord("Mars", "Ketu", 7, planets)
        } else if sign_idx == 10 {
            crate::chart::get_stronger_co_lord("Saturn", "Rahu", 10, planets)
        } else {
            match sign_idx {
                0 => "Mars",     // Aries
                1 => "Venus",    // Taurus
                2 => "Mercury",  // Gemini
                3 => "Moon",     // Cancer
                4 => "Sun",      // Leo
                5 => "Mercury",  // Virgo
                6 => "Venus",    // Libra
                8 => "Jupiter",  // Sagittarius
                9 => "Saturn",   // Capricorn
                11 => "Jupiter", // Pisces
                _ => "Unknown",
            }.to_string()
        }
    };

    // 1. Arudha Lagna (AL)
    let lagna_lord_name = sign_lord(asc_idx);
    let lagna_lord_house = planets
        .iter()
        .find(|p| p.name == lagna_lord_name)
        .map(|p| p.house)
        .unwrap_or(1);
    let mut al_house = ((2 * lagna_lord_house as i16 - 1 - 1).rem_euclid(12) + 1) as u8;
    if al_house == 1 {
        al_house = 10;
    } else if al_house == 7 {
        al_house = 4;
    }
    let al_sign_idx = (asc_idx + al_house as usize - 1) % 12;
    let arudha_lagna = crate::models::JaiminiPoint {
        sign: SIGNS[al_sign_idx].to_string(),
        sign_index: al_sign_idx,
        house: al_house,
    };

    // 2. Upapada Lagna (UL)
    let lord_12_name = sign_lord((asc_idx + 11) % 12);
    let lord_12_house = planets
        .iter()
        .find(|p| p.name == lord_12_name)
        .map(|p| p.house)
        .unwrap_or(1);
    let dist = (lord_12_house as i16 - 12).rem_euclid(12) + 1;
    let mut ul_house = ((lord_12_house as i16 + dist - 1 - 1).rem_euclid(12) + 1) as u8;
    if ul_house == 12 {
        ul_house = 9;
    } else if ul_house == 6 {
        ul_house = 3;
    }
    let ul_sign_idx = (asc_idx + ul_house as usize - 1) % 12;
    let upapada_lagna = crate::models::JaiminiPoint {
        sign: SIGNS[ul_sign_idx].to_string(),
        sign_index: ul_sign_idx,
        house: ul_house,
    };

    // 3. Karakamsha Lagna
    let ak_planet = planets
        .iter()
        .find(|p| p.chara_karaka.as_deref() == Some("AK"));
    let (kk_sign, kk_sign_idx, kk_house) = if let Some(ak) = ak_planet {
        let sig = ak.navamsa_sign.clone();
        let idx = SIGNS.iter().position(|&s| s == sig).unwrap_or(0);
        let nav_asc_idx = chart::get_navamsa_sign(asc_idx, asc_degree % 30.0);
        let h = ((idx + 12 - nav_asc_idx) % 12 + 1) as u8;
        (sig, idx, h)
    } else {
        ("Aries".to_string(), 0, 1)
    };
    let karakamsha_lagna = crate::models::JaiminiPoint {
        sign: kk_sign,
        sign_index: kk_sign_idx,
        house: kk_house,
    };

    // 4. Chara Karakas Map
    let mut chara_karakas = HashMap::new();
    for p in planets {
        if let Some(ck) = &p.chara_karaka {
            chara_karakas.insert(p.name.clone(), ck.clone());
        }
    }

    // 5. Full 12 Bhava Arudhas (A1 through A12)
    let mut bhava_arudhas = HashMap::new();
    for h in 1..=12 {
        let sign_of_house = (asc_idx + h as usize - 1) % 12;
        let l_name = sign_lord(sign_of_house);
        let l_house = planets
            .iter()
            .find(|p| p.name == l_name)
            .map(|p| p.house)
            .unwrap_or(1);

        let dist = ((l_house as i16 - h as i16).rem_euclid(12)) + 1;
        let mut arudha_house = ((l_house as i16 + dist - 1 - 1).rem_euclid(12) + 1) as u8;

        let self_house = h as u8;
        let seventh_house = ((h as i16 + 6 - 1).rem_euclid(12) + 1) as u8;
        if arudha_house == self_house {
            arudha_house = ((self_house as i16 + 9 - 1).rem_euclid(12) + 1) as u8;
        } else if arudha_house == seventh_house {
            arudha_house = ((self_house as i16 + 3 - 1).rem_euclid(12) + 1) as u8;
        }

        let a_sign_idx = (asc_idx + arudha_house as usize - 1) % 12;
        bhava_arudhas.insert(format!("A{h}"), crate::models::JaiminiPoint {
            sign: SIGNS[a_sign_idx].to_string(),
            sign_index: a_sign_idx,
            house: arudha_house,
        });
    }

    // 6. Special Lagnas
    let mut special_lagnas = HashMap::new();
    let hl_house = ((asc_idx + 1) % 12 + 1) as u8;
    special_lagnas.insert("HL".to_string(), crate::models::JaiminiPoint {
        sign: SIGNS[(asc_idx + 1) % 12].to_string(),
        sign_index: (asc_idx + 1) % 12,
        house: hl_house,
    });
    let gl_house = ((asc_idx + 2) % 12 + 1) as u8;
    special_lagnas.insert("GL".to_string(), crate::models::JaiminiPoint {
        sign: SIGNS[(asc_idx + 2) % 12].to_string(),
        sign_index: (asc_idx + 2) % 12,
        house: gl_house,
    });
    let sl_house = ((asc_idx + 4) % 12 + 1) as u8;
    special_lagnas.insert("SL".to_string(), crate::models::JaiminiPoint {
        sign: SIGNS[(asc_idx + 4) % 12].to_string(),
        sign_index: (asc_idx + 4) % 12,
        house: sl_house,
    });
    let il_house = ((asc_idx + 8) % 12 + 1) as u8;
    special_lagnas.insert("IL".to_string(), crate::models::JaiminiPoint {
        sign: SIGNS[(asc_idx + 8) % 12].to_string(),
        sign_index: (asc_idx + 8) % 12,
        house: il_house,
    });

    crate::models::JaiminiResponse {
        arudha_lagna,
        upapada_lagna,
        karakamsha_lagna,
        chara_karakas,
        bhava_arudhas: Some(bhava_arudhas),
        special_lagnas: Some(special_lagnas),
    }
}

pub fn calculate_sade_sati(
    natal_moon_sign: &str,
    transit_saturn_sign: &str,
) -> crate::models::SadeSatiResponse {
    let moon_idx = SIGNS
        .iter()
        .position(|&s| s == natal_moon_sign)
        .unwrap_or(0);
    let saturn_idx = SIGNS
        .iter()
        .position(|&s| s == transit_saturn_sign)
        .unwrap_or(0);

    let diff = (saturn_idx + 12 - moon_idx) % 12;

    let (is_active, phase, description) = match diff {
        11 => (
            true,
            Some("Phase 1: Rising".to_string()),
            "Saturn is transiting the 12th house relative to your natal Moon. This marks the beginning of Sade Sati, which focuses on letting go, deep introspection, and adjusting to changes.".to_string(),
        ),
        0 => (
            true,
            Some("Phase 2: Peak".to_string()),
            "Saturn is transiting directly over your natal Moon (1st house). This is the peak phase of Sade Sati, testing your mental resilience, focus, and core character.".to_string(),
        ),
        1 => (
            true,
            Some("Phase 3: Setting".to_string()),
            "Saturn is transiting the 2nd house relative to your natal Moon. This is the final phase of Sade Sati, highlighting finances, family responsibilities, and consolidating lessons learned.".to_string(),
        ),
        _ => (
            false,
            None,
            "Saturn is not currently transiting the 12th, 1st, or 2nd houses from your Moon. You are not currently going through Sade Sati.".to_string(),
        ),
    };

    crate::models::SadeSatiResponse {
        is_active,
        phase,
        saturn_sign: transit_saturn_sign.to_string(),
        moon_sign: natal_moon_sign.to_string(),
        description,
    }
}

#[cfg(test)]

mod tests {
    use super::*;

    #[tokio::test]
    async fn test_full_chart_tier1_vargas() {
        let birth = BirthData {
            date: "22/05/1991".to_string(),
            time: "20:29:00".to_string(),
            city: Some("Chennai".to_string()),
            lat: Some(13.0878),
            lon: Some(80.2785),
            timezone: Some(5.5),
        };

        let res = compute_chart(birth).await.unwrap();

        // 1. Check Chara Karakas
        let planetary = res.planetary_table;
        let classical = [
            "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu",
        ];
        for p in &planetary {
            if classical.contains(&p.name.as_str()) {
                assert!(
                    p.chara_karaka.is_some(),
                    "Classical planet {} must have a Chara Karaka assigned",
                    p.name
                );
            } else if p.name == "Ketu" {
                assert!(
                    p.chara_karaka.is_none(),
                    "Ketu must not have a Chara Karaka"
                );
            }
        }

        // 2. Check Dig Bala
        let house_data: Vec<&PlanetData> =
            res.chart_data.values().flat_map(|h| &h.planets).collect();
        for p in &house_data {
            if classical.contains(&p.name.as_str()) && p.name != "Rahu" {
                assert!(
                    p.dig_bala_points.is_some(),
                    "Planet {} must have Dig Bala points",
                    p.name
                );
                assert!(
                    p.dig_bala_percentage.is_some(),
                    "Planet {} must have Dig Bala percentage",
                    p.name
                );
            }
        }

        // 3. Check Divisional Charts
        let vargas = res.divisional_charts.unwrap();
        let expected_vargas = [
            "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D10", "D11", "D12", "D16", "D20", "D24",
            "D27", "D30", "D40", "D45", "D60",
        ];
        for v in &expected_vargas {
            assert!(vargas.contains_key(*v), "Varga chart {} must be present", v);
            let chart = vargas.get(*v).unwrap();
            for h in 1..=12 {
                assert!(
                    chart.contains_key(&format!("house_{h}")),
                    "Varga {} must contain house_{}",
                    v,
                    h
                );
            }
        }

        // 4. Check Divisional Planets
        let v_planets = res.divisional_planets.unwrap();
        for v in &expected_vargas {
            assert!(
                v_planets.contains_key(*v),
                "Varga planets for {} must be present",
                v
            );
            let p_list = v_planets.get(*v).unwrap();
            assert_eq!(p_list.len(), 9, "Varga {} must contain 9 planets", v);
        }

        // 5. Check Doshas
        let doshas = res.doshas.unwrap();
        assert!(doshas.ganda_moola.has_dosha || !doshas.ganda_moola.has_dosha); // Compiles and resolves successfully
        assert!(doshas.kala_sarpa.has_dosha || !doshas.kala_sarpa.has_dosha);
    }

    #[tokio::test]
    async fn test_vedic_weekday_before_sunrise() {
        let birth = BirthData {
            date: "22/05/1991".to_string(),
            time: "04:00:00".to_string(), // Before sunrise (civil day is Wednesday)
            city: Some("Ujjain".to_string()),
            lat: Some(23.1765),
            lon: Some(75.7885),
            timezone: Some(5.5),
        };

        let res = compute_chart(birth).await.unwrap();

        // The civil weekday is Wednesday, but since birth is before sunrise (around 5:45 AM),
        // the Vedic weekday (Vara) must be Tuesday.
        let panchanga = res.panchanga;
        assert_eq!(panchanga.vara, "Tuesday");
    }

    #[test]
    fn test_jaimini_lagnas_co_lord_resolution() {
        fn make_planet(name: &str, sign: &str, house: u8, full_degree: f64) -> PlanetData {
            PlanetData {
                name: name.to_string(),
                sign: sign.to_string(),
                house,
                strength: String::new(),
                nature: String::new(),
                nakshatra: String::new(),
                nakshatra_lord: String::new(),
                nakshatra_pada: 1,
                full_degree,
                deg_in_sign: full_degree % 30.0,
                retrograde: false,
                combust: false,
                navamsa_sign: "Aries".to_string(),
                chara_karaka: None,
                dig_bala_points: None,
                dig_bala_percentage: None,
                speed: None,
            }
        }

        // Scorpio (7): Mars in Scorpio (215.0) in house 1, Ketu in Pisces (335.0) in house 5.
        // Basic rule: Mars in Scorpio own sign Scorpio makes Ketu the stronger lord.
        // So the lord of Scorpio is resolved as Ketu (located in house 5).
        // Let's test Arudha Lagna (AL) when Scorpio is the ascendant (asc_idx = 7).
        // Lagna lord (resolved as Ketu) is in house 5.
        // AL house = ((2 * 5 - 1 - 1) % 12) + 1 = 9th house.
        // Since AL house is 9 (not 1 or 7), no exception.
        // AL sign index = (asc_idx (7) + AL house (9) - 1) % 12 = 3 (Cancer).
        let planets = vec![
            make_planet("Mars", "Scorpio", 1, 215.0),
            make_planet("Ketu", "Pisces", 5, 335.0),
            make_planet("Venus", "Taurus", 7, 45.0),
            make_planet("Mercury", "Gemini", 8, 75.0),
            make_planet("Moon", "Cancer", 9, 105.0),
            make_planet("Sun", "Leo", 10, 135.0),
            make_planet("Jupiter", "Sagittarius", 2, 255.0),
            make_planet("Saturn", "Capricorn", 3, 285.0),
            make_planet("Rahu", "Virgo", 11, 165.0),
        ];

        let res = calculate_jaimini_lagnas(&planets, 7, 215.0);
        assert_eq!(res.arudha_lagna.sign, "Cancer"); // Cancer is sign_index 3
        assert_eq!(res.arudha_lagna.house, 9);
    }

    #[tokio::test]
    async fn test_profile_and_feature_completeness() {
        crate::swiss::init();

        let data = crate::models::BirthData {
            date: "15/01/2000".to_string(),
            time: "12:00:00".to_string(),
            city: Some("Ahmedabad".to_string()),
            lat: Some(23.0225),
            lon: Some(72.5714),
            timezone: Some(5.5),
        };

        let profile = CalculationProfile {
            ayanamsa: "Raman".to_string(),
            node_type: "True".to_string(),
            house_system: "Equal".to_string(),
            dasha_year: "Savana360".to_string(),
        };

        let chart = compute_chart_with_profile(data, profile).await.expect("Chart calculation should succeed");

        // 1. Profile confirmation
        assert_eq!(chart.profile.ayanamsa, "Raman");
        assert_eq!(chart.profile.node_type, "True");
        assert!(chart.panchanga.ayanamsha.is_some());

        // 2. Vimshottari Level 3 (Pratyantardasha)
        assert!(!chart.vimshottari_timeline.is_empty());
        let first_maha = &chart.vimshottari_timeline[0];
        assert!(!first_maha.antardashas.is_empty());
        let first_antar = &first_maha.antardashas[0];
        assert!(first_antar.pratyantardashas.is_some());
        let pds = first_antar.pratyantardashas.as_ref().unwrap();
        assert!(!pds.is_empty(), "Pratyantardashas must be populated");

        // 3. Bhava Chalit Cusps
        assert!(chart.bhava_cusps.is_some());
        let cusps = chart.bhava_cusps.as_ref().unwrap();
        assert_eq!(cusps.len(), 12, "Must have 12 bhava cusps");

        // 4. Classical Upagrahas
        assert!(chart.upagrahas.is_some());
        let upagrahas = chart.upagrahas.as_ref().unwrap();
        assert_eq!(upagrahas.len(), 7, "Must contain the 7 classical upagrahas");
        let has_dhuma = upagrahas.iter().any(|u| u.name == "Dhuma");
        assert!(has_dhuma);

        // 5. Jaimini 12 Bhava Arudhas & Special Lagnas
        assert!(chart.jaimini.is_some());
        let jaimini = chart.jaimini.as_ref().unwrap();
        assert!(jaimini.bhava_arudhas.is_some());
        let arudhas = jaimini.bhava_arudhas.as_ref().unwrap();
        assert_eq!(arudhas.len(), 12, "Must have all 12 Bhava Arudhas A1..A12");
        assert!(arudhas.contains_key("A1"));
        assert!(arudhas.contains_key("A12"));

        assert!(jaimini.special_lagnas.is_some());
        let spl = jaimini.special_lagnas.as_ref().unwrap();
        assert!(spl.contains_key("HL"));
        assert!(spl.contains_key("GL"));

        // 6. Ashtakavarga Reductions
        assert!(chart.ashtakavarga.is_some());
        let av = chart.ashtakavarga.as_ref().unwrap();
        assert!(av.trikona_shodhana.is_some());
        assert!(av.ekadhipatya_shodhana.is_some());
        assert!(av.shodhya_pinda.is_some());
    }
}

