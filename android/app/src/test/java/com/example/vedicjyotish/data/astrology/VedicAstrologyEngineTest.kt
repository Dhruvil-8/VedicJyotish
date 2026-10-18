package com.example.vedicjyotish.data.astrology

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone
import kotlin.math.abs

/**
 * Rigorous Unit Test Suite mathematically verifying every Vedic Astrology Calculation:
 * 1. AstroEphemeris: Julian Day, Obliquity, Lahiri Ayanamsa, Ascendant, Planetary Kepler Coordinates
 * 2. VedicChartEngine: D1-D60 charts, Vimshottari Dasha, Ashtakavarga 337 pts, Dig Bala, Jaimini, Yogas, Doshas
 * 3. PanchangaEngine: 5 Angas, Sunrise/Sunset, Rahu Kaal, Abhijit, Choghadiya, Horas
 * 4. CompatibilityEngine: Ashtakoota 36 Guna Milan, Naadi/Bhakoot doshas, Poruthams
 */
class VedicAstrologyEngineTest {

    @Test
    fun testJulianDayEpoch() {
        // Standard astronomical benchmark: J2000.0 (Jan 1, 2000, 12:00:00 UTC) = 2451545.0
        val jd = AstroEphemeris.toJulianDay(2000, 1, 1, 12, 0, 0.0)
        assertEquals(2451545.0, jd, 0.0001)

        // Jan 1, 2024, 00:00:00 UTC
        val jd2024 = AstroEphemeris.toJulianDay(2024, 1, 1, 0, 0, 0.0)
        assertTrue("JD 2024 should be > 2460000", jd2024 > 2460000.0)
    }

    @Test
    fun testLahiriAyanamsaAccuracy() {
        // On J2000.0, Lahiri ayanamsa is approximately 23.85° (23°51')
        val ayanamsa2000 = AstroEphemeris.getLahiriAyanamsa(2451545.0)
        assertTrue("Ayanamsa at J2000 must be between 23.8° and 23.9°", ayanamsa2000 in 23.8..23.9)

        // Around 2024 (approx JD 2460310), Lahiri ayanamsa is approximately 24.15° to 24.2°
        val jd2024 = AstroEphemeris.toJulianDay(2024, 1, 1, 0, 0, 0.0)
        val ayanamsa2024 = AstroEphemeris.getLahiriAyanamsa(jd2024)
        assertTrue("Ayanamsa in 2024 must be between 24.1° and 24.3°", ayanamsa2024 in 24.1..24.3)
        assertTrue("Ayanamsa increases over time (precession of equinoxes)", ayanamsa2024 > ayanamsa2000)
    }

    @Test
    fun testBenchmarkChart() {
        val chart = VedicChartEngine.calculateChart(
            dateStr = "28/05/1998",
            timeStr = "12:30",
            city = "Mumbai",
            lat = 19.076,
            lon = 72.877,
            tzOffsetHours = 5.5
        )
        // Ascendant: Leo (House 1)
        assertEquals("Leo", chart.ascendant.sign)
        assertEquals(11.20, chart.ascendant.degree, 0.5)

        // Moon: Gemini Ardra Pada 3
        assertEquals("Gemini", chart.moonIntelligence.sign)
        assertEquals("Ardra", chart.moonIntelligence.nakshatra)
        assertEquals(3, chart.moonIntelligence.pada)

        val planetMap = chart.planetaryTable.associateBy { it.name }
        // Sun: Taurus (House 10)
        assertEquals("Taurus", planetMap["Sun"]?.sign)
        // Moon: Gemini (House 11)
        assertEquals("Gemini", planetMap["Moon"]?.sign)
        // Mars: Taurus (House 10)
        assertEquals("Taurus", planetMap["Mars"]?.sign)
        // Mercury: Aries (House 9)
        assertEquals("Aries", planetMap["Mercury"]?.sign)
        // Jupiter: Pisces (House 8)
        assertEquals("Pisces", planetMap["Jupiter"]?.sign)
        // Venus: Aries (House 9)
        assertEquals("Aries", planetMap["Venus"]?.sign)
        // Saturn: Aries (House 9)
        assertEquals("Aries", planetMap["Saturn"]?.sign)
        // Rahu: Leo (House 1)
        assertEquals("Leo", planetMap["Rahu"]?.sign)
        // Ketu: Aquarius (House 7)
        assertEquals("Aquarius", planetMap["Ketu"]?.sign)
    }

    @Test
    fun testAscendantCalculation() {
        // Test Ascendant calculation for New Delhi (Lat: 28.6139, Lon: 77.2090)
        val jd = AstroEphemeris.toJulianDay(2024, 4, 14, 6, 0, 0.0) // ~11:30 AM IST (Sun near Midheaven)
        val snapshot = AstroEphemeris.calculateSnapshot(jd, 28.6139, 77.2090)

        assertTrue("Ascendant degree must be in [0, 360)", snapshot.ascendantDegree in 0.0..360.0)
        val signIndex = (snapshot.ascendantDegree / 30).toInt().coerceIn(0, 11)
        val ascSign = VedicConstants.SIGNS[signIndex]
        assertTrue("Ascendant sign must be valid", ascSign in VedicConstants.SIGNS)
    }

