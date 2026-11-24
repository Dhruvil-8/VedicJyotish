//! Pure Vedic Panchanga Calculations
//!
//! Deterministic calculation of:
//! - Tithi, Vara, Nakshatra, Yoga, Karana
//! - Rahu Kaal, Gulika Kaal, Yamaganda Kaal
//! - Abhijit Muhurta, Vijaya Muhurta, Brahma Muhurta, Pradosh Kaal, Dur Muhurtham
//! - Choghadiya (Day & Night)
//! - Horas (Day & Night)
//! - Samvat (Vikram, Shaka, Kali, Samvatsara name)
//! - Masa (Amanta, Purnimanta, Adhika status)
//! - Vedic Time (Ishta Ghati, Prahar, Muhurta)
//! - Festivals & Vrats

use chrono::{Datelike, NaiveDateTime};
use crate::models::{
    ChoghadiyaSlot, HoraSlot, Panchanga, PanchangaElement, VedicTime,
};

pub const TITHI_NAMES: [&str; 30] = [
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

pub const YOGA_NAMES: [&str; 27] = [
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

pub const KARANA_NAMES: [&str; 11] = [
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Gara",
    "Vanija",
    "Vishti (Bhadra)",
    "Shakuni",
    "Chatushpada",
    "Naga",
    "Kimstughna",
];

pub const VARA_NAMES: [&str; 7] = [
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
    ("Purvahna (Morning)", "पूर्वाह्न"),
    ("Madhyahna (Noon)", "मध्याह्न"),
    ("Aparahna (Afternoon)", "अपराह्न"),
    ("Sayanahna (Evening)", "सायनाह्न"),
    ("Pradosha (First Night Watch)", "प्रदोष"),
    ("Nishitha (Midnight Watch)", "निशीथ"),
    ("Triyama (Late Night Watch)", "त्रियामा"),
    ("Usha (Dawn Watch)", "उषा"),
];

pub const MUHURTA_NAMES: [&str; 30] = [
    "Rudra", "Ahi", "Mitra", "Pitr", "Vasu", "Varaha", "Vishwa", "Vidhi", "Sutamukhi", "Puruhuta",
    "Vahni", "Naktanchara", "Varuna", "Aryama", "Bhaga", "Girisha", "Ajapada", "Ahirbudhnya", "Pushan",
    "Ashwini", "Yama", "Agni", "Vidhatr", "Chanda", "Aditi", "Jiva", "Vishnu", "Dyumani", "Brahma", "Samudram",
];

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SunMoonCoordinates {
    pub sun_degree: f64,
    pub moon_degree: f64,
    pub sunrise_jd: f64,
    pub sunset_jd: f64,
    pub next_sunrise_jd: f64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LunarMonthInfo {
    pub amanta_masa_idx: usize,
    pub purnimanta_masa_idx: usize,
    pub is_adhika: bool,
}

pub fn julian_to_local_time(jd: f64, offset_hours: f64) -> String {
    let local_jd = jd + (offset_hours / 24.0);
    let day_fraction = (local_jd + 0.5) - (local_jd + 0.5).floor();
    let total_seconds = ((day_fraction * 86400.0).round() as u32 + 30) % 86400;
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    format!("{:02}:{:02}", hours, minutes)
}

pub fn normalize_degree(deg: f64) -> f64 {
    deg.rem_euclid(360.0)
}

pub fn round4(v: f64) -> f64 {
    (v * 10000.0).round() / 10000.0
}

fn karana_index(half_tithi_index: usize) -> usize {
    if half_tithi_index == 0 {
        10 // Kimstughna
    } else if (1..=56).contains(&half_tithi_index) {
        (half_tithi_index - 1) % 7
    } else if half_tithi_index == 57 {
        7 // Shakuni
    } else if half_tithi_index == 58 {
        8 // Chatushpada
    } else {
        9 // Naga
    }
}

pub fn detect_festival(
    masa_amanta: &str,
    paksha: &str,
    tithi_index: u8,
    _sun_sign: &str,
    _is_sankranti: bool,
) -> Option<String> {
    match (masa_amanta, paksha, tithi_index) {
        // Chaitra
        ("Chaitra", "Shukla", 1) => Some("Chaitra Navratri Starts / Ugadi / Gudi Padwa / Cheti Chand".to_string()),
        ("Chaitra", "Shukla", 2) => Some("Sindhara Dooj".to_string()),
        ("Chaitra", "Shukla", 3) => Some("Gangaur / Matsya Jayanti".to_string()),
        ("Chaitra", "Shukla", 5) => Some("Lakshmi Panchami".to_string()),
        ("Chaitra", "Shukla", 6) => Some("Yamuna Chhath".to_string()),
        ("Chaitra", "Shukla", 8) => Some("Durga Ashtami (Chaitra)".to_string()),
        ("Chaitra", "Shukla", 9) => Some("Rama Navami".to_string()),
        ("Chaitra", "Shukla", 11) => Some("Kamada Ekadashi".to_string()),
        ("Chaitra", "Shukla", 15) => Some("Hanuman Jayanti / Chaitra Purnima".to_string()),
        ("Chaitra", "Krishna", 26) => Some("Varuthini Ekadashi".to_string()),

        // Vaishakha
        ("Vaishakha", "Shukla", 3) => Some("Akshaya Tritiya / Parashurama Jayanti".to_string()),
        ("Vaishakha", "Shukla", 7) => Some("Ganga Saptami".to_string()),
        ("Vaishakha", "Shukla", 9) => Some("Sita Navami".to_string()),
        ("Vaishakha", "Shukla", 11) => Some("Mohini Ekadashi".to_string()),
        ("Vaishakha", "Shukla", 14) => Some("Narasimha Jayanti".to_string()),
        ("Vaishakha", "Shukla", 15) => Some("Buddha Purnima / Kurma Jayanti".to_string()),
        ("Vaishakha", "Krishna", 26) => Some("Apara Ekadashi".to_string()),

        // Jyeshtha
        ("Jyeshtha", "Krishna", 30) => Some("Shani Jayanti / Vat Savitri Vrat (Amavasya)".to_string()),
        ("Jyeshtha", "Shukla", 10) => Some("Ganga Dussehra".to_string()),
        ("Jyeshtha", "Shukla", 11) => Some("Nirjala Ekadashi".to_string()),
        ("Jyeshtha", "Shukla", 15) => Some("Vat Purnima / Kabir Jayanti".to_string()),
        ("Jyeshtha", "Krishna", 26) => Some("Yogini Ekadashi".to_string()),

        // Ashadha
        ("Ashadha", "Shukla", 2) => Some("Jagannath Ratha Yatra".to_string()),
        ("Ashadha", "Shukla", 11) => Some("Devshayani Ekadashi / Ashadi Ekadashi".to_string()),
        ("Ashadha", "Shukla", 15) => Some("Guru Purnima / Vyasa Puja".to_string()),
        ("Ashadha", "Krishna", 26) => Some("Kamika Ekadashi".to_string()),

        // Shravana
        ("Shravana", "Shukla", 3) => Some("Hariyali Teej".to_string()),
        ("Shravana", "Shukla", 5) => Some("Nag Panchami".to_string()),
        ("Shravana", "Shukla", 11) => Some("Shravana Putrada Ekadashi".to_string()),
        ("Shravana", "Shukla", 15) => Some("Raksha Bandhan / Shravana Purnima / Gayatri Jayanti".to_string()),
        ("Shravana", "Krishna", 18) => Some("Kajari Teej".to_string()),
        ("Shravana", "Krishna", 20) => Some("Nag Panchami (Gujarat/South)".to_string()),
        ("Shravana", "Krishna", 22) => Some("Sheetala Saptami".to_string()),
        ("Shravana", "Krishna", 23) => Some("Krishna Janmashtami".to_string()),
        ("Shravana", "Krishna", 24) => Some("Dahi Handi / Nandotsav".to_string()),
        ("Shravana", "Krishna", 26) => Some("Aja Ekadashi".to_string()),

        // Bhadrapada
        ("Bhadrapada", "Shukla", 3) => Some("Hartalika Teej / Varaha Jayanti".to_string()),
        ("Bhadrapada", "Shukla", 4) => Some("Ganesh Chaturthi / Vinayaka Chavithi".to_string()),
        ("Bhadrapada", "Shukla", 5) => Some("Rishi Panchami".to_string()),
        ("Bhadrapada", "Shukla", 8) => Some("Radha Ashtami".to_string()),
        ("Bhadrapada", "Shukla", 11) => Some("Parsva Ekadashi / Vamana Jayanti".to_string()),
        ("Bhadrapada", "Shukla", 14) => Some("Anant Chaturdashi / Ganesh Visarjan".to_string()),
        ("Bhadrapada", "Shukla", 15) => Some("Bhadrapada Purnima / Pitru Paksha Begins".to_string()),
        ("Bhadrapada", "Krishna", 26) => Some("Indira Ekadashi".to_string()),
        ("Bhadrapada", "Krishna", 30) => Some("Sarva Pitru Amavasya / Mahalaya Amavasya".to_string()),

        // Ashvina
        ("Ashvina", "Krishna", 19) => Some("Karwa Chauth".to_string()),
        ("Ashvina", "Krishna", 23) | ("Ashvina", "Krishna", 27) => Some("Ahoi Ashtami".to_string()),
        ("Ashvina", "Krishna", 26) => Some("Rama Ekadashi / Govatsa Dwadashi".to_string()),
        ("Ashvina", "Krishna", 28) => Some("Dhanteras / Dhanvantari Jayanti / Yama Deepam".to_string()),
        ("Ashvina", "Krishna", 29) => Some("Naraka Chaturdashi / Choti Diwali / Roop Chaudas".to_string()),
        ("Ashvina", "Krishna", 30) => Some("Diwali / Lakshmi Puja / Kedar Gauri Vrat".to_string()),
        ("Ashvina", "Shukla", 1) => Some("Sharad Navratri Starts / Ghatasthapana".to_string()),
        ("Ashvina", "Shukla", 7) => Some("Maha Saptami / Saraswati Puja".to_string()),
        ("Ashvina", "Shukla", 8) => Some("Maha Ashtami / Durga Ashtami".to_string()),
        ("Ashvina", "Shukla", 9) => Some("Maha Navami / Ayudha Puja".to_string()),
        ("Ashvina", "Shukla", 10) => Some("Vijayadashami / Dussehra".to_string()),
        ("Ashvina", "Shukla", 11) => Some("Papankusha Ekadashi".to_string()),
        ("Ashvina", "Shukla", 15) => Some("Sharad Purnima / Kojagara Puja / Raas Purnima".to_string()),

        // Kartika
        ("Kartika", "Krishna", 26) => Some("Rama Ekadashi".to_string()),
        ("Kartika", "Krishna", 28) => Some("Dhanteras / Dhanvantari Jayanti / Yama Deepam".to_string()),
        ("Kartika", "Krishna", 29) => Some("Naraka Chaturdashi / Choti Diwali / Roop Chaudas".to_string()),
        ("Kartika", "Krishna", 30) => Some("Diwali / Lakshmi Puja / Kedar Gauri Vrat".to_string()),
        ("Kartika", "Shukla", 1) => Some("Govardhan Puja / Annakut / Gujarati New Year / Bali Pratipada".to_string()),
        ("Kartika", "Shukla", 2) => Some("Bhai Dooj / Yama Dwitiya".to_string()),
        ("Kartika", "Shukla", 5) => Some("Labh Pancham / Saubhagya Panchami".to_string()),
        ("Kartika", "Shukla", 6) => Some("Chhath Puja (Sandhya Arghya) / Surya Shashthi".to_string()),
        ("Kartika", "Shukla", 7) => Some("Chhath Puja (Usha Arghya)".to_string()),
        ("Kartika", "Shukla", 8) => Some("Gopashtami".to_string()),
        ("Kartika", "Shukla", 9) => Some("Akshaya Navami / Amla Navami".to_string()),
        ("Kartika", "Shukla", 11) => Some("Devutthana Ekadashi / Tulsi Vivah Starts".to_string()),
        ("Kartika", "Shukla", 14) => Some("Vaikuntha Chaturdashi".to_string()),
        ("Kartika", "Shukla", 15) => Some("Dev Diwali / Kartik Purnima / Guru Nanak Jayanti".to_string()),

        // Margashirsha
        ("Margashirsha", "Krishna", 26) => Some("Utpanna Ekadashi".to_string()),
        ("Margashirsha", "Shukla", 5) => Some("Vivah Panchami (Rama-Sita Vivah)".to_string()),
        ("Margashirsha", "Shukla", 11) => Some("Mokshada Ekadashi / Gita Jayanti / Guruvayur Ekadashi".to_string()),
        ("Margashirsha", "Shukla", 15) => Some("Dattatreya Jayanti / Margashirsha Purnima / Annapurna Jayanti".to_string()),

        // Pausha
        ("Pausha", "Krishna", 26) => Some("Saphala Ekadashi".to_string()),
        ("Pausha", "Shukla", 11) => Some("Pausha Putrada Ekadashi / Vaikuntha Ekadashi".to_string()),
        ("Pausha", "Shukla", 15) => Some("Pausha Purnima / Shakambhari Jayanti".to_string()),

        // Magha
        ("Magha", "Krishna", 26) => Some("Shattila Ekadashi".to_string()),
        ("Magha", "Krishna", 29) => Some("Maha Shivratri".to_string()),
        ("Magha", "Krishna", 30) => Some("Mauni Amavasya".to_string()),
        ("Magha", "Shukla", 5) => Some("Vasant Panchami / Saraswati Puja".to_string()),
        ("Magha", "Shukla", 7) => Some("Ratha Saptami / Arogya Saptami".to_string()),
        ("Magha", "Shukla", 8) => Some("Bhishma Ashtami".to_string()),
        ("Magha", "Shukla", 11) => Some("Jaya Ekadashi".to_string()),
        ("Magha", "Shukla", 15) => Some("Magha Purnima / Lalita Jayanti / Guru Ravidas Jayanti".to_string()),

        // Phalguna
        ("Phalguna", "Krishna", 26) => Some("Vijaya Ekadashi".to_string()),
        ("Phalguna", "Krishna", 27) => Some("Papmochani Ekadashi".to_string()),
        ("Phalguna", "Shukla", 11) => Some("Amalaki Ekadashi".to_string()),
        ("Phalguna", "Shukla", 14) => Some("Holika Dahan / Chhoti Holi".to_string()),
        ("Phalguna", "Shukla", 15) => Some("Holi / Phalguna Purnima / Chaitanya Mahaprabhu Jayanti".to_string()),
        ("Phalguna", "Krishna", 16) => Some("Holi (Dhulandi) / Vasantotsav".to_string()),
        ("Phalguna", "Krishna", 20) => Some("Rang Panchami".to_string()),
        ("Phalguna", "Krishna", 23) => Some("Sheetala Ashtami / Basoda".to_string()),

        _ => None,
    }
}

pub fn calculate_panchanga_advanced(
    coords: &SunMoonCoordinates,
    local_dt: NaiveDateTime,
    jd_ut: f64,
    offset_hours: f64,
    _lat: f64,
    _lon: f64,
    ayanamsa: Option<f64>,
    lunar_month_info: Option<LunarMonthInfo>,
) -> Panchanga {
    let sun = coords.sun_degree;
    let moon = coords.moon_degree;
    let moon_sun = normalize_degree(moon - sun);
    let tithi_index = (moon_sun / 12.0).floor() as usize;
    let tithi_progress = (moon_sun % 12.0) / 12.0;

    let nak_span = 360.0 / 27.0;
    let nak_index = (moon / nak_span).floor() as usize;
    let nak_progress = (moon % nak_span) / nak_span;

    let yoga_degree = normalize_degree(sun + moon);
    let yoga_index = (yoga_degree / nak_span).floor() as usize;
    let yoga_progress = (yoga_degree % nak_span) / nak_span;

    let karana_idx = karana_index((moon_sun / 6.0).floor() as usize);
    let karana_progress = (moon_sun % 6.0) / 6.0;

    let sun_sign_idx = crate::chart::sign_index(sun);
    let moon_sign_idx = crate::chart::sign_index(moon);
    let sun_sign = Some(crate::constants::SIGNS[sun_sign_idx].to_string());
    let moon_sign = Some(crate::constants::SIGNS[moon_sign_idx].to_string());

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
    let karana_lord = Some(karana_lords[karana_idx].to_string());

    let sunrise_jd = coords.sunrise_jd;
    let sunset_jd = coords.sunset_jd;
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
    let tomorrow_sunrise_jd = coords.next_sunrise_jd;
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
        choghadiya_slots.push(ChoghadiyaSlot {
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
        choghadiya_night_slots.push(ChoghadiyaSlot {
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
        horas_day_slots.push(HoraSlot {
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
        horas_night_slots.push(HoraSlot {
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

    let (amanta_masa_idx, purnimanta_masa_idx, is_adhika_masa) = if let Some(info) = lunar_month_info {
        (info.amanta_masa_idx, info.purnimanta_masa_idx, info.is_adhika)
    } else {
        let amanta_idx = (sun_sign_idx + 1) % 12;
        let purnimanta_idx = if paksha == "Krishna" { (amanta_idx + 1) % 12 } else { amanta_idx };
        (amanta_idx, purnimanta_idx, false)
    };

    let masa_amanta = Some(if is_adhika_masa {
        format!("Adhik {}", MASA_NAMES[amanta_masa_idx])
    } else {
        MASA_NAMES[amanta_masa_idx].to_string()
    });

    let masa_purnimanta = Some(if is_adhika_masa {
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
    let ayana = Some(if sun >= 270.0 || sun < 90.0 {
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

    let vedic_time = Some(VedicTime {
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

    let m_amanta = masa_amanta.clone().unwrap_or_default();
    let m_purnimanta = masa_purnimanta.clone().unwrap_or_default();
    let tithi_day_idx = (tithi_index + 1) as u8;
    let s_sign = sun_sign.clone().unwrap_or_default();
    let festival = detect_festival(&m_amanta, &paksha, tithi_day_idx, &s_sign, false)
        .or_else(|| detect_festival(&m_purnimanta, &paksha, tithi_day_idx, &s_sign, false));

    let mut daily_vrats = Vec::new();
    let is_ekadashi = tithi_day_idx == 11 || tithi_day_idx == 26;
    let is_pradosh = tithi_day_idx == 13 || tithi_day_idx == 28;
    let is_purnima = tithi_day_idx == 15;
    let is_amavasya = tithi_day_idx == 30;
    if is_ekadashi {
        daily_vrats.push("Ekadashi Vrat".to_string());
    }
    if is_pradosh {
        daily_vrats.push("Pradosh Vrat".to_string());
    }
    if is_purnima {
        daily_vrats.push("Purnima Vrat / Satyanarayan".to_string());
    }
    if is_amavasya {
        daily_vrats.push("Amavasya / Pitru Tarpan".to_string());
    }
    if tithi_day_idx == 4 {
        daily_vrats.push("Vinayaka Chaturthi".to_string());
    }
    if tithi_day_idx == 19 {
        daily_vrats.push("Sankashti Chaturthi".to_string());
    }
    if let Some(ref fest) = festival {
        if !daily_vrats.contains(fest) {
            daily_vrats.push(fest.clone());
        }
    }

    Panchanga {
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
            index: (karana_idx + 1) as u8,
            name: KARANA_NAMES[karana_idx].to_string(),
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
        ayanamsha: ayanamsa,
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
        festival,
        vrats: Some(daily_vrats),
    }
}

pub fn calculate_panchanga(
    coords: &SunMoonCoordinates,
    local_dt: NaiveDateTime,
    jd_ut: f64,
    offset_hours: f64,
    lat: f64,
    lon: f64,
) -> Panchanga {
    calculate_panchanga_advanced(coords, local_dt, jd_ut, offset_hours, lat, lon, None, None)
}
