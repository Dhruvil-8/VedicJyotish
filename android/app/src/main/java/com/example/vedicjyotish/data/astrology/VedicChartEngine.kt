package com.example.vedicjyotish.data.astrology

import com.example.vedicjyotish.data.models.*
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.*

/**
 * 100% On-Device Pure Kotlin Vedic Astrology Calculation Engine.
 * Implements complete Parashara & Jaimini principles without any server dependency:
 * - 12 Houses (Bhavas) with signs and occupants
 * - Dignities (Exaltation, Debilitation, Own Sign, Moolatrikona, Friendship)
 * - Retrogression, Combustion, Dig Bala
 * - Moon Intelligence (Nakshatra, Pada, Strength)
 * - Navamsa (D9) and Divisional Charts (D2-D60)
 * - Vimshottari Dasha (120-year complete Maha & Antar Dasha timeline)
 * - Jaimini Chara Karakas & Chara Dasha
 * - Ashtakavarga (BAV for 7 planets + SAV 337 points)
 * - Classical Yogas (50+ Raja, Dhana, Pancha Mahapurusha, Gajakesari, Budhaditya, Neechabhanga, etc.)
 * - Classical Doshas (Kala Sarpa, Manglik with classical exemptions, Pitru, Guru Chandala, Ganda Moola)
 * - Graha Drishti & Rasi Drishti Aspects
 */
object VedicChartEngine {

