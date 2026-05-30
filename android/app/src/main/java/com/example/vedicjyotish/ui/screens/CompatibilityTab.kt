package com.example.vedicjyotish.ui.screens

import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.Canvas
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.vedicjyotish.theme.*
import com.example.vedicjyotish.ui.viewmodels.DashboardViewModel
import com.example.vedicjyotish.data.models.CompatibilityResponse

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompatibilityTab(
    viewModel: DashboardViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    // Form inputs state
    val matchingDate by viewModel.matchingDate.collectAsStateWithLifecycle()
    val matchingTime by viewModel.matchingTime.collectAsStateWithLifecycle()
    val matchingCityQuery by viewModel.matchingCityQuery.collectAsStateWithLifecycle()
    val matchingCity by viewModel.matchingCity.collectAsStateWithLifecycle()
    val matchingLatitude by viewModel.matchingLatitude.collectAsStateWithLifecycle()
    val matchingLongitude by viewModel.matchingLongitude.collectAsStateWithLifecycle()
    val matchingSearchResults by viewModel.matchingSearchResults.collectAsStateWithLifecycle()
    val isSearchingCity by viewModel.isMatchingSearchingCity.collectAsStateWithLifecycle()
    val matchingMethod by viewModel.matchingMethod.collectAsStateWithLifecycle()
    val isCalculating by viewModel.isCalculatingMatching.collectAsStateWithLifecycle()
    val matchingError by viewModel.matchingError.collectAsStateWithLifecycle()
    val compatibilityResult by viewModel.compatibilityResult.collectAsStateWithLifecycle()

    // Trigger debounced city search setup when opening the tab
    LaunchedEffect(Unit) {
        viewModel.initDebouncedIfNeeded()
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 24.dp)
    ) {
        // --- TITLE HEADER ---
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = ParchmentCardBg),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "✦ ASHTAKOOTA MILAN ✦",
                    color = VedicTerracotta,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
                Text(
                    text = "Double-Profile Cosmic Compatibility Compatibility Engine",
                    color = Color.Gray,
                    fontSize = 10.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // --- PARTNER INFO FORM CARD ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = ParchmentCardBg),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Partner Birth Information",
                        color = VedicTerracotta,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    // Load My Details Button (Quick shortcut)
                    TextButton(
                        onClick = { viewModel.loadActiveProfile(context) },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(14.dp), tint = VedicGold)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("LOAD MY DETAILS", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = VedicGold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 1. DATE FIELD
                OutlinedTextField(
                    value = matchingDate,
                    onValueChange = { viewModel.updateMatchingDate(it) },
                    label = { Text("Birth Date (DD/MM/YYYY)", fontSize = 12.sp) },
                    placeholder = { Text("e.g. 26/01/1950", color = Color.LightGray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    trailingIcon = {
                        IconButton(onClick = {
                            showDatePicker(context, matchingDate) { viewModel.updateMatchingDate(it) }
                        }) {
                            Icon(
                                imageVector = Icons.Default.DateRange,
                                contentDescription = "Select Date",
                                tint = VedicGold
                            )
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VedicTerracotta,
                        unfocusedBorderColor = VedicGold,
                        cursorColor = VedicTerracotta
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // 2. TIME FIELD
                OutlinedTextField(
                    value = matchingTime,
                    onValueChange = { viewModel.updateMatchingTime(it) },
                    label = { Text("Birth Time (HH:MM - 24hr)", fontSize = 12.sp) },
                    placeholder = { Text("e.g. 09:15", color = Color.LightGray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    trailingIcon = {
                        IconButton(onClick = {
                            showTimePicker(context, matchingTime) { viewModel.updateMatchingTime(it) }
                        }) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = "Select Time",
                                tint = VedicGold
                            )
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VedicTerracotta,
                        unfocusedBorderColor = VedicGold,
                        cursorColor = VedicTerracotta
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // 3. CITY FIELD WITH AUTOCOMPLETE
                Box(modifier = Modifier.fillMaxWidth()) {
                    Column {
                        OutlinedTextField(
                            value = matchingCityQuery,
                            onValueChange = { viewModel.updateMatchingCityQuery(it) },
                            label = { Text("Birth Place (City)", fontSize = 12.sp) },
                            placeholder = { Text("e.g. Delhi, New York", color = Color.LightGray) },
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
                                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = VedicGold)
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = VedicTerracotta,
                                unfocusedBorderColor = VedicGold,
                                cursorColor = VedicTerracotta
                            )
                        )

                        // Autocomplete Popover
                        if (matchingSearchResults.isNotEmpty()) {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 4.dp),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                            ) {
                                Column {
                                    matchingSearchResults.forEach { result ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable {
                                                    viewModel.selectMatchingCity(result)
                                                }
                                                .padding(horizontal = 16.dp, vertical = 10.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.LocationOn,
                                                contentDescription = null,
                                                tint = VedicGold,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(
                                                text = result.name,
                                                color = VedicCharcoal,
                                                fontSize = 12.sp,
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

                // Coordinates info
                if (matchingCity.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp, start = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = VedicGold, modifier = Modifier.size(12.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Selected: ${matchingLatitude ?: 0.0}°N, ${matchingLongitude ?: 0.0}°E",
                            color = Color.Gray,
                            fontSize = 10.sp,
                            fontStyle = FontStyle.Italic
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // 4. CALCULATION METHOD
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.Start
                ) {
                    Text("Matching System:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = VedicCharcoal)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        FilterChip(
                            selected = matchingMethod == "North",
                            onClick = { viewModel.setMatchingMethod("North") },
                            label = { Text("North Indian (Ashtakoota)", fontSize = 10.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = VedicTerracotta,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                        FilterChip(
                            selected = matchingMethod == "South",
                            onClick = { viewModel.setMatchingMethod("South") },
                            label = { Text("South Indian (Poruthams)", fontSize = 10.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = VedicTerracotta,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                if (matchingError != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = matchingError!!,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // 5. CALCULATE BUTTON
                Button(
                    onClick = { viewModel.calculateCompatibility(context) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = VedicTerracotta),
                    shape = RoundedCornerShape(22.dp),
                    enabled = !isCalculating
                ) {
                    if (isCalculating) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("HARMONIZING ORBITS...", fontSize = 12.sp, letterSpacing = 0.5.sp)
                    } else {
                        Icon(Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CALCULATE COMPATIBILITY", fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp)
                    }
                }
            }
        }

        // --- COMPATIBILITY RESULTS VIEW ---
        AnimatedVisibility(
            visible = compatibilityResult != null,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            compatibilityResult?.let { res ->
                Column(modifier = Modifier.padding(top = 20.dp)) {
                    ScorecardSection(res)
                    Spacer(modifier = Modifier.height(16.dp))
                    PartnerProfilesSection(res)
                    Spacer(modifier = Modifier.height(16.dp))
                    KootasBreakdownSection(res)
                    Spacer(modifier = Modifier.height(16.dp))
                    SouthernPoruthamsSection(res)
                }
            }
        }
    }
}

// ──────────────────────────────────────────────────────
//  Result Subsections
// ──────────────────────────────────────────────────────

@Composable
fun ScorecardSection(res: CompatibilityResponse) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = ParchmentCardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "✦ HARMONY SCORE ✦",
                color = VedicTerracotta,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.5.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Premium circular scorecard using canvas
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(120.dp)
            ) {
                val scorePercent = (res.totalScore / res.maxScore).toFloat()
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokeWidth = 12.dp.toPx()
                    val diameter = size.minDimension - strokeWidth - 16.dp.toPx()
                    val arcSize = androidx.compose.ui.geometry.Size(diameter, diameter)
                    val topLeftOffset = androidx.compose.ui.geometry.Offset(
                        (size.width - diameter) / 2,
                        (size.height - diameter) / 2
                    )

                    // Track circle
                    drawCircle(
                        color = VedicBorder,
                        radius = diameter / 2,
                        center = center,
                        style = Stroke(width = strokeWidth)
                    )
                    // Score arc
                    drawArc(
                        color = VedicTerracotta,
                        startAngle = -90f,
                        sweepAngle = 360f * scorePercent,
                        useCenter = false,
                        topLeft = topLeftOffset,
                        size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "%.1f".format(res.totalScore),
                        color = VedicTerracotta,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black
                    )
                    Divider(color = VedicGold, modifier = Modifier.width(40.dp).padding(vertical = 2.dp), thickness = 1.5.dp)
                    Text(
                        text = "${res.maxScore.toInt()} GUNAS",
                        color = VedicCharcoal,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Suitability title
            val scoreText = when {
                res.totalScore >= 28.0 -> "Auspicious & Harmonious Union"
                res.totalScore >= 18.0 -> "Suitable & Balanced Union"
                else -> "Challenging Planetary Alignments"
            }
            val scoreColor = when {
                res.totalScore >= 28.0 -> Color(0xFF2E7D32) // Auspicious Green
                res.totalScore >= 18.0 -> VedicGold
                else -> Color(0xFFC62828) // Challenging Red
            }

            Text(
                text = scoreText,
                color = scoreColor,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Suitability Description
            val scoreDesc = when {
                res.totalScore >= 28.0 -> "Planetary and nakshatra configurations are highly compatible. This union promises deep intellectual, emotional, and physical harmony, fostering prosperity, long life, and shared spiritual growth."
                res.totalScore >= 18.0 -> "A suitable match. The score indicates stable compatibility, though minor adjustments or spiritual remediation (like mantras or charity) might be needed to harmonize areas with planetary conflicts."
                else -> "Planetary alignments indicate potential friction in critical areas such as communication, temperament, or physiological chemistry. Mutual understanding, patience, and professional remedial advice are strongly recommended."
            }

            Text(
                text = scoreDesc,
                color = VedicCharcoal,
                fontSize = 11.sp,
                textAlign = TextAlign.Center,
                lineHeight = 16.sp,
                modifier = Modifier.padding(horizontal = 8.dp)
            )
        }
    }
}

@Composable
fun PartnerProfilesSection(res: CompatibilityResponse) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = ParchmentCardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "ASTROLOGICAL PROFILES",
                color = VedicTerracotta,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Partner 1 Card
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color(0x0A8B4513)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("PARTNER 1", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = VedicGold)
                        Spacer(modifier = Modifier.height(6.dp))
                        ProfileDetailItem("Nakshatra", res.boyDetails.nakshatra)
                        ProfileDetailItem("Pada", res.boyDetails.pada.toString())
                        ProfileDetailItem("Rashi", res.boyDetails.sign)
                    }
                }

                // Partner 2 Card
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = Color(0x0A8B4513)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("PARTNER 2", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = VedicGold)
                        Spacer(modifier = Modifier.height(6.dp))
                        ProfileDetailItem("Nakshatra", res.girlDetails.nakshatra)
                        ProfileDetailItem("Pada", res.girlDetails.pada.toString())
                        ProfileDetailItem("Rashi", res.girlDetails.sign)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileDetailItem(label: String, value: String) {
    Column(
        modifier = Modifier.padding(vertical = 3.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(label, fontSize = 8.sp, color = Color.Gray)
        Text(value, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = VedicCharcoal)
    }
}

@Composable
fun KootasBreakdownSection(res: CompatibilityResponse) {
    val kootas = listOf(
        KootaRowData("Varna", "Mental compatibility & work capacity", res.varna),
        KootaRowData("Vashya", "Mutual attraction & influence", res.vashya),
        KootaRowData("Tara", "Destiny, longevity & compatibility", res.tara),
        KootaRowData("Yoni", "Physical compatibility & intimacy", res.yoni),
        KootaRowData("Graha Maitri", "Intellectual harmony & friendship", res.grahaMaitri),
        KootaRowData("Gana", "Temperament & nature compatibility", res.gana),
        KootaRowData("Bhakoot", "Emotional harmony & children success", res.bhakoot),
        KootaRowData("Naadi", "Genetic compatibility & life force", res.naadi)
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = ParchmentCardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "ASHTAKOOTA GUNA MILAN BREAKDOWN",
                color = VedicTerracotta,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            // Table headers
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(VedicBorder)
                    .padding(vertical = 8.dp, horizontal = 6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Koota Details", modifier = Modifier.weight(2.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = VedicCharcoal)
                Text("Match", modifier = Modifier.weight(1f), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = VedicCharcoal, textAlign = TextAlign.Center)
                Text("Points", modifier = Modifier.weight(1f), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = VedicCharcoal, textAlign = TextAlign.End)
            }

            kootas.forEach { item ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(width = 0.5.dp, color = VedicBorder)
                        .padding(vertical = 8.dp, horizontal = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(2.5f)) {
                        Text(item.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = VedicTerracotta)
                        Text(item.description, fontSize = 8.sp, color = Color.Gray)
                    }

                    // Checkmark or Cross for Matched
                    Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        if (item.koota.matched) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Matched",
                                tint = Color(0xFF2E7D32),
                                modifier = Modifier.size(16.dp)
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Cancel,
                                contentDescription = "Not Matched",
                                tint = Color(0xFFC62828),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    // Points Score / Max
                    Text(
                        text = "%.1f / %.0f".format(item.koota.score, item.koota.maxScore),
                        modifier = Modifier.weight(1f),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = VedicCharcoal,
                        textAlign = TextAlign.End
                    )
                }
            }
        }
    }
}

data class KootaRowData(
    val name: String,
    val description: String,
    val koota: com.example.vedicjyotish.data.models.KootaResult
)

@Composable
fun SouthernPoruthamsSection(res: CompatibilityResponse) {
    val checks = listOf(
        PoruthamCheck("Mahendra Porutham", "Indicates lineage progress and children wealth", res.mahendra),
        PoruthamCheck("Rajju Porutham", "Vital check. Represents husband longevity & health", res.rajju),
        PoruthamCheck("Vedha Porutham", "Ensures absence of external obstacles & arguments", res.vedha),
        PoruthamCheck("Sthree Dheerga Porutham", "Promotes health, prosperity, and wealth safety", res.sthreeDheerga)
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = ParchmentCardBg),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SECONDARY SOUTHERN PORUTHAMS",
                    color = VedicTerracotta,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )

                // Suitability status indicator badge
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (res.minimumPoruthamMatched) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                    ),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = if (res.minimumPoruthamMatched) "MINIMUM MATCHED" else "CONFLICTS FOUND",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (res.minimumPoruthamMatched) Color(0xFF2E7D32) else Color(0xFFC62828),
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            checks.forEach { check ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (check.matched) Icons.Default.Done else Icons.Default.Close,
                        contentDescription = null,
                        tint = if (check.matched) Color(0xFF2E7D32) else Color(0xFFC62828),
                        modifier = Modifier
                            .size(18.dp)
                            .background(
                                color = if (check.matched) Color(0xFFE8F5E9) else Color(0xFFFFEBEE),
                                shape = RoundedCornerShape(9.dp)
                            )
                            .padding(2.dp)
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    Column {
                        Text(
                            text = check.name,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = VedicCharcoal
                        )
                        Text(
                            text = check.description,
                            fontSize = 9.sp,
                            color = Color.Gray
                        )
                    }
                }
            }
        }
    }
}

data class PoruthamCheck(
    val name: String,
    val description: String,
    val matched: Boolean
)

private fun showDatePicker(
    context: android.content.Context,
    currentDate: String,
    onDateSelected: (String) -> Unit
) {
    val calendar = java.util.Calendar.getInstance()
    val parts = currentDate.split("/")
    if (parts.size == 3) {
        val d = parts[0].toIntOrNull()
        val m = parts[1].toIntOrNull()
        val y = parts[2].toIntOrNull()
        if (d != null && m != null && y != null) {
            calendar.set(java.util.Calendar.YEAR, y)
            calendar.set(java.util.Calendar.MONTH, m - 1)
            calendar.set(java.util.Calendar.DAY_OF_MONTH, d)
        }
    }
    android.app.DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val formatted = String.format("%02d/%02d/%04d", dayOfMonth, month + 1, year)
            onDateSelected(formatted)
        },
        calendar.get(java.util.Calendar.YEAR),
        calendar.get(java.util.Calendar.MONTH),
        calendar.get(java.util.Calendar.DAY_OF_MONTH)
    ).show()
}

private fun showTimePicker(
    context: android.content.Context,
    currentTime: String,
    onTimeSelected: (String) -> Unit
) {
    val calendar = java.util.Calendar.getInstance()
    val parts = currentTime.split(":")
    if (parts.size == 2) {
        val h = parts[0].toIntOrNull()
        val m = parts[1].toIntOrNull()
        if (h != null && m != null) {
            calendar.set(java.util.Calendar.HOUR_OF_DAY, h)
            calendar.set(java.util.Calendar.MINUTE, m)
        }
    }
    android.app.TimePickerDialog(
        context,
        { _, hourOfDay, minute ->
            val formatted = String.format("%02d:%02d", hourOfDay, minute)
            onTimeSelected(formatted)
        },
        calendar.get(java.util.Calendar.HOUR_OF_DAY),
        calendar.get(java.util.Calendar.MINUTE),
        true
    ).show()
}
