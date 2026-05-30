package com.example.vedicjyotish.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Settings
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
import com.example.vedicjyotish.theme.ParchmentBg
import com.example.vedicjyotish.theme.VedicCharcoal
import com.example.vedicjyotish.theme.VedicGold
import com.example.vedicjyotish.theme.VedicTerracotta

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BirthDetailsScreen(
    onChartCalculated: (com.example.vedicjyotish.data.models.ChartResponse) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: BirthDetailsViewModel = viewModel()
) {
    val date by viewModel.date.collectAsStateWithLifecycle()
    val time by viewModel.time.collectAsStateWithLifecycle()
    val cityQuery by viewModel.cityQuery.collectAsStateWithLifecycle()
    val selectedCity by viewModel.city.collectAsStateWithLifecycle()
    val searchResults by viewModel.searchResults.collectAsStateWithLifecycle()
    val isSearchingCity by viewModel.isSearchingCity.collectAsStateWithLifecycle()
    val isCalculating by viewModel.isCalculating.collectAsStateWithLifecycle()
    val errorMsg by viewModel.error.collectAsStateWithLifecycle()
    val latitude by viewModel.latitude.collectAsStateWithLifecycle()
    val longitude by viewModel.longitude.collectAsStateWithLifecycle()

    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("vedic_prefs", android.content.Context.MODE_PRIVATE) }

    // Listen for successful calculation events
    LaunchedEffect(Unit) {
        viewModel.chartResult.collect { chart ->
            prefs.edit()
                .putString("birth_date", date)
                .putString("birth_time", time)
                .putString("birth_city", selectedCity)
                .putFloat("birth_lat", viewModel.latitude.value?.toFloat() ?: 0.0f)
                .putFloat("birth_lon", viewModel.longitude.value?.toFloat() ?: 0.0f)
                .apply()
            onChartCalculated(chart)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "VEDIC JYOTISH",
                            color = VedicTerracotta,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 4.sp
                        )
                        Text(
                            text = "ENTER BIRTH INFORMATION",
                            color = VedicGold,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 2.sp
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
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(ParchmentBg)
                .padding(20.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(scrollState),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "✦ COSMIC INITIATION ✦",
                        color = VedicTerracotta,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                    )

                    Text(
                        text = "Map the exact alignment of planets at your time of birth",
                        color = Color.Gray,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
                    )

                    // 1. DATE OF BIRTH
                    OutlinedTextField(
                        value = date,
                        onValueChange = { viewModel.updateDate(it) },
                        label = { Text("Date of Birth (DD/MM/YYYY)", fontSize = 13.sp) },
                        placeholder = { Text("e.g. 15/08/1947", color = Color.LightGray) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VedicTerracotta,
                            unfocusedBorderColor = VedicGold,
                            cursorColor = VedicTerracotta
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // 2. TIME OF BIRTH
                    OutlinedTextField(
                        value = time,
                        onValueChange = { viewModel.updateTime(it) },
                        label = { Text("Time of Birth (HH:MM - 24hr)", fontSize = 13.sp) },
                        placeholder = { Text("e.g. 14:30", color = Color.LightGray) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VedicTerracotta,
                            unfocusedBorderColor = VedicGold,
                            cursorColor = VedicTerracotta
                        )
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // 3. PLACE OF BIRTH (CITY GEOLOCATION AUTOCONTACT)
                    Box(modifier = Modifier.fillMaxWidth()) {
                        Column {
                            OutlinedTextField(
                                value = cityQuery,
                                onValueChange = { viewModel.updateCityQuery(it) },
                                label = { Text("Place of Birth (City)", fontSize = 13.sp) },
                                placeholder = { Text("e.g. Mumbai, London", color = Color.LightGray) },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                trailingIcon = {
                                    if (isSearchingCity) {
                                        CircularProgressIndicator(
                                            color = VedicTerracotta,
                                            strokeWidth = 2.dp,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    } else {
                                        Icon(Icons.Default.LocationOn, contentDescription = "Location", tint = VedicGold)
                                    }
                                },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = VedicTerracotta,
                                    unfocusedBorderColor = VedicGold,
                                    cursorColor = VedicTerracotta
                                )
                            )

                            // Dropdown Results Popup
                            if (searchResults.isNotEmpty()) {
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(top = 4.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
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
                                                    tint = VedicGold,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Text(
                                                    text = result.name,
                                                    color = VedicCharcoal,
                                                    fontSize = 13.sp,
                                                    fontWeight = FontWeight.Medium
                                                )
                                            }
                                            Divider(color = Color(0xFFF4F3EF), thickness = 1.dp)
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
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = VedicGold,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                             Text(
                                text = "Selected: ${latitude}°N, ${longitude}°E",
                                color = Color.Gray,
                                fontSize = 11.sp,
                                fontStyle = FontStyle.Italic
                            )
                        }
                    }

                    // Error Message
                    if (errorMsg != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = errorMsg!!,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                    }

                    Spacer(modifier = Modifier.height(28.dp))

                    // 4. SUBMIT BUTTON
                    Button(
                        onClick = { viewModel.calculateChart() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = VedicTerracotta),
                        shape = RoundedCornerShape(24.dp),
                        enabled = !isCalculating
                    ) {
                        if (isCalculating) {
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("CALCULATING...")
                        } else {
                            Text(
                                text = "CALCULATE COSMIC CHART",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
