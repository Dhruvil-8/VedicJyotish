#![allow(dead_code)]

use std::collections::HashMap;

use once_cell::sync::Lazy;

pub const SIDEREAL_YEAR: f64 = 365.256363004;
pub const PLANET_FLAGS: i32 = swiss_eph::SEFLG_SIDEREAL | swiss_eph::SEFLG_SPEED;
pub const HOUSE_FLAGS: i32 = swiss_eph::SEFLG_SIDEREAL;

pub const SIGNS: [&str; 12] = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
];

pub const DASHA_SEQ: [&str; 9] = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
];

pub static DASHA_YEARS: Lazy<HashMap<&'static str, f64>> = Lazy::new(|| {
    HashMap::from([
        ("Ketu", 7.0),
        ("Venus", 20.0),
        ("Sun", 6.0),
        ("Moon", 10.0),
        ("Mars", 7.0),
        ("Rahu", 18.0),
        ("Jupiter", 16.0),
        ("Saturn", 19.0),
        ("Mercury", 17.0),
    ])
});

pub const NAKSHATRA_NAMES: [&str; 27] = [
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashira",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Mula",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Shatabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati",
];

pub const PLANETS: [(&str, i32); 8] = [
    ("Sun", swiss_eph::SE_SUN),
    ("Moon", swiss_eph::SE_MOON),
    ("Mars", swiss_eph::SE_MARS),
    ("Mercury", swiss_eph::SE_MERCURY),
    ("Jupiter", swiss_eph::SE_JUPITER),
    ("Venus", swiss_eph::SE_VENUS),
    ("Saturn", swiss_eph::SE_SATURN),
    ("Rahu", swiss_eph::SE_MEAN_NODE),
];

pub static FUNCTIONAL_MALEFICS: Lazy<HashMap<usize, Vec<&'static str>>> = Lazy::new(|| {
    HashMap::from([
        (0, vec!["Mercury", "Saturn", "Rahu", "Ketu"]),
        (1, vec!["Venus", "Jupiter", "Moon", "Rahu", "Ketu"]),
        (2, vec!["Mars", "Jupiter", "Sun", "Rahu", "Ketu"]),
        (3, vec!["Jupiter", "Saturn", "Mercury", "Rahu", "Ketu"]),
        (4, vec!["Mercury", "Venus", "Saturn", "Rahu", "Ketu"]),
        (5, vec!["Mars", "Jupiter", "Moon", "Rahu", "Ketu"]),
        (6, vec!["Mars", "Jupiter", "Sun", "Rahu", "Ketu"]),
        (7, vec!["Venus", "Mercury", "Saturn", "Rahu", "Ketu"]),
        (8, vec!["Venus", "Saturn", "Mercury", "Rahu", "Ketu"]),
        (9, vec!["Mars", "Jupiter", "Moon", "Rahu", "Ketu"]),
        (10, vec!["Moon", "Mercury", "Mars", "Rahu", "Ketu"]),
        (11, vec!["Sun", "Venus", "Saturn", "Rahu", "Ketu"]),
    ])
});

pub static STRENGTH_CHART: Lazy<HashMap<&'static str, StrengthRule>> = Lazy::new(|| {
    HashMap::from([
        ("Sun", StrengthRule::new("Aries", "Libra", vec!["Leo"])),
        (
            "Moon",
            StrengthRule::new("Taurus", "Scorpio", vec!["Cancer"]),
        ),
        (
            "Mars",
            StrengthRule::new("Capricorn", "Cancer", vec!["Aries", "Scorpio"]),
        ),
        (
            "Mercury",
            StrengthRule::new("Virgo", "Pisces", vec!["Gemini", "Virgo"]),
        ),
        (
            "Jupiter",
            StrengthRule::new("Cancer", "Capricorn", vec!["Sagittarius", "Pisces"]),
        ),
        (
            "Venus",
            StrengthRule::new("Pisces", "Virgo", vec!["Taurus", "Libra"]),
        ),
        (
            "Saturn",
            StrengthRule::new("Libra", "Aries", vec!["Capricorn", "Aquarius"]),
        ),
        (
            "Rahu",
            StrengthRule::new("Taurus", "Scorpio", vec!["Aquarius"]),
        ),
        (
            "Ketu",
            StrengthRule::new("Scorpio", "Taurus", vec!["Scorpio"]),
        ),
    ])
});

#[derive(Clone)]
pub struct StrengthRule {
    pub exalt: &'static str,
    pub debilit: &'static str,
    pub own: Vec<&'static str>,
}

impl StrengthRule {
    fn new(exalt: &'static str, debilit: &'static str, own: Vec<&'static str>) -> Self {
        Self {
            exalt,
            debilit,
            own,
        }
    }
}

pub static MOOLATRIKONA: Lazy<HashMap<&'static str, (&'static str, f64, f64)>> = Lazy::new(|| {
    HashMap::from([
        ("Sun", ("Leo", 0.0, 20.0)),
        ("Moon", ("Taurus", 4.0, 20.0)),
        ("Mars", ("Aries", 0.0, 12.0)),
        ("Mercury", ("Virgo", 16.0, 20.0)),
        ("Jupiter", ("Sagittarius", 0.0, 10.0)),
        ("Venus", ("Libra", 0.0, 15.0)),
        ("Saturn", ("Aquarius", 0.0, 20.0)),
    ])
});

pub static COMBUSTION_DEGREES: Lazy<HashMap<&'static str, f64>> = Lazy::new(|| {
    HashMap::from([
        ("Moon", 12.0),
        ("Mars", 17.0),
        ("Mercury", 14.0),
        ("Jupiter", 11.0),
        ("Venus", 10.0),
        ("Saturn", 15.0),
    ])
});

pub const NAKSHATRA_SPAN: f64 = 360.0 / 27.0;
pub const PADA_SPAN: f64 = 360.0 / 108.0;
pub const SAVANA_YEAR: f64 = 360.0;
pub const TROPICAL_YEAR: f64 = 365.24219;

pub const FIRE_SIGNS: [usize; 3] = [0, 4, 8];
pub const WATER_SIGNS: [usize; 3] = [3, 7, 11];
pub const AIR_SIGNS: [usize; 3] = [2, 6, 10];

pub static DEEP_EXALTATION_DEGREES: Lazy<HashMap<&'static str, f64>> = Lazy::new(|| {
    HashMap::from([
        ("Sun", 10.0),      // Aries 10°
        ("Moon", 33.0),     // Taurus 3°
        ("Mars", 298.0),    // Capricorn 28°
        ("Mercury", 165.0), // Virgo 15°
        ("Jupiter", 95.0),  // Cancer 5°
        ("Venus", 357.0),   // Pisces 27°
        ("Saturn", 200.0),  // Libra 20°
    ])
});

pub static DEEP_DEBILITATION_DEGREES: Lazy<HashMap<&'static str, f64>> = Lazy::new(|| {
    HashMap::from([
        ("Sun", 190.0),     // Libra 10°
        ("Moon", 213.0),    // Scorpio 3°
        ("Mars", 118.0),    // Cancer 28°
        ("Mercury", 345.0), // Pisces 15°
        ("Jupiter", 275.0), // Capricorn 5°
        ("Venus", 177.0),   // Virgo 27°
        ("Saturn", 20.0),   // Aries 20°
    ])
});