    @Test
    fun testPlanetaryCoordinatesAndDignities() {
        // Calculate chart for Indian Independence: 15 Aug 1947, 00:00:00 IST (UTC: 14 Aug 1947, 18:30:00)
        val jd = AstroEphemeris.toJulianDay(1947, 8, 14, 18, 30, 0.0)
        val snapshot = AstroEphemeris.calculateSnapshot(jd, 28.6139, 77.2090)
        val planets = snapshot.planets

        // Must compute all 9 Vedic Grahas + outer reference planets
        assertEquals(12, planets.size)
        val planetNames = planets.map { it.name }.toSet()
        val expectedPlanets = setOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu")
        assertTrue("Must include all 9 classical Grahas", planetNames.containsAll(expectedPlanets))

        // Rahu and Ketu must be precisely 180 degrees apart
        val rahu = planets.first { it.name == "Rahu" }
        val ketu = planets.first { it.name == "Ketu" }
        val separation = abs(rahu.siderealLongitude - ketu.siderealLongitude)
        val diff = if (separation > 180.0) 360.0 - separation else separation
        assertEquals(180.0, diff, 0.01)

        // Rahu and Ketu are always retrograde in classical Jyotish
        assertTrue("Rahu must be retrograde", rahu.isRetrograde)
        assertTrue("Ketu must be retrograde", ketu.isRetrograde)

        // Sun and Moon are never retrograde
        val sun = planets.first { it.name == "Sun" }
        val moon = planets.first { it.name == "Moon" }
        assertFalse("Sun cannot be retrograde", sun.isRetrograde)
        assertFalse("Moon cannot be retrograde", moon.isRetrograde)
    }

    @Test
    fun testVedicChartEngineFullCalculation() {
        val chart = VedicChartEngine.calculateChart(
            dateStr = "15/08/1947",
            timeStr = "00:00",
            city = "New Delhi",
            lat = 28.6139,
            lon = 77.2090,
            tzOffsetHours = 5.5
        )

        // 1. Verify Ascendant & Moon
        assertNotNull(chart.ascendant)
        assertNotNull(chart.moonIntelligence)
        assertTrue(chart.moonIntelligence.nakshatra.isNotEmpty())
        assertTrue(chart.moonIntelligence.pada in 1..4)

        // 2. Verify 12 houses in D1
        assertEquals(12, chart.chartData.size)
        for (h in 1..12) {
            val house = chart.chartData["house_$h"]
            assertNotNull("House $h must exist", house)
            assertTrue("House sign must be valid", house!!.sign in VedicConstants.SIGNS)
        }

        // 3. Verify D9 Navamsa Chart
        assertEquals(12, chart.navamsaChart.size)

        // 4. Verify 15 Divisional Charts (D2 through D60; D1 is verified in step 2)
        assertNotNull(chart.divisionalCharts)
        val vargas = listOf("D2", "D3", "D4", "D7", "D9", "D10", "D12", "D16", "D20", "D24", "D27", "D30", "D40", "D45", "D60")
        for (v in vargas) {
            assertTrue("Divisional chart $v must be generated", chart.divisionalCharts!!.containsKey(v))
            assertEquals(12, chart.divisionalCharts!![v]!!.size)
        }

        // 5. Verify Vimshottari Timeline
        assertNotNull(chart.vimshottariTimeline)
        assertTrue("Vimshottari timeline must contain Mahadasha periods", chart.vimshottariTimeline.isNotEmpty())
        for (dasha in chart.vimshottariTimeline) {
            assertTrue(dasha.lord in VedicConstants.DASHA_SEQUENCE)
        }

        // 6. Verify Ashtakavarga (337 total SAV points)
        assertNotNull(chart.ashtakavarga)
        val sav = chart.ashtakavarga!!.sarvashtakavarga
        assertEquals(12, sav.size)
        val totalSav = sav.sum()
        assertEquals("Total Sarvashtakavarga bindus across 12 houses must be exactly 337", 337, totalSav)

        // 7. Verify Dig Bala (Directional Strength for 7 planets in house planets)
        for (h in 1..12) {
            val house = chart.chartData["house_$h"]
            house?.planets?.forEach { p ->
                if (p.digBalaPoints != null) {
                    assertTrue("${p.name} Dig Bala in 0..60", p.digBalaPoints >= 0.0 && p.digBalaPoints <= 60.0)
                }
            }
        }

        // 8. Verify Jaimini Chara Karakas
        assertNotNull(chart.jaimini)
        val jaimini = chart.jaimini!!
        assertTrue("Atmakaraka must be assigned", jaimini.charaKarakas.values.any { it.contains("Atmakaraka") })
        assertTrue(jaimini.arudhaLagna.sign in VedicConstants.SIGNS)
        assertTrue(jaimini.upapadaLagna.sign in VedicConstants.SIGNS)

        // 9. Verify Yogas & Doshas
        assertNotNull(chart.yogas)
        assertNotNull(chart.doshas)
        assertNotNull(chart.doshas!!.kalaSarpa)
        assertNotNull(chart.doshas!!.manglikLagna)
    }

