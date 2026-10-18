package com.example.vedicjyotish.ui.screens

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.theme.*
import com.example.vedicjyotish.ui.components.*
import com.example.vedicjyotish.ui.tabs.*
import com.example.vedicjyotish.ui.viewmodels.DashboardViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    chart: ChartResponse,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: DashboardViewModel = viewModel()
) {
    val context = LocalContext.current
    LaunchedEffect(chart) {
        viewModel.init(chart, context)
    }

    val selectedTab by viewModel.selectedTab.collectAsStateWithLifecycle()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    // Deep Report State
    val reportText by viewModel.reportText.collectAsStateWithLifecycle()
    val isGeneratingReport by viewModel.isGeneratingReport.collectAsStateWithLifecycle()
    val reportError by viewModel.reportError.collectAsStateWithLifecycle()

    // Rishi Chat State
    val chatMessages by viewModel.chatMessages.collectAsStateWithLifecycle()
    val chatInput by viewModel.chatInput.collectAsStateWithLifecycle()
    val isChatStreaming by viewModel.isChatStreaming.collectAsStateWithLifecycle()
    val chatError by viewModel.chatError.collectAsStateWithLifecycle()
    val allSessions by viewModel.allSessions.collectAsStateWithLifecycle()
    val activeSessionTitle by viewModel.activeSessionTitle.collectAsStateWithLifecycle()

    var showAiSettings by remember { mutableStateOf(false) }
    var showLanguageDialog by remember { mutableStateOf(false) }

    val currentTitle = when (selectedTab) {
        0 -> "Vedic Calculations"
        1 -> "Vedic Panchangam"
        2 -> "Rishi AI Astrologer"
        3 -> "Kundli Milan & Matching"
        4 -> "Deep Life Analysis"
        else -> "Vedic Jyotish"
    }

    val drawerItemColors = NavigationDrawerItemDefaults.colors(
        selectedContainerColor = VedicTerracotta.copy(alpha = 0.12f),
        unselectedContainerColor = Color.Transparent,
        selectedTextColor = VedicTerracotta,
        unselectedTextColor = VedicCharcoal,
        selectedIconColor = VedicTerracotta,
        unselectedIconColor = VedicMutedCharcoal
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = ParchmentCardBg,
                drawerShape = RoundedCornerShape(topEnd = 20.dp, bottomEnd = 20.dp),
                modifier = Modifier.width(310.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .padding(horizontal = 16.dp, vertical = 20.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Header Brand with 3-bar logo
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = null,
                                tint = VedicTerracotta,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "VEDIC JYOTISH",
                                    color = VedicTerracotta,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.8.sp
                                )
                                Text(
                                    text = "॥ ॐ गं गणपतये नमः ॥",
                                    color = VedicGold,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                        IconButton(onClick = { coroutineScope.launch { drawerState.close() } }) {
                            Icon(Icons.Default.Close, contentDescription = "Close Menu", tint = VedicMutedCharcoal)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Active Profile Card
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = ParchmentBg,
                        border = BorderStroke(1.dp, VedicBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "ACTIVE HOROSCOPE",
                                    color = VedicGold,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "Switch",
                                    color = VedicTerracotta,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.clickable {
                                        coroutineScope.launch { drawerState.close() }
                                        onBackClick()
                                    }
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = chart.location.city ?: "Selected City",
                                color = VedicCharcoal,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "${chart.ascendant.sign} Lagna • ${chart.moonIntelligence.nakshatra} (Pada ${chart.moonIntelligence.pada})",
                                color = VedicTerracotta,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            val tzSign = if (chart.location.tz >= 0) "+" else ""
                            Text(
                                text = "${chart.location.lat}°N, ${chart.location.lon}°E • GMT$tzSign${chart.location.tz}",
                                color = VedicMutedCharcoal,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Main Navigation Views Section
                    Text(
                        text = "ASTROLOGICAL VIEWS",
                        color = VedicMutedCharcoal,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp,
                        modifier = Modifier.padding(start = 8.dp, bottom = 4.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.AutoAwesome, contentDescription = null) },
                        label = { Text("Vedic Calculations", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = selectedTab == 0,
                        onClick = {
                            viewModel.selectTab(0)
                            coroutineScope.launch { drawerState.close() }
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.WbSunny, contentDescription = null) },
                        label = { Text("Vedic Panchangam", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = selectedTab == 1,
                        onClick = {
                            viewModel.selectTab(1)
                            coroutineScope.launch { drawerState.close() }
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Psychology, contentDescription = null) },
                        label = { Text("Rishi AI Astrologer", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = selectedTab == 2,
                        onClick = {
                            viewModel.selectTab(2)
                            coroutineScope.launch { drawerState.close() }
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Favorite, contentDescription = null) },
                        label = { Text("Kundli Milan & Matching", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = selectedTab == 3,
                        onClick = {
                            viewModel.selectTab(3)
                            coroutineScope.launch { drawerState.close() }
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Description, contentDescription = null) },
                        label = { Text("Deep Life Report", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = selectedTab == 4,
                        onClick = {
                            viewModel.selectTab(4)
                            coroutineScope.launch { drawerState.close() }
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = VedicLightBorder)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Settings & Preferences
                    Text(
                        text = "SETTINGS & PREFERENCES",
                        color = VedicMutedCharcoal,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.2.sp,
                        modifier = Modifier.padding(start = 8.dp, bottom = 4.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.SettingsSuggest, contentDescription = null) },
                        label = { Text("AI Provider Setup (BYOK)", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = false,
                        onClick = {
                            coroutineScope.launch { drawerState.close() }
                            showAiSettings = true
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Language, contentDescription = null) },
                        label = { Text("Consultation Language", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = false,
                        onClick = {
                            coroutineScope.launch { drawerState.close() }
                            showLanguageDialog = true
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )

                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.AddCircleOutline, contentDescription = null) },
                        label = { Text("New Birth Chart Input", fontSize = 13.sp, fontWeight = FontWeight.Medium) },
                        selected = false,
                        onClick = {
                            coroutineScope.launch { drawerState.close() }
                            onBackClick()
                        },
                        colors = drawerItemColors,
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }
        }
    ) {
        Scaffold(
            containerColor = ParchmentBg,
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = currentTitle,
                            color = VedicTerracotta,
                            fontSize = 16.5.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 0.5.sp
                        )
                    },
                    navigationIcon = {
                        IconButton(
                            onClick = { coroutineScope.launch { drawerState.open() } }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Menu,
                                contentDescription = "Menu",
                                tint = VedicTerracotta,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = onBackClick) {
                            Icon(
                                imageVector = Icons.Default.EditCalendar,
                                contentDescription = "New or Edit Chart",
                                tint = VedicTerracotta
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = ParchmentBg
                    )
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = ParchmentCardBg,
                    tonalElevation = 3.dp,
                    modifier = Modifier.border(BorderStroke(1.dp, VedicBorder.copy(alpha = 0.5f)))
                ) {
                    val navItems = listOf(
                        Triple(0, "Calculations", Icons.Default.AutoAwesome),
                        Triple(1, "Panchang", Icons.Default.WbSunny),
                        Triple(2, "Rishi AI", Icons.Default.Psychology),
                        Triple(3, "Milan", Icons.Default.Favorite),
                        Triple(4, "Report", Icons.Default.Description)
                    )
                    navItems.forEach { (index, label, icon) ->
                        val isSelected = selectedTab == index
                        NavigationBarItem(
                            selected = isSelected,
                            onClick = { viewModel.selectTab(index) },
                            icon = { Icon(icon, contentDescription = label) },
                            label = {
                                Text(
                                    text = label,
                                    fontSize = 10.5.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = VedicTerracotta,
                                selectedTextColor = VedicTerracotta,
                                indicatorColor = VedicTerracotta.copy(alpha = 0.14f),
                                unselectedIconColor = VedicMutedCharcoal,
                                unselectedTextColor = VedicMutedCharcoal
                            )
                        )
                    }
                }
            }
        ) { innerPadding ->
            Box(
                modifier = modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(ParchmentBg)
            ) {
                Crossfade(
                    targetState = selectedTab,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 14.dp, vertical = 6.dp)
                ) { tabIndex ->
                    when (tabIndex) {
                        0 -> ChartsTab(chart = chart)
                        1 -> PanchangaScreen(
                            lat = chart.location.lat,
                            lon = chart.location.lon,
                            city = chart.location.city ?: "Location",
                            tzOffsetHours = chart.location.tz
                        )
                        2 -> ChatSection(
                            messages = chatMessages,
                            inputValue = chatInput,
                            onInputChange = { viewModel.updateChatInput(it) },
                            onSendClick = { viewModel.sendChatMessage() },
                            isStreaming = isChatStreaming,
                            errorMessage = chatError,
                            activeSessionTitle = activeSessionTitle,
                            sessions = allSessions,
                            onNewChatClick = { viewModel.startNewChat() },
                            onSelectSession = { viewModel.switchSession(it) },
                            onOpenAiSettings = { showAiSettings = true },
                            providerName = if (viewModel.isInitialized) viewModel.aiKeyManager.currentProvider.displayName else "AI Astrologer"
                        )
                        3 -> CompatibilityTab(viewModel = viewModel)
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

    // AI Settings Dialog
    if (showAiSettings && viewModel.isInitialized) {
        AiSettingsDialog(
            keyManager = viewModel.aiKeyManager,
            onDismiss = { showAiSettings = false },
            onSaved = { }
        )
    }

    // Language Selector Dialog
    if (showLanguageDialog) {
        val selectedLanguage by viewModel.selectedLanguage.collectAsStateWithLifecycle()
        val languages = listOf(
            "English" to "English",
            "Hindi" to "हिन्दी (Hindi)",
            "Gujarati" to "ગુજરાતી (Gujarati)",
            "Marathi" to "मराठी (Marathi)",
            "Tamil" to "தமிழ் (Tamil)",
            "Telugu" to "తెలుగు (Telugu)",
            "Bengali" to "বাংলা (Bengali)",
            "Kannada" to "ಕನ್ನಡ (Kannada)"
        )

        AlertDialog(
            onDismissRequest = { showLanguageDialog = false },
            containerColor = ParchmentCardBg,
            title = {
                Text(
                    text = "Consultation Language",
                    color = VedicTerracotta,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column {
                    languages.forEach { lang ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    viewModel.updateSelectedLanguage(lang.first, context)
                                    showLanguageDialog = false
                                }
                                .padding(vertical = 10.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = lang.second,
                                color = if (lang.first == selectedLanguage) VedicTerracotta else VedicCharcoal,
                                fontWeight = if (lang.first == selectedLanguage) FontWeight.Bold else FontWeight.Normal,
                                fontSize = 14.sp
                            )
                            if (lang.first == selectedLanguage) {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    tint = VedicTerracotta,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showLanguageDialog = false }) {
                    Text("Close", color = VedicTerracotta, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}
