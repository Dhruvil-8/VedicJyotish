package com.example.vedicjyotish.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import android.content.Context
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.vedicjyotish.ui.viewmodels.BirthDetailsViewModel
import com.example.vedicjyotish.theme.*
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BirthDetailsScreen(
    onChartCalculated: (com.example.vedicjyotish.data.models.ChartResponse) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: BirthDetailsViewModel = viewModel()
) {
    val date by viewModel.date.collectAsStateWithLifecycle()
    val time by viewModel.time.collectAsStateWithLifecycle()
    val selectedLanguage by viewModel.selectedLanguage.collectAsStateWithLifecycle()
    val cityQuery by viewModel.cityQuery.collectAsStateWithLifecycle()
    val selectedCity by viewModel.city.collectAsStateWithLifecycle()
    val searchResults by viewModel.searchResults.collectAsStateWithLifecycle()
    val isSearchingCity by viewModel.isSearchingCity.collectAsStateWithLifecycle()
    val isCalculating by viewModel.isCalculating.collectAsStateWithLifecycle()
    val errorMsg by viewModel.error.collectAsStateWithLifecycle()
    val latitude by viewModel.latitude.collectAsStateWithLifecycle()
    val longitude by viewModel.longitude.collectAsStateWithLifecycle()
    val timezone by viewModel.timezone.collectAsStateWithLifecycle()
    val hasSavedChart by viewModel.hasSavedChart.collectAsStateWithLifecycle()
    val savedChartInfo by viewModel.savedChartInfo.collectAsStateWithLifecycle()

    val scrollState = rememberScrollState()
    val context = LocalContext.current

    // Listen for successful calculation events and load saved profile
    LaunchedEffect(Unit) {
        viewModel.setContext(context)
        viewModel.loadLanguage(context)
        viewModel.loadSavedProfile(context)
        viewModel.chartResult.collect { chart ->
            onChartCalculated(chart)
        }
    }

    val glassTextFieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = VedicTerracotta,
        unfocusedBorderColor = VedicBorder,
        focusedLabelColor = VedicTerracotta,
        unfocusedLabelColor = VedicMutedCharcoal,
        focusedTextColor = VedicCharcoal,
        unfocusedTextColor = VedicCharcoal,
        cursorColor = VedicTerracotta,
        focusedContainerColor = Color(0xFFFFFFFF),
        unfocusedContainerColor = Color(0xFFFFFFFF)
    )

    Scaffold(
        containerColor = ParchmentBg,
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "VEDIC JYOTISH",
                            color = VedicTerracotta,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 2.5.sp
                        )
                        Text(
                            text = "॥ ॐ गं गणपतये नमः ॥",
                            color = VedicGold,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = ParchmentBg
                )
            )
        }
    ) { paddingValues ->

        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(ParchmentBg)
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            contentAlignment = Alignment.TopCenter
        ) {
            VedicCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                backgroundColor = ParchmentCardBg,
                borderColor = VedicBorder,
                contentPadding = 18.dp
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "BIRTH INFORMATION",
                        color = LiquidGold,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )

                    Text(
                        text = "Compute exact astronomical planetary alignment at your time of birth",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp, bottom = 18.dp)
                    )

                    // SAVED KUNDLI QUICK-ACCESS BANNER
                    if (hasSavedChart) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = LiquidGold.copy(alpha = 0.12f),
                            border = BorderStroke(1.dp, LiquidGold.copy(alpha = 0.45f)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 18.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(12.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "SAVED READING",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = LiquidGold,
                                        letterSpacing = 1.sp
                                    )
                                    Text(
                                        text = savedChartInfo ?: "Previous Reading",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "Tap Open to view instantly",
                                        fontSize = 10.sp,
                                        color = TextSecondary
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    IconButton(
                                        onClick = { viewModel.clearSavedData(context) },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Close,
                                            contentDescription = "Clear saved data",
                                            tint = TextSecondary,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Button(
                                        onClick = { viewModel.loadSavedChart(context) },
                                        colors = ButtonDefaults.buttonColors(containerColor = LiquidGold),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                    ) {
                                        Text("Open", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = CosmicVoid)
                                    }
                                }
                            }
                        }
                    }

                    // 1. DATE OF BIRTH
                    OutlinedTextField(
                        value = date,
                        onValueChange = { viewModel.updateDate(it) },
                        label = { Text("Date of Birth (DD/MM/YYYY)", fontSize = 13.sp) },
                        placeholder = { Text("e.g. 15/08/1947", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        trailingIcon = {
                            IconButton(onClick = {
                                showDatePicker(context, date) { viewModel.updateDate(it) }
                            }) {
                                Icon(
                                    imageVector = Icons.Default.DateRange,
                                    contentDescription = "Select Date",
                                    tint = LiquidGold
                                )
                            }
                        },
                        colors = glassTextFieldColors
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2. TIME OF BIRTH
                    OutlinedTextField(
                        value = time,
                        onValueChange = { viewModel.updateTime(it) },
                        label = { Text("Time of Birth (HH:MM - 24hr)", fontSize = 13.sp) },
                        placeholder = { Text("e.g. 14:30", color = TextMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        trailingIcon = {
                            IconButton(onClick = {
                                showTimePicker(context, time) { viewModel.updateTime(it) }
                            }) {
                                Icon(
                                    imageVector = Icons.Default.Schedule,
                                    contentDescription = "Select Time",
                                    tint = LiquidGold
                                )
                            }
                        },
                        colors = glassTextFieldColors
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3. PLACE OF BIRTH (CITY GEOLOCATION AUTOCONTACT)
                    Box(modifier = Modifier.fillMaxWidth()) {
                        Column {
                            OutlinedTextField(
                                value = cityQuery,
                                onValueChange = { viewModel.updateCityQuery(it) },
                                label = { Text("Place of Birth (City / Village)", fontSize = 13.sp) },
                                placeholder = { Text("e.g. Mumbai, New York, London", color = TextMuted) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                trailingIcon = {
                                    if (isSearchingCity) {
                                        CircularProgressIndicator(
                                            color = LiquidGold,
                                            strokeWidth = 2.dp,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    } else if (cityQuery.isNotEmpty()) {
                                        IconButton(onClick = { viewModel.updateCityQuery("") }) {
                                            Icon(
                                                Icons.Default.Close,
                                                contentDescription = "Clear city",
                                                tint = TextSecondary,
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                    }
                                },
                                colors = glassTextFieldColors
                            )

                            // Dropdown Results Popup
                            if (searchResults.isNotEmpty()) {
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 4.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    color = CosmicCard,
                                    border = BorderStroke(1.dp, GlassBorder),
                                    shadowElevation = 8.dp
                                ) {
                                    Column {
                                        searchResults.forEach { result ->
                                            Row(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clickable {
                                                        viewModel.selectCity(result)
                                                    }
                                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Icon(
                                                    imageVector = Icons.Default.LocationOn,
                                                    contentDescription = null,
                                                    tint = LiquidGold,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = result.name,
                                                    color = TextPrimary,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Medium
                                                )
                                            }
                                            HorizontalDivider(color = GlassBorderSubtle)
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Display coordinates if city is selected
                    if (selectedCity.isNotEmpty()) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp, start = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = VedicGold,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            val tzSign = if (timezone >= 0) "+" else ""
                            Text(
                                text = "Selected: ${latitude}°N, ${longitude}°E • GMT$tzSign$timezone",
                                color = VedicMutedCharcoal,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    // 3b. CONSULTATION LANGUAGE SELECTOR
                    var langExpanded by remember { mutableStateOf(false) }
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

                    Spacer(modifier = Modifier.height(14.dp))

                    Box(modifier = Modifier.fillMaxWidth()) {
                        ExposedDropdownMenuBox(
                            expanded = langExpanded,
                            onExpandedChange = { langExpanded = !langExpanded }
                        ) {
                            OutlinedTextField(
                                value = languages.firstOrNull { it.first == selectedLanguage }?.second ?: selectedLanguage,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Consultation Language", fontSize = 13.sp) },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = langExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth(),
                                colors = glassTextFieldColors
                            )
                            ExposedDropdownMenu(
                                expanded = langExpanded,
                                onDismissRequest = { langExpanded = false },
                                modifier = Modifier.background(CosmicCard)
                            ) {
                                languages.forEach { lang ->
                                    DropdownMenuItem(
                                        text = { Text(lang.second, color = TextPrimary) },
                                        onClick = {
                                            viewModel.updateSelectedLanguage(lang.first, context)
                                            langExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Error Message
                    if (errorMsg != null) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = errorMsg!!,
                            color = LiquidRose,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // 4. SUBMIT BUTTON
                    Button(
                        onClick = { viewModel.calculateChart(context) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = LiquidGold),
                        shape = RoundedCornerShape(25.dp),
                        enabled = !isCalculating
                    ) {
                        if (isCalculating) {
                            CircularProgressIndicator(
                                color = CosmicVoid,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("CALCULATING...", color = CosmicVoid, fontWeight = FontWeight.Bold)
                        } else {
                            Text(
                                text = "CALCULATE COSMIC CHART",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = CosmicVoid,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun showDatePicker(context: Context, currentDate: String, onDateSelected: (String) -> Unit) {
    val cal = Calendar.getInstance()
    if (currentDate.isNotEmpty()) {
        try {
            val parts = currentDate.split("/")
            if (parts.size == 3) {
                cal.set(Calendar.DAY_OF_MONTH, parts[0].toInt())
                cal.set(Calendar.MONTH, parts[1].toInt() - 1)
                cal.set(Calendar.YEAR, parts[2].toInt())
            }
        } catch (_: Exception) {}
    }

    android.app.DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val formatted = String.format("%02d/%02d/%04d", dayOfMonth, month + 1, year)
            onDateSelected(formatted)
        },
        cal.get(Calendar.YEAR),
        cal.get(Calendar.MONTH),
        cal.get(Calendar.DAY_OF_MONTH)
    ).show()
}

private fun showTimePicker(context: Context, currentTime: String, onTimeSelected: (String) -> Unit) {
    val cal = Calendar.getInstance()
    if (currentTime.isNotEmpty()) {
        try {
            val parts = currentTime.split(":")
            if (parts.size >= 2) {
                cal.set(Calendar.HOUR_OF_DAY, parts[0].toInt())
                cal.set(Calendar.MINUTE, parts[1].toInt())
            }
        } catch (_: Exception) {}
    }

    android.app.TimePickerDialog(
        context,
        { _, hourOfDay, minute ->
            val formatted = String.format("%02d:%02d", hourOfDay, minute)
            onTimeSelected(formatted)
        },
        cal.get(Calendar.HOUR_OF_DAY),
        cal.get(Calendar.MINUTE),
        true
    ).show()
}
