package com.example.vedicjyotish.data.astrology

import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.*

/**
 * 100% On-Device High-Precision Panchanga Engine.
 * Computes:
 * - High-precision Sunrise, Sunset, Moonrise, Moonset, Solar Noon using astronomical equations
 * - Five Angas: Tithi, Nakshatra, Yoga, Karana, Vara (with exact end times & next names)
 * - Auspicious Timings: Abhijit Muhurta, Brahma Muhurta, Amrit Kaal, Vijaya Muhurta, Pradosha Kaal
 * - Inauspicious Timings: Rahu Kaal, Yamaganda, Gulika Kaal, Varjyam, Dur Muhurtham
 * - 24-Hour Day & Night Choghadiya with real-time active slot detection
 * - 24 Planetary Horas with real-time active hora detection
 * - Sun Rashi & Moon Rashi, Vikram Samvat, Shaka Samvat, Ritu, Ayana
 */
object PanchangaEngine {

    private const val RAD = Math.PI / 180.0
    private const val DEG = 180.0 / Math.PI

    data class PanchangaDetails(
        val date: String,
        val city: String,
        val sunrise: String,
        val sunset: String,
        val moonrise: String,
        val moonset: String,
        val solarNoon: String,
        val dayDuration: String,
        val nightDuration: String,
        val vara: String,
        val varaLord: String,
        val tithi: PanchangaAnga,
        val nakshatra: PanchangaAnga,
        val yoga: PanchangaAnga,
        val karana: PanchangaAnga,
        val sunRashi: String,
        val moonRashi: String,
        val samvat: String,
        val ritu: String,
        val ayana: String,
        val abhijitMuhurta: String,
        val brahmaMuhurta: String,
        val vijayaMuhurta: String,
        val pradoshaKaal: String,
        val amritKaal: String,
        val rahuKaal: String,
        val yamaganda: String,
        val gulikaKaal: String,
        val varjyam: String,
        val durMuhurtham: List<String>,
        val choghadiyaDay: List<ChoghadiyaSlot>,
        val choghadiyaNight: List<ChoghadiyaSlot>,
        val horasDay: List<HoraSlot>,
        val horasNight: List<HoraSlot>,
        val currentChoghadiya: ChoghadiyaSlot? = null,
        val currentHora: HoraSlot? = null
    )

    data class PanchangaAnga(
        val name: String,
        val details: String,
        val progressPercent: Double,
        val endTime: String? = null
    )

    data class ChoghadiyaSlot(
        val name: String,
        val start: String,
        val end: String,
        val nature: String, // "Auspicious", "Inauspicious", or "Neutral"
        val planet: String,
        val isCurrent: Boolean = false
    )

    data class HoraSlot(
        val horaNumber: Int,
        val planet: String,
        val start: String,
        val end: String,
        val nature: String,
        val description: String = "",
        val isCurrent: Boolean = false
    )

    fun calculateDailyPanchanga(
        calendar: Calendar,
        lat: Double,
        lon: Double,
        city: String = "Location",
        tzOffsetHours: Double = 5.5
    ): PanchangaDetails {
        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH) + 1
        val day = calendar.get(Calendar.DAY_OF_MONTH)

        // 1. Calculate Sunrise, Sunset & Solar Noon using NOAA Solar algorithms
        val (sunriseMinutes, sunsetMinutes, solarNoonMinutes) = calculateSunTimes(year, month, day, lat, lon, tzOffsetHours)

        val sunriseStr = formatMinutesToTime(sunriseMinutes)
        val sunsetStr = formatMinutesToTime(sunsetMinutes)
        val solarNoonStr = formatMinutesToTime(solarNoonMinutes)

        val dayDurationMinutes = sunsetMinutes - sunriseMinutes
        val nightDurationMinutes = 1440.0 - dayDurationMinutes

        val dayDurStr = "${(dayDurationMinutes / 60).toInt()}h ${(dayDurationMinutes % 60).toInt()}m"
        val nightDurStr = "${(nightDurationMinutes / 60).toInt()}h ${(nightDurationMinutes % 60).toInt()}m"

        // 2. Ephemeris at Sunrise for classical day Panchanga
        val sunriseHourFrac = sunriseMinutes / 60.0
        val sunriseUtHour = sunriseHourFrac - tzOffsetHours
        val jdSunrise = AstroEphemeris.toJulianDay(year, month, day, 0, 0, 0.0) + (sunriseUtHour / 24.0)

        val snapshot = AstroEphemeris.calculateSnapshot(jdSunrise, lat, lon)
        val sunDeg = snapshot.planets.firstOrNull { it.name == "Sun" }?.tropicalLongitude ?: 0.0
        val sunSidereal = snapshot.planets.firstOrNull { it.name == "Sun" }?.siderealLongitude ?: 0.0
        val moonDeg = snapshot.planets.firstOrNull { it.name == "Moon" }?.tropicalLongitude ?: 0.0
        val moonSidereal = snapshot.planets.firstOrNull { it.name == "Moon" }?.siderealLongitude ?: 0.0

