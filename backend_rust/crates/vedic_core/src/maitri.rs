//! Pancha-Dha Maitri (Five-fold Planetary Friendship) Engine.
//!
//! Combines Naisargika (Natural) and Tatkalika (Temporal) friendships
//! to calculate exact planetary relationships: Great Friend, Friend, Neutral,
//! Enemy, or Great Enemy.

use std::collections::HashMap;
use once_cell::sync::Lazy;

/// Natural relationships map: key is (planet, other_planet) -> value is relationship value (-1 for Enemy, 0 for Neutral, 1 for Friend)
static NAISARGIKA_MAP: Lazy<HashMap<(&'static str, &'static str), i8>> = Lazy::new(|| {
    let mut m = HashMap::new();
    
    // Sun
    m.insert(("Sun", "Moon"), 1);
    m.insert(("Sun", "Mars"), 1);
    m.insert(("Sun", "Jupiter"), 1);
    m.insert(("Sun", "Mercury"), 0);
    m.insert(("Sun", "Venus"), -1);
    m.insert(("Sun", "Saturn"), -1);
    m.insert(("Sun", "Rahu"), -1);
    m.insert(("Sun", "Ketu"), -1);

    // Moon
    m.insert(("Moon", "Sun"), 1);
    m.insert(("Moon", "Mercury"), 1);
    m.insert(("Moon", "Mars"), 0);
    m.insert(("Moon", "Jupiter"), 0);
    m.insert(("Moon", "Venus"), 0);
    m.insert(("Moon", "Saturn"), 0);
    m.insert(("Moon", "Rahu"), -1);
    m.insert(("Moon", "Ketu"), -1);

    // Mars
    m.insert(("Mars", "Sun"), 1);
    m.insert(("Mars", "Moon"), 1);
    m.insert(("Mars", "Jupiter"), 1);
    m.insert(("Mars", "Venus"), 0);
    m.insert(("Mars", "Saturn"), 0);
    m.insert(("Mars", "Mercury"), -1);
    m.insert(("Mars", "Rahu"), -1);
    m.insert(("Mars", "Ketu"), 0);

    // Mercury
    m.insert(("Mercury", "Sun"), 1);
    m.insert(("Mercury", "Venus"), 1);
    m.insert(("Mercury", "Mars"), 0);
    m.insert(("Mercury", "Jupiter"), 0);
    m.insert(("Mercury", "Saturn"), 0);
    m.insert(("Mercury", "Moon"), -1);
    m.insert(("Mercury", "Rahu"), 0);
    m.insert(("Mercury", "Ketu"), 0);

    // Jupiter
    m.insert(("Jupiter", "Sun"), 1);
    m.insert(("Jupiter", "Moon"), 1);
    m.insert(("Jupiter", "Mars"), 1);
    m.insert(("Jupiter", "Saturn"), 0);
    m.insert(("Jupiter", "Mercury"), -1);
    m.insert(("Jupiter", "Venus"), -1);
    m.insert(("Jupiter", "Rahu"), 0);
    m.insert(("Jupiter", "Ketu"), 0);

    // Venus
    m.insert(("Venus", "Mercury"), 1);
    m.insert(("Venus", "Saturn"), 1);
    m.insert(("Venus", "Mars"), 0);
    m.insert(("Venus", "Jupiter"), 0);
    m.insert(("Venus", "Sun"), -1);
    m.insert(("Venus", "Moon"), -1);
    m.insert(("Venus", "Rahu"), 1);
    m.insert(("Venus", "Ketu"), 1);

    // Saturn
    m.insert(("Saturn", "Mercury"), 1);
    m.insert(("Saturn", "Venus"), 1);
    m.insert(("Saturn", "Jupiter"), 0);
    m.insert(("Saturn", "Sun"), -1);
    m.insert(("Saturn", "Moon"), -1);
    m.insert(("Saturn", "Mars"), -1);
    m.insert(("Saturn", "Rahu"), 1);
    m.insert(("Saturn", "Ketu"), 0);

    // Rahu
    m.insert(("Rahu", "Venus"), 1);
    m.insert(("Rahu", "Saturn"), 1);
    m.insert(("Rahu", "Mercury"), 1);
    m.insert(("Rahu", "Jupiter"), 0);
    m.insert(("Rahu", "Sun"), -1);
    m.insert(("Rahu", "Moon"), -1);
    m.insert(("Rahu", "Mars"), -1);
    m.insert(("Rahu", "Ketu"), 0);

    // Ketu
    m.insert(("Ketu", "Venus"), 1);
    m.insert(("Ketu", "Saturn"), 1);
    m.insert(("Ketu", "Mercury"), 1);
    m.insert(("Ketu", "Jupiter"), 0);
    m.insert(("Ketu", "Mars"), 0);
    m.insert(("Ketu", "Sun"), -1);
    m.insert(("Ketu", "Moon"), -1);
    m.insert(("Ketu", "Rahu"), 0);

    m
});

