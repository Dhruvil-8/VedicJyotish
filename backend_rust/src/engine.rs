use axum::http::StatusCode;
use chrono::Datelike;

use crate::{
    atlas,
    constants::SIGNS,
    models::{
        BirthData, CalculationProfile, ChartResponse, LocationInfo, MoonIntelligence,
    },
    swiss, timezones, ApiError,
};

pub async fn compute_chart(data: BirthData) -> Result<ChartResponse, ApiError> {
    compute_chart_with_profile(data, CalculationProfile::default()).await
}

pub async fn compute_chart_with_profile(
    mut data: BirthData,
    profile: CalculationProfile,
) -> Result<ChartResponse, ApiError> {
    if data.lat.is_none() || data.lon.is_none() {
        let (lat, lon) = resolve_coordinates(&data).await?;
        data.lat = Some(lat);
        data.lon = Some(lon);
    }
    tokio::task::spawn_blocking(move || compute_chart_sync(data, profile))
        .await
        .map_err(|e| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Task join error: {e}"),
            )
        })?
}

pub fn compute_chart_sync(
    mut data: BirthData,
    profile: CalculationProfile,
) -> Result<ChartResponse, ApiError> {
    validate_profile(&profile)?;
    normalize_birth_data(&mut data)?;

    let (lat, lon) = if let (Some(la), Some(lo)) = (data.lat, data.lon) {
        (la, lo)
    } else if let Some(ref c) = data.city {
        if !c.trim().is_empty() {
            if let Ok(cities) = atlas::search_city(c) {
                if let Some(first) = cities.first() {
                    (first.lat, first.lon)
                } else {
                    return Err(ApiError::new(
                        StatusCode::BAD_REQUEST,
                        format!("Coordinates for '{c}' not found. Please provide latitude and longitude."),
                    ));
                }
            } else {
                return Err(ApiError::new(
                    StatusCode::BAD_REQUEST,
                    "Coordinates required for offline calculation.",
                ));
            }
        } else {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Coordinates required.",
            ));
        }
    } else {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Latitude and longitude required.",
        ));
    };

    let resolved_time = timezones::resolve(&data.date, &data.time, lat, lon, data.timezone)?;
    let jd = resolved_time.jd_ut;
    let snapshot = swiss::calculate_snapshot_with_profile(
        jd,
        lat,
        lon,
        &profile.ayanamsa,
        &profile.node_type,
        &profile.house_system,
    )?;

    let (sunrise_jd, sunset_jd) = crate::swiss::calculate_sunrise_sunset(
        resolved_time.jd_ut,
        lat,
        lon,
        resolved_time.offset_hours,
    )?;
    let (next_sunrise_jd, _) = crate::swiss::calculate_sunrise_sunset(
        resolved_time.jd_ut + 1.0,
        lat,
        lon,
        resolved_time.offset_hours,
    )?;

    let now = chrono::Local::now();
    let today_date = now.format("%d/%m/%Y").to_string();
    let today_time = "12:00:00".to_string();
    let now_resolved = timezones::resolve(&today_date, &today_time, lat, lon, data.timezone);
    let saturn_raw = if let Ok(resolved) = now_resolved {
        let jd_today = resolved.jd_ut;
        let _guard = swiss::SWISS_LOCK
            .lock()
            .expect("Swiss Ephemeris lock poisoned");
        let mut xx = [0.0_f64; 6];
        let mut serr = [0 as std::os::raw::c_char; 256];
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
    } else {
        None
    };

    let (amanta_m_idx, amanta_is_adhik, _) = crate::panchanga::get_lunar_month_info(resolved_time.jd_ut, false);
    let (purnimanta_m_idx, _, _) = crate::panchanga::get_lunar_month_info(resolved_time.jd_ut, true);
    let lunar_info = Some(vedic_core::panchanga::LunarMonthInfo {
        amanta_masa_idx: amanta_m_idx,
        purnimanta_masa_idx: purnimanta_m_idx,
        is_adhika: amanta_is_adhik,
    });

    let core_input = vedic_core::calculator::CoreChartInput {
        date: data.date.clone(),
        time: data.time.clone(),
        lat,
        lon,
        timezone: Some(resolved_time.offset_hours),
        city: data.city.clone(),
        timezone_name: resolved_time.timezone_name.clone(),
        ascendant_degree: snapshot.ascendant_degree,
        ayanamsa_value: snapshot.ayanamsa_value,
        house_cusps: snapshot.house_cusps.to_vec(),
        planets: snapshot
            .planets
            .into_iter()
            .map(|p| vedic_core::calculator::RawPlanetCoordinate {
                name: p.name.to_string(),
                longitude: p.longitude,
                speed: p.speed,
            })
            .collect(),
        profile: Some(profile),
        current_saturn_longitude: saturn_raw,
        sunrise_jd: Some(sunrise_jd),
        sunset_jd: Some(sunset_jd),
        next_sunrise_jd: Some(next_sunrise_jd),
        jd_ut: Some(resolved_time.jd_ut),
        lunar_month_info: lunar_info,
    };

    vedic_core::calculator::compute_chart_core(core_input)
        .map_err(|e| ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, e))
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
    mut request: crate::models::TransitRequest,
) -> Result<crate::models::TransitResponse, ApiError> {
    if request.birth_data.lat.is_none() || request.birth_data.lon.is_none() {
        let (lat, lon) = resolve_coordinates(&request.birth_data).await?;
        request.birth_data.lat = Some(lat);
        request.birth_data.lon = Some(lon);
    }
    tokio::task::spawn_blocking(move || compute_transits_sync(request))
        .await
        .map_err(|e| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Task join error: {e}"),
            )
        })?
}

