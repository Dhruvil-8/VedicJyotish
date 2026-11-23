//! Pure Vedic Chart Calculator
//!
//! Deterministic calculation of complete Vedic Chart (Kundli) given
//! planetary coordinates and astronomical snapshot values.
//! Zero C-dependencies, zero network, zero filesystem access.

use std::collections::HashMap;
use chrono::{Datelike, NaiveDate, NaiveDateTime, NaiveTime};
use serde::{Deserialize, Serialize};

use crate::constants::{
    COMBUSTION_DEGREES, DASHA_SEQ, FUNCTIONAL_MALEFICS, MOOLATRIKONA, NAKSHATRA_NAMES,
    NAKSHATRA_SPAN, PADA_SPAN, SIGNS, STRENGTH_CHART,
};
use crate::models::{
    AscendantInfo, BhavaCuspData, CalculationProfile, ChartResponse, LocationInfo,
    MoonIntelligence, Nakshatra, PlanetData, PlanetaryRow, UpagrahaData,
};
use crate::panchanga::{self, LunarMonthInfo, SunMoonCoordinates};
use crate::transit::calculate_sade_sati;
use crate::{argala, ashtakavarga, chart, dasha, drishti, service, shadbala, yoga};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawPlanetCoordinate {
    pub name: String,
    pub longitude: f64,
    pub speed: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoreChartInput {
    pub date: String,
    pub time: String,
    pub lat: f64,
    pub lon: f64,
    #[serde(default)]
    pub timezone: Option<f64>,
    #[serde(default)]
    pub city: Option<String>,
    #[serde(default)]
    pub timezone_name: Option<String>,
    pub ascendant_degree: f64,
    pub ayanamsa_value: f64,
    pub house_cusps: Vec<f64>,
    pub planets: Vec<RawPlanetCoordinate>,
    #[serde(default)]
    pub profile: Option<CalculationProfile>,
    #[serde(default)]
    pub current_saturn_longitude: Option<f64>,
    #[serde(default)]
    pub sunrise_jd: Option<f64>,
    #[serde(default)]
    pub sunset_jd: Option<f64>,
    #[serde(default)]
    pub next_sunrise_jd: Option<f64>,
    #[serde(default)]
    pub jd_ut: Option<f64>,
    #[serde(default)]
    pub lunar_month_info: Option<LunarMonthInfo>,
    #[serde(default)]
    pub amanta_month: Option<usize>,
    #[serde(default)]
    pub purnimanta_month: Option<usize>,
    #[serde(default)]
    pub is_adhika_month: Option<bool>,
}

pub fn normalize_degree(degree: f64) -> f64 {
    degree.rem_euclid(360.0)
}

pub fn round2(value: f64) -> f64 {
    (value * 100.0).round() / 100.0
}

pub fn round4(value: f64) -> f64 {
    (value * 10_000.0).round() / 10_000.0
}

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
            0 => "Mars",
            1 => "Venus",
            2 => "Mercury",
            3 => "Moon",
            4 => "Sun",
            5 => "Mercury",
            6 => "Venus",
            7 => "Mars",
            8 => "Jupiter",
            9 => "Saturn",
            10 => "Saturn",
            11 => "Jupiter",
            _ => "Unknown",
        }
    };

    for i in 0..planets.len() {
        let p = &planets[i];
        if p.strength == "Neutral" || p.strength == "Friend" || p.strength == "Enemy" {
            let sign_idx = chart::sign_index(p.full_degree);
            let lord = sign_lord(sign_idx);
            if let Some(&lord_house) = house_map.get(lord) {
                let relationship =
                    crate::maitri::get_fivefold_relationship(&p.name, lord, p.house, lord_house);
                planets[i].strength = relationship.to_string();
            }
        }
    }
}