/// Get natural relationship score: 1 = Friend, 0 = Neutral, -1 = Enemy
pub fn get_natural_relationship(planet: &str, other: &str) -> i8 {
    if planet == other {
        return 0; // Neutral relative to itself
    }
    *NAISARGIKA_MAP.get(&(planet, other)).unwrap_or(&0)
}

/// Get temporal relationship score: 1 = Friend, -1 = Enemy.
///
/// Rules: Planets in the 2nd, 3rd, 4th, 10th, 11th, and 12th houses from a reference planet
/// are its temporal friends. Others (1st, 5th, 6th, 7th, 8th, 9th) are temporal enemies.
pub fn get_temporal_relationship(planet_house: u8, other_house: u8) -> i8 {
    if planet_house == other_house {
        return -1; // Same house is an enemy (conjunction causes competition/affliction temporarily)
    }
    
    // Compute distance relative to whole signs (1 to 12)
    let dist = ((other_house as i16 + 12 - planet_house as i16) % 12) as u8;
    if [1, 2, 3, 9, 10, 11].contains(&dist) {
        1  // 2nd, 3rd, 4th, 10th, 11th, 12th from planet (0-indexed offset is 1, 2, 3, 9, 10, 11)
    } else {
        -1 // 1st, 5th, 6th, 7th, 8th, 9th
    }
}

/// Compute Pancha-Dha (five-fold) friendship:
///
/// - +2: Great Friend (Adhi-Mitra)
/// - +1: Friend (Mitra)
/// -  0: Neutral (Sama)
/// - -1: Enemy (Shatru)
/// - -2: Great Enemy (Adhi-Shatru)
pub fn get_fivefold_relationship(planet: &str, lord: &str, planet_house: u8, lord_house: u8) -> &'static str {
    if planet == lord {
        return "Own Sign"; // If lord of sign is the planet itself, it's in its own sign
    }
    
    let natural = get_natural_relationship(planet, lord);
    let temporal = get_temporal_relationship(planet_house, lord_house);
    
    let combined = natural + temporal;
    match combined {
        2 => "Great Friend",
        1 => "Friend",
        0 => "Neutral",
        -1 => "Enemy",
        _ => "Great Enemy",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_natural_friendship() {
        assert_eq!(get_natural_relationship("Sun", "Moon"), 1);     // Moon is Sun's friend
        assert_eq!(get_natural_relationship("Sun", "Saturn"), -1);  // Saturn is Sun's enemy
        assert_eq!(get_natural_relationship("Sun", "Mercury"), 0);   // Mercury is Sun's neutral
    }

    #[test]
    fn test_temporal_friendship() {
        // Planet in House 1, other in House 4 -> distance = 3 (offset is 3, which is 4th house from it) -> temporal friend
        assert_eq!(get_temporal_relationship(1, 4), 1);
        
        // Planet in House 1, other in House 7 -> distance = 6 -> temporal enemy
        assert_eq!(get_temporal_relationship(1, 7), -1);
    }

    #[test]
    fn test_fivefold_friendship() {
        // Sun in Aries (lord Mars). If Sun is in house 1 and Mars in house 4:
        // Natural relationship (Sun, Mars) = 1 (Friend)
        // Temporal relationship (House 1, House 4) = 1 (Friend)
        // Combined = 2 (Great Friend)
        assert_eq!(get_fivefold_relationship("Sun", "Mars", 1, 4), "Great Friend");

        // Sun in Leo (lord Sun) -> Own Sign
        assert_eq!(get_fivefold_relationship("Sun", "Sun", 5, 5), "Own Sign");
    }
}
