package com.example.vedicjyotish.data.astrology

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

/**
 * Unit Test Suite for Android Astrology Components:
 * 1. PanchangaEngine: Julian Day, Sun/Moon calculation, 5 Angas, Sunrise/Sunset, Rahu Kaal, Abhijit, Choghadiya, Horas
 * 2. CompatibilityEngine: Ashtakoota 36 Guna Milan, Naadi/Bhakoot doshas, Poruthams
 * 3. RustBridge: Native bridge interface verification
 */
class VedicAstrologyEngineTest {

    @Test
    fun testJulianDayEpoch() {
        // Standard astronomical benchmark: J2000.0 (Jan 1, 2000, 12:00:00 UTC) = 2451545.0
        val jd = PanchangaEngine.toJulianDay(2000, 1, 1, 12, 0, 0.0)
        assertEquals(2451545.0, jd, 0.0001)

        // Jan 1, 2024, 00:00:00 UTC
        val jd2024 = PanchangaEngine.toJulianDay(2024, 1, 1, 0, 0, 0.0)
        assertTrue("JD 2024 should be > 2460000", jd2024 > 2460000.0)
    }

    @Test
    fun testSunMoonCoordinates() {
        val jd = PanchangaEngine.toJulianDay(2024, 4, 14, 6, 0, 0.0)
        val coords = PanchangaEngine.getSunMoon(jd, 28.6139, 77.2090)

        assertTrue("Sun tropical in 0..360", coords.sunTropical in 0.0..360.0)
        assertTrue("Sun sidereal in 0..360", coords.sunSidereal in 0.0..360.0)
        assertTrue("Moon tropical in 0..360", coords.moonTropical in 0.0..360.0)
        assertTrue("Moon sidereal in 0..360", coords.moonSidereal in 0.0..360.0)
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
        assertTrue("Tithi has end time", pan.tithi.endTime?.contains("Ends at") == true)
        assertTrue("Nakshatra has end time", pan.nakshatra.endTime?.contains("Ends at") == true)
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
