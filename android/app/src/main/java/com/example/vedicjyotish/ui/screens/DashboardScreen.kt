package com.example.vedicjyotish.ui.screens

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.data.models.HouseData
import com.example.vedicjyotish.ui.components.*
import com.example.vedicjyotish.ui.viewmodels.DashboardViewModel
import com.example.vedicjyotish.theme.ParchmentBg
import com.example.vedicjyotish.theme.VedicCharcoal
import com.example.vedicjyotish.theme.VedicGold
import com.example.vedicjyotish.theme.VedicTerracotta
import com.example.vedicjyotish.theme.VedicMutedCharcoal

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    chart: ChartResponse,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel()
) {
    // Initialize viewmodel with chart data
    LaunchedEffect(chart) {
        viewModel.init(chart)
    }

    val selectedTab by viewModel.selectedTab.collectAsStateWithLifecycle()

    // Deep Report State
    val reportText by viewModel.reportText.collectAsStateWithLifecycle()
    val isGeneratingReport by viewModel.isGeneratingReport.collectAsStateWithLifecycle()
    val reportError by viewModel.reportError.collectAsStateWithLifecycle()

    // Rishi Chat State
    val chatMessages by viewModel.chatMessages.collectAsStateWithLifecycle()
    val chatInput by viewModel.chatInput.collectAsStateWithLifecycle()
    val isChatStreaming by viewModel.isChatStreaming.collectAsStateWithLifecycle()
    val chatError by viewModel.chatError.collectAsStateWithLifecycle()
    val questionCount by viewModel.questionCount.collectAsStateWithLifecycle()

    val tabTitles = listOf("CHARTS", "PLANETS", "DASHAS/YOGAS", "RISHI CHAT", "DEEP REPORT", "COMPATIBILITY")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "COSMIC DASHBOARD",
                            color = VedicTerracotta,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.sp
                        )
                        Text(
                            text = "${chart.location.city ?: "Chart"} • ${chart.location.lat}°N, ${chart.location.lon}°E",
                            color = VedicGold,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.sp
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Go back to inputs",
                            tint = VedicTerracotta
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = ParchmentBg,
                    titleContentColor = VedicTerracotta
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(ParchmentBg)
        ) {
            // --- SCROLLABLE TABS ROW ---
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                containerColor = ParchmentBg,
                contentColor = VedicTerracotta,
                edgePadding = 12.dp,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = VedicTerracotta
                    )
                }
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { viewModel.selectTab(index) },
                        text = {
                            Text(
                                text = title,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp,
                                color = if (selectedTab == index) VedicTerracotta else VedicMutedCharcoal
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // --- TAB CONTENT WITH SMOOTH CROSSFADE ANIMATION --- // YXV0aG9yIC0gRGhydXZpbCBQYXRlbA==
            Crossfade(
                targetState = selectedTab,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp)
            ) { tabIndex ->
                when (tabIndex) {
                    0 -> ChartsTab(chart = chart)
                    1 -> PlanetsTab(chart = chart)
                    2 -> DashasAndYogasTab(chart = chart)
                    3 -> RishiChatTab(
                        messages = chatMessages,
                        inputValue = chatInput,
                        onInputChange = { viewModel.updateChatInput(it) },
                        onSendClick = { viewModel.sendChatMessage() },
                        isStreaming = isChatStreaming,
                        questionCount = questionCount,
                        errorMessage = chatError
                    )
                    4 -> DeepReportTab(
                        reportText = reportText,
                        isGenerating = isGeneratingReport,
                        errorMsg = reportError,
                        onRetryClick = { viewModel.generateDeepReport() }
                    )
                    5 -> CompatibilityTab(viewModel = viewModel)
                }
            }
        }
    }
}

// ──────────────────────────────────────────────────────
//  Tab UI Components
// ──────────────────────────────────────────────────────

