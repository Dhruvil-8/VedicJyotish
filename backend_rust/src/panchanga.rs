use axum::http::StatusCode;
use chrono::{Datelike, NaiveDateTime};

use crate::{
    models::{Panchanga, PanchangaElement, PlanetData},
    swiss, ApiError,
};

const TITHI_NAMES: [&str; 30] = [
    "Shukla Pratipada",
    "Shukla Dwitiya",
    "Shukla Tritiya",
    "Shukla Chaturthi",
    "Shukla Panchami",
    "Shukla Shashthi",
    "Shukla Saptami",
    "Shukla Ashtami",
    "Shukla Navami",
    "Shukla Dashami",
    "Shukla Ekadashi",
    "Shukla Dwadashi",
    "Shukla Trayodashi",
    "Shukla Chaturdashi",
    "Purnima",
    "Krishna Pratipada",
    "Krishna Dwitiya",
    "Krishna Tritiya",
    "Krishna Chaturthi",
    "Krishna Panchami",
    "Krishna Shashthi",
    "Krishna Saptami",
    "Krishna Ashtami",
    "Krishna Navami",
    "Krishna Dashami",
    "Krishna Ekadashi",
    "Krishna Dwadashi",
    "Krishna Trayodashi",
    "Krishna Chaturdashi",
    "Amavasya",
];

const YOGA_NAMES: [&str; 27] = [
    "Vishkambha",
    "Priti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shoola",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyana",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti",
];

const KARANA_NAMES: [&str; 11] = [
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Garaja",
    "Vanija",
    "Vishti",
    "Shakuni",
    "Chatushpada",
    "Naga",
    "Kimstughna",
];

const VARA_NAMES: [&str; 7] = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

pub const MASA_NAMES: [&str; 12] = [
    "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
];

pub const SAMVATSARA_NAMES: [&str; 60] = [
    "Prabhava", "Vibhava", "Shukla", "Pramoda", "Prajapati", "Angirasa", "Shrimukha", "Bhava",
    "Yuva", "Dhatri", "Ishvara", "Bahudhanya", "Pramathi", "Vikrama", "Vrisha", "Chitrabhanu",
    "Subhanu", "Tarana", "Parthiva", "Vyaya", "Sarvajit", "Sarvadhari", "Virodhi", "Vikrita",
    "Khara", "Nandana", "Vijaya", "Jaya", "Manmatha", "Durmukha", "Hemalamba", "Vilamba",
    "Vikari", "Sharvari", "Plava", "Shubhakrit", "Shobhakrit", "Krodhi", "Vishvavasu", "Parabhava",
    "Plavanga", "Kilaka", "Saumya", "Sadharana", "Virodhikrit", "Paridhavi", "Pramadicha", "Ananda",
    "Rakshasa", "Nala", "Pingala", "Kalayukta", "Siddharthi", "Raudra", "Durmati", "Dundubhi",
    "Rudhirodgari", "Raktakshi", "Krodhana", "Kshaya",
];

pub const RITU_NAMES: [&str; 6] = [
    "Vasanta (Spring)",
    "Grishma (Summer)",
    "Varsha (Monsoon)",
    "Sharad (Autumn)",
    "Hemanta (Pre-winter)",
    "Shishira (Winter)",
];

pub const PRAHAR_NAMES: [(&str, &str); 8] = [
    ("Pratah Prahar (Dawn to Morning)", "प्रातः प्रहर"),
    ("Madhyahna Prahar (Midday / Noon)", "मध्याह्न प्रहर"),
    ("Aparahna Prahar (Afternoon)", "अपराह्न प्रहर"),
    ("Sayahna Prahar (Late Afternoon to Sunset)", "सायाह्न प्रहर"),
    ("Pradosha Prahar (Early Evening)", "प्रदोष प्रहर"),
    ("Nishitha Prahar (Midnight)", "निशीथ प्रहर"),
    ("Triyama Prahar (Late Night)", "त्रियामा प्रहर"),
    ("Usha Prahar (Pre-dawn / Brahma)", "उषा प्रहर"),
];

pub const MUHURTA_NAMES: [&str; 30] = [
    "Rudra", "Ahi", "Mitra", "Pitri", "Vasu", "Varaha", "Vishvedeva", "Vidhi", "Sutamukhi", "Puruhuta",
    "Vahni", "Naktanchara", "Varuna", "Aryaman", "Bhaga",
    "Girisha", "Ajapada", "Ahirbudhnya", "Pushan", "Ashvini", "Yama", "Agni", "Vidhatri", "Kandu", "Aditi",
    "Jiva", "Vishnu", "Dyumani", "Brahma", "Samudra",
];

pub const VARA_SANSKRIT: [&str; 7] = [
    "Somavara", "Mangalavara", "Budhavara", "Guruvara", "Shukravara", "Shanivara", "Ravivara",
];

fn julian_to_local_time(jd_ut: f64, offset_hours: f64) -> String {
    let unix_timestamp = (jd_ut - 2440587.5) * 86400.0;
    if let Some(naive_utc) =
        chrono::DateTime::from_timestamp(unix_timestamp.round() as i64, 0).map(|dt| dt.naive_utc())
    {
        let local_dt =
            naive_utc + chrono::Duration::seconds((offset_hours * 3600.0).round() as i64);
        let rounded_dt = local_dt + chrono::Duration::seconds(30);
        rounded_dt.format("%H:%M").to_string()
    } else {
        "Unknown".to_string()
    }
}

