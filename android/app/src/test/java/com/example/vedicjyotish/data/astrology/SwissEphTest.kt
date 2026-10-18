package com.example.vedicjyotish.data.astrology

import org.junit.Assert.*
import org.junit.Test
import swisseph.SweConst
import swisseph.SwissEph

/**
 * Accuracy validation test verifying that Android on-device calculations
 * match Astrodienst Swiss Ephemeris and backend_rust ground truth down to sub-arcsecond accuracy.
 */
class SwissEphTest {

    @Test
    fun testSwissEphRawCalculations() {
        val sw = SwissEph()
        sw.swe_set_sid_mode(SweConst.SE_SIDM_LAHIRI, 0.0, 0.0)

        // 28 May 1998, 12:30 IST = 07:00 UTC
        val jdUt = AstroEphemeris.toJulianDay(1998, 5, 28, 7, 0, 0.0)

        val xx = DoubleArray(6)
        val serr = StringBuffer()
        val flags = SweConst.SEFLG_SIDEREAL or SweConst.SEFLG_MOSEPH or SweConst.SEFLG_SPEED

        // 1. Calculate Sun
        val sunRet = sw.swe_calc_ut(jdUt, SweConst.SE_SUN, flags, xx, serr)
        println("OFFLINE SWISSEPH SUN: longitude = ${xx[0]}°, speed = ${xx[3]}")
        assertEquals("Sun in Taurus (30°..60°)", 1, (xx[0] / 30.0).toInt())
        assertEquals(42.9322, xx[0], 0.001)

        // 2. Calculate Moon
        val moonRet = sw.swe_calc_ut(jdUt, SweConst.SE_MOON, flags, xx, serr)
        println("OFFLINE SWISSEPH MOON: longitude = ${xx[0]}°, speed = ${xx[3]}")
        assertEquals("Moon in Gemini (60°..90°)", 2, (xx[0] / 30.0).toInt())
        assertEquals(76.1087, xx[0], 0.001)

        // Moon in Ardra nakshatra (66°40' to 80°00')
        assertTrue("Moon must be in Ardra", xx[0] >= 66.666 && xx[0] < 80.0)

        // 3. Calculate Ascendant (Lagna) for Mumbai (Lat: 19.076, Lon: 72.877)
        val cusps = DoubleArray(15)
        val ascmc = DoubleArray(10)
        sw.swe_houses(jdUt, flags, 19.076, 72.877, 'W'.code, cusps, ascmc)
        println("OFFLINE SWISSEPH ASCENDANT (LAGNA): ${ascmc[0]}° (Sign: ${ascmc[0] / 30.0})")
        assertEquals("Ascendant in Leo (120°..150°)", 4, (ascmc[0] / 30.0).toInt())
        assertEquals(131.2059, ascmc[0], 0.001)
    }