@Composable
private fun ChartsTab(chart: ChartResponse) {
    val scrollState = rememberScrollState()

    var selectedVarga by remember { mutableStateOf("D1") }
    var dropdownExpanded by remember { mutableStateOf(false) }

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
                com.example.vedicjyotish.data.models.HousePlanet(
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
                            com.example.vedicjyotish.data.models.HousePlanet(
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
            .padding(bottom = 24.dp)
    ) {
        // Celestial Highlights Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "✦ CELESTIAL HIGHLIGHTS ✦",
                    color = VedicTerracotta,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    HighlightItem("ASCENDANT", chart.ascendant.sign, "${chart.ascendant.degree.toInt()}°")
                    HighlightItem("MOON NAKSHATRA", chart.moonIntelligence.nakshatra, "Pada ${chart.moonIntelligence.pada}")
                    HighlightItem("MOON STRENGTH", chart.moonIntelligence.strength, chart.moonIntelligence.sign)
                }
            }
        }

        // Divisional Chart Selector & Kundli Chart
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Divisional Kundli",
                            color = VedicTerracotta,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Explore varga maps of your life",
                            color = VedicMutedCharcoal,
                            fontSize = 9.sp
                        )
                    }

                    // Simple clean Custom Dropdown Box to avoid layout bugs
                    Box {
                        Surface(
                            onClick = { dropdownExpanded = true },
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, VedicGold),
                            color = Color.White,
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
                                    color = VedicCharcoal
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.ArrowDropDown,
                                    contentDescription = null,
                                    tint = VedicGold,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        DropdownMenu(
                            expanded = dropdownExpanded,
                            onDismissRequest = { dropdownExpanded = false },
                            modifier = Modifier.background(Color.White)
                        ) {
                            vargas.forEach { pair ->
                                DropdownMenuItem(
                                    text = { Text(pair.second, fontSize = 11.sp, color = VedicCharcoal) },
                                    onClick = {
                                        selectedVarga = pair.first
                                        dropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                NorthIndianChart(
                    chartData = selectedVargaChart,
                    title = vargas.find { it.first == selectedVarga }?.second ?: "Natal Chart"
                )
            }
        }

        // Panchanga Elements Section (Dynamic backend calculations)
        chart.panchanga?.let { pan ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ PANCHANGA ELEMENTS ✦",
                        color = VedicTerracotta,
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
                                    .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                    .padding(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(label, fontSize = 9.sp, color = VedicMutedCharcoal, fontWeight = FontWeight.Bold)
                                    Text(value, fontSize = 11.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                }

                                if (progress > 0.0) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    LinearProgressIndicator(
                                        progress = progress.toFloat(),
                                        color = VedicGold,
                                        trackColor = Color.LightGray.copy(alpha = 0.4f),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(4.dp)
                                    )
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.End
                                    ) {
                                        Text("${(progress * 100).toInt()}% progress", fontSize = 8.sp, color = VedicMutedCharcoal)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Spiritual Doshas & Alignments Card (Dynamic backend calculations)
        chart.doshas?.let { dosha ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ SPIRITUAL DOSHAS & ALIGNMENTS ✦",
                        color = VedicTerracotta,
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
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                    .padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (active) Icons.Default.Warning else Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = if (active) VedicTerracotta else Color(0xFF2E7D32),
                                    modifier = Modifier.size(18.dp)
                                )

                                Spacer(modifier = Modifier.width(12.dp))

                                Column {
                                    Text(
                                        text = title,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (active) VedicTerracotta else VedicCharcoal
                                    )
                                    Text(
                                        text = desc,
                                        fontSize = 9.sp,
                                        color = VedicMutedCharcoal
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Ashtakavarga SAV & BAV Point Matrix Card (Dynamic backend calculations)
        chart.ashtakavarga?.let { ash ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ ASHTAKAVARGA POINT MATRIX ✦",
                        color = VedicTerracotta,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Bhinnashtakavarga (BAV) planetary strengths and Sarvashtakavarga (SAV) collective house totals.",
                        color = Color.Gray,
                        fontSize = 9.sp,
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
    }
}

@Composable
private fun PlanetsTab(chart: ChartResponse) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 24.dp)
    ) {
        PlanetaryTable(planetaryRows = chart.planetaryTable)

        Spacer(modifier = Modifier.height(16.dp))

        // --- Dig Bala Strengths ---
        val digBalaPlanets = remember(chart) {
            val list = mutableListOf<com.example.vedicjyotish.data.models.HousePlanet>()
            chart.chartData.values.forEach { house ->
                house.planets.forEach { planet ->
                    if (planet.digBalaPoints != null) {
                        list.add(planet)
                    }
                }
            }
            list.sortByDescending { it.digBalaPercentage ?: 0.0 }
            list
        }

        if (digBalaPlanets.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ PLANETARY STRENGTHS (DIG BALA) ✦",
                        color = VedicTerracotta,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Directional strength coordinates determining a planet's capability to manifest outcomes.",
                        color = Color.Gray,
                        fontSize = 9.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        digBalaPlanets.forEach { p ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                    .padding(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(p.name, fontSize = 11.sp, color = VedicCharcoal, fontWeight = FontWeight.Bold)
                                    Text("${p.digBalaPoints?.toInt() ?: 0} Pts", fontSize = 10.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                val pct = p.digBalaPercentage ?: 0.0
                                LinearProgressIndicator(
                                    progress = (pct / 100.0).toFloat(),
                                    color = VedicGold,
                                    trackColor = Color.LightGray.copy(alpha = 0.4f),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(5.dp)
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Lagna Power", fontSize = 8.sp, color = VedicMutedCharcoal)
                                    Text("${pct.toInt()}%", fontSize = 8.sp, color = VedicMutedCharcoal)
                                }
                            }
                        }
                    }
                }
            }
        }

        // --- Jaimini Lagnas & Karakas ---
        chart.jaimini?.let { jaimini ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ JAIMINI LAGNAS & KARAKAS ✦",
                        color = VedicTerracotta,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Subtle focal points representing your soul's desires, material status, and public image.",
                        color = Color.Gray,
                        fontSize = 9.sp,
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
                            Triple("Karakamsha Lagna (KL)", jaimini.karakamshaLagna.sign, jaimini.karakamshaLagna.house)
                        )
                        lagnas.forEach { (name, sign, house) ->
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(name, fontSize = 8.sp, color = Color.Gray, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(sign, fontSize = 11.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                Text("House $house", fontSize = 9.sp, color = VedicCharcoal, fontWeight = FontWeight.Medium)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Chara Karakas",
                        color = VedicCharcoal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    val karakaSignificances = listOf(
                        "AK" to ("Atmakaraka" to "Soul indicator, primary lessons and spiritual path."),
                        "AmK" to ("Amatyakaraka" to "Career, profession, intellectual path, and counselors."),
                        "BK" to ("Bhratrukaraka" to "Siblings, companions, gurus, and helpful guides."),
                        "MK" to ("Matrukaraka" to "Mother, home environment, emotional peace, and luxury."),
                        "PiK" to ("Pitrukaraka" to "Father, lineage, ancestors, and higher duties."),
                        "PK" to ("Putrakaraka" to "Children, creative pursuits, education, and followers."),
                        "GK" to ("Gnatikaraka" to "Rivals, disputes, conflicts, health challenges, and struggles."),
                        "DK" to ("Darakaraka" to "Life partner, marriage, business partners, and physical wellness.")
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        karakaSignificances.forEach { (code, data) ->
                            val (fullName, meaning) = data
                            val planet = jaimini.charaKarakas.entries.find { it.value == code }?.key ?: "None"
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("$code ($fullName)", fontSize = 10.sp, color = VedicCharcoal, fontWeight = FontWeight.Bold)
                                    Text(meaning, fontSize = 8.sp, color = Color.Gray)
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(planet, fontSize = 10.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // --- Graha & Rasi Aspects ---
        chart.aspects?.let { aspects ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ GRAHA & RASI ASPECTS ✦",
                        color = VedicTerracotta,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Graha Drishti (planetary aspects) and Rasi Drishti (sign-based aspects) representing mutual influences.",
                        color = Color.Gray,
                        fontSize = 9.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    // Graha Drishti
                    Text(
                        text = "Graha Drishti (Planetary Aspects)",
                        color = VedicCharcoal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        aspects.grahaDrishti.forEach { (planet, details) ->
                            if (details.aspectedPlanets.isNotEmpty() || details.aspectedSigns.isNotEmpty()) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                        .padding(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(planet, fontSize = 10.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                        Text("Houses: ${details.aspectedHouses.joinToString(", ")}", fontSize = 9.sp, color = Color.Gray)
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Aspected Planets: ${details.aspectedPlanets.joinToString(", ").ifEmpty { "None" }}", fontSize = 9.sp, color = VedicCharcoal)
                                    Text("Aspected Signs: ${details.aspectedSigns.joinToString(", ").ifEmpty { "None" }}", fontSize = 9.sp, color = VedicCharcoal)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Rasi Drishti
                    Text(
                        text = "Rasi Drishti (Sign Aspects)",
                        color = VedicCharcoal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        aspects.rasiDrishti.forEach { (sign, details) ->
                            if (details.aspectedPlanets.isNotEmpty() || details.aspectedSigns.isNotEmpty()) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                        .padding(8.dp)
                                ) {
                                    Text(sign, fontSize = 10.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Aspected Signs: ${details.aspectedSigns.joinToString(", ")}", fontSize = 9.sp, color = VedicCharcoal)
                                    Text("Aspected Planets: ${details.aspectedPlanets.joinToString(", ").ifEmpty { "None" }}", fontSize = 9.sp, color = VedicCharcoal)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DashasAndYogasTab(chart: ChartResponse) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 16.dp)
    ) {
        YogaCards(yogas = chart.yogas)
        Spacer(modifier = Modifier.height(16.dp))
        DashaTimeline(mahadashas = chart.vimshottariTimeline)

        // --- Jaimini Chara Dasha ---
        chart.charaDasha?.let { charaDasha ->
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "✦ JAIMINI CHARA DASHA ✦",
                        color = VedicTerracotta,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                    Text(
                        text = "Sign-based cyclic timeline mapping spiritual and material periods of experiences.",
                        color = Color.Gray,
                        fontSize = 9.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        charaDasha.periods.forEach { period ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                                    .padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(period.sign, fontSize = 11.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                                    Text("${period.durationYears} Years Duration", fontSize = 8.sp, color = VedicMutedCharcoal)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("From: ${period.startDate}", fontSize = 9.sp, color = VedicCharcoal, fontWeight = FontWeight.Medium)
                                    Text("To: ${period.endDate}", fontSize = 9.sp, color = VedicCharcoal, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RishiChatTab(
    messages: List<com.example.vedicjyotish.data.models.ChatMessage>,
    inputValue: String,
    onInputChange: (String) -> Unit,
    onSendClick: () -> Unit,
    isStreaming: Boolean,
    questionCount: Int,
    errorMessage: String?
) {
    ChatSection(
        messages = messages,
        inputValue = inputValue,
        onInputChange = onInputChange,
        onSendClick = onSendClick,
        isStreaming = isStreaming,
        questionCount = questionCount,
        errorMessage = errorMessage
    )
}

@Composable
private fun DeepReportTab(
    reportText: String,
    isGenerating: Boolean,
    errorMsg: String?,
    onRetryClick: () -> Unit
) {
    ReportSection(
        reportText = reportText,
        isGenerating = isGenerating,
        errorMsg = errorMsg,
        onRetryClick = onRetryClick
    )
}

@Composable
private fun HighlightItem(label: String, val1: String, val2: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = label,
            color = VedicMutedCharcoal,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = val1,
            color = VedicTerracotta,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = val2,
            color = VedicCharcoal,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun HorizontalScrollableTable(
    houses: List<Int>,
    planets: List<String>,
    bhinnashtakavarga: Map<String, List<Int>>,
    sarvashtakavarga: List<Int>
) {
    val scrollState = rememberScrollState()
    val cellWidth = 44.dp
    val headerWidth = 64.dp

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState)
    ) {
        // Houses Row (Header)
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Planet",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = VedicCharcoal,
                modifier = Modifier.width(headerWidth),
                textAlign = TextAlign.Start
            )
            houses.forEach { h ->
                Text(
                    text = "H$h",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    modifier = Modifier.width(cellWidth),
                    textAlign = TextAlign.Center
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // BAV Rows
        planets.forEach { p ->
            val scores = bhinnashtakavarga[p] ?: List(12) { 0 }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = p,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Medium,
                    color = VedicCharcoal,
                    modifier = Modifier.width(headerWidth),
                    textAlign = TextAlign.Start
                )
                scores.forEach { score ->
                    Text(
                        text = "$score",
                        fontSize = 9.sp,
                        color = VedicCharcoal,
                        modifier = Modifier
                            .width(cellWidth)
                            .background(
                                if (score >= 5) Color(0xFFE8F5E9) else Color.Transparent,
                                RoundedCornerShape(4.dp)
                            ),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(6.dp))
        HorizontalDivider(color = Color.LightGray.copy(alpha = 0.5f), thickness = 1.dp)
        Spacer(modifier = Modifier.height(6.dp))

        // SAV Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF4F3EF), RoundedCornerShape(6.dp))
                .padding(vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "SAV Total",
                fontSize = 9.sp,
                fontWeight = FontWeight.Bold,
                color = VedicTerracotta,
                modifier = Modifier.width(headerWidth),
                textAlign = TextAlign.Start
            )
            sarvashtakavarga.forEach { total ->
                Text(
                    text = "$total",
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    modifier = Modifier
                        .width(cellWidth)
                        .background(
                            if (total >= 28) Color(0xFFC8E6C9) else if (total < 20) Color(0xFFFFCDD2) else Color.Transparent,
                            RoundedCornerShape(4.dp)
                        ),
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