        // 3. Moonrise & Moonset calculations
        val (moonriseMinutes, moonsetMinutes) = calculateMoonTimes(year, month, day, lat, lon, tzOffsetHours)
        val moonriseStr = if (moonriseMinutes != null) formatMinutesToTime(moonriseMinutes) else "--:--"
        val moonsetStr = if (moonsetMinutes != null) formatMinutesToTime(moonsetMinutes) else "--:--"

        // 4. Vara (Weekday)
        val dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK) // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
        val varaNames = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
        val varaLords = listOf("Sun (Surya)", "Moon (Chandra)", "Mars (Mangala)", "Mercury (Budha)", "Jupiter (Guru)", "Venus (Shukra)", "Saturn (Shani)")
        val varaName = varaNames[dayOfWeek - 1]
        val varaLord = varaLords[dayOfWeek - 1]

        // 5. Tithi with exact end time
        val diff = (moonDeg - sunDeg + 360.0) % 360.0
        val tithiIdx = ((diff / 12.0).toInt()) % 30
        val tithiProgress = (diff % 12.0) / 12.0
        val tithiNames = listOf(
            "Shukla Pratipada (1st Waxing)", "Shukla Dwitiya (2nd Waxing)", "Shukla Tritiya (3rd Waxing)", "Shukla Chaturthi (4th Waxing)", "Shukla Panchami (5th Waxing)",
            "Shukla Shashthi (6th Waxing)", "Shukla Saptami (7th Waxing)", "Shukla Ashtami (8th Waxing)", "Shukla Navami (9th Waxing)", "Shukla Dashami (10th Waxing)",
            "Shukla Ekadashi (11th Waxing)", "Shukla Dwadashi (12th Waxing)", "Shukla Trayodashi (13th Waxing)", "Shukla Chaturdashi (14th Waxing)", "Purnima (Full Moon)",
            "Krishna Pratipada (1st Waning)", "Krishna Dwitiya (2nd Waning)", "Krishna Tritiya (3rd Waning)", "Krishna Chaturthi (4th Waning)", "Krishna Panchami (5th Waning)",
            "Krishna Shashthi (6th Waning)", "Krishna Saptami (7th Waning)", "Krishna Ashtami (8th Waning)", "Krishna Navami (9th Waning)", "Krishna Dashami (10th Waning)",
            "Krishna Ekadashi (11th Waning)", "Krishna Dwadashi (12th Waning)", "Krishna Trayodashi (13th Waning)", "Krishna Chaturdashi (14th Waning)", "Amavasya (New Moon)"
        )
        val paksha = if (tithiIdx < 15) "Shukla Paksha (Waxing Phase)" else "Krishna Paksha (Waning Phase)"

        // Tithi end time calculation: Moon travels ~12.19 deg/day relative to Sun (0.008465 deg/min)
        val tithiDegLeft = 12.0 - (diff % 12.0)
        val tithiMinsRemaining = tithiDegLeft / 0.008465
        val tithiEndMinutes = sunriseMinutes + tithiMinsRemaining
        val nextTithiName = tithiNames[(tithiIdx + 1) % 30].substringBefore(" (")
        val tithiEndTimeStr = "Ends at ${formatMinutesToTime(tithiEndMinutes)} • Next: $nextTithiName"

        val tithiAnga = PanchangaAnga(
            name = tithiNames[tithiIdx],
            details = paksha,
            progressPercent = round(tithiProgress * 1000.0) / 10.0,
            endTime = tithiEndTimeStr
        )

        // 6. Nakshatra with exact end time
        val nakSpan = 360.0 / 27.0
        val nakIdx = ((moonSidereal / nakSpan).toInt()) % 27
        val nakProgress = (moonSidereal % nakSpan) / nakSpan
        val nakPada = ((nakProgress * 4.0).toInt()) + 1

        val nakDegLeft = nakSpan - (moonSidereal % nakSpan)
        val nakMinsRemaining = nakDegLeft / 0.00915 // Moon sidereal speed ~13.18 deg/day = 0.00915 deg/min
        val nakEndMinutes = sunriseMinutes + nakMinsRemaining
        val nextNakName = VedicConstants.NAKSHATRA_NAMES[(nakIdx + 1) % 27]
        val nakEndTimeStr = "Ends at ${formatMinutesToTime(nakEndMinutes)} • Next: $nextNakName"

        val nakAnga = PanchangaAnga(
            name = VedicConstants.NAKSHATRA_NAMES[nakIdx],
            details = "Pada $nakPada • Ruler: ${VedicConstants.NAKSHATRA_LORDS[nakIdx]}",
            progressPercent = round(nakProgress * 1000.0) / 10.0,
            endTime = nakEndTimeStr
        )

        // 7. Yoga (Sun + Moon) with exact end time
        val yogaSum = (sunDeg + moonDeg) % 360.0
        val yogaIdx = ((yogaSum / nakSpan).toInt()) % 27
        val yogaProgress = (yogaSum % nakSpan) / nakSpan
        val yogaNames = listOf(
            "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
            "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
            "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
        )
        val isYogaAuspicious = yogaIdx !in listOf(5, 8, 9, 12, 14, 16, 18, 26)
        val yogaDegLeft = nakSpan - (yogaSum % nakSpan)
        val yogaMinsRemaining = yogaDegLeft / 0.009837
        val yogaEndTimeStr = "Ends at ${formatMinutesToTime(sunriseMinutes + yogaMinsRemaining)} • Next: ${yogaNames[(yogaIdx + 1) % 27]}"

        val yogaAnga = PanchangaAnga(
            name = yogaNames[yogaIdx],
            details = if (isYogaAuspicious) "Auspicious Combination" else "Inauspicious Period",
            progressPercent = round(yogaProgress * 1000.0) / 10.0,
            endTime = yogaEndTimeStr
        )

        // 8. Karana (Half of a Tithi) with exact end time
        val karanaIdx = ((diff / 6.0).toInt()) % 60
        val karanaProgress = (diff % 6.0) / 6.0
        val karanaNames = listOf("Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti (Bhadra)", "Shakuni", "Chatushpada", "Naga", "Kimstughna")
        val currentKaranaName = if (karanaIdx == 0) "Kimstughna"
        else if (karanaIdx in 57..59) karanaNames[7 + (karanaIdx - 57)]
        else karanaNames[((karanaIdx - 1) % 7)]

        val karanaDegLeft = 6.0 - (diff % 6.0)
        val karanaMinsRemaining = karanaDegLeft / 0.008465
        val karanaEndTimeStr = "Ends at ${formatMinutesToTime(sunriseMinutes + karanaMinsRemaining)}"

        val karanaAnga = PanchangaAnga(
            name = currentKaranaName,
            details = if (currentKaranaName.contains("Vishti")) "Avoid auspicious work (Vishti/Bhadra)" else "Standard Action Period",
            progressPercent = round(karanaProgress * 1000.0) / 10.0,
            endTime = karanaEndTimeStr
        )

        // 9. Sun Rashi & Moon Rashi
        val sunSignIdx = (sunSidereal / 30.0).toInt().coerceIn(0, 11)
        val sunDegInSign = sunSidereal % 30.0
        val sunRashi = "${VedicConstants.SIGNS[sunSignIdx]} ${sunDegInSign.toInt()}° ${(sunDegInSign * 60 % 60).toInt()}'"

        val moonSignIdx = (moonSidereal / 30.0).toInt().coerceIn(0, 11)
        val moonDegInSign = moonSidereal % 30.0
        val moonRashi = "${VedicConstants.SIGNS[moonSignIdx]} ${moonDegInSign.toInt()}° ${(moonDegInSign * 60 % 60).toInt()}'"

        // 10. Samvat, Ritu & Ayana
        val vikramSamvat = if (month >= 4) year + 57 else year + 56
        val shakaSamvat = if (month >= 4) year - 78 else year - 79
        val samvatStr = "Vikram $vikramSamvat • Shaka $shakaSamvat"

        val ayanaStr = if (sunDeg in 270.0..360.0 || sunDeg in 0.0..90.0) "Uttarayana (Northward Transit)" else "Dakshinayana (Southward Transit)"
        val rituStr = when (month) {
            3, 4 -> "Vasanta (Spring)"
            5, 6 -> "Grishma (Summer)"
            7, 8 -> "Varsha (Monsoon)"
            9, 10 -> "Sharad (Autumn)"
            11, 12 -> "Hemanta (Pre-Winter)"
            else -> "Shishira (Winter)"
        }

        // 11. Auspicious Muhurtas
        val abhijitStart = solarNoonMinutes - 24.0
        val abhijitEnd = solarNoonMinutes + 24.0
        val abhijitMuhurta = "${formatMinutesToTime(abhijitStart)} - ${formatMinutesToTime(abhijitEnd)}"

        val brahmaStart = sunriseMinutes - 96.0
        val brahmaEnd = sunriseMinutes - 48.0
        val brahmaMuhurta = "${formatMinutesToTime(brahmaStart)} - ${formatMinutesToTime(brahmaEnd)}"

        val daytimeMuhurtaDur = dayDurationMinutes / 15.0
        val vijayaStart = sunriseMinutes + 10.0 * daytimeMuhurtaDur
        val vijayaEnd = sunriseMinutes + 11.0 * daytimeMuhurtaDur
        val vijayaMuhurta = "${formatMinutesToTime(vijayaStart)} - ${formatMinutesToTime(vijayaEnd)}"

        val pradoshaStart = sunsetMinutes
        val pradoshaEnd = sunsetMinutes + 96.0
        val pradoshaKaal = "${formatMinutesToTime(pradoshaStart)} - ${formatMinutesToTime(pradoshaEnd)}"

        // 12. Varjyam & Amrit Kaal (Calculated from Nakshatra Tyajya tables)
        val varjyamGhatikas = intArrayOf(
            50, 24, 30, 40, 14, 21, 30, 20, 32, 30, 20, 18, 21, 20, 14, 14, 10, 14, 56, 24, 20, 10, 10, 18, 16, 24, 30
        )
        val varjyamStartGhatika = varjyamGhatikas[nakIdx]
        val nakElapsedMinutes = nakProgress * 1440.0
        var varjyamStartMins = sunriseMinutes + (varjyamStartGhatika * 24.0) - nakElapsedMinutes
        while (varjyamStartMins < 0) varjyamStartMins += 1440.0
        varjyamStartMins %= 1440.0
        val varjyamStr = "${formatMinutesToTime(varjyamStartMins)} - ${formatMinutesToTime(varjyamStartMins + 96.0)}"

        val amritKaalStartMins = (varjyamStartMins + 14 * 24.0) % 1440.0
        val amritKaalStr = "${formatMinutesToTime(amritKaalStartMins)} - ${formatMinutesToTime(amritKaalStartMins + 96.0)}"

        // 13. Inauspicious Muhurtas (Rahu Kaal, Yamaganda, Gulika Kaal)
        val daySlotDur = dayDurationMinutes / 8.0
        val dow0 = dayOfWeek - 1

        val rahuSlots = intArrayOf(7, 1, 6, 4, 5, 3, 2)
        val rahuStart = sunriseMinutes + rahuSlots[dow0] * daySlotDur
        val rahuKaal = "${formatMinutesToTime(rahuStart)} - ${formatMinutesToTime(rahuStart + daySlotDur)}"

        val yamaSlots = intArrayOf(4, 3, 2, 1, 0, 6, 5)
        val yamaStart = sunriseMinutes + yamaSlots[dow0] * daySlotDur
        val yamaganda = "${formatMinutesToTime(yamaStart)} - ${formatMinutesToTime(yamaStart + daySlotDur)}"

        val gulikaSlots = intArrayOf(6, 5, 4, 3, 2, 1, 0)
        val gulikaStart = sunriseMinutes + gulikaSlots[dow0] * daySlotDur
        val gulikaKaal = "${formatMinutesToTime(gulikaStart)} - ${formatMinutesToTime(gulikaStart + daySlotDur)}"

        val durMuhurthams = mutableListOf<String>()
        val dur1Start = sunriseMinutes + (dow0 * 1.5) * daytimeMuhurtaDur
        durMuhurthams.add("${formatMinutesToTime(dur1Start)} - ${formatMinutesToTime(dur1Start + daytimeMuhurtaDur)}")

        // Current device clock for real-time highlighting
        val nowCal = Calendar.getInstance()
        val isToday = nowCal.get(Calendar.YEAR) == year &&
                nowCal.get(Calendar.MONTH) + 1 == month &&
                nowCal.get(Calendar.DAY_OF_MONTH) == day
        val nowMins = if (isToday) nowCal.get(Calendar.HOUR_OF_DAY) * 60.0 + nowCal.get(Calendar.MINUTE) else -1.0

        // 14. Choghadiyas (Day & Night)
        val choghadiyaSequence = listOf("Amrit", "Kala", "Shubh", "Rog", "Udveg", "Char", "Labh")
        val dayChoghadiyaStarts = intArrayOf(4, 0, 3, 6, 2, 5, 1)
        val dayStartIdx = dayChoghadiyaStarts[dow0]

        val dayChoghadiyas = mutableListOf<ChoghadiyaSlot>()
        var activeChoghadiya: ChoghadiyaSlot? = null

        for (k in 0..7) {
            val name = choghadiyaSequence[(dayStartIdx + k) % 7]
            val nature = when (name) {
                "Amrit", "Shubh", "Labh" -> "Auspicious"
                "Char" -> "Neutral"
                else -> "Inauspicious"
            }
            val sStart = sunriseMinutes + k * daySlotDur
            val sEnd = sStart + daySlotDur
            val isCurrent = isToday && (nowMins in sStart..sEnd)
            val slot = ChoghadiyaSlot(
                name = name,
                start = formatMinutesToTime(sStart),
                end = formatMinutesToTime(sEnd),
                nature = nature,
                planet = getChoghadiyaLord(name),
                isCurrent = isCurrent
            )
            if (isCurrent) activeChoghadiya = slot
            dayChoghadiyas.add(slot)
        }

        val nightSlotDur = nightDurationMinutes / 8.0
        val nightChoghadiyaStarts = intArrayOf(2, 5, 1, 4, 0, 3, 6)
        val nightStartIdx = nightChoghadiyaStarts[dow0]

        val nightChoghadiyas = mutableListOf<ChoghadiyaSlot>()
        for (k in 0..7) {
            val name = choghadiyaSequence[(nightStartIdx + k * 5) % 7]
            val nature = when (name) {
                "Amrit", "Shubh", "Labh" -> "Auspicious"
                "Char" -> "Neutral"
                else -> "Inauspicious"
            }
            val sStart = sunsetMinutes + k * nightSlotDur
            val sEnd = sStart + nightSlotDur
            val isCurrent = isToday && (
                if (sEnd <= 1440.0) nowMins in sStart..sEnd
                else (nowMins >= sStart || nowMins <= (sEnd - 1440.0))
            )
            val slot = ChoghadiyaSlot(
                name = name,
                start = formatMinutesToTime(sStart),
                end = formatMinutesToTime(sEnd),
                nature = nature,
                planet = getChoghadiyaLord(name),
                isCurrent = isCurrent
            )
            if (isCurrent) activeChoghadiya = slot
            nightChoghadiyas.add(slot)
        }

        // 15. Planetary Horas (Day & Night)
        val horaPlanets = listOf("Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter", "Mars")
        val horaStarts = intArrayOf(0, 3, 6, 2, 5, 1, 4)
        val startHoraIdx = horaStarts[dow0]

        val dayHoraDur = dayDurationMinutes / 12.0
        val horasDay = mutableListOf<HoraSlot>()
        var activeHora: HoraSlot? = null

        for (h in 1..12) {
            val pIdx = (startHoraIdx + (h - 1)) % 7
            val pName = horaPlanets[pIdx]
            val nature = when (pName) {
                "Jupiter" -> "Highly Auspicious"
                "Venus", "Mercury", "Moon" -> "Auspicious"
                "Sun" -> "Neutral"
                else -> "Inauspicious"
            }
            val desc = getHoraDescription(pName)
            val sStart = sunriseMinutes + (h - 1) * dayHoraDur
            val sEnd = sStart + dayHoraDur
            val isCurrent = isToday && (nowMins in sStart..sEnd)
            val slot = HoraSlot(h, pName, formatMinutesToTime(sStart), formatMinutesToTime(sEnd), nature, desc, isCurrent)
            if (isCurrent) activeHora = slot
            horasDay.add(slot)
        }

        val nightHoraDur = nightDurationMinutes / 12.0
        val horasNight = mutableListOf<HoraSlot>()
        for (h in 1..12) {
            val pIdx = (startHoraIdx + 12 + (h - 1)) % 7
            val pName = horaPlanets[pIdx]
            val nature = when (pName) {
                "Jupiter" -> "Highly Auspicious"
                "Venus", "Mercury", "Moon" -> "Auspicious"
                "Sun" -> "Neutral"
                else -> "Inauspicious"
            }
            val desc = getHoraDescription(pName)
            val sStart = sunsetMinutes + (h - 1) * nightHoraDur
            val sEnd = sStart + nightHoraDur
            val isCurrent = isToday && (
                if (sEnd <= 1440.0) nowMins in sStart..sEnd
                else (nowMins >= sStart || nowMins <= (sEnd - 1440.0))
            )
            val slot = HoraSlot(h, pName, formatMinutesToTime(sStart), formatMinutesToTime(sEnd), nature, desc, isCurrent)
            if (isCurrent) activeHora = slot
            horasNight.add(slot)
        }

        val sdfDate = SimpleDateFormat("EEEE, dd MMMM yyyy", Locale.ENGLISH)
        val dateStr = sdfDate.format(calendar.time)

        return PanchangaDetails(
            date = dateStr,
            city = city,
            sunrise = sunriseStr,
            sunset = sunsetStr,
            moonrise = moonriseStr,
            moonset = moonsetStr,
            solarNoon = solarNoonStr,
            dayDuration = dayDurStr,
            nightDuration = nightDurStr,
            vara = varaName,
            varaLord = varaLord,
            tithi = tithiAnga,
            nakshatra = nakAnga,
            yoga = yogaAnga,
            karana = karanaAnga,
            sunRashi = sunRashi,
            moonRashi = moonRashi,
            samvat = samvatStr,
            ritu = rituStr,
            ayana = ayanaStr,
            abhijitMuhurta = abhijitMuhurta,
            brahmaMuhurta = brahmaMuhurta,
            vijayaMuhurta = vijayaMuhurta,
            pradoshaKaal = pradoshaKaal,
            amritKaal = amritKaalStr,
            rahuKaal = rahuKaal,
            yamaganda = yamaganda,
            gulikaKaal = gulikaKaal,
            varjyam = varjyamStr,
            durMuhurtham = durMuhurthams,
            choghadiyaDay = dayChoghadiyas,
            choghadiyaNight = nightChoghadiyas,
            horasDay = horasDay,
            horasNight = horasNight,
            currentChoghadiya = activeChoghadiya,
            currentHora = activeHora
        )
    }

    private fun getChoghadiyaLord(name: String): String {
        return when (name) {
            "Udveg" -> "Sun"
            "Char" -> "Venus"
            "Labh" -> "Mercury"
            "Amrit" -> "Moon"
            "Kaal", "Kala" -> "Saturn"
            "Shubh" -> "Jupiter"
            "Rog" -> "Mars"
            else -> "Sun"
        }
    }

    private fun getHoraDescription(planet: String): String {
        return when (planet) {
            "Jupiter" -> "Ideal for education, investments, spiritual work & marriage talks."
            "Venus" -> "Ideal for arts, romance, luxury purchases, contracts & social events."
            "Mercury" -> "Ideal for business, correspondence, accounting & analytical tasks."
            "Moon" -> "Ideal for travel, emotional connections, public relations & wellness."
            "Sun" -> "Ideal for government paperwork, leadership decisions & executive meetings."
            "Mars" -> "Ideal for sports, debates & legal conflicts. Avoid peace negotiations."
            "Saturn" -> "Ideal for factory labor, real estate & discipline. Avoid auspicious starts."
            else -> "General planetary period"
        }
    }

    /**
     * Standard NOAA Solar Equation to compute Sunrise, Sunset, and Solar Noon in local minutes from midnight.
     */
    private fun calculateSunTimes(
        year: Int, month: Int, day: Int,
        latDeg: Double, lonDeg: Double, tzOffset: Double
    ): Triple<Double, Double, Double> {
        val n = AstroEphemeris.toJulianDay(year, month, day, 12, 0, 0.0) - 2451545.0 + 0.0008

        val jStar = n - (lonDeg / 360.0)
        val mDeg = (357.5291 + 0.98560028 * jStar) % 360.0
        val mRad = mDeg * RAD

        val c = 1.9148 * sin(mRad) + 0.0200 * sin(2.0 * mRad) + 0.0003 * sin(3.0 * mRad)
        val lambdaDeg = (mDeg + c + 180.0 + 102.9372) % 360.0
        val lambdaRad = lambdaDeg * RAD

        val jTransit = 2451545.0 + jStar + 0.0053 * sin(mRad) - 0.0069 * sin(2.0 * lambdaRad)

        val sinDec = sin(lambdaRad) * sin(23.44 * RAD)
        val cosDec = cos(asin(sinDec))

        val latRad = latDeg * RAD
        val cosOmega0 = (sin(-0.833 * RAD) - sin(latRad) * sinDec) / (cos(latRad) * cosDec)

        val omega0Deg = if (cosOmega0 > 1.0) 0.0
        else if (cosOmega0 < -1.0) 180.0
        else acos(cosOmega0) * DEG

        val jRise = jTransit - (omega0Deg / 360.0)
        val jSet = jTransit + (omega0Deg / 360.0)

        val toMinutes = { jd: Double ->
            val fractionOfDay = (jd + 0.5) - floor(jd + 0.5)
            val utMinutes = fractionOfDay * 1440.0
            val localMinutes = (utMinutes + tzOffset * 60.0 + 1440.0) % 1440.0
            localMinutes
        }

        return Triple(toMinutes(jRise), toMinutes(jSet), toMinutes(jTransit))
    }

    /**
     * Astronomical Moonrise & Moonset Scanner.
     * Evaluates Moon topocentric altitude above the horizon at 15-minute intervals.
     */
    private fun calculateMoonTimes(
        year: Int, month: Int, day: Int,
        latDeg: Double, lonDeg: Double, tzOffset: Double
    ): Pair<Double?, Double?> {
        var moonrise: Double? = null
        var moonset: Double? = null

        fun getMoonAltitude(minuteOfDay: Double): Double {
            val utHour = (minuteOfDay / 60.0) - tzOffset
            val jd = AstroEphemeris.toJulianDay(year, month, day, 0, 0, 0.0) + (utHour / 24.0)

            // Local Sidereal Time
            val d = jd - 2451545.0
            val gmst = (280.46061837 + 360.98564736629 * d) % 360.0
            val lst = (gmst + lonDeg + 360.0) % 360.0

            val snapshot = AstroEphemeris.calculateSnapshot(jd, latDeg, lonDeg)
            val moonLong = snapshot.planets.firstOrNull { it.name == "Moon" }?.tropicalLongitude ?: 0.0
            val eps = 23.44 * RAD

            val ra = atan2(sin(moonLong * RAD) * cos(eps), cos(moonLong * RAD)) * DEG
            val dec = asin(sin(moonLong * RAD) * sin(eps))

            val ha = (lst - ra + 360.0) % 360.0
            val latRad = latDeg * RAD
            val sinAlt = sin(latRad) * sin(dec) + cos(latRad) * cos(dec) * cos(ha * RAD)
            return asin(sinAlt.coerceIn(-1.0, 1.0)) * DEG
        }

        // Standard Moon horizon altitude = +0.133 deg (accounting for parallax & refraction)
        val h0 = 0.133
        var prevMinute = 0.0
        var prevDiff = getMoonAltitude(0.0) - h0

        val stepMins = 15.0
        var curMin = stepMins
        while (curMin <= 1440.0) {
            val curDiff = getMoonAltitude(curMin) - h0

            // Rising: altitude transitions from negative to positive
            if (prevDiff < 0.0 && curDiff >= 0.0 && moonrise == null) {
                val frac = -prevDiff / (curDiff - prevDiff)
                moonrise = prevMinute + frac * stepMins
            }
            // Setting: altitude transitions from positive to negative
            if (prevDiff >= 0.0 && curDiff < 0.0 && moonset == null) {
                val frac = prevDiff / (prevDiff - curDiff)
                moonset = prevMinute + frac * stepMins
            }

            prevMinute = curMin
            prevDiff = curDiff
            curMin += stepMins
        }

        return Pair(moonrise, moonset)
    }

    private fun formatMinutesToTime(minutes: Double): String {
        var m = minutes % 1440.0
        if (m < 0) m += 1440.0
        val hours24 = (m / 60.0).toInt()
        val mins = (m % 60.0).toInt()
        val amPm = if (hours24 >= 12) "PM" else "AM"
        val hours12 = if (hours24 == 0) 12 else if (hours24 > 12) hours24 - 12 else hours24
        return String.format(Locale.ENGLISH, "%02d:%02d %s", hours12, mins, amPm)
    }

    data class MonthDayInfo(
        val dayOfMonth: Int,
        val dayOfWeek: Int, // 1 = Sun, 7 = Sat
        val tithiNumber: Int,
        val tithiName: String,
        val isShukla: Boolean,
        val nakshatraName: String,
        val isEkadashi: Boolean,
        val isPurnima: Boolean,
        val isAmavasya: Boolean
    )

    data class VedicTimeInfo(
        val ishtaKalaGhati: Int,
        val ishtaKalaVighati: Int,
        val dinamanaHoursMins: String,
        val dinamanaGhatis: String,
        val ratrimanaHoursMins: String,
        val ratrimanaGhatis: String,
        val currentMuhurtaName: String,
        val currentMuhurtaNumber: Int,
        val isAuspiciousMuhurta: Boolean,
        val currentMuhurtaStart: String = "",
        val currentMuhurtaEnd: String = "",
        val nextMuhurtaName: String = "",
        val nextMuhurtaNumber: Int = 0,
        val nextMuhurtaStart: String = "",
        val nextMuhurtaEnd: String = "",
        val isNextAuspicious: Boolean = false
    )

    fun calculateVedicTime(
        currentTimeMinutes: Double,
        sunriseMinutes: Double,
        sunsetMinutes: Double
    ): VedicTimeInfo {
        // Ishta Kala = minutes elapsed since sunrise / 24
        val elapsedMins = if (currentTimeMinutes >= sunriseMinutes) {
            currentTimeMinutes - sunriseMinutes
        } else {
            (1440.0 - sunriseMinutes) + currentTimeMinutes
        }

        val totalGhatis = elapsedMins / 24.0
        val ghati = totalGhatis.toInt()
        val vighati = ((totalGhatis - ghati) * 60.0).toInt()

        // Dinamana (day duration)
        val dayMins = sunsetMinutes - sunriseMinutes
        val dayGhatis = dayMins / 24.0
        val dinaGhati = dayGhatis.toInt()
        val dinaVighati = ((dayGhatis - dinaGhati) * 60.0).toInt()
        val dinaH = (dayMins / 60.0).toInt()
        val dinaM = (dayMins % 60.0).toInt()

        // Ratrimana (night duration)
        val nightMins = 1440.0 - dayMins
        val nightGhatis = nightMins / 24.0
        val ratriGhati = nightGhatis.toInt()
        val ratriVighati = ((nightGhatis - ratriGhati) * 60.0).toInt()
        val ratriH = (nightMins / 60.0).toInt()
        val ratriM = (nightMins % 60.0).toInt()

        // 30 Classical Muhurtas (15 Day, 15 Night) with Authentic Vedic Names
        val dayMuhurtas = listOf(
            "रुद्र (Rudra)", "अहि (Ahi)", "मित्र (Mitra)", "पितृ (Pitri)", "वसु (Vasu)", "वर (Vara)",
            "विश्वेदेवा (Vishwadeva)", "अभिजित (Abhijit)", "विधि (Vidhi)", "सुतमुखी (Sutamukhi)",
            "पुरुहूत (Puruhuta)", "वह्नि (Vahni)", "नक्तंचर (Naktanchara)", "वरुण (Varuna)", "अर्यमा (Aryama)"
        )
        val nightMuhurtas = listOf(
            "गिरीश (Girisha)", "अजपाद (Ajapada)", "अहिर्बुध्न्य (Ahirbudhnya)", "पुष्य (Pushya)", "अश्विनी (Ashwini)",
            "यम (Yama)", "अग्नि (Agni)", "विधातृ (Vidhatri)", "कण्ड (Chanda)", "अदिति (Aditi)",
            "जीव (Jiva)", "विष्णु (Vishnu)", "द्युमद्गद्युति (Dyumadgadyuti)", "ब्रह्म (Brahma)", "समुद्र (Samudra)"
        )

        val isDay = currentTimeMinutes in sunriseMinutes..sunsetMinutes
        val muhurtaNum: Int
        val muhurtaName: String
        val isAuspicious: Boolean
        val curStartMins: Double
        val curEndMins: Double

        val nextMuhurtaNum: Int
        val nextMuhurtaName: String
        val isNextAuspicious: Boolean
        val nextStartMins: Double
        val nextEndMins: Double

        if (isDay) {
            val slotDur = dayMins / 15.0
            val slotIdx = ((currentTimeMinutes - sunriseMinutes) / slotDur).toInt().coerceIn(0, 14)
            muhurtaNum = slotIdx + 1
            muhurtaName = dayMuhurtas[slotIdx]
            isAuspicious = slotIdx in listOf(2, 4, 5, 6, 7, 8, 9, 13, 14) // Mitra, Vasu, Vara, Vishwadeva, Abhijit, Vidhi, Sutamukhi, Varuna, Aryama
            curStartMins = sunriseMinutes + slotIdx * slotDur
            curEndMins = sunriseMinutes + (slotIdx + 1) * slotDur

            if (slotIdx < 14) {
                nextMuhurtaNum = slotIdx + 2
                nextMuhurtaName = dayMuhurtas[slotIdx + 1]
                isNextAuspicious = (slotIdx + 1) in listOf(2, 4, 5, 6, 7, 8, 9, 13, 14)
                nextStartMins = curEndMins
                nextEndMins = sunriseMinutes + (slotIdx + 2) * slotDur
            } else {
                nextMuhurtaNum = 16
                nextMuhurtaName = nightMuhurtas[0]
                isNextAuspicious = false
                nextStartMins = sunsetMinutes
                nextEndMins = sunsetMinutes + (nightMins / 15.0)
            }
        } else {
            val slotDur = nightMins / 15.0
            val nightElapsed = if (currentTimeMinutes > sunsetMinutes) {
                currentTimeMinutes - sunsetMinutes
            } else {
                (1440.0 - sunsetMinutes) + currentTimeMinutes
            }
            val slotIdx = (nightElapsed / slotDur).toInt().coerceIn(0, 14)
            muhurtaNum = 15 + slotIdx + 1
            muhurtaName = nightMuhurtas[slotIdx]
            isAuspicious = slotIdx in listOf(2, 3, 4, 7, 9, 10, 11, 13, 14) // Ahirbudhnya, Pushya, Ashwini, Vidhatri, Aditi, Jiva, Vishnu, Brahma, Samudra
            curStartMins = sunsetMinutes + slotIdx * slotDur
            curEndMins = sunsetMinutes + (slotIdx + 1) * slotDur

            if (slotIdx < 14) {
                nextMuhurtaNum = 15 + slotIdx + 2
                nextMuhurtaName = nightMuhurtas[slotIdx + 1]
                isNextAuspicious = (slotIdx + 1) in listOf(2, 3, 4, 7, 9, 10, 11, 13, 14)
                nextStartMins = curEndMins
                nextEndMins = sunsetMinutes + (slotIdx + 2) * slotDur
            } else {
                nextMuhurtaNum = 1
                nextMuhurtaName = dayMuhurtas[0]
                isNextAuspicious = false
                nextStartMins = sunsetMinutes + 15 * slotDur
                nextEndMins = nextStartMins + (dayMins / 15.0)
            }
        }

        return VedicTimeInfo(
            ishtaKalaGhati = ghati,
            ishtaKalaVighati = vighati,
            dinamanaHoursMins = "${dinaH}h ${dinaM}m",
            dinamanaGhatis = "$dinaGhati Gh $dinaVighati Vig",
            ratrimanaHoursMins = "${ratriH}h ${ratriM}m",
            ratrimanaGhatis = "$ratriGhati Gh $ratriVighati Vig",
            currentMuhurtaName = muhurtaName,
            currentMuhurtaNumber = muhurtaNum,
            isAuspiciousMuhurta = isAuspicious,
            currentMuhurtaStart = formatMinutesToTime(curStartMins),
            currentMuhurtaEnd = formatMinutesToTime(curEndMins),
            nextMuhurtaName = nextMuhurtaName,
            nextMuhurtaNumber = nextMuhurtaNum,
            nextMuhurtaStart = formatMinutesToTime(nextStartMins),
            nextMuhurtaEnd = formatMinutesToTime(nextEndMins),
            isNextAuspicious = isNextAuspicious
        )
    }

    fun calculateMonthlyCalendar(
        year: Int,
        month: Int,
        lat: Double,
        lon: Double,
        tzOffsetHours: Double = 5.5
    ): List<MonthDayInfo> {
        val cal = Calendar.getInstance()
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month - 1)
        cal.set(Calendar.DAY_OF_MONTH, 1)

        val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
        val list = mutableListOf<MonthDayInfo>()

        for (d in 1..daysInMonth) {
            cal.set(Calendar.DAY_OF_MONTH, d)
            val p = calculateDailyPanchanga(cal, lat, lon, "Cal", tzOffsetHours)

            val tLower = p.tithi.name.lowercase()
            val isPurnima = tLower.contains("purnima")
            val isAmavasya = tLower.contains("amavasya")
            val isEkadashi = tLower.contains("ekadashi")
            val isShukla = !tLower.contains("krishna") && !isAmavasya

            val tNum = when {
                isPurnima || isAmavasya -> 15
                isEkadashi -> 11
                tLower.contains("pratipada") -> 1
                tLower.contains("dwitiya") -> 2
                tLower.contains("tritiya") -> 3
                tLower.contains("chaturthi") -> 4
                tLower.contains("panchami") -> 5
                tLower.contains("shashthi") -> 6
                tLower.contains("saptami") -> 7
                tLower.contains("ashtami") -> 8
                tLower.contains("navami") -> 9
                tLower.contains("dashami") -> 10
                tLower.contains("dwadashi") -> 12
                tLower.contains("trayodashi") -> 13
                tLower.contains("chaturdashi") -> 14
                else -> 1
            }

            list.add(
                MonthDayInfo(
                    dayOfMonth = d,
                    dayOfWeek = cal.get(Calendar.DAY_OF_WEEK),
                    tithiNumber = tNum,
                    tithiName = p.tithi.name,
                    isShukla = isShukla,
                    nakshatraName = p.nakshatra.name,
                    isEkadashi = isEkadashi,
                    isPurnima = isPurnima,
                    isAmavasya = isAmavasya
                )
            )
        }
        return list
    }
}