fn get_nakshatra(degree: f64) -> Nakshatra {
    let span = NAKSHATRA_SPAN;
    let norm_deg = normalize_degree(degree);
    let idx = (norm_deg / span).floor() as usize;
    let degree_in_nak = norm_deg % span;
    let pada_span = PADA_SPAN;
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

fn calculate_dig_bala(name: &str, planet_long: f64, asc_long: f64) -> Option<(f64, f64)> {
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
                0 => "Mars",
                1 => "Venus",
                2 => "Mercury",
                3 => "Moon",
                4 => "Sun",
                5 => "Mercury",
                6 => "Venus",
                7 => "Mars",
                8 => "Jupiter",
                9 => "Saturn",
                10 => "Saturn",
                11 => "Jupiter",
                _ => "Unknown",
            }
            .to_string()
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

pub fn compute_chart_core(input: CoreChartInput) -> Result<ChartResponse, String> {
    let profile = input.profile.unwrap_or_default();
    let asc_idx = chart::sign_index(input.ascendant_degree);
    let sun_deg = input
        .planets
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.longitude)
        .unwrap_or(0.0);

    let mut planets = Vec::new();
    for raw in &input.planets {
        planets.push(build_planet(
            &raw.name,
            raw.longitude,
            raw.speed,
            asc_idx,
            sun_deg,
            input.ascendant_degree,
        ));
    }

    let rahu = planets
        .iter()
        .find(|p| p.name == "Rahu")
        .ok_or_else(|| "Rahu calculation missing.".to_string())?;
    let ketu_deg = normalize_degree(rahu.full_degree + 180.0);
    planets.push(build_planet(
        "Ketu",
        ketu_deg,
        -1.0,
        asc_idx,
        sun_deg,
        input.ascendant_degree,
    ));

    assign_chara_karakas(&mut planets);
    assign_fivefold_friendship(&mut planets);

    let moon = planets
        .iter()
        .find(|p| p.name == "Moon")
        .cloned()
        .ok_or_else(|| "Moon calculation missing.".to_string())?;
    let moon_nak = get_nakshatra(moon.full_degree);

    // Parse date & time
    let date_clean = input.date.trim().replace(['-', '.'], "/");
    let parts: Vec<&str> = date_clean.split('/').collect();
    let (d, m, y) = if parts.len() == 3 {
        let p0 = parts[0].parse::<u32>().unwrap_or(1);
        let p1 = parts[1].parse::<u32>().unwrap_or(1);
        let p2 = parts[2].parse::<i32>().unwrap_or(2000);
        if p0 > 31 {
            // YYYY/MM/DD
            (parts[2].parse::<u32>().unwrap_or(1), p1, parts[0].parse::<i32>().unwrap_or(2000))
        } else {
            // DD/MM/YYYY
            (p0, p1, p2)
        }
    } else {
        (1, 1, 2000)
    };
    let naive_date = NaiveDate::from_ymd_opt(y, m, d).unwrap_or_else(|| NaiveDate::from_ymd_opt(2000, 1, 1).unwrap());

    let time_clean = input.time.trim();
    let t_parts: Vec<&str> = time_clean.split(':').collect();
    let (th, tm, ts) = if t_parts.len() >= 2 {
        (
            t_parts[0].parse::<u32>().unwrap_or(12),
            t_parts[1].parse::<u32>().unwrap_or(0),
            t_parts.get(2).and_then(|s| s.parse::<u32>().ok()).unwrap_or(0),
        )
    } else {
        (12, 0, 0)
    };
    let naive_time = NaiveTime::from_hms_opt(th, tm, ts).unwrap_or_else(|| NaiveTime::from_hms_opt(12, 0, 0).unwrap());
    let local_naive = NaiveDateTime::new(naive_date, naive_time);

    let dasha_year_days = service::parse_dasha_year_days(&profile.dasha_year);
    let timeline = service::vimshottari_timeline_with_year(&moon_nak, local_naive, dasha_year_days);

    let chart_data = chart::build_rasi_chart(asc_idx, &planets);
    let navamsa_chart = chart::build_navamsa_chart(input.ascendant_degree, &planets);

    let offset_hours = input.timezone.unwrap_or(0.0);
    let jd_ut = input.jd_ut.unwrap_or_else(|| {
        let (y, m, d) = (naive_date.year(), naive_date.month() as i32, naive_date.day() as f64);
        let dec_hour = (th as f64) + (tm as f64) / 60.0 + (ts as f64) / 3600.0 - offset_hours;
        let mut adj_y = y;
        let mut adj_m = m;
        if adj_m <= 2 {
            adj_y -= 1;
            adj_m += 12;
        }
        let a = (adj_y as f64 / 100.0).floor();
        let b = 2.0 - a + (a / 4.0).floor();
        (365.25 * (adj_y as f64 + 4716.0)).floor()
            + (30.6001 * (adj_m as f64 + 1.0)).floor()
            + d + (dec_hour / 24.0) + b - 1524.5
    });

    let sunrise_jd = input.sunrise_jd.unwrap_or(jd_ut - 0.25);
    let sunset_jd = input.sunset_jd.unwrap_or(jd_ut + 0.25);
    let next_sunrise_jd = input.next_sunrise_jd.unwrap_or(sunrise_jd + 1.0);

    let coords = SunMoonCoordinates {
        sun_degree: sun_deg,
        moon_degree: moon.full_degree,
        sunrise_jd,
        sunset_jd,
        next_sunrise_jd,
    };

    let lunar_month_info = input.lunar_month_info.or_else(|| {
        input.amanta_month.map(|amanta| LunarMonthInfo {
            amanta_masa_idx: amanta,
            purnimanta_masa_idx: input.purnimanta_month.unwrap_or(amanta),
            is_adhika: input.is_adhika_month.unwrap_or(false),
        })
    });

    let mut panchanga = panchanga::calculate_panchanga_advanced(
        &coords,
        local_naive,
        jd_ut,
        offset_hours,
        input.lat,
        input.lon,
        Some(input.ayanamsa_value),
        lunar_month_info,
    );
    panchanga.ayanamsha = Some(input.ayanamsa_value);

    let yogas = yoga::detect_yogas(&planets, asc_idx);
    let planetary_table: Vec<PlanetaryRow> = planets
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

    let ashtakavarga = ashtakavarga::calculate(&positions);

    let (divisional_charts, divisional_planets) =
        chart::calculate_varga_charts(input.ascendant_degree, &planets);

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

    let jaimini = calculate_jaimini_lagnas(&planets, asc_idx, input.ascendant_degree);

    let aspects = drishti::calculate_drishti(asc_idx, &planets);

    let argala = argala::calculate_argala(&planets);

    let chara_dasha = dasha::calculate_chara_dasha(SIGNS[asc_idx], &planets, &input.date);

    let ss_res = if let Some(sat_long) = input.current_saturn_longitude {
        let saturn_sign_idx = chart::sign_index(sat_long);
        let saturn_sign = SIGNS[saturn_sign_idx];
        Some(calculate_sade_sati(&moon.sign, saturn_sign))
    } else {
        None
    };

    let mut weekday_idx = local_naive.weekday().num_days_from_monday() as usize;
    if jd_ut < sunrise_jd {
        weekday_idx = (weekday_idx + 6) % 7;
    }
    let vedic_weekday_idx = (weekday_idx + 1) % 7;

    let shadbala_res =
        shadbala::calculate_shadbala(&planets, input.ascendant_degree, vedic_weekday_idx);
    let bhava_res =
        shadbala::calculate_bhava_bala(input.ascendant_degree, &planets, &shadbala_res);
    let war_res = shadbala::detect_graha_yuddha(&planets, &shadbala_res);

    // Bhava Chalit Cusps
    let mut bhava_cusps = Vec::with_capacity(12);
    for h in 1..=12 {
        let cusp_deg = if input.house_cusps.len() > h && input.house_cusps[h] > 0.0 {
            input.house_cusps[h]
        } else {
            normalize_degree(input.ascendant_degree + (h as f64 - 1.0) * 30.0)
        };
        let start_deg = normalize_degree(cusp_deg - 15.0);
        let end_deg = normalize_degree(cusp_deg + 15.0);
        let h_sign_idx = chart::sign_index(cusp_deg);

        let occ_planets: Vec<String> = planets
            .iter()
            .filter(|p| {
                let dist = normalize_degree(p.full_degree - start_deg);
                dist < 30.0
            })
            .map(|p| p.name.clone())
            .collect();

        bhava_cusps.push(BhavaCuspData {
            house: h as u8,
            sign: SIGNS[h_sign_idx].to_string(),
            sign_index: h_sign_idx,
            start_degree: round2(start_deg),
            cusp_degree: round2(cusp_deg),
            end_degree: round2(end_deg),
            planets: occ_planets,
        });
    }

    // Classical Upagrahas
    let dhuma_long = normalize_degree(sun_deg + 133.33333333333334);
    let vyatipata_long = normalize_degree(360.0 - dhuma_long);
    let parivesha_long = normalize_degree(vyatipata_long + 180.0);
    let indrachapa_long = normalize_degree(360.0 - parivesha_long);
    let upaketu_long = normalize_degree(indrachapa_long + 16.666666666666668);
    let gulika_long = normalize_degree(input.ascendant_degree + 90.0);
    let mandi_long = normalize_degree(input.ascendant_degree + 85.0);

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
        upagrahas.push(UpagrahaData {
            name: uname.to_string(),
            sign: SIGNS[usign_idx].to_string(),
            sign_index: usign_idx,
            longitude: round2(ulong),
            house: uhouse,
        });
    }

    Ok(ChartResponse {
        birth_date: input.date.clone(),
        birth_time: input.time.clone(),
        profile,
        location: LocationInfo {
            city: input.city,
            lat: input.lat,
            lon: input.lon,
            tz: offset_hours,
            timezone_name: input.timezone_name,
        },
        ascendant: AscendantInfo {
            sign: SIGNS[asc_idx].to_string(),
            degree: input.ascendant_degree,
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
