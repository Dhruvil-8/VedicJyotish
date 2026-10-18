package com.example.vedicjyotish.data.astrology

object VedicConstants {

    val SIGNS = listOf(
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    )

    val SIGN_LORDS = listOf(
        "Mars", "Venus", "Mercury", "Moon",
        "Sun", "Mercury", "Venus", "Mars",
        "Jupiter", "Saturn", "Saturn", "Jupiter"
    )

    val NAKSHATRA_NAMES = listOf(
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
        "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
        "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
        "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
        "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
    )

    val NAKSHATRA_LORDS = listOf(
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
    )

    val DASHA_SEQUENCE = listOf(
        "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
    )

    val DASHA_YEARS = mapOf(
        "Ketu" to 7.0,
        "Venus" to 20.0,
        "Sun" to 6.0,
        "Moon" to 10.0,
        "Mars" to 7.0,
        "Rahu" to 18.0,
        "Jupiter" to 16.0,
        "Saturn" to 19.0,
        "Mercury" to 17.0
    )

    // Exaltation sign index (0-based) and exact exaltation degree in sign
    val EXALTATION_MAP = mapOf(
        "Sun" to Pair(0, 10.0),       // Aries 10°
        "Moon" to Pair(1, 3.0),       // Taurus 3°
        "Mars" to Pair(9, 28.0),      // Capricorn 28°
        "Mercury" to Pair(5, 15.0),   // Virgo 15°
        "Jupiter" to Pair(3, 5.0),    // Cancer 5°
        "Venus" to Pair(11, 27.0),    // Pisces 27°
        "Saturn" to Pair(6, 20.0),    // Libra 20°
        "Rahu" to Pair(1, 15.0),      // Taurus (standard Parashara)
        "Ketu" to Pair(7, 15.0)       // Scorpio
    )

    // Debilitation sign is exactly (Exaltation sign + 6) % 12
    val DEBILITATION_MAP = mapOf(
        "Sun" to Pair(6, 10.0),       // Libra 10°
        "Moon" to Pair(7, 3.0),       // Scorpio 3°
        "Mars" to Pair(3, 28.0),      // Cancer 28°
        "Mercury" to Pair(11, 15.0),  // Pisces 15°
        "Jupiter" to Pair(9, 5.0),    // Capricorn 5°
        "Venus" to Pair(5, 27.0),     // Virgo 27°
        "Saturn" to Pair(0, 20.0),    // Aries 20°
        "Rahu" to Pair(7, 15.0),      // Scorpio
        "Ketu" to Pair(1, 15.0)       // Taurus
    )

    // Own signs for each planet
    val OWN_SIGNS = mapOf(
        "Sun" to listOf(4),
        "Moon" to listOf(3),
        "Mars" to listOf(0, 7),
        "Mercury" to listOf(2, 5),
        "Jupiter" to listOf(8, 11),
        "Venus" to listOf(1, 6),
        "Saturn" to listOf(9, 10)
    )

    // Combustion distance from Sun in degrees
    val COMBUSTION_ORB = mapOf(
        "Moon" to 12.0,
        "Mars" to 17.0,
        "Mercury" to 14.0,
        "Jupiter" to 11.0,
        "Venus" to 10.0,
        "Saturn" to 15.0
    )

    // Functional benefics and malefics by Lagna sign index
    val FUNCTIONAL_MALEFICS = mapOf(
        0 to listOf("Mercury", "Saturn", "Rahu", "Ketu"),
        1 to listOf("Venus", "Jupiter", "Moon", "Rahu", "Ketu"),
        2 to listOf("Mars", "Jupiter", "Sun", "Rahu", "Ketu"),
        3 to listOf("Jupiter", "Saturn", "Mercury", "Rahu", "Ketu"),
        4 to listOf("Mercury", "Venus", "Saturn", "Rahu", "Ketu"),
        5 to listOf("Mars", "Jupiter", "Moon", "Rahu", "Ketu"),
        6 to listOf("Mars", "Jupiter", "Sun", "Rahu", "Ketu"),
        7 to listOf("Venus", "Mercury", "Saturn", "Rahu", "Ketu"),
        8 to listOf("Venus", "Saturn", "Mercury", "Rahu", "Ketu"),
        9 to listOf("Mars", "Jupiter", "Moon", "Rahu", "Ketu"),
        10 to listOf("Moon", "Mercury", "Mars", "Rahu", "Ketu"),
        11 to listOf("Sun", "Venus", "Saturn", "Rahu", "Ketu")
    )
}