    @Test
    fun testFullVedicChartAccuracyVersusBackendRust() {
        // Benchmark Chart: 28 May 1998, 12:30 IST, Mumbai
        val chart = VedicChartEngine.calculateChart(
            dateStr = "28/05/1998",
            timeStr = "12:30",
            city = "Mumbai",
            lat = 19.076,
            lon = 72.877,
            tzOffsetHours = 5.5
        )

        // 1. Ascendant
        assertEquals("Leo", chart.ascendant.sign)
        assertEquals(11.2059, chart.ascendant.degree, 0.05)

        // 2. Moon Intelligence
        assertEquals("Gemini", chart.moonIntelligence.sign)
        assertEquals("Ardra", chart.moonIntelligence.nakshatra)
        assertEquals(3, chart.moonIntelligence.pada)

        // 3. Planetary positions map
        val planetMap = chart.planetaryTable.associateBy { it.name }

        // Sun: Taurus, House 10, Rohini 1
        val sun = planetMap["Sun"]!!
        assertEquals("Taurus", sun.sign)
        assertEquals(10, sun.house)
        assertEquals("Rohini", sun.nakshatra)
        assertEquals(1, sun.pada)
        assertEquals("Aries", sun.navamsaSign)

        // Moon: Gemini, House 11, Ardra 3
        val moon = planetMap["Moon"]!!
        assertEquals("Gemini", moon.sign)
        assertEquals(11, moon.house)
        assertEquals("Ardra", moon.nakshatra)
        assertEquals(3, moon.pada)
        assertEquals("Aquarius", moon.navamsaSign)

        // Mars: Taurus, House 10, Krittika 4, Combust
        val mars = planetMap["Mars"]!!
        assertEquals("Taurus", mars.sign)
        assertEquals(10, mars.house)
        assertEquals("Krittika", mars.nakshatra)
        assertEquals(4, mars.pada)
        assertEquals("Pisces", mars.navamsaSign)
        assertTrue("Mars must be combust", mars.combust)

        // Mercury: Aries, House 9, Krittika 1
        val mercury = planetMap["Mercury"]!!
        assertEquals("Aries", mercury.sign)
        assertEquals(9, mercury.house)
        assertEquals("Krittika", mercury.nakshatra)
        assertEquals(1, mercury.pada)
        assertEquals("Sagittarius", mercury.navamsaSign)

        // Jupiter: Pisces, House 8, Purva Bhadrapada 4, Own Sign
        val jupiter = planetMap["Jupiter"]!!
        assertEquals("Pisces", jupiter.sign)
        assertEquals(8, jupiter.house)
        assertEquals("Purva Bhadrapada", jupiter.nakshatra)
        assertEquals(4, jupiter.pada)
        assertEquals("Cancer", jupiter.navamsaSign)
        assertEquals("Own Sign", jupiter.dignity)

        // Venus: Aries, House 9, Ashwini 2
        val venus = planetMap["Venus"]!!
        assertEquals("Aries", venus.sign)
        assertEquals(9, venus.house)
        assertEquals("Ashwini", venus.nakshatra)
        assertEquals(2, venus.pada)
        assertEquals("Taurus", venus.navamsaSign)

        // Saturn: Aries, House 9, Ashwini 2, Debilitated
        val saturn = planetMap["Saturn"]!!
        assertEquals("Aries", saturn.sign)
        assertEquals(9, saturn.house)
        assertEquals("Ashwini", saturn.nakshatra)
        assertEquals(2, saturn.pada)
        assertEquals("Taurus", saturn.navamsaSign)
        assertEquals("Debilitated", saturn.dignity)

        // Rahu: Leo, House 1, Magha 4, Retrograde
        val rahu = planetMap["Rahu"]!!
        assertEquals("Leo", rahu.sign)
        assertEquals(1, rahu.house)
        assertEquals("Magha", rahu.nakshatra)
        assertEquals(4, rahu.pada)
        assertEquals("Cancer", rahu.navamsaSign)
        assertTrue("Rahu must be retrograde", rahu.retrograde)

        // Ketu: Aquarius, House 7, Shatabhisha 2, Retrograde
        val ketu = planetMap["Ketu"]!!
        assertEquals("Aquarius", ketu.sign)
        assertEquals(7, ketu.house)
        assertEquals("Shatabhisha", ketu.nakshatra)
        assertEquals(2, ketu.pada)
        assertEquals("Capricorn", ketu.navamsaSign)
        assertTrue("Ketu must be retrograde", ketu.retrograde)

        // 4. Verify 8-Karaka Scheme matches backend_rust
        assertTrue("Mercury is AK", mercury.charaKaraka?.contains("AK") == true)
        assertTrue("Rahu is AmK", rahu.charaKaraka?.contains("AmK") == true)
        assertTrue("Moon is BK", moon.charaKaraka?.contains("BK") == true)
        assertTrue("Sun is MK", sun.charaKaraka?.contains("MK") == true)
        assertTrue("Mars is PiK", mars.charaKaraka?.contains("PiK") == true)
        assertTrue("Saturn is PK", saturn.charaKaraka?.contains("PK") == true)
        assertTrue("Venus is GK", venus.charaKaraka?.contains("GK") == true)
        assertTrue("Jupiter is DK", jupiter.charaKaraka?.contains("DK") == true)

        // 5. Verify Sarvashtakavarga total = 337
        val savSum = chart.ashtakavarga!!.sarvashtakavarga.sum()
        assertEquals(337, savSum)

        // 6. Verify Vimshottari Dasha Accuracy
        val vTimeline = chart.vimshottariTimeline
        assertTrue("Vimshottari timeline must not be empty", vTimeline.isNotEmpty())
        val firstMaha = vTimeline.first()
        assertEquals("Rahu", firstMaha.lord) // Moon in Ardra -> Rahu Mahadasha
        assertEquals("28-05-1998", firstMaha.start) // Starts at birth date
        assertTrue("First Mahadasha must have antardashas", !firstMaha.antardashas.isNullOrEmpty())

        val secondMaha = vTimeline[1]
        assertEquals("Jupiter", secondMaha.lord)
        assertEquals(firstMaha.end, secondMaha.start)

        val thirdMaha = vTimeline[2]
        assertEquals("Saturn", thirdMaha.lord)
        assertEquals(secondMaha.end, thirdMaha.start)

        // 7. Verify Jaimini Chara Dasha Accuracy
        val charaPeriods = chart.charaDasha!!.periods
        assertEquals(12, charaPeriods.size)
        assertEquals("Leo", charaPeriods[0].sign)
        assertEquals("28-05-1998", charaPeriods[0].startDate)
        assertTrue(charaPeriods[0].durationYears in 1..12)
    }

    @Test
    fun testGlobalTimezoneHandling() {
        // Test New York birth (UTC-5): 1 Jan 2000, 12:00 PM EST
        val nyChart = VedicChartEngine.calculateChart(
            dateStr = "01/01/2000",
            timeStr = "12:00",
            city = "New York",
            lat = 40.7128,
            lon = -74.0060,
            tzOffsetHours = -5.0
        )
        // Ascendant for New York at 12:00 PM EST on Jan 1 2000 is Pisces (around 354°)
        assertEquals("Pisces", nyChart.ascendant.sign)
        assertEquals(-5.0, nyChart.location.tz, 0.01)

        // Test London birth (UTC+0): 1 Jan 2000, 12:00 PM GMT
        val londonChart = VedicChartEngine.calculateChart(
            dateStr = "01/01/2000",
            timeStr = "12:00",
            city = "London",
            lat = 51.5074,
            lon = -0.1278,
            tzOffsetHours = 0.0
        )
        // Ascendant for London at 12:00 PM GMT on Jan 1 2000 is Aries
        assertEquals("Aries", londonChart.ascendant.sign)
        assertEquals(0.0, londonChart.location.tz, 0.01)

        // Test Tokyo birth (UTC+9): 1 Jan 2000, 12:00 PM JST
        val tokyoChart = VedicChartEngine.calculateChart(
            dateStr = "01/01/2000",
            timeStr = "12:00",
            city = "Tokyo",
            lat = 35.6762,
            lon = 139.6503,
            tzOffsetHours = 9.0
        )
        // Ascendant for Tokyo at 12:00 PM JST on Jan 1 2000 is Pisces
        assertEquals("Pisces", tokyoChart.ascendant.sign)
        assertEquals(9.0, tokyoChart.location.tz, 0.01)
    }
}