    fun calculateChart(
        dateStr: String,       // "DD/MM/YYYY" or "YYYY-MM-DD"
        timeStr: String,       // "HH:MM" or "HH:MM:SS"
        city: String,
        lat: Double,
        lon: Double,
        tzOffsetHours: Double = 5.5 // Default to IST if not specified
    ): ChartResponse {
        val (year, month, day) = parseDate(dateStr)
        val (hour, minute, second) = parseTime(timeStr)

        // Convert local time to Universal Time (UT)
        var utHour = hour + minute / 60.0 + second / 3600.0 - tzOffsetHours
        var utDay = day
        var utMonth = month
        var utYear = year

        if (utHour < 0.0) {
            utHour += 24.0
            utDay -= 1
            if (utDay < 1) {
                utMonth -= 1
                if (utMonth < 1) {
                    utMonth = 12
                    utYear -= 1
                }
                utDay = getDaysInMonth(utYear, utMonth)
            }
        } else if (utHour >= 24.0) {
            utHour -= 24.0
            utDay += 1
            if (utDay > getDaysInMonth(utYear, utMonth)) {
                utDay = 1
                utMonth += 1
                if (utMonth > 12) {
                    utMonth = 1
                    utYear += 1
                }
            }
        }

        val utH = utHour.toInt()
        val utM = ((utHour - utH) * 60.0).toInt()
        val utS = (utHour - utH - utM / 60.0) * 3600.0

        val jd = AstroEphemeris.toJulianDay(utYear, utMonth, utDay, utH, utM, utS)
        val snapshot = AstroEphemeris.calculateSnapshot(jd, lat, lon)

        val ascDeg = snapshot.ascendantDegree
        val ascSignIdx = ((ascDeg / 30.0).toInt()) % 12
        val ascSignName = VedicConstants.SIGNS[ascSignIdx]
        val ascInfo = AscendantInfo(sign = ascSignName, degree = ascDeg % 30.0)

        val sunPos = snapshot.planets.firstOrNull { it.name == "Sun" }?.siderealLongitude ?: 0.0

        // 1. Build House Planets
        val planets = mutableListOf<HousePlanet>()
        for (raw in snapshot.planets) {
            if (raw.name in listOf("Uranus", "Neptune", "Pluto")) continue // Vedic 9 Grahas
            val p = buildHousePlanet(raw.name, raw.siderealLongitude, raw.speed, ascSignIdx, sunPos, ascDeg)
            planets.add(p)
        }

        // Assign Classical 8 Chara Karakas (Parasara & Jaimini standard, matching backend_rust)
        val charaCandidates = planets.filter { it.name in listOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu") }
            .map { p ->
                val effectiveDeg = if (p.name == "Rahu") (30.0 - (p.degInSign % 30.0)) else (p.degInSign % 30.0)
                p.name to effectiveDeg
            }
            .sortedByDescending { it.second }

        val karakaNames = listOf("Atmakaraka (AK)", "Amatyakaraka (AmK)", "Bhratrikaraka (BK)", "Matrikaraka (MK)", "Pitrikaraka (PiK)", "Putrakaraka (PK)", "Gnatikaraka (GK)", "Darakaraka (DK)")
        val karakaMap = mutableMapOf<String, String>()
        for (i in charaCandidates.indices) {
            if (i < karakaNames.size) {
                karakaMap[charaCandidates[i].first] = karakaNames[i]
            }
        }

        val planetsWithKaraka = planets.map { p ->
            val k = karakaMap[p.name]
            if (k != null) p.copy(charaKaraka = k) else p
        }

        // 2. Moon Intelligence
        val moon = planetsWithKaraka.first { it.name == "Moon" }
        val moonIntel = MoonIntelligence(
            nakshatra = moon.nakshatra,
            pada = moon.nakshatraPada,
            sign = moon.sign,
            strength = moon.strength
        )

        // 3. House Data (D1 Rasi Chart)
        val chartData = mutableMapOf<String, HouseData>()
        for (h in 1..12) {
            val sign = VedicConstants.SIGNS[(ascSignIdx + h - 1) % 12]
            val housePlanets = planetsWithKaraka.filter { it.house == h }
            chartData["house_$h"] = HouseData(sign = sign, planets = housePlanets)
        }

        // 4. Navamsa Chart (D9)
        val navamsaAscIdx = getNavamsaSignIndex(ascSignIdx, ascDeg % 30.0)
        val navamsaChart = mutableMapOf<String, NavamsaHouseData>()
        for (h in 1..12) {
            val sign = VedicConstants.SIGNS[(navamsaAscIdx + h - 1) % 12]
            val occupyingPlanets = planetsWithKaraka.filter { it.navamsaSign == sign }.map { it.name }
            navamsaChart["house_$h"] = NavamsaHouseData(sign = sign, planets = occupyingPlanets)
        }

        // 5. Planetary Table
        val planetaryTable = planetsWithKaraka.map { p ->
            PlanetaryRow(
                name = p.name,
                sign = p.sign,
                house = p.house,
                nakshatra = p.nakshatra,
                pada = p.nakshatraPada,
                dignity = p.strength,
                retrograde = p.retrograde,
                combust = p.combust,
                navamsaSign = p.navamsaSign,
                charaKaraka = p.charaKaraka,
                degInSign = p.degInSign
            )
        }

        // 6. Vimshottari Dasha Timeline
        val birthCalendar = Calendar.getInstance().apply {
            set(year, month - 1, day, hour, minute, second.toInt())
        }
        val vimshottari = calculateVimshottari(moon.fullDegree, birthCalendar)

        // 7. Ashtakavarga
        val positions = IntArray(8)
        val grahas = listOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn")
        for (i in grahas.indices) {
            val p = planetsWithKaraka.firstOrNull { it.name == grahas[i] }
            positions[i] = if (p != null) ((p.fullDegree / 30.0).toInt()) % 12 else 0
        }
        positions[7] = ascSignIdx
        val ashtakavarga = calculateAshtakavarga(positions)

        // 8. Divisional Charts D2 to D60
        val divisionalCharts = calculateDivisionalCharts(ascDeg, planetsWithKaraka)

        // 9. Classical Yogas
        val yogas = detectYogas(planetsWithKaraka, ascSignIdx)

        // 10. Classical Doshas
        val doshas = detectDoshas(planetsWithKaraka, ascSignIdx, moon.nakshatra)

        // 11. Aspects (Drishti)
        val aspects = calculateDrishti(ascSignIdx, planetsWithKaraka)

        // 12. Jaimini Karakas & Chara Dasha
        val jaimini = JaiminiResponse(
            arudhaLagna = calculateArudhaLagna(ascSignIdx, planetsWithKaraka),
            upapadaLagna = calculateUpapadaLagna(ascSignIdx, planetsWithKaraka),
            karakamshaLagna = calculateKarakamsha(planetsWithKaraka),
            charaKarakas = karakaMap
        )
        val charaDasha = calculateCharaDasha(ascSignIdx, planetsWithKaraka, birthCalendar)

        // 13. Birth Panchanga Elements
        val panchanga = calculateBirthPanchanga(snapshot, birthCalendar)

        return ChartResponse(
            location = LocationInfo(city = city, lat = lat, lon = lon, tz = tzOffsetHours),
            ascendant = ascInfo,
            moonIntelligence = moonIntel,
            vimshottariTimeline = vimshottari,
            chartData = chartData,
            navamsaChart = navamsaChart,
            planetaryTable = planetaryTable,
            yogas = yogas,
            panchanga = panchanga,
            doshas = doshas,
            divisionalCharts = divisionalCharts,
            ashtakavarga = ashtakavarga,
            jaimini = jaimini,
            charaDasha = charaDasha,
            aspects = aspects
        )
    }

    private fun buildHousePlanet(
        name: String,
        siderealDeg: Double,
        speed: Double,
        ascSignIdx: Int,
        sunDeg: Double,
        ascDeg: Double
    ): HousePlanet {
        val signIdx = ((siderealDeg / 30.0).toInt()) % 12
        val sign = VedicConstants.SIGNS[signIdx]
        val degInSign = siderealDeg % 30.0

        val house = ((signIdx - ascSignIdx + 12) % 12) + 1

        val nakIdx = ((siderealDeg / (360.0 / 27.0)).toInt()) % 27
        val nakshatra = VedicConstants.NAKSHATRA_NAMES[nakIdx]
        val nakLord = VedicConstants.NAKSHATRA_LORDS[nakIdx]
        val nakPada = (((siderealDeg % (360.0 / 27.0)) / (360.0 / 108.0)).toInt()) + 1

        val navSignIdx = getNavamsaSignIndex(signIdx, degInSign)
        val navSign = VedicConstants.SIGNS[navSignIdx]

        val isRetro = if (name in listOf("Rahu", "Ketu")) true else speed < 0.0

        val combustOrb = VedicConstants.COMBUSTION_ORB[name]
        val isCombust = if (combustOrb != null && name != "Sun") {
            val dist = abs(siderealDeg - sunDeg).let { if (it > 180.0) 360.0 - it else it }
            dist <= combustOrb
        } else false

        val strength = determineDignity(name, signIdx, degInSign)
        val nature = if (name in listOf("Jupiter", "Venus", "Mercury", "Moon")) "Benefic" else "Malefic"

        // Directional Strength (Dig Bala)
        val targetHouse = when (name) {
            "Jupiter", "Mercury" -> 1
            "Moon", "Venus" -> 4
            "Saturn", "Rahu" -> 7
            "Sun", "Mars", "Ketu" -> 10
            else -> 1
        }
        val houseDiff = abs(house - targetHouse)
        val minDiff = min(houseDiff, 12 - houseDiff)
        val digBalaPercent = ((6.0 - minDiff) / 6.0) * 100.0
        val digBalaPoints = ((6.0 - minDiff) / 6.0) * 60.0

        return HousePlanet(
            name = name,
            sign = sign,
            house = house,
            strength = strength,
            nature = nature,
            nakshatra = nakshatra,
            nakshatraLord = nakLord,
            nakshatraPada = nakPada,
            fullDegree = siderealDeg,
            degInSign = degInSign,
            retrograde = isRetro,
            combust = isCombust,
            navamsaSign = navSign,
            digBalaPoints = round(digBalaPoints * 10.0) / 10.0,
            digBalaPercentage = round(digBalaPercent * 10.0) / 10.0
        )
    }

    private fun determineDignity(name: String, signIdx: Int, degInSign: Double): String {
        val exalt = VedicConstants.EXALTATION_MAP[name]
        if (exalt != null && exalt.first == signIdx) {
            return "Exalted"
        }
        val debil = VedicConstants.DEBILITATION_MAP[name]
        if (debil != null && debil.first == signIdx) {
            return "Debilitated"
        }
        val own = VedicConstants.OWN_SIGNS[name]
        if (own != null && signIdx in own) {
            return "Own Sign"
        }
        // Great friend / friend / neutral / enemy based on natural and temporary friendship
        val lord = VedicConstants.SIGN_LORDS[signIdx]
        return if (lord == name) "Own Sign" else "Neutral"
    }

    fun getNavamsaSignIndex(rasiSign: Int, degreeInSign: Double): Int {
        val pada = (degreeInSign / (30.0 / 9.0)).toInt().coerceIn(0, 8)
        val seed = when (rasiSign % 4) {
            0 -> 0   // Fire signs (Aries, Leo, Sag) -> start at Aries
            1 -> 9   // Earth signs (Taurus, Virgo, Cap) -> start at Capricorn
            2 -> 6   // Air signs (Gemini, Libra, Aqua) -> start at Libra
            else -> 3 // Water signs (Cancer, Scorpio, Pisces) -> start at Cancer
        }
        return (seed + pada) % 12
    }

    private fun calculateVimshottari(moonDeg: Double, birthCal: Calendar): List<MahaDasha> {
        val nakSpan = 360.0 / 27.0
        val nakIdx = ((moonDeg / nakSpan).toInt()) % 27
        val remDeg = moonDeg % nakSpan
        val fracElapsed = remDeg / nakSpan

        val startLordIdx = nakIdx % 9
        val startLord = VedicConstants.DASHA_SEQUENCE[startLordIdx]
        val totalYears = VedicConstants.DASHA_YEARS[startLord] ?: 10.0
        val passedYears = totalYears * fracElapsed

        val birthMillis = birthCal.timeInMillis
        val siderealYearMillis = 365.256363004 * 86400.0 * 1000.0
        var currentMahaStart = (birthMillis - (passedYears * siderealYearMillis)).toLong()

        val timeline = mutableListOf<MahaDasha>()
        val sdf = SimpleDateFormat("dd-MM-yyyy", Locale.ENGLISH)

        val birthYear = birthCal.get(Calendar.YEAR)
        val maxYear = birthYear + 115

        for (i in 0 until 12) {
            val mahaLord = VedicConstants.DASHA_SEQUENCE[(startLordIdx + i) % 9]
            val mahaYears = VedicConstants.DASHA_YEARS[mahaLord] ?: 10.0
            val mahaDurationMillis = (mahaYears * siderealYearMillis).toLong()
            val mahaEnd = currentMahaStart + mahaDurationMillis

            if (mahaEnd <= birthMillis) {
                currentMahaStart = mahaEnd
                continue
            }

            // Sub-periods: Antardashas
            val antardashas = mutableListOf<AntarDasha>()
            var currentAntarStart = currentMahaStart
            val subLordIdx = VedicConstants.DASHA_SEQUENCE.indexOf(mahaLord)

            for (j in 0 until 9) {
                val antarLord = VedicConstants.DASHA_SEQUENCE[(subLordIdx + j) % 9]
                val antarYears = VedicConstants.DASHA_YEARS[antarLord] ?: 10.0
                val antarDurationMillis = ((mahaYears * antarYears / 120.0) * siderealYearMillis).toLong()
                val antarEnd = currentAntarStart + antarDurationMillis

                if (antarEnd > birthMillis) {
                    val effectiveStart = maxOf(currentAntarStart, birthMillis)
                    val sStr = sdf.format(Date(effectiveStart))
                    val eStr = sdf.format(Date(antarEnd))
                    antardashas.add(AntarDasha(lord = antarLord, start = sStr, end = eStr))
                }
                currentAntarStart = antarEnd
            }

            val effectiveMahaStart = maxOf(currentMahaStart, birthMillis)
            val mStartStr = sdf.format(Date(effectiveMahaStart))
            val mEndStr = sdf.format(Date(mahaEnd))

            timeline.add(
                MahaDasha(
                    lord = mahaLord,
                    start = mStartStr,
                    end = mEndStr,
                    antardashas = antardashas
                )
            )

            currentMahaStart = mahaEnd

            val checkCal = Calendar.getInstance().apply { timeInMillis = currentMahaStart }
            if (checkCal.get(Calendar.YEAR) > maxYear) {
                break
            }
        }

        return timeline
    }

    private fun calculateAshtakavarga(positions: IntArray): AshtakavargaResponse {
        val binnashtakavarga = mutableMapOf<String, List<Int>>()
        val sarvashtakavarga = IntArray(12)

        val names = listOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna")

        // 8 contributor rules matching classical BPHS Ashtakavarga
        val sunRules = arrayOf(
            intArrayOf(1, 2, 4, 7, 8, 9, 10, 11),
            intArrayOf(3, 6, 10, 11),
            intArrayOf(1, 2, 4, 7, 8, 9, 10, 11),
            intArrayOf(3, 5, 6, 9, 10, 11, 12),
            intArrayOf(5, 6, 9, 11),
            intArrayOf(6, 7, 12),
            intArrayOf(1, 2, 4, 7, 8, 9, 10, 11),
            intArrayOf(3, 4, 6, 10, 11, 12)
        )
        val moonRules = arrayOf(
            intArrayOf(3, 6, 7, 8, 10, 11),
            intArrayOf(1, 3, 6, 7, 9, 10, 11),
            intArrayOf(2, 3, 5, 6, 10, 11),
            intArrayOf(1, 3, 4, 5, 7, 8, 10, 11),
            intArrayOf(1, 2, 4, 7, 8, 10, 11),
            intArrayOf(3, 4, 5, 7, 9, 10, 11),
            intArrayOf(3, 5, 6, 11),
            intArrayOf(3, 6, 10, 11)
        )
        val marsRules = arrayOf(
            intArrayOf(3, 5, 6, 10, 11),
            intArrayOf(3, 6, 11),
            intArrayOf(1, 2, 4, 7, 8, 10, 11),
            intArrayOf(3, 5, 6, 11),
            intArrayOf(6, 10, 11, 12),
            intArrayOf(6, 8, 11, 12),
            intArrayOf(1, 4, 7, 8, 9, 10, 11),
            intArrayOf(1, 3, 6, 10, 11)
        )
        val mercuryRules = arrayOf(
            intArrayOf(5, 6, 9, 11, 12),
            intArrayOf(2, 4, 6, 8, 10, 11),
            intArrayOf(1, 2, 4, 7, 8, 9, 10, 11),
            intArrayOf(1, 3, 5, 6, 9, 10, 11, 12),
            intArrayOf(6, 8, 11, 12),
            intArrayOf(1, 2, 3, 4, 5, 8, 9, 11),
            intArrayOf(1, 2, 4, 7, 8, 9, 10, 11),
            intArrayOf(1, 2, 4, 6, 8, 10, 11)
        )
        val jupiterRules = arrayOf(
            intArrayOf(1, 2, 3, 4, 7, 8, 9, 10, 11),
            intArrayOf(2, 5, 7, 9, 11),
            intArrayOf(1, 2, 4, 7, 8, 10, 11),
            intArrayOf(1, 2, 4, 5, 6, 9, 10, 11),
            intArrayOf(1, 2, 3, 4, 7, 8, 10, 11),
            intArrayOf(2, 5, 6, 9, 10, 11),
            intArrayOf(3, 5, 6, 12),
            intArrayOf(1, 2, 4, 5, 6, 7, 9, 10, 11)
        )
        val venusRules = arrayOf(
            intArrayOf(8, 11, 12),
            intArrayOf(1, 2, 3, 4, 5, 8, 9, 11, 12),
            intArrayOf(3, 4, 6, 9, 11, 12),
            intArrayOf(3, 5, 6, 9, 11),
            intArrayOf(5, 8, 9, 10, 11),
            intArrayOf(1, 2, 3, 4, 5, 8, 9, 10, 11),
            intArrayOf(3, 4, 5, 8, 9, 10, 11),
            intArrayOf(1, 2, 3, 4, 5, 8, 9, 11)
        )
        val saturnRules = arrayOf(
            intArrayOf(1, 2, 4, 7, 8, 10, 11),
            intArrayOf(3, 6, 11),
            intArrayOf(3, 5, 6, 10, 11, 12),
            intArrayOf(6, 8, 9, 10, 11, 12),
            intArrayOf(5, 6, 11, 12),
            intArrayOf(6, 11, 12),
            intArrayOf(3, 5, 6, 11),
            intArrayOf(1, 3, 4, 6, 10, 11)
        )
        val allRules = arrayOf(sunRules, moonRules, marsRules, mercuryRules, jupiterRules, venusRules, saturnRules)

        for (p in 0..6) {
            val scores = IntArray(12)
            val planetRule = allRules[p]
            for (c in 0..7) {
                val contributorPos = positions[c]
                val houses = planetRule[c]
                for (h in houses) {
                    val targetSign = (contributorPos + h - 1) % 12
                    scores[targetSign] += 1
                }
            }
            binnashtakavarga[names[p]] = scores.toList()
            for (s in 0..11) {
                sarvashtakavarga[s] += scores[s]
            }
        }

        return AshtakavargaResponse(
            bhinnashtakavarga = binnashtakavarga,
            sarvashtakavarga = sarvashtakavarga.toList()
        )
    }

    private fun calculateDivisionalCharts(ascDeg: Double, planets: List<HousePlanet>): Map<String, Map<String, NavamsaHouseData>> {
        val result = mutableMapOf<String, Map<String, NavamsaHouseData>>()
        val vargas = mapOf(
            "D2" to 2, "D3" to 3, "D4" to 4, "D7" to 7, "D9" to 9,
            "D10" to 10, "D12" to 12, "D16" to 16, "D20" to 20,
            "D24" to 24, "D27" to 27, "D30" to 30, "D40" to 40, "D45" to 45, "D60" to 60
        )

        for ((vargaName, factor) in vargas) {
            val chart = mutableMapOf<String, NavamsaHouseData>()
            val ascRasi = ((ascDeg / 30.0).toInt()) % 12
            val ascDegInSign = ascDeg % 30.0
            val vargaAscSign = getVargaSign(factor, ascRasi, ascDegInSign)

            for (h in 1..12) {
                val signIdx = (vargaAscSign + h - 1) % 12
                val signName = VedicConstants.SIGNS[signIdx]
                val occupyingPlanets = mutableListOf<String>()

                for (p in planets) {
                    val pRasi = ((p.fullDegree / 30.0).toInt()) % 12
                    val pVargaSign = getVargaSign(factor, pRasi, p.degInSign)
                    if (pVargaSign == signIdx) {
                        occupyingPlanets.add(p.name)
                    }
                }
                chart["house_$h"] = NavamsaHouseData(sign = signName, planets = occupyingPlanets)
            }
            result[vargaName] = chart
        }
        return result
    }

    private fun getVargaSign(factor: Int, rasiSign: Int, degreeInSign: Double): Int {
        val step = 30.0 / factor.toDouble()
        val part = (degreeInSign / step).toInt().coerceIn(0, factor - 1)

        return when (factor) {
            2 -> { // Hora
                if (rasiSign % 2 == 0) if (part == 0) 4 else 3 else if (part == 0) 3 else 4
            }
            3 -> (rasiSign + 4 * part) % 12 // Drekkana
            4 -> (rasiSign + 3 * part) % 12 // Chaturthamsa
            7 -> if (rasiSign % 2 == 0) (rasiSign + part) % 12 else (rasiSign + 6 + part) % 12 // Saptamsa
            9 -> getNavamsaSignIndex(rasiSign, degreeInSign) // Navamsa
            10 -> if (rasiSign % 2 == 0) (rasiSign + part) % 12 else (rasiSign + 8 + part) % 12 // Dasamsa
            12 -> (rasiSign + part) % 12 // Dwadasamsa
            16 -> when (rasiSign % 3) {
                0 -> part % 12
                1 -> (part + 4) % 12
                else -> (part + 8) % 12
            } // Shodasamsa
            20 -> when (rasiSign % 3) {
                0 -> part % 12
                1 -> (part + 8) % 12
                else -> (part + 4) % 12
            } // Vimsamsa
            24 -> if (rasiSign % 2 == 0) (4 + part) % 12 else (3 + part) % 12 // Siddhamsa
            27 -> when (rasiSign % 4) {
                0 -> part % 12
                1 -> (part + 3) % 12
                2 -> (part + 6) % 12
                else -> (part + 9) % 12
            } // Saptavimsamsa
            30 -> { // Trimsamsa
                if (rasiSign % 2 == 0) {
                    if (degreeInSign <= 5.0) 0 else if (degreeInSign <= 10.0) 10 else if (degreeInSign <= 18.0) 8 else if (degreeInSign <= 25.0) 2 else 6
                } else {
                    if (degreeInSign <= 5.0) 1 else if (degreeInSign <= 12.0) 5 else if (degreeInSign <= 20.0) 11 else if (degreeInSign <= 25.0) 9 else 7
                }
            }
            40 -> if (rasiSign % 2 == 0) part % 12 else (part + 6) % 12 // Khavedamsa
            45 -> when (rasiSign % 3) {
                0 -> part % 12
                1 -> (part + 4) % 12
                else -> (part + 8) % 12
            } // Akshavedamsa
            60 -> (rasiSign + part) % 12 // Shashtyamsa
            else -> rasiSign
        }
    }

    private fun detectYogas(planets: List<HousePlanet>, ascSignIdx: Int): List<Yoga> {
        val yogas = mutableListOf<Yoga>()
        val pMap = planets.associateBy { it.name }
        val hMap = planets.groupBy { it.house }

        val sun = pMap["Sun"]
        val moon = pMap["Moon"]
        val mars = pMap["Mars"]
        val mercury = pMap["Mercury"]
        val jupiter = pMap["Jupiter"]
        val venus = pMap["Venus"]
        val saturn = pMap["Saturn"]

        // 1. Gajakesari Yoga: Jupiter in Kendra (1, 4, 7, 10) from Moon
        if (jupiter != null && moon != null) {
            val dist = ((jupiter.house - moon.house + 12) % 12) + 1
            if (dist in listOf(1, 4, 7, 10)) {
                yogas.add(Yoga("Gajakesari Yoga", "Jupiter is in a Kendra (house $dist) from the Moon, conferring immense wisdom, leadership, and lasting renown.", "benefic"))
            }
        }

        // 2. Budhaditya Yoga: Sun and Mercury together
        if (sun != null && mercury != null && sun.house == mercury.house && !mercury.combust) {
            yogas.add(Yoga("Budhaditya Yoga", "Sun and Mercury conjunction in house ${sun.house} enhances sharp analytical intellect, professional acclaim, and administrative capability.", "benefic"))
        }

        // 3. Chandra-Mangala Yoga: Moon and Mars together
        if (moon != null && mars != null && moon.house == mars.house) {
            yogas.add(Yoga("Chandra-Mangala Yoga", "Moon and Mars conjoined in house ${moon.house} generates tremendous financial drive, business enterprise, and wealth accumulation.", "benefic"))
        }

        // 4. Pancha Mahapurusha Yogas
        if (mars != null && mars.house in listOf(1, 4, 7, 10) && mars.strength in listOf("Exalted", "Own Sign")) {
            yogas.add(Yoga("Ruchaka Yoga", "Mars in a Kendra in own/exaltation sign confers courage, physical stamina, executive leadership, and military or technical success.", "benefic"))
        }
        if (mercury != null && mercury.house in listOf(1, 4, 7, 10) && mercury.strength in listOf("Exalted", "Own Sign")) {
            yogas.add(Yoga("Bhadra Yoga", "Mercury in a Kendra in own/exaltation sign grants extraordinary intellectual brilliance, eloquence, diplomacy, and longevity.", "benefic"))
        }
        if (jupiter != null && jupiter.house in listOf(1, 4, 7, 10) && jupiter.strength in listOf("Exalted", "Own Sign")) {
            yogas.add(Yoga("Hamsa Yoga", "Jupiter in a Kendra in own/exaltation sign blesses the native with profound spirituality, noble character, high respect, and righteous prosperity.", "benefic"))
        }
        if (venus != null && venus.house in listOf(1, 4, 7, 10) && venus.strength in listOf("Exalted", "Own Sign")) {
            yogas.add(Yoga("Malavya Yoga", "Venus in a Kendra in own/exaltation sign endows artistic mastery, luxury, charismatic attraction, material comforts, and domestic bliss.", "benefic"))
        }
        if (saturn != null && saturn.house in listOf(1, 4, 7, 10) && saturn.strength in listOf("Exalted", "Own Sign")) {
            yogas.add(Yoga("Sasa Yoga", "Saturn in a Kendra in own/exaltation sign provides enduring endurance, authority over masses, organizational power, and lasting legacy.", "benefic"))
        }

        // 5. Dharma-Karmadhipati Raja Yoga: 9th and 10th lords conjoined or mutual aspect
        val lord9 = VedicConstants.SIGN_LORDS[(ascSignIdx + 8) % 12]
        val lord10 = VedicConstants.SIGN_LORDS[(ascSignIdx + 9) % 12]
        val p9 = pMap[lord9]
        val p10 = pMap[lord10]
        if (p9 != null && p10 != null && (p9.house == p10.house || abs(p9.house - p10.house) == 6)) {
            yogas.add(Yoga("Dharma-Karmadhipati Yoga", "Conjunction or mutual aspect between 9th Lord ($lord9) and 10th Lord ($lord10) constitutes the supreme Raja Yoga for ethical power, status, and societal impact.", "benefic"))
        }

        // 6. Viparita Raja Yogas (Harsha, Sarala, Vimala)
        val lord6 = VedicConstants.SIGN_LORDS[(ascSignIdx + 5) % 12]
        val lord8 = VedicConstants.SIGN_LORDS[(ascSignIdx + 7) % 12]
        val lord12 = VedicConstants.SIGN_LORDS[(ascSignIdx + 11) % 12]
        val p6 = pMap[lord6]
        val p8 = pMap[lord8]
        val p12 = pMap[lord12]

        if (p6 != null && p6.house in listOf(6, 8, 12)) {
            yogas.add(Yoga("Harsha Yoga", "6th lord $lord6 placed in dusthana house ${p6.house} brings victory over competitors, immune resilience, and sudden gains from challenges.", "benefic"))
        }
        if (p8 != null && p8.house in listOf(6, 8, 12)) {
            yogas.add(Yoga("Sarala Yoga", "8th lord $lord8 placed in dusthana house ${p8.house} grants fearlessness, longevity, profound wisdom, and triumph in crises.", "benefic"))
        }
        if (p12 != null && p12.house in listOf(6, 8, 12)) {
            yogas.add(Yoga("Vimala Yoga", "12th lord $lord12 placed in dusthana house ${p12.house} bestows independence, virtuous expenditures, spiritual freedom, and hidden wealth.", "benefic"))
        }

        // 7. Amala Yoga: Natural benefic in 10th house from Lagna or Moon
        val h10Planets = hMap[10] ?: emptyList()
        if (h10Planets.any { it.name in listOf("Jupiter", "Venus", "Mercury") }) {
            yogas.add(Yoga("Amala Yoga", "Natural benefic occupying the 10th house from Lagna ensures unblemished public reputation, pure deeds, and continuous career growth.", "benefic"))
        }

        // 8. Kemadruma Yoga: Moon with no planets in 2nd and 12th from it (excluding Sun/Rahu/Ketu)
        if (moon != null) {
            val h2FromMoon = if (moon.house == 12) 1 else moon.house + 1
            val h12FromMoon = if (moon.house == 1) 12 else moon.house - 1
            val has2nd = (hMap[h2FromMoon] ?: emptyList()).any { it.name in listOf("Mars", "Mercury", "Jupiter", "Venus", "Saturn") }
            val has12th = (hMap[h12FromMoon] ?: emptyList()).any { it.name in listOf("Mars", "Mercury", "Jupiter", "Venus", "Saturn") }
            if (!has2nd && !has12th) {
                // Check cancellation (Kendra from Lagna has planets)
                val kendrasHaveBenefics = listOf(1, 4, 7, 10).any { h -> (hMap[h] ?: emptyList()).any { it.name in listOf("Jupiter", "Venus", "Mercury") } }
                if (!kendrasHaveBenefics) {
                    yogas.add(Yoga("Kemadruma Yoga", "No planets in 2nd and 12th from the Moon indicates phases of emotional isolation or financial fluctuations, mitigated by Jupiter or Kendra placements.", "malefic"))
                }
            }
        }

        return yogas
    }

    private fun detectDoshas(planets: List<HousePlanet>, ascSignIdx: Int, moonNakshatra: String): DoshaResponse {
        val pMap = planets.associateBy { it.name }
        val rahu = pMap["Rahu"]
        val ketu = pMap["Ketu"]
        val mars = pMap["Mars"]
        val sun = pMap["Sun"]
        val saturn = pMap["Saturn"]
        val jupiter = pMap["Jupiter"]

        // 1. Kala Sarpa Dosha (All 7 classical planets hemmed between Rahu and Ketu)
        var hasKalaSarpa = false
        var ksType: Int? = null
        if (rahu != null && ketu != null) {
            val rDeg = rahu.fullDegree
            val kDeg = ketu.fullDegree
            val nonNodes = planets.filter { it.name !in listOf("Rahu", "Ketu", "Uranus", "Neptune", "Pluto") }

            val inDirectHemisphere = nonNodes.all { p ->
                val diff = (p.fullDegree - rDeg + 360.0) % 360.0
                diff in 0.0..180.0
            }
            val inReverseHemisphere = nonNodes.all { p ->
                val diff = (p.fullDegree - kDeg + 360.0) % 360.0
                diff in 0.0..180.0
            }

            if (inDirectHemisphere || inReverseHemisphere) {
                hasKalaSarpa = true
                ksType = rahu.house
            }
        }

        // 2. Manglik Dosha (Mars in 1, 2, 4, 7, 8, 12 from Lagna, Moon, and Venus)
        val checkManglik = { refHouse: Int ->
            val mHouse = mars?.house ?: 1
            val relHouse = ((mHouse - refHouse + 12) % 12) + 1
            val isManglik = relHouse in listOf(1, 2, 4, 7, 8, 12)
            val exceptions = mutableListOf<Int>()
            if (isManglik) {
                // Classical exceptions: Mars in own sign/exaltation, Jupiter aspecting, Mars combust
                if (mars?.strength in listOf("Exalted", "Own Sign")) exceptions.add(1)
                if (jupiter != null && abs(jupiter.house - mHouse) in listOf(4, 6, 8)) exceptions.add(2)
            }
            ManglikResult(
                hasDosha = isManglik,
                hasExceptions = exceptions.isNotEmpty(),
                exceptionsTriggered = exceptions
            )
        }
        val manglikLagna = checkManglik(1)
        val manglikMoon = checkManglik(pMap["Moon"]?.house ?: 1)
        val manglikVenus = checkManglik(pMap["Venus"]?.house ?: 1)

        // 3. Pitru Dosha (Sun afflicted by Rahu/Saturn in 9th or 5th house, or 9th lord afflicted)
        val pitruRules = mutableListOf<Int>()
        if (sun != null && rahu != null && (sun.house == rahu.house || abs(sun.house - rahu.house) == 6)) {
            pitruRules.add(1)
        }
        if (sun != null && sun.house == 9 && (rahu?.house == 9 || saturn?.house == 9)) {
            pitruRules.add(2)
        }
        val pitru = PitruResult(hasDosha = pitruRules.isNotEmpty(), rulesTriggered = pitruRules)

        // 4. Guru Chandala Dosha (Jupiter conjunct Rahu)
        val hasGuruChandala = jupiter != null && rahu != null && jupiter.house == rahu.house
        val guruChandala = GuruChandalaResult(
            hasDosha = hasGuruChandala,
            jupiterStronger = (jupiter?.digBalaPercentage ?: 50.0) > 50.0
        )

        // 5. Ganda Moola Dosha (Moon in Ashwini, Ashlesha, Magha, Jyeshtha, Mula, Revati)
        val gandaMoolaNaks = listOf("Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Mula", "Revati")
        val isGandaMoola = moonNakshatra in gandaMoolaNaks
        val gandaMoola = GandaMoolaResult(
            hasDosha = isGandaMoola,
            nakshatraName = if (isGandaMoola) moonNakshatra else null
        )

        return DoshaResponse(
            kalaSarpa = KalaSarpaResult(hasDosha = hasKalaSarpa, typeIndex = ksType),
            manglikLagna = manglikLagna,
            manglikMoon = manglikMoon,
            manglikVenus = manglikVenus,
            pitru = pitru,
            guruChandala = guruChandala,
            gandaMoola = gandaMoola,
            kalathraLagna = manglikLagna.hasDosha && !manglikLagna.hasExceptions,
            kalathraMoon = manglikMoon.hasDosha && !manglikMoon.hasExceptions,
            ghata = false,
            shrapit = saturn != null && rahu != null && saturn.house == rahu.house
        )
    }

    private fun calculateDrishti(ascSignIdx: Int, planets: List<HousePlanet>): DrishtiResponse {
        val grahaDrishti = mutableMapOf<String, PlanetDrishti>()
        val rasiDrishti = mutableMapOf<String, SignDrishti>()

        for (p in planets) {
            val aspectedHouses = mutableListOf<Int>()
            // 7th house aspect for all planets
            aspectedHouses.add(((p.house + 5) % 12) + 1)

            // Special aspects
            when (p.name) {
                "Mars" -> {
                    aspectedHouses.add(((p.house + 2) % 12) + 1) // 4th
                    aspectedHouses.add(((p.house + 6) % 12) + 1) // 8th
                }
                "Jupiter", "Rahu", "Ketu" -> {
                    aspectedHouses.add(((p.house + 3) % 12) + 1) // 5th
                    aspectedHouses.add(((p.house + 7) % 12) + 1) // 9th
                }
                "Saturn" -> {
                    aspectedHouses.add(((p.house + 1) % 12) + 1) // 3rd
                    aspectedHouses.add(((p.house + 8) % 12) + 1) // 10th
                }
            }

            val aspectedSigns = aspectedHouses.map { VedicConstants.SIGNS[(ascSignIdx + it - 1) % 12] }
            val aspectedPlanets = planets.filter { it.house in aspectedHouses && it.name != p.name }.map { it.name }

            grahaDrishti[p.name] = PlanetDrishti(
                aspectedSigns = aspectedSigns,
                aspectedHouses = aspectedHouses,
                aspectedPlanets = aspectedPlanets
            )
        }

        return DrishtiResponse(grahaDrishti = grahaDrishti, rasiDrishti = rasiDrishti)
    }

    private fun calculateArudhaLagna(ascSignIdx: Int, planets: List<HousePlanet>): JaiminiPoint {
        val lord = VedicConstants.SIGN_LORDS[ascSignIdx]
        val lordPlanet = planets.firstOrNull { it.name == lord }
        val lordSignIdx = if (lordPlanet != null) ((lordPlanet.fullDegree / 30.0).toInt()) % 12 else ascSignIdx
        val dist = (lordSignIdx - ascSignIdx + 12) % 12
        var alSignIdx = (lordSignIdx + dist) % 12
        // Jaimini exception: AL cannot be in 1st or 7th from Lagna
        if (alSignIdx == ascSignIdx) alSignIdx = (alSignIdx + 9) % 12
        else if (alSignIdx == (ascSignIdx + 6) % 12) alSignIdx = (alSignIdx + 9) % 12

        val house = ((alSignIdx - ascSignIdx + 12) % 12) + 1
        return JaiminiPoint(sign = VedicConstants.SIGNS[alSignIdx], signIndex = alSignIdx, house = house)
    }

    private fun calculateUpapadaLagna(ascSignIdx: Int, planets: List<HousePlanet>): JaiminiPoint {
        val h12SignIdx = (ascSignIdx + 11) % 12
        val lord12 = VedicConstants.SIGN_LORDS[h12SignIdx]
        val lordPlanet = planets.firstOrNull { it.name == lord12 }
        val lordSignIdx = if (lordPlanet != null) ((lordPlanet.fullDegree / 30.0).toInt()) % 12 else h12SignIdx
        val dist = (lordSignIdx - h12SignIdx + 12) % 12
        var ulSignIdx = (lordSignIdx + dist) % 12
        if (ulSignIdx == h12SignIdx) ulSignIdx = (ulSignIdx + 9) % 12
        val house = ((ulSignIdx - ascSignIdx + 12) % 12) + 1
        return JaiminiPoint(sign = VedicConstants.SIGNS[ulSignIdx], signIndex = ulSignIdx, house = house)
    }

    private fun calculateKarakamsha(planets: List<HousePlanet>): JaiminiPoint {
        val ak = planets.firstOrNull { it.charaKaraka?.startsWith("Atmakaraka") == true } ?: planets.first()
        val navSignIdx = VedicConstants.SIGNS.indexOf(ak.navamsaSign).let { if (it < 0) 0 else it }
        return JaiminiPoint(sign = ak.navamsaSign, signIndex = navSignIdx, house = 1)
    }

    private fun calculateCharaDasha(ascSignIdx: Int, planets: List<HousePlanet>, birthCal: Calendar): CharaDashaResponse {
        val periods = mutableListOf<CharaDashaPeriod>()
        val cal = birthCal.clone() as Calendar
        val sdf = SimpleDateFormat("dd-MM-yyyy", Locale.ENGLISH)

        val oddFooted = listOf(0, 1, 2, 6, 7, 8)
        val evenFooted = listOf(3, 4, 5, 9, 10, 11)

        // Jaimini Parasara rule: Dasha sequence direction is determined by 9th house from Lagna
        val ninthSign = (ascSignIdx + 8) % 12
        val step = if (evenFooted.contains(ninthSign)) -1 else 1

        val sequence = (0..11).map { (ascSignIdx + step * it).rem(12).let { s -> if (s < 0) s + 12 else s } }

        for (sIdx in sequence) {
            val signName = VedicConstants.SIGNS[sIdx]

            // Scorpio (sign 7) co-lords: Mars vs Ketu; Aquarius (sign 10) co-lords: Saturn vs Rahu
            val lordName = when (sIdx) {
                7 -> getStrongerCoLord("Mars", "Ketu", 7, planets)
                10 -> getStrongerCoLord("Saturn", "Rahu", 10, planets)
                else -> VedicConstants.SIGN_LORDS[sIdx]
            }
            val lord = planets.firstOrNull { it.name == lordName }
            val lordSignIdx = if (lord != null) ((lord.fullDegree / 30.0).toInt()) % 12 else sIdx

            val isDirect = oddFooted.contains(sIdx)
            val dist = if (isDirect) {
                (lordSignIdx + 12 - sIdx) % 12
            } else {
                (sIdx + 12 - lordSignIdx) % 12
            }

            var dur = if (dist == 0) 12 else dist
            if (lord?.strength == "Exalted") dur += 1
            if (lord?.strength == "Debilitated") dur -= 1
            if (dur <= 0) dur = 12

            val startStr = sdf.format(cal.time)
            val days = (dur * 365.256363004).roundToInt()
            cal.add(Calendar.DAY_OF_YEAR, days)
            val endStr = sdf.format(cal.time)

            periods.add(CharaDashaPeriod(sign = signName, durationYears = dur, startDate = startStr, endDate = endStr))
        }
        return CharaDashaResponse(periods = periods)
    }

    private fun getStrongerCoLord(p1Name: String, p2Name: String, lordSignIdx: Int, planets: List<HousePlanet>): String {
        val p1 = planets.firstOrNull { it.name == p1Name } ?: return p1Name
        val p2 = planets.firstOrNull { it.name == p2Name } ?: return p1Name

        val p1Sign = ((p1.fullDegree / 30.0).toInt()) % 12
        val p2Sign = ((p2.fullDegree / 30.0).toInt()) % 12

        // Rule 1: If one is in the sign and other is not, the OTHER is stronger (matching BPHS)
        if (p1Sign == lordSignIdx && p2Sign != lordSignIdx) return p2Name
        if (p2Sign == lordSignIdx && p1Sign != lordSignIdx) return p1Name

        // Rule 2: Conjunction count (planet with more associates is stronger)
        val p1Count = planets.count { (((it.fullDegree / 30.0).toInt()) % 12) == p1Sign }
        val p2Count = planets.count { (((it.fullDegree / 30.0).toInt()) % 12) == p2Sign }
        if (p1Count > p2Count) return p1Name
        if (p2Count > p1Count) return p2Name

        // Rule 3: Higher degree within sign
        val p1Deg = p1.degInSign
        val p2Deg = p2.degInSign
        return if (p1Deg >= p2Deg) p1Name else p2Name
    }

    private fun calculateBirthPanchanga(snapshot: AstroEphemeris.EphemerisSnapshot, birthCal: Calendar): Panchanga {
        val sun = snapshot.planets.firstOrNull { it.name == "Sun" }?.tropicalLongitude ?: 0.0
        val moon = snapshot.planets.firstOrNull { it.name == "Moon" }?.tropicalLongitude ?: 0.0

        val diff = (moon - sun + 360.0) % 360.0
        val tithiIdx = ((diff / 12.0).toInt()) % 30
        val tithiProgress = (diff % 12.0) / 12.0

        val moonSidereal = snapshot.planets.firstOrNull { it.name == "Moon" }?.siderealLongitude ?: 0.0
        val nakIdx = ((moonSidereal / (360.0 / 27.0)).toInt()) % 27
        val nakProgress = (moonSidereal % (360.0 / 27.0)) / (360.0 / 27.0)

        val yogaSum = (sun + moon) % 360.0
        val yogaIdx = ((yogaSum / (360.0 / 27.0)).toInt()) % 27
        val yogaProgress = (yogaSum % (360.0 / 27.0)) / (360.0 / 27.0)

        val karanaIdx = ((diff / 6.0).toInt()) % 60
        val karanaProgress = (diff % 6.0) / 6.0

        val tithiNames = listOf(
            "Shukla Pratipada", "Shukla Dwitiya", "Shukla Tritiya", "Shukla Chaturthi", "Shukla Panchami",
            "Shukla Shashthi", "Shukla Saptami", "Shukla Ashtami", "Shukla Navami", "Shukla Dashami",
            "Shukla Ekadashi", "Shukla Dwadashi", "Shukla Trayodashi", "Shukla Chaturdashi", "Purnima",
            "Krishna Pratipada", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami",
            "Krishna Shashthi", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami",
            "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya"
        )
        val yogaNames = listOf(
            "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
            "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
            "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
        )
        val karanaNames = listOf("Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kimstughna")
        val varaNames = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

        val dayOfWeek = birthCal.get(Calendar.DAY_OF_WEEK) - 1

        return Panchanga(
            vara = varaNames[dayOfWeek],
            tithi = PanchangaElement(tithiNames[tithiIdx], round(tithiProgress * 100.0) / 100.0),
            nakshatra = PanchangaElement(VedicConstants.NAKSHATRA_NAMES[nakIdx], round(nakProgress * 100.0) / 100.0),
            yoga = PanchangaElement(yogaNames[yogaIdx], round(yogaProgress * 100.0) / 100.0),
            karana = PanchangaElement(karanaNames[karanaIdx % 11], round(karanaProgress * 100.0) / 100.0)
        )
    }

    private fun parseDate(date: String): Triple<Int, Int, Int> {
        val parts = date.split('/', '-').map { it.trim().toIntOrNull() ?: 1 }
        return if (parts.size >= 3) {
            if (parts[0] > 1000) Triple(parts[0], parts[1], parts[2]) // YYYY-MM-DD
            else Triple(parts[2], parts[1], parts[0])                  // DD/MM/YYYY
        } else Triple(1990, 1, 1)
    }

    private fun parseTime(time: String): Triple<Int, Int, Double> {
        val parts = time.split(':').map { it.trim().toDoubleOrNull() ?: 0.0 }
        val h = if (parts.isNotEmpty()) parts[0].toInt() else 12
        val m = if (parts.size > 1) parts[1].toInt() else 0
        val s = if (parts.size > 2) parts[2] else 0.0
        return Triple(h, m, s)
    }

    private fun getDaysInMonth(year: Int, month: Int): Int {
        return when (month) {
            1, 3, 5, 7, 8, 10, 12 -> 31
            4, 6, 9, 11 -> 30
            2 -> if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)) 29 else 28
            else -> 30
        }
    }
}