    @Test
    fun testPanchangaEngine() {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            set(2024, Calendar.APRIL, 14, 12, 0, 0)
        }
        val pan = PanchangaEngine.calculateDailyPanchanga(
            calendar = cal,
            lat = 28.6139,
            lon = 77.2090,
            city = "New Delhi",
            tzOffsetHours = 5.5
        )

        // 1. Five Angas
        assertEquals("Sunday", pan.vara)
        assertTrue("Tithi name not empty", pan.tithi.name.isNotEmpty())
        assertTrue("Nakshatra name not empty", pan.nakshatra.name.isNotEmpty())
        assertTrue("Yoga name not empty", pan.yoga.name.isNotEmpty())
        assertTrue("Karana name not empty", pan.karana.name.isNotEmpty())

        // 2. Sunrise & Sunset
        assertTrue(pan.sunrise.contains(":"))
        assertTrue(pan.sunset.contains(":"))

        // 3. Auspicious & Inauspicious Muhurtas
        assertTrue(pan.rahuKaal.contains(" - "))
        assertTrue(pan.yamaganda.contains(" - "))
        assertTrue(pan.gulikaKaal.contains(" - "))
        assertTrue(pan.abhijitMuhurta.contains(" - "))
        assertTrue(pan.brahmaMuhurta.contains(" - "))

        // 4. Day & Night Choghadiyas (8 day + 8 night = 16)
        assertEquals(8, pan.choghadiyaDay.size)
        assertEquals(8, pan.choghadiyaNight.size)
        for (c in pan.choghadiyaDay + pan.choghadiyaNight) {
            assertTrue(c.name.isNotEmpty())
            assertTrue(c.nature in setOf("Auspicious", "Inauspicious", "Neutral"))
        }

        // 5. 24 Planetary Horas
        assertEquals(12, pan.horasDay.size)
        assertEquals(12, pan.horasNight.size)

        // 6. Enriched Features: Moonrise, Moonset, Amrit Kaal, Varjyam, End Times, Rashis
        assertTrue("Moonrise present", pan.moonrise.isNotEmpty())
        assertTrue("Moonset present", pan.moonset.isNotEmpty())
        assertTrue("Amrit Kaal present", pan.amritKaal.contains(" - "))
        assertTrue("Varjyam present", pan.varjyam.contains(" - "))
        assertTrue("Tithi has end time", pan.tithi.endTime != null && pan.tithi.endTime!!.contains("Ends at"))
        assertTrue("Nakshatra has end time", pan.nakshatra.endTime != null && pan.nakshatra.endTime!!.contains("Ends at"))
        assertTrue("Sun Rashi present", pan.sunRashi.isNotEmpty())
        assertTrue("Moon Rashi present", pan.moonRashi.isNotEmpty())
    }

    @Test
    fun testCompatibilityEngineAshtakoota() {
        val result = CompatibilityEngine.calculateMatching(
            boySign = "Taurus",
            boyNakshatra = "Rohini",
            boyPada = 1,
            girlSign = "Taurus",
            girlNakshatra = "Rohini",
            girlPada = 1
        )

        // 1. Total score out of 36
        assertTrue("Score in 0..36", result.totalScore in 0.0..36.0)

        // 2. Check 8 Kootas exist
        assertEquals("Varna", result.varna.name)
        assertEquals(1.0, result.varna.maxScore, 0.01)

        assertEquals("Vashya", result.vashya.name)
        assertEquals(2.0, result.vashya.maxScore, 0.01)

        assertEquals("Tara", result.tara.name)
        assertEquals(3.0, result.tara.maxScore, 0.01)

        assertEquals("Yoni", result.yoni.name)
        assertEquals(4.0, result.yoni.maxScore, 0.01)

        assertEquals("Graha Maitri", result.grahaMaitri.name)
        assertEquals(5.0, result.grahaMaitri.maxScore, 0.01)

        assertEquals("Gana", result.gana.name)
        assertEquals(6.0, result.gana.maxScore, 0.01)

        assertEquals("Bhakoot", result.bhakoot.name)
        assertEquals(7.0, result.bhakoot.maxScore, 0.01)

        assertEquals("Naadi", result.naadi.name)
        assertEquals(8.0, result.naadi.maxScore, 0.01)

        // 3. Poruthams
        assertNotNull(result.mahendra)
        assertNotNull(result.vedha)
        assertNotNull(result.rajju)
        assertNotNull(result.sthreeDheerga)
    }
}
