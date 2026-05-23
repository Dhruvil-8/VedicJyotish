package com.example.vedicastroai.ui.screens

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
import com.example.vedicastroai.data.models.ChartResponse
import com.example.vedicastroai.data.models.HouseData
import com.example.vedicastroai.ui.components.*
import com.example.vedicastroai.ui.viewmodels.DashboardViewModel
import com.example.vedicastroai.theme.ParchmentBg
import com.example.vedicastroai.theme.VedicCharcoal
import com.example.vedicastroai.theme.VedicGold
import com.example.vedicastroai.theme.VedicTerracotta

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

    val tabTitles = listOf("CHARTS", "PLANETS", "DASHAS/YOGAS", "RISHI CHAT", "DEEP REPORT")

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
                                color = if (selectedTab == index) VedicTerracotta else Color.Gray
                            )
                        }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // --- TAB CONTENT WITH SMOOTH CROSSFADE ANIMATION ---
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 16.dp)
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

        // D1 Lagna Kundli Chart
        val d1Data = chart.chartData.map { entry ->
            entry.key.removePrefix("house_") to entry.value
        }.toMap()
        NorthIndianChart(
            chartData = d1Data,
            title = "D1 Lagna Kundli"
        )

        Spacer(modifier = Modifier.height(16.dp))

        // D9 Navamsa Chart
        val d9Data = chart.navamsaChart.map { entry ->
            val cleanKey = entry.key.removePrefix("house_")
            cleanKey to HouseData(
                sign = entry.value.sign,
                planets = entry.value.planets.map { pName ->
                    com.example.vedicastroai.data.models.HousePlanet(
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
        NorthIndianChart(
            chartData = d9Data,
            title = "D9 Navamsa Chart"
        )
    }
}

@Composable
private fun PlanetsTab(chart: ChartResponse) {
    Column(modifier = Modifier.fillMaxSize()) {
        PlanetaryTable(planetaryRows = chart.planetaryTable)
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
    }
}

@Composable
private fun RishiChatTab(
    messages: List<com.example.vedicastroai.data.models.ChatMessage>,
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
            color = Color.Gray,
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