pub fn calculate(
    planets: &[PlanetData],
    local_dt: NaiveDateTime,
    jd_ut: f64,
    offset_hours: f64,
    lat: f64,
    lon: f64,
) -> Result<Panchanga, ApiError> {
    let sun = planet_degree(planets, "Sun")?;
    let moon = planet_degree(planets, "Moon")?;
    let moon_sun = swiss::normalize_degree(moon - sun);
    let tithi_index = (moon_sun / 12.0).floor() as usize;
    let tithi_progress = (moon_sun % 12.0) / 12.0;

    let nak_span = 360.0 / 27.0;
    let nak_index = (moon / nak_span).floor() as usize;
    let nak_progress = (moon % nak_span) / nak_span;

    let yoga_degree = swiss::normalize_degree(sun + moon);
    let yoga_index = (yoga_degree / nak_span).floor() as usize;
    let yoga_progress = (yoga_degree % nak_span) / nak_span;

    let karana_index = karana_index((moon_sun / 6.0).floor() as usize);
    let karana_progress = (moon_sun % 6.0) / 6.0;

    let sun_sign = Some(
        planets
            .iter()
            .find(|p| p.name == "Sun")
            .map(|p| p.sign.clone())
            .unwrap_or_default(),
    );
    let moon_sign = Some(
        planets
            .iter()
            .find(|p| p.name == "Moon")
            .map(|p| p.sign.clone())
            .unwrap_or_default(),
    );

    let lords = [
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    ];
    let nakshatra_lord = Some(lords[nak_index % 9].to_string());

    let tithi_lords = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Sun", "Moon",
        "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Ketu",
    ];
    let tithi_lord = Some(match tithi_index {
        14 => "Saturn".to_string(), // Purnima
        29 => "Ketu".to_string(),   // Amavasya
        idx => tithi_lords[idx % 15].to_string(),
    });

    let yoga_lords = [
        "Jupiter", "Saturn", "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Mercury",
    ];
    let yoga_lord = Some(yoga_lords[yoga_index % 9].to_string());

    let karana_lords = [
        "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu", "Rahu",
        "Ketu",
    ];
    let karana_lord = Some(karana_lords[karana_index].to_string());

    let (sunrise_jd, sunset_jd) = crate::swiss::calculate_sunrise_sunset(jd_ut, lat, lon, offset_hours)?;
    let sunrise = Some(julian_to_local_time(sunrise_jd, offset_hours));
    let sunset = Some(julian_to_local_time(sunset_jd, offset_hours));

    let mut weekday_idx = local_dt.weekday().num_days_from_monday() as usize;
    if jd_ut < sunrise_jd {
        weekday_idx = (weekday_idx + 6) % 7;
    }

    let vara_lord = Some(
        match VARA_NAMES[weekday_idx] {
            "Monday" => "Moon",
            "Tuesday" => "Mars",
            "Wednesday" => "Mercury",
            "Thursday" => "Jupiter",
            "Friday" => "Venus",
            "Saturday" => "Saturn",
            "Sunday" => "Sun",
            _ => "Unknown",
        }
        .to_string(),
    );

    let ayanamsha = unsafe {
        let _guard = swiss::SWISS_LOCK
            .lock()
            .expect("Swiss Ephemeris lock poisoned");
        Some(swiss_eph::swe_get_ayanamsa_ut(jd_ut))
    };

    let rahu_slots = [2, 7, 5, 6, 4, 3, 8];
    let yama_slots = [4, 3, 2, 1, 7, 6, 5];
    let gulika_slots = [6, 5, 4, 3, 2, 1, 7];

    let r_slot = rahu_slots[weekday_idx % 7];
    let y_slot = yama_slots[weekday_idx % 7];
    let g_slot = gulika_slots[weekday_idx % 7];

    let daytime_jd = sunset_jd - sunrise_jd;
    let slot_jd = daytime_jd / 8.0;

    let get_slot_range = |slot_num: usize| -> String {
        let s_start = sunrise_jd + (slot_num - 1) as f64 * slot_jd;
        let s_end = sunrise_jd + slot_num as f64 * slot_jd;
        format!(
            "{} - {}",
            julian_to_local_time(s_start, offset_hours),
            julian_to_local_time(s_end, offset_hours)
        )
    };

    let rahu_kaal = Some(get_slot_range(r_slot));
    let yama_ganda = Some(get_slot_range(y_slot));
    let gulika_kaal = Some(get_slot_range(g_slot));

    // Abhijit Muhurat: +/- 24 minutes from solar noon (noon = midpoint between rise and set)
    let solar_noon_jd = sunrise_jd + daytime_jd / 2.0;
    let abhijit_start = solar_noon_jd - (24.0 / 1440.0);
    let abhijit_end = solar_noon_jd + (24.0 / 1440.0);
    let abhijit_muhurat = Some(format!(
        "{} - {}",
        julian_to_local_time(abhijit_start, offset_hours),
        julian_to_local_time(abhijit_end, offset_hours)
    ));

    // Vijaya Muhurta: 11th Muhurta of the day (starts 10/15 of daytime, ends 11/15)
    let vijaya_start = sunrise_jd + daytime_jd * 10.0 / 15.0;
    let vijaya_end = sunrise_jd + daytime_jd * 11.0 / 15.0;
    let vijaya_muhurta = Some(format!(
        "{} - {}",
        julian_to_local_time(vijaya_start, offset_hours),
        julian_to_local_time(vijaya_end, offset_hours)
    ));

    // Brahma Muhurta: 96 to 48 minutes before sunrise
    let brahma_start = sunrise_jd - (96.0 / 1440.0);
    let brahma_end = sunrise_jd - (48.0 / 1440.0);
    let brahma_muhurta = Some(format!(
        "{} - {}",
        julian_to_local_time(brahma_start, offset_hours),
        julian_to_local_time(brahma_end, offset_hours)
    ));

    // Pradosh Kaal: Sunset to 96 minutes after sunset
    let pradosh_start = sunset_jd;
    let pradosh_end = sunset_jd + (96.0 / 1440.0);
    let pradosh_kaal = Some(format!(
        "{} - {}",
        julian_to_local_time(pradosh_start, offset_hours),
        julian_to_local_time(pradosh_end, offset_hours)
    ));

    // Tomorrow's sunrise to calculate exact nighttime duration
    let (tomorrow_sunrise_jd, _) = crate::swiss::calculate_sunrise_sunset(jd_ut + 1.0, lat, lon, offset_hours)?;
    let night_dur = tomorrow_sunrise_jd - sunset_jd;

    // Dur Muhurtham: Calculated using standard daily astronomical offsets
    let vaara_idx = (weekday_idx + 1) % 7; // Sunday = 0, Monday = 1, ..., Saturday = 6
    let dur_offsets = [
        [10.4, -1.0], // Sunday
        [6.4, 8.8],   // Monday
        [2.4, 4.8],   // Tuesday
        [5.6, -1.0],  // Wednesday
        [4.0, 8.8],   // Thursday
        [2.4, 6.4],   // Friday
        [0.0, -1.0],  // Saturday
    ];

    let mut dur_muhurtham_slots = Vec::new();
    for i in 0..2 {
        let offset = dur_offsets[vaara_idx][i];
        if offset >= 0.0 {
            let (base_jd, dur) = if vaara_idx == 2 && i == 1 {
                (sunset_jd, night_dur)
            } else {
                (sunrise_jd, daytime_jd)
            };
            let start_jd = base_jd + dur * offset / 12.0;
            let span = if vaara_idx == 6 { 1.6 } else { 0.8 };
            let end_jd = start_jd + dur * span / 12.0;
            dur_muhurtham_slots.push(format!(
                "{} - {}",
                julian_to_local_time(start_jd, offset_hours),
                julian_to_local_time(end_jd, offset_hours)
            ));
        }
    }
    let dur_muhurtham = Some(dur_muhurtham_slots);

    // Choghadiya Daytime
    let choghadiya_sequence = ["Amrit", "Kala", "Shubh", "Rog", "Udveg", "Char", "Labh"];
    let choghadiya_starts = [0, 3, 6, 2, 5, 1, 4]; // Monday to Sunday starts
    let day_start_idx = choghadiya_starts[weekday_idx % 7];

    let mut choghadiya_slots = Vec::new();
    for k in 1..=8 {
        let name = choghadiya_sequence[(day_start_idx + k - 1) % 7].to_string();
        let nature = match name.as_str() {
            "Amrit" | "Shubh" | "Labh" | "Char" => "Auspicious".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunrise_jd + (k - 1) as f64 * slot_jd;
        let s_end = sunrise_jd + k as f64 * slot_jd;
        choghadiya_slots.push(crate::models::ChoghadiyaSlot {
            name,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let choghadiya = Some(choghadiya_slots);

    // Choghadiya Nighttime
    let night_choghadiya_starts = [5, 1, 4, 0, 3, 6, 2];
    let night_start_idx = night_choghadiya_starts[weekday_idx % 7];
    let night_slot_jd = night_dur / 8.0;

    let mut choghadiya_night_slots = Vec::new();
    for k in 1..=8 {
        let name_idx = (night_start_idx + (k - 1) * 5) % 7;
        let name = choghadiya_sequence[name_idx].to_string();
        let nature = match name.as_str() {
            "Amrit" | "Shubh" | "Labh" | "Char" => "Auspicious".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunset_jd + (k - 1) as f64 * night_slot_jd;
        let s_end = sunset_jd + k as f64 * night_slot_jd;
        choghadiya_night_slots.push(crate::models::ChoghadiyaSlot {
            name,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let choghadiya_night = Some(choghadiya_night_slots);

    // Planetary Horas (Day & Night)
    let hora_planets = [
        "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars",
    ];
    let hora_starts = [3, 6, 2, 5, 1, 4, 0];
    let start_idx = hora_starts[weekday_idx % 7];

    let day_hora_dur = daytime_jd / 12.0;
    let mut horas_day_slots = Vec::new();
    for h in 1..=12 {
        let planet_idx = (start_idx + h - 1) % 7;
        let planet = hora_planets[planet_idx].to_string();
        let nature = match planet.as_str() {
            "Jupiter" => "Highly Auspicious".to_string(),
            "Venus" | "Mercury" | "Moon" => "Auspicious".to_string(),
            "Sun" => "Neutral".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunrise_jd + (h - 1) as f64 * day_hora_dur;
        let s_end = sunrise_jd + h as f64 * day_hora_dur;
        horas_day_slots.push(crate::models::HoraSlot {
            hora_num: h as u8,
            planet,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let horas_day = Some(horas_day_slots);

    let night_hora_dur = night_dur / 12.0;
    let mut horas_night_slots = Vec::new();
    for h in 13..=24 {
        let planet_idx = (start_idx + h - 1) % 7;
        let planet = hora_planets[planet_idx].to_string();
        let nature = match planet.as_str() {
            "Jupiter" => "Highly Auspicious".to_string(),
            "Venus" | "Mercury" | "Moon" => "Auspicious".to_string(),
            "Sun" => "Neutral".to_string(),
            _ => "Inauspicious".to_string(),
        };
        let s_start = sunset_jd + (h - 13) as f64 * night_hora_dur;
        let s_end = sunset_jd + (h - 12) as f64 * night_hora_dur;
        horas_night_slots.push(crate::models::HoraSlot {
            hora_num: h as u8,
            planet,
            start: julian_to_local_time(s_start, offset_hours),
            end: julian_to_local_time(s_end, offset_hours),
            nature,
        });
    }
    let horas_night = Some(horas_night_slots);

    let paksha = if tithi_index < 15 {
        "Shukla".to_string()
    } else {
        "Krishna".to_string()
    };

    // Calculate Masa (Amanta & Purnimanta)
    let sun_sign_val = planets
        .iter()
        .find(|p| p.name == "Sun")
        .map(|p| p.full_degree)
        .unwrap_or(0.0);
    let _moon_sign_val = planets
        .iter()
        .find(|p| p.name == "Moon")
        .map(|p| p.full_degree)
        .unwrap_or(0.0);

    // Astronomical Lunar Month & Adhika/Nija Calculation (Classical Drik Ganita algorithm)
    let (amanta_m_idx, amanta_is_adhik, _amanta_is_nija) = get_lunar_month_info(jd_ut, false);
    let (purnimanta_m_idx, purnimanta_is_adhik, _purnimanta_is_nija) = get_lunar_month_info(jd_ut, true);

    let amanta_masa_idx = amanta_m_idx;
    let purnimanta_masa_idx = purnimanta_m_idx;
    let is_adhika_masa = amanta_is_adhik;

    let masa_amanta = Some(if amanta_is_adhik {
        format!("Adhik {}", MASA_NAMES[amanta_masa_idx])
    } else {
        MASA_NAMES[amanta_masa_idx].to_string()
    });

    let masa_purnimanta = Some(if purnimanta_is_adhik {
        format!("Adhik {}", MASA_NAMES[purnimanta_masa_idx])
    } else {
        MASA_NAMES[purnimanta_masa_idx].to_string()
    });

    let masa = masa_purnimanta.clone();

    // Samvat calculations
    let yr = local_dt.year();
    let mo = local_dt.month();
    let is_after_chaitra = mo > 3 || (mo == 3 && amanta_masa_idx == 0 && tithi_index < 15);
    let vikram_samvat = Some(if is_after_chaitra { (yr + 57) as u32 } else { (yr + 56) as u32 });
    let shaka_samvat = Some(if is_after_chaitra { (yr - 78) as u32 } else { (yr - 79) as u32 });
    let kali_samvat = Some((yr + 3101) as u32);
    let samvatsara_name = Some(SAMVATSARA_NAMES[((shaka_samvat.unwrap_or(1948) + 11) % 60) as usize].to_string());

    // Ritu & Ayana
    let ritu_idx = (amanta_masa_idx / 2) % 6;
    let ritu = Some(RITU_NAMES[ritu_idx].to_string());
    let ayana = Some(if sun_sign_val >= 270.0 || sun_sign_val < 90.0 {
        "Uttarayana".to_string()
    } else {
        "Dakshinayana".to_string()
    });

    // Traditional Vedic Time
    let ishta_days = if jd_ut >= sunrise_jd {
        jd_ut - sunrise_jd
    } else {
        jd_ut - (sunrise_jd - 1.0)
    };
    let ishta_ghati_total = (ishta_days * 60.0).rem_euclid(60.0);
    let ghati = ishta_ghati_total.floor() as u32;
    let rem_vi = (ishta_ghati_total - ishta_ghati_total.floor()) * 60.0;
    let vighati = rem_vi.floor() as u32;
    let vipal = ((rem_vi - rem_vi.floor()) * 60.0).floor() as u32;

    let (prahar_num, muhurta_num) = if jd_ut >= sunrise_jd && jd_ut < sunset_jd {
        let day_len = sunset_jd - sunrise_jd;
        let p = (((jd_ut - sunrise_jd) / (day_len / 4.0)).floor() as usize).min(3);
        let m = (((jd_ut - sunrise_jd) / (day_len / 15.0)).floor() as usize).min(14);
        ((p + 1) as u8, (m + 1) as u8)
    } else {
        let night_start = if jd_ut < sunrise_jd { sunrise_jd - (1.0 - (sunset_jd - sunrise_jd)) } else { sunset_jd };
        let p = 4 + (((jd_ut - night_start) / (night_dur / 4.0)).floor() as usize).min(3);
        let m = 15 + (((jd_ut - night_start) / (night_dur / 15.0)).floor() as usize).min(14);
        ((p + 1) as u8, (m + 1) as u8)
    };

    let vedic_time = Some(crate::models::VedicTime {
        ishta_ghati: round4(ishta_ghati_total),
        ghati,
        vighati,
        vipal,
        prahar_num,
        prahar_name: PRAHAR_NAMES[(prahar_num - 1) as usize].0.to_string(),
        prahar_sanskrit: PRAHAR_NAMES[(prahar_num - 1) as usize].1.to_string(),
        muhurta_num,
        muhurta_name: MUHURTA_NAMES[(muhurta_num - 1) as usize].to_string(),
    });

    Ok(Panchanga {
        vara: VARA_NAMES[weekday_idx].to_string(),
        tithi: PanchangaElement {
            index: (tithi_index + 1) as u8,
            name: TITHI_NAMES[tithi_index.min(29)].to_string(),
            progress: round4(tithi_progress),
        },
        nakshatra: PanchangaElement {
            index: (nak_index + 1) as u8,
            name: crate::constants::NAKSHATRA_NAMES[nak_index.min(26)].to_string(),
            progress: round4(nak_progress),
        },
        yoga: PanchangaElement {
            index: (yoga_index + 1) as u8,
            name: YOGA_NAMES[yoga_index.min(26)].to_string(),
            progress: round4(yoga_progress),
        },
        karana: PanchangaElement {
            index: (karana_index + 1) as u8,
            name: KARANA_NAMES[karana_index].to_string(),
            progress: round4(karana_progress),
        },
        paksha,
        sun_sign,
        moon_sign,
        nakshatra_lord,
        tithi_lord,
        yoga_lord,
        karana_lord,
        vara_lord,
        ayanamsha,
        sunrise,
        sunset,
        rahu_kaal,
        yama_ganda,
        gulika_kaal,
        abhijit_muhurat,
        choghadiya,
        vijaya_muhurta,
        brahma_muhurta,
        pradosh_kaal,
        dur_muhurtham,
        choghadiya_night,
        horas_day,
        horas_night,
        masa,
        masa_amanta,
        masa_purnimanta,
        is_adhika_masa: Some(is_adhika_masa),
        vikram_samvat,
        shaka_samvat,
        kali_samvat,
        samvatsara_name,
        ritu,
        ayana,
        vedic_time,
    })
}

/// Find the exact Julian Day of the New Moon (conjunction of Moon and Sun, separation = 0.0)
/// opt = -1 for previous New Moon, opt = +1 for next New Moon
pub fn find_exact_new_moon(jd: f64, opt: i32) -> f64 {
    let (s, m) = swiss::get_sun_moon_sidereal(jd);
    let diff = swiss::normalize_degree(m - s);
    let initial_offset = if opt < 0 {
        if diff < 1.0 { -29.53 } else { -diff / 12.190749 }
    } else {
        if diff > 359.0 { 29.53 } else { (360.0 - diff) / 12.190749 }
    };
    let mut cur_jd = jd + initial_offset;
    for _ in 0..4 {
        let (s_cur, m_cur) = swiss::get_sun_moon_sidereal(cur_jd);
        let d = swiss::normalize_degree(m_cur - s_cur);
        let d_signed = if d > 180.0 { d - 360.0 } else { d };
        cur_jd -= d_signed / 12.190749;
    }
    cur_jd
}

/// Find the exact Julian Day of the Full Moon (opposition of Moon and Sun, separation = 180.0)
/// opt = -1 for previous Full Moon, opt = +1 for next Full Moon
pub fn find_exact_full_moon(jd: f64, opt: i32) -> f64 {
    let (s, m) = swiss::get_sun_moon_sidereal(jd);
    let diff = swiss::normalize_degree(m - s);
    let diff_from_target = swiss::normalize_degree(diff - 180.0);
    let initial_offset = if opt < 0 {
        if diff_from_target < 1.0 { -29.53 } else { -diff_from_target / 12.190749 }
    } else {
        if diff_from_target > 359.0 { 29.53 } else { (360.0 - diff_from_target) / 12.190749 }
    };
    let mut cur_jd = jd + initial_offset;
    for _ in 0..4 {
        let (s_cur, m_cur) = swiss::get_sun_moon_sidereal(cur_jd);
        let d = swiss::normalize_degree(m_cur - s_cur);
        let d_diff = swiss::normalize_degree(d - 180.0);
        let d_signed = if d_diff > 180.0 { d_diff - 360.0 } else { d_diff };
        cur_jd -= d_signed / 12.190749;
    }
    cur_jd
}

/// Classical Drik lunar_month algorithm:
/// Returns (lunar_masa_index: usize, is_adhik: bool, is_nija: bool)
pub fn get_lunar_month_info(jd_ut: f64, use_purnimanta: bool) -> (usize, bool, bool) {
    let last_nm = find_exact_new_moon(jd_ut, -1);
    let next_nm = find_exact_new_moon(jd_ut, 1);
    let (sun_last, _) = swiss::get_sun_moon_sidereal(last_nm);
    let (sun_next, _) = swiss::get_sun_moon_sidereal(next_nm);
    let rashi_last = (sun_last / 30.0).floor() as usize;
    let rashi_next = (sun_next / 30.0).floor() as usize;

    let is_leap_month = rashi_last == rashi_next;
    let mut lunar_month = (rashi_last + 1) % 12;

    let mut is_nija_month = false;
    if !is_leap_month {
        // Check if the previous lunar month (approx 30 days before) was a leap month with the same name
        let prev_last_nm = find_exact_new_moon(last_nm - 1.0, -1);
        let (prev_sun_last, _) = swiss::get_sun_moon_sidereal(prev_last_nm);
        let prev_rashi_last = (prev_sun_last / 30.0).floor() as usize;
        let prev_is_leap = prev_rashi_last == rashi_last;
        let prev_masa = (prev_rashi_last + 1) % 12;
        if prev_is_leap && prev_masa == lunar_month {
            is_nija_month = true;
        }
    }

    if use_purnimanta {
        let (s, m) = swiss::get_sun_moon_sidereal(jd_ut);
        let moon_sun = swiss::normalize_degree(m - s);
        let tithi_idx = (moon_sun / 12.0).floor() as usize;
        if tithi_idx >= 15 {
            lunar_month = (lunar_month + 1) % 12;
        }
    }

    (lunar_month, is_leap_month, is_nija_month)
}

/// Check if Sun transitions across a Rashi boundary between jd_start and jd_end
pub fn check_day_sankranti(jd_start: f64, jd_end: f64) -> Option<(usize, &'static str)> {
    let (s_start, _) = swiss::get_sun_moon_sidereal(jd_start);
    let (s_end, _) = swiss::get_sun_moon_sidereal(jd_end);
    let r1 = (s_start / 30.0).floor() as usize;
    let r2 = (s_end / 30.0).floor() as usize;
    if r1 != r2 {
        Some((r2, crate::constants::SIGNS[r2.min(11)]))
    } else {
        None
    }
}

/// Helper to convert a Julian Day to local NaiveDate
pub fn jd_to_local_date(jd: f64, tz: f64) -> chrono::NaiveDate {
    let unix_ts = (jd - 2440587.5) * 86400.0;
    if let Some(utc) = chrono::DateTime::from_timestamp(unix_ts.round() as i64, 0) {
        let local = utc + chrono::Duration::seconds((tz * 3600.0).round() as i64);
        local.date_naive()
    } else {
        chrono::NaiveDate::from_ymd_opt(2026, 1, 1).unwrap()
    }
}

#[allow(dead_code)]
pub struct MonthCycleInfo {
    pub start_date: chrono::NaiveDate,
    pub days: Vec<chrono::NaiveDate>,
    pub masa_index: u8,
    pub is_adhik: bool,
    pub is_nija: bool,
    pub vikram_samvat: u32,
    pub shaka_samvat: u32,
}

/// Collects all lunar month cycles for a given year and tradition using Swiss Ephemeris.
pub fn get_year_lunar_cycles(
    year: i32,
    tradition: &str,
    lat: f64,
    lon: f64,
    tz: f64,
) -> Vec<MonthCycleInfo> {
    let use_purnimanta = tradition == "purnimanta" || tradition == "north";
    let is_kartikadi = tradition == "gujarat";

    let scan_start_jd = unsafe {
        swiss_eph::swe_julday(year - 1, 11, 15, 12.0 - tz, swiss_eph::SE_GREG_CAL)
    };
    let scan_end_jd = unsafe {
        swiss_eph::swe_julday(year + 1, 3, 15, 12.0 - tz, swiss_eph::SE_GREG_CAL)
    };

    let mut cycles = Vec::new();
    let mut cur_nm = find_exact_new_moon(scan_start_jd, 1);

    for _ in 0..18 {
        if cur_nm >= scan_end_jd {
            break;
        }
        let next_nm = find_exact_new_moon(cur_nm + 20.0, 1);
        if next_nm <= cur_nm + 20.0 {
            cur_nm = cur_nm + 29.53;
            continue;
        }

        let (sun_curr, _) = swiss::get_sun_moon_sidereal(cur_nm);
        let (sun_next, _) = swiss::get_sun_moon_sidereal(next_nm);
        let rashi_curr = (sun_curr / 30.0).floor() as usize;
        let rashi_next = (sun_next / 30.0).floor() as usize;

        let is_leap = rashi_curr == rashi_next;
        let base_amanta_masa = ((rashi_curr + 1) % 12) as u8;

        let mut is_nija = false;
        if !is_leap {
            let prev_nm = find_exact_new_moon(cur_nm - 1.0, -1);
            let (prev_sun, _) = swiss::get_sun_moon_sidereal(prev_nm);
            let prev_rashi = (prev_sun / 30.0).floor() as usize;
            if prev_rashi == rashi_curr {
                is_nija = true;
            }
        }

        let (start_jd, end_jd, cycle_masa) = if use_purnimanta {
            let prev_fm = find_exact_full_moon(cur_nm, -1);
            let next_fm = find_exact_full_moon(next_nm, -1);
            (prev_fm, next_fm, base_amanta_masa)
        } else {
            (cur_nm, next_nm, base_amanta_masa)
        };

        let approx_start_date = jd_to_local_date(start_jd, tz);
        let s_noon_jd = unsafe {
            swiss_eph::swe_julday(approx_start_date.year(), approx_start_date.month() as i32, approx_start_date.day() as i32, 12.0 - tz, swiss_eph::SE_GREG_CAL)
        };
        let (sunrise_jd, _) = swiss::calculate_sunrise_sunset(s_noon_jd, lat, lon, tz).unwrap_or((s_noon_jd - 0.25, s_noon_jd + 0.25));
        let start_date = if start_jd < sunrise_jd {
            approx_start_date
        } else {
            approx_start_date + chrono::Duration::days(1)
        };

        let approx_end_date = jd_to_local_date(end_jd, tz);
        let e_noon_jd = unsafe {
            swiss_eph::swe_julday(approx_end_date.year(), approx_end_date.month() as i32, approx_end_date.day() as i32, 12.0 - tz, swiss_eph::SE_GREG_CAL)
        };
        let (e_sunrise_jd, _) = swiss::calculate_sunrise_sunset(e_noon_jd, lat, lon, tz).unwrap_or((e_noon_jd - 0.25, e_noon_jd + 0.25));
        let next_start_date = if end_jd < e_sunrise_jd {
            approx_end_date
        } else {
            approx_end_date + chrono::Duration::days(1)
        };

        let mut days = Vec::new();
        let mut d = start_date;
        let mut day_count = 0;
        while d < next_start_date && day_count < 32 {
            days.push(d);
            d = d + chrono::Duration::days(1);
            day_count += 1;
        }
        if days.len() < 29 {
            while days.len() < 29 {
                days.push(d);
                d = d + chrono::Duration::days(1);
            }
        } else if days.len() > 30 {
            days.truncate(30);
        }

        let is_after_new_year = if is_kartikadi {
            cycle_masa >= 7 || start_date.month() >= 11
        } else {
            start_date.month() >= 4 || (start_date.month() == 3 && cycle_masa == 0)
        };
        let vikram_samvat = if is_after_new_year { (start_date.year() + 57) as u32 } else { (start_date.year() + 56) as u32 };
        let shaka_samvat = if start_date.month() >= 4 || (start_date.month() == 3 && cycle_masa == 0) {
            (start_date.year() - 78) as u32
        } else {
            (start_date.year() - 79) as u32
        };

        cycles.push(MonthCycleInfo {
            start_date,
            days,
            masa_index: cycle_masa,
            is_adhik: is_leap,
            is_nija,
            vikram_samvat,
            shaka_samvat,
        });

        cur_nm = next_nm;
    }

    cycles
}

pub fn calculate_month_calendar(
    req: crate::models::MonthCalendarRequest,
) -> Result<crate::models::MonthCalendarResponse, ApiError> {
    let year = req.year;
    let month = req.month;
    let lat = req.lat;
    let lon = req.lon;
    let tz = req.timezone;
    let tradition = req.tradition.to_lowercase();
    let is_lunar_view = req.view_mode.to_lowercase() == "lunar";
    let is_adhik_target = req.is_adhik.unwrap_or_else(|| {
        req.masa_type.as_deref() == Some("adhik")
    });

    let (dates_to_calculate, primary_masa_idx, calc_start_date, calc_end_date, month_is_adhik, month_is_nija, available_masas): (
        Vec<chrono::NaiveDate>,
        u8,
        String,
        String,
        bool,
        bool,
        Vec<crate::models::AvailableMasaInfo>,
    ) = if is_lunar_view {
        let is_purnimanta = tradition == "purnimanta" || tradition == "north";
        let is_gujarat = tradition == "gujarat";
        let cycles = get_year_lunar_cycles(year, &tradition, lat, lon, tz);

        let year_cycles: Vec<&MonthCycleInfo> = cycles
            .iter()
            .filter(|c| {
                c.start_date.year() == year
                    || (c.start_date.year() == year - 1 && c.masa_index >= 10 && is_purnimanta)
            })
            .collect();

        let mut seen = std::collections::HashSet::new();
        let mut avail: Vec<crate::models::AvailableMasaInfo> = Vec::new();
        for c in &year_cycles {
            let key = (c.masa_index, c.is_adhik);
            if seen.insert(key) {
                let m_name = MASA_NAMES[c.masa_index as usize].to_string();
                let m_type = if c.is_adhik {
                    "adhik"
                } else if c.is_nija {
                    "nija"
                } else {
                    "regular"
                };
                avail.push(crate::models::AvailableMasaInfo {
                    index: c.masa_index,
                    name: m_name.clone(),
                    is_adhik: c.is_adhik,
                    masa_type: m_type.to_string(),
                    masa_id: format!("{}_{}_{}", year, m_name.to_lowercase(), m_type),
                });
            }
        }

        // Sort available masas according to tradition sequence
        if is_gujarat {
            // Gujarat sequence: Kartika (7) through Ashvina (6)
            avail.sort_by_key(|m| {
                let base_order = if m.index >= 7 { m.index - 7 } else { m.index + 5 };
                base_order * 2 + if m.is_adhik { 0 } else { 1 }
            });
        } else {
            // Chaitradi sequence: Chaitra (0) through Phalguna (11)
            avail.sort_by_key(|m| m.index * 2 + if m.is_adhik { 0 } else { 1 });
        }

        let target_masa = if let Some(m) = req.lunar_masa {
            m % 12
        } else {
            let ref_jd = unsafe {
                swiss_eph::swe_julday(year, month.min(12) as i32, 15, 12.0 - tz, swiss_eph::SE_GREG_CAL)
            };
            let (m_info, _, _) = get_lunar_month_info(ref_jd, is_purnimanta);
            m_info as u8
        };

        let matched = cycles
            .iter()
            .find(|c| {
                c.masa_index == target_masa
                    && (if is_adhik_target { c.is_adhik } else { !c.is_adhik })
                    && c.start_date.year() == year
            })
            .or_else(|| {
                cycles.iter().find(|c| {
                    c.masa_index == target_masa
                        && (if is_adhik_target { c.is_adhik } else { !c.is_adhik })
                        && (c.start_date.year() == year || c.start_date.year() == year + 1)
                })
            })
            .or_else(|| {
                cycles.iter().find(|c| {
                    c.masa_index == target_masa
                        && (if is_adhik_target { c.is_adhik } else { !c.is_adhik })
                })
            })
            .or_else(|| cycles.iter().find(|c| c.masa_index == target_masa))
            .ok_or_else(|| {
                ApiError::new(
                    StatusCode::NOT_FOUND,
                    "Lunar month not found for the requested criteria.",
                )
            })?;

        let s_str = format!(
            "{:02}/{:02}/{}",
            matched.start_date.day(),
            matched.start_date.month(),
            matched.start_date.year()
        );
        let end_d = matched.days.last().copied().unwrap_or(matched.start_date);
        let e_str = format!("{:02}/{:02}/{}", end_d.day(), end_d.month(), end_d.year());

        (
            matched.days.clone(),
            matched.masa_index,
            s_str,
            e_str,
            matched.is_adhik,
            matched.is_nija,
            avail,
        )
    } else {
        let days_in_month = match month {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 => {
                if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                    29
                } else {
                    28
                }
            }
            _ => 30,
        };
        let mut d_vec = Vec::with_capacity(days_in_month as usize);
        for d in 1..=days_in_month {
            if let Some(nd) = chrono::NaiveDate::from_ymd_opt(year, month, d) {
                d_vec.push(nd);
            }
        }
        let s_str = format!("01/{:02}/{}", month, year);
        let e_str = format!("{:02}/{:02}/{}", days_in_month, month, year);

        let cycles = get_year_lunar_cycles(year, &tradition, lat, lon, tz);
        let avail: Vec<crate::models::AvailableMasaInfo> = cycles
            .iter()
            .filter(|c| c.start_date.year() == year)
            .map(|c| {
                let m_name = MASA_NAMES[c.masa_index as usize].to_string();
                let m_type = if c.is_adhik {
                    "adhik"
                } else if c.is_nija {
                    "nija"
                } else {
                    "regular"
                };
                crate::models::AvailableMasaInfo {
                    index: c.masa_index,
                    name: m_name.clone(),
                    is_adhik: c.is_adhik,
                    masa_type: m_type.to_string(),
                    masa_id: format!("{}_{}_{}", year, m_name.to_lowercase(), m_type),
                }
            })
            .collect();

        (d_vec, ((month + 7) % 12) as u8, s_str, e_str, false, false, avail)
    };

    let mut days = Vec::with_capacity(dates_to_calculate.len());
    let mut primary_masa = String::new();
    let mut primary_vikram = 0u32;
    let mut primary_shaka = 0u32;
    let mut primary_samvatsara = String::new();
    let mut primary_ritu = String::new();
    let mut primary_ayana = String::new();

    let lords = [
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
    ];

    for (day_idx, naive_date) in dates_to_calculate.iter().enumerate() {
        let local_dt = naive_date.and_hms_opt(12, 0, 0).unwrap();
        let utc_hour = 12.0 - tz;
        let jd_ut = unsafe {
            swiss_eph::swe_julday(
                naive_date.year(),
                naive_date.month() as i32,
                naive_date.day() as i32,
                utc_hour,
                swiss_eph::SE_GREG_CAL,
            )
        };

        let snapshot = swiss::calculate_snapshot(jd_ut, lat, lon)?;
        let planets: Vec<PlanetData> = snapshot
            .planets
            .into_iter()
            .map(|p| {
                let sign_idx = (p.longitude / 30.0).floor() as usize;
                let nak_idx = ((p.longitude / (360.0 / 27.0)).floor() as usize).min(26);
                let nak_lord = lords[nak_idx % 9].to_string();
                let nak_pada = ((p.longitude % (360.0 / 27.0)) / (360.0 / 108.0)).floor() as u8 + 1;
                PlanetData {
                    name: p.name.to_string(),
                    sign: crate::constants::SIGNS[sign_idx.min(11)].to_string(),
                    house: 1,
                    strength: "Neutral".to_string(),
                    nature: "Benefic".to_string(),
                    nakshatra: crate::constants::NAKSHATRA_NAMES[nak_idx].to_string(),
                    nakshatra_lord: nak_lord,
                    nakshatra_pada: nak_pada,
                    full_degree: p.longitude,
                    deg_in_sign: p.longitude % 30.0,
                    retrograde: p.speed < 0.0,
                    combust: false,
                    navamsa_sign: "Aries".to_string(),
                    chara_karaka: None,
                    dig_bala_points: None,
                    dig_bala_percentage: None,
                    speed: Some(p.speed),
                }
            })
            .collect();

        let panchang = calculate(&planets, local_dt, jd_ut, tz, lat, lon)?;

        let tithi_idx = panchang.tithi.index;
        let is_ekadashi = tithi_idx == 11 || tithi_idx == 26;
        let is_pradosh = tithi_idx == 13 || tithi_idx == 28;
        let is_purnima = tithi_idx == 15;
        let is_amavasya = tithi_idx == 30;

        let mut vrats = Vec::new();
        if is_ekadashi {
            vrats.push("Ekadashi Vrat".to_string());
        }
        if is_pradosh {
            vrats.push("Pradosh Vrat".to_string());
        }
        if is_purnima {
            vrats.push("Purnima Vrat / Satyanarayan".to_string());
        }
        if is_amavasya {
            vrats.push("Amavasya / Pitru Tarpan".to_string());
        }
        if tithi_idx == 4 {
            vrats.push("Vinayaka Chaturthi".to_string());
        }
        if tithi_idx == 19 {
            vrats.push("Sankashti Chaturthi".to_string());
        }

        // Saṅkrānti detection between today's sunrise and tomorrow's sunrise
        let (sunrise_jd, _) = crate::swiss::calculate_sunrise_sunset(jd_ut, lat, lon, tz)?;
        let sankranti_info = check_day_sankranti(sunrise_jd, sunrise_jd + 1.0);
        let is_sankranti = sankranti_info.is_some();
        if let Some((_, sign_name)) = sankranti_info {
            vrats.push(format!("{} Sankranti", sign_name));
        }

        let m_amanta = panchang.masa_amanta.clone().unwrap_or_default();
        let m_purnimanta = panchang.masa_purnimanta.clone().unwrap_or_default();
        let festival = detect_festival(
            &m_amanta,
            &panchang.paksha,
            tithi_idx,
            &panchang.sun_sign.clone().unwrap_or_default(),
            false,
        );

        if let Some(ref fest) = festival {
            vrats.push(fest.clone());
        }

        let weekday_sanskrit = VARA_SANSKRIT[(naive_date.weekday().num_days_from_monday() as usize).min(6)];

        // Determine if day is inside Adhik Masa
        let (_, day_is_adhik, _) = get_lunar_month_info(jd_ut, tradition == "purnimanta");

        if day_idx == 14 || primary_masa.is_empty() {
            primary_masa = if is_lunar_view {
                if month_is_adhik {
                    format!("Adhik {}", MASA_NAMES[primary_masa_idx as usize])
                } else {
                    MASA_NAMES[primary_masa_idx as usize].to_string()
                }
            } else if tradition == "amanta" {
                m_amanta.clone()
            } else {
                m_purnimanta.clone()
            };
            primary_vikram = panchang.vikram_samvat.unwrap_or(0);
            primary_shaka = panchang.shaka_samvat.unwrap_or(0);
            primary_samvatsara = panchang.samvatsara_name.clone().unwrap_or_default();
            primary_ritu = panchang.ritu.clone().unwrap_or_default();
            primary_ayana = panchang.ayana.clone().unwrap_or_default();
        }

        days.push(crate::models::CalendarDayData {
            date: format!("{:02}/{:02}/{}", naive_date.day(), naive_date.month(), naive_date.year()),
            day_of_month: naive_date.day(),
            tithi_day_number: (day_idx + 1) as u8,
            day_of_week: naive_date.weekday().to_string(),
            vara_sanskrit: weekday_sanskrit.to_string(),
            tithi_name: panchang.tithi.name,
            tithi_index: tithi_idx,
            paksha: panchang.paksha,
            nakshatra_name: panchang.nakshatra.name,
            yoga_name: panchang.yoga.name,
            karana_name: panchang.karana.name,
            masa_amanta: m_amanta,
            masa_purnimanta: m_purnimanta,
            is_adhika: day_is_adhik,
            ritu: panchang.ritu.unwrap_or_default(),
            ayana: panchang.ayana.unwrap_or_default(),
            vikram_samvat: panchang.vikram_samvat.unwrap_or(0),
            shaka_samvat: panchang.shaka_samvat.unwrap_or(0),
            sunrise: panchang.sunrise.unwrap_or_default(),
            sunset: panchang.sunset.unwrap_or_default(),
            rahu_kaal: panchang.rahu_kaal.unwrap_or_default(),
            abhijit_muhurat: panchang.abhijit_muhurat.unwrap_or_default(),
            vrats,
            is_ekadashi,
            is_pradosh,
            is_purnima,
            is_amavasya,
            is_sankranti,
            festival,
        });
    }

    let masa_type_str = if month_is_adhik {
        "adhik".to_string()
    } else if month_is_nija {
        "nija".to_string()
    } else {
        "regular".to_string()
    };
    let masa_id_str = format!(
        "{}_{}_{}",
        year,
        MASA_NAMES[primary_masa_idx as usize].to_lowercase(),
        masa_type_str
    );

    Ok(crate::models::MonthCalendarResponse {
        requested_year: year,
        requested_month: month,
        tradition: if tradition == "amanta" {
            "Amanta".to_string()
        } else {
            "Purnimanta".to_string()
        },
        view_mode: if is_lunar_view {
            "lunar".to_string()
        } else {
            "gregorian".to_string()
        },
        primary_masa,
        primary_masa_index: primary_masa_idx,
        is_adhika: month_is_adhik,
        masa_type: masa_type_str,
        masa_id: masa_id_str,
        primary_vikram_samvat: primary_vikram,
        primary_shaka_samvat: primary_shaka,
        primary_samvatsara,
        primary_ritu,
        primary_ayana,
        start_date: calc_start_date,
        end_date: calc_end_date,
        days,
        available_masas,
    })
}

fn detect_festival(
    masa_amanta: &str,
    paksha: &str,
    tithi_index: u8,
    _sun_sign: &str,
    _is_sankranti: bool,
) -> Option<String> {
    match (masa_amanta, paksha, tithi_index) {
        ("Chaitra", "Shukla", 1) => Some("Chaitra Navratri Starts / Ugadi / Gudi Padwa".to_string()),
        ("Chaitra", "Shukla", 9) => Some("Rama Navami".to_string()),
        ("Chaitra", "Shukla", 15) => Some("Hanuman Jayanti / Chaitra Purnima".to_string()),
        ("Vaishakha", "Shukla", 3) => Some("Akshaya Tritiya / Parashurama Jayanti".to_string()),
        ("Vaishakha", "Shukla", 15) => Some("Buddha Purnima / Kurma Jayanti".to_string()),
        ("Jyeshtha", "Shukla", 10) => Some("Ganga Dussehra".to_string()),
        ("Jyeshtha", "Shukla", 15) => Some("Vat Purnima".to_string()),
        ("Ashadha", "Shukla", 2) => Some("Jagannath Ratha Yatra".to_string()),
        ("Ashadha", "Shukla", 11) => Some("Devshayani Ekadashi".to_string()),
        ("Ashadha", "Shukla", 15) => Some("Guru Purnima / Vyasa Puja".to_string()),
        ("Shravana", "Shukla", 5) => Some("Nag Panchami".to_string()),
        ("Shravana", "Shukla", 15) => Some("Raksha Bandhan / Shravana Purnima".to_string()),
        ("Shravana", "Krishna", 23) => Some("Krishna Janmashtami".to_string()),
        ("Bhadrapada", "Shukla", 4) => Some("Ganesh Chaturthi / Vinayaka Chavithi".to_string()),
        ("Bhadrapada", "Shukla", 5) => Some("Rishi Panchami".to_string()),
        ("Bhadrapada", "Shukla", 14) => Some("Anant Chaturdashi".to_string()),
        ("Bhadrapada", "Shukla", 15) => Some("Bhadrapada Purnima / Mahalaya Starts".to_string()),
        ("Ashvina", "Shukla", 1) => Some("Sharad Navratri Starts / Ghatasthapana".to_string()),
        ("Ashvina", "Shukla", 8) => Some("Maha Ashtami / Durga Ashtami".to_string()),
        ("Ashvina", "Shukla", 9) => Some("Maha Navami / Ayudha Puja".to_string()),
        ("Ashvina", "Shukla", 10) => Some("Vijayadashami / Dussehra".to_string()),
        ("Ashvina", "Shukla", 15) => Some("Sharad Purnima / Kojagara Puja".to_string()),
        ("Ashvina", "Krishna", 19) => Some("Karwa Chauth".to_string()),
        ("Kartika", "Krishna", 28) => Some("Dhanteras / Dhanvantari Jayanti".to_string()),
        ("Kartika", "Krishna", 29) => Some("Naraka Chaturdashi / Choti Diwali".to_string()),
        ("Kartika", "Krishna", 30) => Some("Diwali / Lakshmi Puja".to_string()),
        ("Kartika", "Shukla", 1) => Some("Govardhan Puja / Annakut".to_string()),
        ("Kartika", "Shukla", 2) => Some("Bhai Dooj / Yama Dwitiya".to_string()),
        ("Kartika", "Shukla", 6) => Some("Chhath Puja".to_string()),
        ("Kartika", "Shukla", 11) => Some("Devutthana Ekadashi / Tulsi Vivah".to_string()),
        ("Kartika", "Shukla", 15) => Some("Dev Diwali / Kartik Purnima".to_string()),
        ("Margashirsha", "Shukla", 11) => Some("Mokshada Ekadashi / Gita Jayanti".to_string()),
        ("Pausha", "Shukla", 15) => Some("Pausha Purnima".to_string()),
        ("Magha", "Shukla", 5) => Some("Vasant Panchami / Saraswati Puja".to_string()),
        ("Magha", "Shukla", 7) => Some("Ratha Saptami".to_string()),
        ("Magha", "Krishna", 29) => Some("Maha Shivratri".to_string()),
        ("Phalguna", "Shukla", 15) => Some("Holika Dahan / Chhoti Holi".to_string()),
        ("Phalguna", "Krishna", 16) => Some("Holi (Dhulandi)".to_string()),
        _ => None,
    }
}

fn planet_degree(planets: &[PlanetData], name: &str) -> Result<f64, ApiError> {
    planets
        .iter()
        .find(|planet| planet.name == name)
        .map(|planet| planet.full_degree)
        .ok_or_else(|| {
            ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("{name} required for panchanga calculation."),
            )
        })
}

fn karana_index(half_tithi_index: usize) -> usize {
    match half_tithi_index {
        0 => 10,
        57 => 7,
        58 => 8,
        59 => 9,
        n => (n - 1) % 7,
    }
}

fn round4(value: f64) -> f64 {
    (value * 10_000.0).round() / 10_000.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_month_calendar_lunar_amanta() {
        let req = crate::models::MonthCalendarRequest {
            year: 2026,
            month: 8,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "amanta".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(4), // Shravana
            masa_type: None,
            is_adhik: None,
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate lunar calendar");
        assert!(res.days.len() == 29 || res.days.len() == 30);
        assert_eq!(res.primary_masa, "Shravana");
    }

    #[test]
    fn test_calculate_month_calendar_lunar_purnimanta() {
        let req = crate::models::MonthCalendarRequest {
            year: 2026,
            month: 8,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "purnimanta".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(5), // Bhadrapada
            masa_type: None,
            is_adhik: None,
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate purnimanta calendar");
        assert!(res.days.len() == 29 || res.days.len() == 30);
        assert_eq!(res.primary_masa, "Bhadrapada");
    }

    #[test]
    fn test_calculate_month_calendar_gregorian() {
        let req = crate::models::MonthCalendarRequest {
            year: 2026,
            month: 8,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "purnimanta".to_string(),
            view_mode: "gregorian".to_string(),
            lunar_masa: None,
            masa_type: None,
            is_adhik: None,
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate gregorian calendar");
        assert_eq!(res.days.len(), 31);
    }

    #[test]
    fn test_adhik_shravana_2023() {
        let req = crate::models::MonthCalendarRequest {
            year: 2023,
            month: 7,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "amanta".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(4), // Shravana
            masa_type: Some("adhik".to_string()),
            is_adhik: Some(true),
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate Adhik Shravana 2023");
        assert!(res.is_adhika, "2023 Shravana should have an Adhik occurrence");
        assert_eq!(res.primary_masa, "Adhik Shravana");
        assert_eq!(res.masa_type, "adhik");
        assert!(res.days.len() == 29 || res.days.len() == 30);
        assert!(res.days.iter().any(|d| d.is_adhika));
    }

    #[test]
    fn test_nija_shravana_2023() {
        let req = crate::models::MonthCalendarRequest {
            year: 2023,
            month: 8,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "amanta".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(4), // Shravana
            masa_type: Some("regular".to_string()),
            is_adhik: Some(false),
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate Nija Shravana 2023");
        assert!(!res.is_adhika, "Nija Shravana should not be flagged as Adhika month");
        assert_eq!(res.primary_masa, "Shravana");
    }

    #[test]
    fn test_makar_sankranti_detection_2024() {
        let req = crate::models::MonthCalendarRequest {
            year: 2024,
            month: 1,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "purnimanta".to_string(),
            view_mode: "gregorian".to_string(),
            lunar_masa: None,
            masa_type: None,
            is_adhik: None,
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate Jan 2024");
        let sankranti_day = res.days.iter().find(|d| d.is_sankranti);
        assert!(sankranti_day.is_some(), "Makar Sankranti should be detected in January 2024");
        let day = sankranti_day.unwrap();
        assert!(
            day.vrats.iter().any(|v| v.contains("Sankranti")),
            "Vrats should list Sankranti event"
        );
    }

    #[test]
    fn test_adhik_ashvina_2020() {
        let req = crate::models::MonthCalendarRequest {
            year: 2020,
            month: 9,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "amanta".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(6), // Ashvina
            masa_type: Some("adhik".to_string()),
            is_adhik: Some(true),
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate Adhik Ashvina 2020");
        assert!(res.is_adhika);
        assert_eq!(res.primary_masa, "Adhik Ashvina");
    }

    #[test]
    fn test_adhik_masa_2026() {
        let req = crate::models::MonthCalendarRequest {
            year: 2026,
            month: 5,
            lat: 28.6139,
            lon: 77.209,
            timezone: 5.5,
            tradition: "amanta".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(2), // Jyeshtha
            masa_type: Some("adhik".to_string()),
            is_adhik: Some(true),
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate Adhik Masa 2026");
        assert!(res.is_adhika, "2026 Jyeshtha must have an Adhik Masa occurrence");
        assert_eq!(res.primary_masa, "Adhik Jyeshtha");
        assert_eq!(res.masa_type, "adhik");
        assert!(res.days.len() == 29 || res.days.len() == 30);
    }

    #[test]
    fn test_astronomical_numerical_cross_validation() {
        // Benchmark Test Cases verified directly against classical Drik Ephemeris ground truth

        // Case 1: 2026-05-20 (Adhik Jyeshtha)
        let jd_2026_adhik = unsafe { swiss_eph::swe_julday(2026, 5, 20, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_1, moon_1) = swiss::get_sun_moon_sidereal(jd_2026_adhik);
        assert!((sun_1 - 35.0260).abs() < 0.02, "Sun longitude mismatch for 2026 Adhik Jyeshtha");
        assert!((moon_1 - 83.2420).abs() < 0.05, "Moon longitude mismatch for 2026 Adhik Jyeshtha");
        let (m_1, is_adhik_1, is_nija_1) = get_lunar_month_info(jd_2026_adhik, false);
        assert_eq!(m_1, 2, "2026-05-20 must be Jyeshtha (idx 2)");
        assert!(is_adhik_1, "2026-05-20 must be Adhik Masa");
        assert!(!is_nija_1, "2026-05-20 is Adhik, not Nija");

        // Case 2: 2026-06-25 (Nija Jyeshtha)
        let jd_2026_nija = unsafe { swiss_eph::swe_julday(2026, 6, 25, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_2, moon_2) = swiss::get_sun_moon_sidereal(jd_2026_nija);
        assert!((sun_2 - 69.4913).abs() < 0.02, "Sun longitude mismatch for 2026 Nija Jyeshtha");
        assert!((moon_2 - 197.5014).abs() < 0.05, "Moon longitude mismatch for 2026 Nija Jyeshtha");
        let (m_2, is_adhik_2, is_nija_2) = get_lunar_month_info(jd_2026_nija, false);
        assert_eq!(m_2, 2, "2026-06-25 must be Jyeshtha (idx 2)");
        assert!(!is_adhik_2, "2026-06-25 is Nija Masa, not Adhik");
        assert!(is_nija_2, "2026-06-25 must be Nija Masa");

        // Case 3: 2023-07-25 (Adhik Shravana)
        let jd_2023_adhik = unsafe { swiss_eph::swe_julday(2023, 7, 25, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_3, moon_3) = swiss::get_sun_moon_sidereal(jd_2023_adhik);
        assert!((sun_3 - 97.8913).abs() < 0.02, "Sun longitude mismatch for 2023 Adhik Shravana");
        assert!((moon_3 - 180.1493).abs() < 0.05, "Moon longitude mismatch for 2023 Adhik Shravana");
        let (m_3, is_adhik_3, is_nija_3) = get_lunar_month_info(jd_2023_adhik, false);
        assert_eq!(m_3, 4, "2023-07-25 must be Shravana (idx 4)");
        assert!(is_adhik_3, "2023-07-25 must be Adhik Shravana");
        assert!(!is_nija_3, "2023-07-25 is Adhik, not Nija");

        // Case 4: 2023-08-25 (Nija Shravana)
        let jd_2023_nija = unsafe { swiss_eph::swe_julday(2023, 8, 25, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_4, moon_4) = swiss::get_sun_moon_sidereal(jd_2023_nija);
        assert!((sun_4 - 127.6210).abs() < 0.02, "Sun longitude mismatch for 2023 Nija Shravana");
        assert!((moon_4 - 227.9372).abs() < 0.05, "Moon longitude mismatch for 2023 Nija Shravana");
        let (m_4, is_adhik_4, is_nija_4) = get_lunar_month_info(jd_2023_nija, false);
        assert_eq!(m_4, 4, "2023-08-25 must be Shravana (idx 4)");
        assert!(!is_adhik_4, "2023-08-25 must be Nija Shravana");
        assert!(is_nija_4, "2023-08-25 is Nija Shravana");

        // Case 5: 2020-09-25 (Adhik Ashvina)
        let jd_2020_adhik = unsafe { swiss_eph::swe_julday(2020, 9, 25, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_5, moon_5) = swiss::get_sun_moon_sidereal(jd_2020_adhik);
        assert!((sun_5 - 158.4894).abs() < 0.02, "Sun longitude mismatch for 2020 Adhik Ashvina");
        assert!((moon_5 - 262.8594).abs() < 0.05, "Moon longitude mismatch for 2020 Adhik Ashvina");
        let (m_5, is_adhik_5, _) = get_lunar_month_info(jd_2020_adhik, false);
        assert_eq!(m_5, 6, "2020-09-25 must be Ashvina (idx 6)");
        assert!(is_adhik_5, "2020-09-25 must be Adhik Ashvina");

        // Case 6: 2024-01-15 (Makar Sankranti)
        let jd_2024_sankranti = unsafe { swiss_eph::swe_julday(2024, 1, 15, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_6, moon_6) = swiss::get_sun_moon_sidereal(jd_2024_sankranti);
        assert!((sun_6 - 270.3724).abs() < 0.02, "Sun should be just inside Makara (>270)");
        assert!((moon_6 - 322.0598).abs() < 0.05, "Moon longitude mismatch for Makar Sankranti");
        assert!(sun_6 >= 270.0 && sun_6 < 300.0, "Sun must be in Makara (270-300)");

        // Case 7: 2026-09-01 (Current Date)
        let jd_today = unsafe { swiss_eph::swe_julday(2026, 9, 1, 6.0, swiss_eph::SE_GREG_CAL) };
        let (sun_7, moon_7) = swiss::get_sun_moon_sidereal(jd_today);
        assert!((sun_7 - 134.6029).abs() < 0.02, "Sun longitude mismatch for 2026-09-01");
        assert!((moon_7 - 4.6129).abs() < 0.05, "Moon longitude mismatch for 2026-09-01");
        let (m_7, is_adhik_7, _) = get_lunar_month_info(jd_today, false);
        assert_eq!(m_7, 4, "2026-09-01 Amanta month must be Shravana (0-indexed 4)");
        assert!(!is_adhik_7, "2026-09-01 is regular month, not Adhik");
    }

    #[test]
    fn test_calculate_month_calendar_gujarat() {
        let req = crate::models::MonthCalendarRequest {
            year: 2026,
            month: 8,
            lat: 23.0225,
            lon: 72.5714,
            timezone: 5.5,
            tradition: "gujarat".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(4), // Shravana
            masa_type: None,
            is_adhik: None,
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate Gujarat calendar");
        assert!(res.days.len() == 29 || res.days.len() == 30);
        assert_eq!(res.primary_masa, "Shravana");
        assert!(res.days[0].date.contains("2026"), "Shravana 2026 must be in 2026");
    }

    #[test]
    fn test_calculate_month_calendar_south() {
        let req = crate::models::MonthCalendarRequest {
            year: 2026,
            month: 8,
            lat: 12.9716,
            lon: 77.5946,
            timezone: 5.5,
            tradition: "south".to_string(),
            view_mode: "lunar".to_string(),
            lunar_masa: Some(4), // Shravana
            masa_type: None,
            is_adhik: None,
        };
        let res = calculate_month_calendar(req).expect("Failed to calculate South Indian calendar");
        assert!(res.days.len() == 29 || res.days.len() == 30);
        assert_eq!(res.primary_masa, "Shravana");
    }
}