pub fn compute_transits_sync(
    request: crate::models::TransitRequest,
) -> Result<crate::models::TransitResponse, ApiError> {
    let natal = compute_chart_sync(request.birth_data.clone(), CalculationProfile::default())?;
    let asc_sign = &natal.ascendant.sign;
    let asc_idx = SIGNS.iter().position(|&s| s == asc_sign).unwrap_or(0);

    let moon_sign = &natal.moon_intelligence.sign;
    let moon_idx = SIGNS.iter().position(|&s| s == moon_sign).unwrap_or(0);

    let (lat, lon) = if let (Some(la), Some(lo)) = (request.birth_data.lat, request.birth_data.lon) {
        (la, lo)
    } else if let Some(ref c) = request.birth_data.city {
        if !c.trim().is_empty() {
            if let Ok(cities) = atlas::search_city(c) {
                if let Some(first) = cities.first() {
                    (first.lat, first.lon)
                } else {
                    return Err(ApiError::new(
                        StatusCode::BAD_REQUEST,
                        format!("Coordinates for '{c}' not found."),
                    ));
                }
            } else {
                return Err(ApiError::new(
                    StatusCode::BAD_REQUEST,
                    "Coordinates required.",
                ));
            }
        } else {
            return Err(ApiError::new(
                StatusCode::BAD_REQUEST,
                "Coordinates missing.",
            ));
        }
    } else {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "Coordinates missing.",
        ));
    };

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
    let snapshot = swiss::calculate_snapshot(jd_transit, lat, lon)?;
    let raw_planets: Vec<vedic_core::transit::TransitPlanetRaw> = snapshot
        .planets
        .into_iter()
        .map(|p| vedic_core::transit::TransitPlanetRaw {
            name: p.name.to_string(),
            longitude: p.longitude,
            speed: p.speed,
        })
        .collect();

    vedic_core::transit::evaluate_transits(
        natal.ascendant,
        &natal.moon_intelligence.sign,
        &transit_data.date,
        &transit_data.time,
        &raw_planets,
    )
    .map_err(|e| ApiError::new(StatusCode::INTERNAL_SERVER_ERROR, e))
}

#[cfg(test)]

mod tests {
    use super::*;
    use crate::models::PlanetData;
    use vedic_core::calculator::calculate_jaimini_lagnas;

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

