package com.example.vedicjyotish.ui.tabs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.data.models.HouseData
import com.example.vedicjyotish.data.models.HousePlanet
import com.example.vedicjyotish.theme.*
import com.example.vedicjyotish.ui.components.*

/**
 * Unified Vedic Astrology Calculations Screen.
 * Consolidates all horoscopic calculations onto a single comprehensive, beautifully structured page
 * matching the VedicJyotish web application.
 */
@Composable
fun ChartsTab(chart: ChartResponse) {
    val scrollState = rememberScrollState()

    var selectedVarga by remember { mutableStateOf("D1") }
    var dropdownExpanded by remember { mutableStateOf(false) }
    var chartStyleIndex by remember { mutableStateOf(0) } // 0: North Indian, 1: South Indian
    var inspectedHouse by remember { mutableStateOf<Triple<Int, String, HouseData?>?>(null) }

    val vargas = listOf(
        "D1" to "D1 Lagna (Primary Life)",
        "D2" to "D2 Hora (Wealth & Assets)",
        "D3" to "D3 Drekkana (Siblings & Drive)",
        "D4" to "D4 Chaturthamsa (Property)",
        "D7" to "D7 Saptamsa (Progeny & Fruits)",
        "D9" to "D9 Navamsa (Destiny & Dharma)",
        "D10" to "D10 Dasamsa (Career & Status)",
        "D12" to "D12 Dwadasamsa (Parents)",
        "D16" to "D16 Shodasamsa (Luxuries)",
        "D20" to "D20 Vimsamsa (Spirituality)",
        "D24" to "D24 Chaturvimsamsa (Learning)",
        "D27" to "D27 Saptavimsamsa (Stamina)",
        "D30" to "D30 Trimsamsa (Obstacles)",
        "D40" to "D40 Khavedamsa (Fortunes)",
        "D45" to "D45 Akshavedamsa (Character)",
        "D60" to "D60 Shastiamsa (Karma)"
    )

    val d9Data = chart.navamsaChart.map { entry ->
        val cleanKey = entry.key.removePrefix("house_")
        cleanKey to HouseData(
            sign = entry.value.sign,
            planets = entry.value.planets.map { pName ->
                HousePlanet(
                    name = pName,
                    sign = entry.value.sign,
                    house = cleanKey.toIntOrNull() ?: 1,
                    strength = "",
                    nature = "",
                    nakshatra = "",
                    nakshatraLord = "",
                    nakshatraPada = 0,
                    fullDegree = 0.0,
                    degInSign = 0.0,
                    retrograde = false,
                    combust = false,
                    navamsaSign = ""
                )
            }
        )
    }.toMap()

    val selectedVargaChart = remember(selectedVarga, chart) {
        when (selectedVarga) {
            "D1" -> chart.chartData.map { entry ->
                entry.key.removePrefix("house_") to entry.value
            }.toMap()
            "D9" -> d9Data
            else -> {
                val rawVarga = chart.divisionalCharts?.get(selectedVarga)
                rawVarga?.map { entry ->
                    val cleanKey = entry.key.removePrefix("house_")
                    cleanKey to HouseData(
                        sign = entry.value.sign,
                        planets = entry.value.planets.map { pName ->
                            HousePlanet(
                                name = pName,
                                sign = entry.value.sign,
                                house = cleanKey.toIntOrNull() ?: 1,
                                strength = "",
                                nature = "",
                                nakshatra = "",
                                nakshatraLord = "",
                                nakshatraPada = 0,
                                fullDegree = 0.0,
                                degInSign = 0.0,
                                retrograde = false,
                                combust = false,
                                navamsaSign = ""
                            )
                        }
                    )
                }?.toMap() ?: emptyMap()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 28.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Celestial Highlights Card
        VedicCard(
            shape = RoundedCornerShape(18.dp),
            contentPadding = 16.dp
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "CELESTIAL HIGHLIGHTS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    ChartStatHighlight("ASCENDANT", chart.ascendant.sign, "${chart.ascendant.degree.toInt()}°")
                    ChartStatHighlight("MOON NAKSHATRA", chart.moonIntelligence.nakshatra, "Pada ${chart.moonIntelligence.pada}")
                    ChartStatHighlight("MOON STRENGTH", chart.moonIntelligence.strength, chart.moonIntelligence.sign)
                }
            }
        }

        // 2. Divisional Kundli Chart Card (North / South Indian Toggle)
        VedicCard(
            shape = RoundedCornerShape(18.dp),
            contentPadding = 16.dp
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Divisional Kundli",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Explore 16 varga maps of your life",
                        color = TextSecondary,
                        fontSize = 10.sp
                    )
                }

                Box {
                    Surface(
                        onClick = { dropdownExpanded = true },
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, VedicBorder),
                        color = ParchmentBg,
                        modifier = Modifier
                            .height(36.dp)
                            .widthIn(min = 100.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = selectedVarga,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = LiquidGold
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.ArrowDropDown,
                                contentDescription = null,
                                tint = LiquidGold,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    DropdownMenu(
                        expanded = dropdownExpanded,
                        onDismissRequest = { dropdownExpanded = false },
                        modifier = Modifier.background(CosmicCard)
                    ) {
                        vargas.forEach { pair ->
                            DropdownMenuItem(
                                text = { Text(pair.second, fontSize = 11.sp, color = TextPrimary) },
                                onClick = {
                                    selectedVarga = pair.first
                                    dropdownExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Chart Style Segmented Control (North / South)
            VedicSegmentedControl(
                options = listOf("North Indian (Diamond)", "South Indian (Square)"),
                selectedIndex = chartStyleIndex,
                onOptionSelected = { chartStyleIndex = it },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (chartStyleIndex == 0) {
                NorthIndianChart(
                    chartData = selectedVargaChart,
                    title = vargas.find { it.first == selectedVarga }?.second ?: "Natal Chart",
                    onHouseClick = { hNum, sName, hData ->
                        inspectedHouse = Triple(hNum, sName, hData)
                    }
                )
            } else {
                SouthIndianChart(
                    chartData = selectedVargaChart,
                    title = vargas.find { it.first == selectedVarga }?.second ?: "Natal Chart",
                    ascendantSign = chart.ascendant.sign,
                    onHouseClick = { hNum, sName, hData ->
                        inspectedHouse = Triple(hNum, sName, hData)
                    }
                )
            }
        }

        // 3. Planetary Positions & Dignities Table
        PlanetaryTable(planetaryRows = chart.planetaryTable)

        // 4. Vimshottari Dasha Timeline with Active Dasha Hero Card
        DashaTimeline(mahadashas = chart.vimshottariTimeline)

        // 5. Vedic Yogas
        YogaCards(yogas = chart.yogas)

        // 6. Planetary Directional Strengths (Dig Bala)
        val digBalaPlanets = chart.chartData.values
            .flatMap { it.planets }
            .filter { it.digBalaPoints != null && it.digBalaPoints > 0.0 }
            .distinctBy { it.name }
            .sortedByDescending { it.digBalaPoints }

        if (digBalaPlanets.isNotEmpty()) {
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "PLANETARY DIRECTIONAL STRENGTHS (DIG BALA)",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Directional strength coordinates determining a planet's capability to manifest outcomes.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    digBalaPlanets.forEach { p ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(ParchmentBg)
                                .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(p.name, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                                Text("${p.digBalaPoints?.toInt() ?: 0} Pts", fontSize = 11.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            val pct = p.digBalaPercentage ?: 0.0
                            LinearProgressIndicator(
                                progress = { (pct / 100.0).toFloat().coerceIn(0f, 1f) },
                                color = LiquidGold,
                                trackColor = VedicLightBorder,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(5.dp)
                                    .clip(RoundedCornerShape(2.5.dp))
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Lagna Power", fontSize = 9.sp, color = TextMuted)
                                Text("${pct.toInt()}%", fontSize = 9.sp, color = VedicTerracotta, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }

        // 7. Jaimini Special Lagnas & 8 Chara Karakas
        chart.jaimini?.let { jaimini ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "JAIMINI SPECIAL LAGNAS & KARAKAS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Focal coordinates representing soul desires, material status, and public image.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Lagnas grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val lagnas = listOf(
                        Triple("Arudha Lagna (AL)", jaimini.arudhaLagna.sign, jaimini.arudhaLagna.house),
                        Triple("Upapada Lagna (UL)", jaimini.upapadaLagna.sign, jaimini.upapadaLagna.house),
                        Triple("Karakamsha (KL)", jaimini.karakamshaLagna.sign, jaimini.karakamshaLagna.house)
                    )
                    lagnas.forEach { (name, sign, house) ->
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(ParchmentBg)
                                .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(10.dp))
                                .padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(name, fontSize = 9.sp, color = TextSecondary, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(sign, fontSize = 12.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                            Text("House $house", fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Chara Karakas (Soul Role Indicators)",
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                val karakaSignificances = listOf(
                    "AK" to ("Atmakaraka" to "Soul indicator, primary spiritual lessons."),
                    "AmK" to ("Amatyakaraka" to "Career, intellect, vocation & counselors."),
                    "BK" to ("Bhratrukaraka" to "Siblings, guides & gurus."),
                    "MK" to ("Matrukaraka" to "Mother, home, emotional peace & luxury."),
                    "PiK" to ("Pitrukaraka" to "Father, lineage, ancestors & duty."),
                    "PK" to ("Putrakaraka" to "Children, creative intelligence & learning."),
                    "GK" to ("Gnatikaraka" to "Rivals, disputes, tests & health hurdles."),
                    "DK" to ("Darakaraka" to "Spouse, partnership & physical longevity.")
                )

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    karakaSignificances.forEach { (code, data) ->
                        val (fullName, meaning) = data
                        val planet = jaimini.charaKarakas.entries.find { it.value.contains(code) }?.key ?: "None"
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(ParchmentBg)
                                .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(8.dp))
                                .padding(horizontal = 10.dp, vertical = 7.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("$code ($fullName)", fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                                Text(meaning, fontSize = 9.sp, color = TextSecondary)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(planet, fontSize = 11.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // 8. Graha & Rasi Aspects
        chart.aspects?.let { aspects ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "GRAHA & RASI ASPECTS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Graha Drishti (planetary desire aspects) and Rasi Drishti (sign-based spatial aspects).",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Graha Drishti
                Text(
                    text = "Graha Drishti (Planetary Aspects)",
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    aspects.grahaDrishti.forEach { (planet, details) ->
                        if (details.aspectedPlanets.isNotEmpty() || details.aspectedSigns.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(ParchmentBg)
                                    .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(8.dp))
                                    .padding(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(planet, fontSize = 11.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                                    Text("Houses: ${details.aspectedHouses.joinToString(", ")}", fontSize = 9.sp, color = TextSecondary)
                                }
                                Spacer(modifier = Modifier.height(3.dp))
                                Text("Aspected Planets: ${details.aspectedPlanets.joinToString(", ").ifEmpty { "None" }}", fontSize = 10.sp, color = TextPrimary)
                                Text("Aspected Signs: ${details.aspectedSigns.joinToString(", ").ifEmpty { "None" }}", fontSize = 10.sp, color = VedicTerracotta)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Rasi Drishti
                Text(
                    text = "Rasi Drishti (Sign Aspects)",
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    aspects.rasiDrishti.forEach { (sign, details) ->
                        if (details.aspectedPlanets.isNotEmpty() || details.aspectedSigns.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(ParchmentBg)
                                    .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(8.dp))
                                    .padding(8.dp)
                            ) {
                                Text(sign, fontSize = 11.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(3.dp))
                                Text("Aspected Signs: ${details.aspectedSigns.joinToString(", ")}", fontSize = 10.sp, color = TextPrimary)
                                Text("Aspected Planets: ${details.aspectedPlanets.joinToString(", ").ifEmpty { "None" }}", fontSize = 10.sp, color = TextSecondary)
                            }
                        }
                    }
                }
            }
        }

        // 9. Natal Panchanga Elements
        chart.panchanga?.let { pan ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "NATAL PANCHANGA ELEMENTS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                val elements = listOf(
                    Triple("Vara (Day)", pan.vara, 0.0),
                    Triple("Tithi (Lunar)", pan.tithi.name, pan.tithi.progress),
                    Triple("Nakshatra", pan.nakshatra.name, pan.nakshatra.progress),
                    Triple("Yoga (Angle)", pan.yoga.name, pan.yoga.progress),
                    Triple("Karana", pan.karana.name, pan.karana.progress)
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    elements.forEach { (label, value, progress) ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(ParchmentBg)
                                .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(label, fontSize = 10.sp, color = TextSecondary, fontWeight = FontWeight.Bold)
                                Text(value, fontSize = 11.5.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                            }

                            if (progress > 0.0) {
                                Spacer(modifier = Modifier.height(6.dp))
                                LinearProgressIndicator(
                                    progress = { progress.toFloat() },
                                    color = LiquidGold,
                                    trackColor = VedicLightBorder,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(4.dp)
                                        .clip(RoundedCornerShape(2.dp))
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    Text("${(progress * 100).toInt()}% progress", fontSize = 9.sp, color = TextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }

        // 10. Spiritual Doshas & Alignments Card
        chart.doshas?.let { dosha ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "SPIRITUAL DOSHAS & ALIGNMENTS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                val doshaChecks = listOf(
                    Triple("Kaal Sarp Alignment", dosha.kalaSarpa.hasDosha, if (dosha.kalaSarpa.hasDosha) "Planets hemmed between Rahu and Ketu." else "Auspicious planetary freedom."),
                    Triple("Manglik Alignment", dosha.manglikLagna.hasDosha, if (dosha.manglikLagna.hasDosha) "Mars influence in house 1, 4, 7, 8 or 12." else "Neutral/Balanced Mars configuration."),
                    Triple("Pitru Ancestral Alignment", dosha.pitru.hasDosha, if (dosha.pitru.hasDosha) "Ancestral patterns active in the chart." else "Harmonious ancestral blessings."),
                    Triple("Guru Chandal Alignment", dosha.guruChandala.hasDosha, if (dosha.guruChandala.hasDosha) "Jupiter conjunct Rahu/Ketu active." else "Clear intellectual path."),
                    Triple("Ganda Mool Alignment", dosha.gandaMoola.hasDosha, if (dosha.gandaMoola.hasDosha) "Moon in transitional nakshatra: ${dosha.gandaMoola.nakshatraName}." else "Safe and auspicious Nakshatra pada."),
                    Triple("Kalathra Alignment", (dosha.kalathraLagna ?: false) || (dosha.kalathraMoon ?: false), if ((dosha.kalathraLagna ?: false) || (dosha.kalathraMoon ?: false)) "Afflictions on the 7th house or lord, affecting relationships." else "Harmonious relationship indicators."),
                    Triple("Shrapit Alignment", dosha.shrapit ?: false, if (dosha.shrapit == true) "Saturn and Rahu conjunction active, creating karmic lessons." else "No Saturn/Rahu curse active.")
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    doshaChecks.forEach { (title, active, desc) ->
                        val itemColor = if (active) LiquidRose else LiquidEmerald

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(ParchmentBg)
                                .border(BorderStroke(1.dp, itemColor.copy(alpha = 0.35f)), RoundedCornerShape(10.dp))
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = if (active) Icons.Default.Warning else Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = itemColor,
                                modifier = Modifier.size(18.dp)
                            )

                            Spacer(modifier = Modifier.width(12.dp))

                            Column {
                                Text(
                                    text = title,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                                Text(
                                    text = desc,
                                    fontSize = 10.sp,
                                    color = TextSecondary
                                )
                            }
                        }
                    }
                }
            }
        }

        // 11. Jaimini Chara Dasha Timeline
        chart.charaDasha?.let { charaDasha ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "JAIMINI CHARA DASHA",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Sign-based cyclic timeline mapping spiritual and material periods of experiences.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    charaDasha.periods.forEach { period ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(ParchmentBg)
                                .border(BorderStroke(1.dp, VedicLightBorder), RoundedCornerShape(10.dp))
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(period.sign, fontSize = 12.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                                Text("${period.durationYears} Years Duration", fontSize = 9.sp, color = TextSecondary)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("From: ${period.startDate}", fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                                Text("To: ${period.endDate}", fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }

        // 12. Ashtakavarga SAV & BAV Point Matrix Card
        chart.ashtakavarga?.let { ash ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "ASHTAKAVARGA POINT MATRIX",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Bhinnashtakavarga (BAV) planetary strengths and Sarvashtakavarga (SAV) collective house totals.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                HorizontalScrollableTable(
                    houses = (1..12).toList(),
                    planets = listOf("Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Lagna"),
                    bhinnashtakavarga = ash.bhinnashtakavarga,
                    sarvashtakavarga = ash.sarvashtakavarga
                )
            }
        }
    }

    // Interactive House Inspector Dialog
    inspectedHouse?.let { (hNum, sName, hData) ->
        HouseInspectorDialog(
            houseNumber = hNum,
            signName = sName,
            houseData = hData,
            onDismiss = { inspectedHouse = null }
        )
    }
}

@Composable
private fun ChartStatHighlight(label: String, value: String, sub: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, fontSize = 9.sp, color = TextSecondary, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, fontSize = 13.5.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
        Text(text = sub, fontSize = 10.sp, color = LiquidGoldDark)
    }
}
