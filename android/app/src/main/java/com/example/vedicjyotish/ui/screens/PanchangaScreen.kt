package com.example.vedicjyotish.ui.screens

import android.app.DatePickerDialog
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import android.widget.Toast
import com.example.vedicjyotish.widget.VedicClockWidgetProvider
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.astrology.PanchangaEngine
import com.example.vedicjyotish.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun PanchangaScreen(
    lat: Double = 28.6139,
    lon: Double = 77.2090,
    city: String = "New Delhi",
    tzOffsetHours: Double = 5.5
) {
    val context = LocalContext.current
    var selectedCalendar by remember { mutableStateOf(Calendar.getInstance()) }
    var viewModeIndex by remember { mutableStateOf(0) } // 0: Dainika, 1: Masika
    var choghadiyaTab by remember { mutableStateOf("DAY") } // "DAY" or "NIGHT"
    var horaTab by remember { mutableStateOf("DAY") }       // "DAY" or "NIGHT"

    val panchangData = remember(selectedCalendar, lat, lon) {
        PanchangaEngine.calculateDailyPanchanga(selectedCalendar, lat, lon, city, tzOffsetHours)
    }

    // Vedic Time calculation (Ishta Kala, Dinamana, Ratrimana)
    val vedicTime = remember(selectedCalendar, lat, lon) {
        val nowCal = Calendar.getInstance()
        val curMins = nowCal.get(Calendar.HOUR_OF_DAY) * 60.0 + nowCal.get(Calendar.MINUTE)
        val sRiseParts = panchangData.sunrise.split(":", " ")
        val sSetParts = panchangData.sunset.split(":", " ")

        val riseH = sRiseParts.getOrNull(0)?.toIntOrNull() ?: 6
        val riseM = sRiseParts.getOrNull(1)?.toIntOrNull() ?: 0
        val riseAmPm = sRiseParts.getOrNull(2) ?: "AM"
        val rise24 = if (riseAmPm.equals("PM", ignoreCase = true) && riseH < 12) riseH + 12 else riseH
        val riseMins = rise24 * 60.0 + riseM

        val setH = sSetParts.getOrNull(0)?.toIntOrNull() ?: 6
        val setM = sSetParts.getOrNull(1)?.toIntOrNull() ?: 0
        val setAmPm = sSetParts.getOrNull(2) ?: "PM"
        val set24 = if (setAmPm.equals("PM", ignoreCase = true) && setH < 12) setH + 12 else setH
        val setMins = set24 * 60.0 + setM

        PanchangaEngine.calculateVedicTime(curMins, riseMins, setMins)
    }

    val isViewingToday = remember(selectedCalendar) {
        val today = Calendar.getInstance()
        today.get(Calendar.YEAR) == selectedCalendar.get(Calendar.YEAR) &&
                today.get(Calendar.DAY_OF_YEAR) == selectedCalendar.get(Calendar.DAY_OF_YEAR)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ParchmentBg)
            .padding(horizontal = 14.dp, vertical = 8.dp)
    ) {
        // Mode Switcher: Authentic Vedic Terminology
        VedicSegmentedControl(
            options = listOf("दैनिक पञ्चाङ्ग (Dainika)", "मासिक पञ्चाङ्ग (Masika)"),
            selectedIndex = viewModeIndex,
            onOptionSelected = { viewModeIndex = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
        )

        if (viewModeIndex == 0) {
            // ==========================================
            // MODE 0: DAINIKA PANCHANGA (दैनिक पञ्चाङ्ग)
            // ==========================================
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // 1. Date Navigation Bar
                item {
                    VedicCard(contentPadding = 12.dp) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = {
                                    val newCal = selectedCalendar.clone() as Calendar
                                    newCal.add(Calendar.DAY_OF_YEAR, -1)
                                    selectedCalendar = newCal
                                },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(ParchmentBg)
                                    .border(BorderStroke(1.dp, VedicBorder), CircleShape)
                            ) {
                                Icon(
                                    Icons.Default.ChevronLeft,
                                    contentDescription = "Previous Day",
                                    tint = VedicTerracotta,
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable {
                                        val c = selectedCalendar
                                        DatePickerDialog(
                                            context,
                                            { _, y, m, d ->
                                                val newCal = Calendar.getInstance()
                                                newCal.set(y, m, d)
                                                selectedCalendar = newCal
                                            },
                                            c.get(Calendar.YEAR),
                                            c.get(Calendar.MONTH),
                                            c.get(Calendar.DAY_OF_MONTH)
                                        ).show()
                                    }
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = panchangData.date,
                                        fontSize = 15.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = VedicCharcoal
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Icon(
                                        Icons.Default.CalendarToday,
                                        contentDescription = "Pick Date",
                                        tint = VedicTerracotta,
                                        modifier = Modifier.size(14.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "${panchangData.vara} (वासराधिपति: ${panchangData.varaLord}) • $city",
                                    fontSize = 11.sp,
                                    color = VedicMutedCharcoal,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }

                            IconButton(
                                onClick = {
                                    val newCal = selectedCalendar.clone() as Calendar
                                    newCal.add(Calendar.DAY_OF_YEAR, 1)
                                    selectedCalendar = newCal
                                },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(ParchmentBg)
                                    .border(BorderStroke(1.dp, VedicBorder), CircleShape)
                            ) {
                                Icon(
                                    Icons.Default.ChevronRight,
                                    contentDescription = "Next Day",
                                    tint = VedicTerracotta,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        if (!isViewingToday) {
                            Spacer(modifier = Modifier.height(6.dp))
                            TextButton(
                                onClick = { selectedCalendar = Calendar.getInstance() },
                                modifier = Modifier.align(Alignment.CenterHorizontally),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 2.dp)
                            ) {
                                Icon(Icons.Default.Restore, contentDescription = null, tint = VedicTerracotta, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("आज का पञ्चाङ्ग (Today)", fontSize = 11.5.sp, color = VedicTerracotta, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // 2. Vedic Horology Hero Card (वैदिक काल गणना)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Text(
                            text = "वैदिक काल गणना • VEDIC HOROLOGY",
                            color = VedicTerracotta,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(bottom = 10.dp)
                        )

                        // Ishta Kala & Dinamana Cards (Equal Sizing & Clean Alignment)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Ishta Kala
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = ParchmentBg,
                                border = BorderStroke(1.dp, VedicBorder),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(10.dp),
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = "इष्ट काल (ISHTA KALA)",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = VedicGold,
                                        letterSpacing = 0.5.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "${vedicTime.ishtaKalaGhati} घटी ${vedicTime.ishtaKalaVighati} विघटी",
                                        fontSize = 13.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = VedicCharcoal
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "सूर्योदयात् गत काल",
                                        fontSize = 9.5.sp,
                                        color = VedicMutedCharcoal
                                    )
                                }
                            }

                            // Dinamana & Ratrimana
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = ParchmentBg,
                                border = BorderStroke(1.dp, VedicBorder),
                                modifier = Modifier.weight(1f)
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(10.dp),
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        text = "दिनमान / रात्रिमान",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = VedicGold,
                                        letterSpacing = 0.5.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "दिन: ${vedicTime.dinamanaHoursMins}",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = VedicCharcoal
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "रात्रि: ${vedicTime.ratrimanaHoursMins}",
                                        fontSize = 10.sp,
                                        color = VedicMutedCharcoal
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Active Muhurta Banner
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (vedicTime.isAuspiciousMuhurta) AuspiciousGreen.copy(alpha = 0.08f) else VedicTerracotta.copy(alpha = 0.08f),
                            border = BorderStroke(1.dp, if (vedicTime.isAuspiciousMuhurta) AuspiciousGreen.copy(alpha = 0.35f) else VedicTerracotta.copy(alpha = 0.35f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .clip(CircleShape)
                                                .background(if (vedicTime.isAuspiciousMuhurta) AuspiciousGreen else VedicTerracotta)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "वर्तमान: ${vedicTime.currentMuhurtaName} (क्र. ${vedicTime.currentMuhurtaNumber}/30)",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = VedicCharcoal,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                    Text(
                                        text = if (vedicTime.isAuspiciousMuhurta) "शुभ (Auspicious)" else "सामान्य (Neutral)",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (vedicTime.isAuspiciousMuhurta) AuspiciousGreen else VedicTerracotta,
                                        modifier = Modifier.padding(start = 6.dp)
                                    )
                                }
                                if (vedicTime.currentMuhurtaStart.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(3.dp))
                                    Text(
                                        text = "समय: ${vedicTime.currentMuhurtaStart} - ${vedicTime.currentMuhurtaEnd}",
                                        fontSize = 10.sp,
                                        color = VedicMutedCharcoal,
                                        modifier = Modifier.padding(start = 16.dp)
                                    )
                                }
                            }
                        }

                        // Upcoming Muhurta Banner
                        Spacer(modifier = Modifier.height(6.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = ParchmentBg,
                            border = BorderStroke(1.dp, VedicBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Schedule,
                                        contentDescription = null,
                                        tint = VedicGold,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "आगामी: ${vedicTime.nextMuhurtaName} (${vedicTime.nextMuhurtaStart} - ${vedicTime.nextMuhurtaEnd})",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = VedicCharcoal,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                                Text(
                                    text = if (vedicTime.isNextAuspicious) "शुभ" else "सामान्य",
                                    fontSize = 9.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (vedicTime.isNextAuspicious) AuspiciousGreen else VedicMutedCharcoal,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Astronomical Timings Grid (4 Equal Columns with Zero Drift)
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = ParchmentBg,
                            border = BorderStroke(1.dp, VedicBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AstroTimeCol(Icons.Default.WbSunny, "सूर्योदय", panchangData.sunrise, Modifier.weight(1f))
                                VerticalDivider(color = VedicLightBorder, modifier = Modifier.height(28.dp))
                                AstroTimeCol(Icons.Default.WbTwilight, "सूर्यास्त", panchangData.sunset, Modifier.weight(1f))
                                VerticalDivider(color = VedicLightBorder, modifier = Modifier.height(28.dp))
                                AstroTimeCol(Icons.Default.Nightlight, "चन्द्रोदय", panchangData.moonrise, Modifier.weight(1f))
                                VerticalDivider(color = VedicLightBorder, modifier = Modifier.height(28.dp))
                                AstroTimeCol(Icons.Default.Bedtime, "चन्द्रास्त", panchangData.moonset, Modifier.weight(1f))
                            }
                        }

                        // 1-Tap Home Screen Widget Button
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedButton(
                            onClick = {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                    val appWidgetManager = context.getSystemService(AppWidgetManager::class.java)
                                    val myProvider = ComponentName(context, VedicClockWidgetProvider::class.java)
                                    if (appWidgetManager != null && appWidgetManager.isRequestPinAppWidgetSupported) {
                                        appWidgetManager.requestPinAppWidget(myProvider, null, null)
                                    } else {
                                        Toast.makeText(context, "होम स्क्रीन पर लॉन्ग-प्रेस करें -> Widgets -> Vedic Jyotish", Toast.LENGTH_LONG).show()
                                    }
                                } else {
                                    Toast.makeText(context, "होम स्क्रीन पर लॉन्ग-प्रेस करें -> Widgets -> Vedic Jyotish", Toast.LENGTH_LONG).show()
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, VedicGold.copy(alpha = 0.6f)),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = ParchmentBg,
                                contentColor = VedicTerracotta
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Widgets,
                                contentDescription = null,
                                tint = VedicTerracotta,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Add Live Vedic Clock & Muhurta to Home Screen",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = VedicCharcoal
                            )
                        }
                    }
                }

                // 3. Five Essential Angas (पञ्चाङ्ग पञ्च-तत्व)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Text(
                            text = "पञ्चाङ्ग पञ्च-तत्व • FIVE ESSENTIAL ANGAS",
                            color = VedicTerracotta,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        val angas = listOf(
                            Triple("तिथि (Tithi)", panchangData.tithi, Icons.Default.Brightness2),
                            Triple("नक्षत्र (Nakshatra)", panchangData.nakshatra, Icons.Default.Stars),
                            Triple("योग (Yoga)", panchangData.yoga, Icons.Default.Balance),
                            Triple("करण (Karana)", panchangData.karana, Icons.Default.HourglassTop),
                            Triple("वासर (Vara)", PanchangaEngine.PanchangaAnga(panchangData.vara, "वासराधिपति: ${panchangData.varaLord}", 1.0), Icons.Default.Today)
                        )

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            angas.forEach { (title, anga, icon) ->
                                AngaCard(title, anga, icon)
                            }
                        }
                    }
                }

                // 4. Samvat & Solar Attributes (संवत्सर व सौर चक्र)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Text(
                            text = "संवत्सर व सौर चक्र • SAMVAT & SOLAR",
                            color = VedicTerracotta,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(bottom = 10.dp)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            DataPill("संवत्सर (SAMVAT)", panchangData.samvat, Modifier.weight(1f))
                            DataPill("अयन (AYANA)", panchangData.ayana, Modifier.weight(1f))
                            DataPill("ऋतु (RITU)", panchangData.ritu, Modifier.weight(1f))
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            DataPill("सूर्य राशि", panchangData.sunRashi, Modifier.weight(1f))
                            DataPill("चन्द्र राशि", panchangData.moonRashi, Modifier.weight(1f))
                            DataPill("मध्याह्न (NOON)", panchangData.solarNoon, Modifier.weight(1f))
                        }
                    }
                }

                // 5. Auspicious Timings (शुभ मुहूर्त व काल)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(AuspiciousGreen))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "शुभ मुहूर्त व योग • AUSPICIOUS TIMINGS",
                                color = AuspiciousGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            TimingRow("अभिजित मुहूर्त (Abhijit)", panchangData.abhijitMuhurta, "सर्वकार्य सिद्धिदायक काल", AuspiciousGreen)
                            TimingRow("ब्रह्म मुहूर्त (Brahma)", panchangData.brahmaMuhurta, "ध्यान, जप व विद्यारम्भ", AuspiciousGreen)
                            TimingRow("विजय मुहूर्त (Vijaya)", panchangData.vijayaMuhurta, "यात्रा, व्यापार व विजय कार्य", AuspiciousGreen)
                            TimingRow("अमृत काल (Amrit Kaal)", panchangData.amritKaal, "शुभ व मांगलिक अनुष्ठान", AuspiciousGreen)
                            TimingRow("प्रदोष काल (Pradosha)", panchangData.pradoshaKaal, "संध्या व शिवोपासना काल", AuspiciousGreen)
                        }
                    }
                }

                // 6. Inauspicious Timings (अशुभ काल व वेला)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(InauspiciousRed))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "अशुभ काल व वेला • INAUSPICIOUS TIMINGS",
                                color = InauspiciousRed,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(10.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            TimingRow("राहु काल (Rahu Kaal)", panchangData.rahuKaal, "नवीन कार्य आरम्भ वर्जित", InauspiciousRed)
                            TimingRow("यमगण्ड (Yamaganda)", panchangData.yamaganda, "यात्रा व मांगलिक कार्य वर्जित", InauspiciousRed)
                            TimingRow("गुलिक काल (Gulika)", panchangData.gulikaKaal, "शनि-पुत्र गुलिक का प्रभाव", InauspiciousRed)
                            TimingRow("वर्ज्यम् (Varjyam)", panchangData.varjyam, "अनिष्टकर काल खण्ड", InauspiciousRed)
                            if (panchangData.durMuhurtham.isNotEmpty()) {
                                TimingRow("दुर्मुहूर्त (Dur Muhurtam)", panchangData.durMuhurtham.joinToString(", "), "वर्जित समय", InauspiciousRed)
                            }
                        }
                    }
                }

                // 7. Choghadiya Timings (चौघड़िया मुहूर्त)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "चौघड़िया मुहूर्त • CHOGHADIYA",
                                color = VedicTerracotta,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Row {
                                ChoiceChip("दिन (Day)", choghadiyaTab == "DAY") { choghadiyaTab = "DAY" }
                                Spacer(modifier = Modifier.width(6.dp))
                                ChoiceChip("रात्रि (Night)", choghadiyaTab == "NIGHT") { choghadiyaTab = "NIGHT" }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        val slots = if (choghadiyaTab == "DAY") panchangData.choghadiyaDay else panchangData.choghadiyaNight
                        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            slots.forEach { slot ->
                                ChoghadiyaRow(slot)
                            }
                        }
                    }
                }

                // 8. Planetary Horas (ग्रह होरा चक्र)
                item {
                    VedicCard(contentPadding = 14.dp) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "ग्रह होरा चक्र • PLANETARY HORAS",
                                color = VedicTerracotta,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Row {
                                ChoiceChip("दिन होरा", horaTab == "DAY") { horaTab = "DAY" }
                                Spacer(modifier = Modifier.width(6.dp))
                                ChoiceChip("रात्रि होरा", horaTab == "NIGHT") { horaTab = "NIGHT" }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        val horas = if (horaTab == "DAY") panchangData.horasDay else panchangData.horasNight
                        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            horas.forEach { hora ->
                                HoraRow(hora)
                            }
                        }
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        } else {
            // ==========================================
            // MODE 1: MASIKA PANCHANGA (मासिक पञ्चाङ्ग)
            // ==========================================
            val monthCalendar = remember(selectedCalendar) {
                val cal = selectedCalendar.clone() as Calendar
                cal.set(Calendar.DAY_OF_MONTH, 1)
                cal
            }

            val monthDays = remember(selectedCalendar, lat, lon) {
                val y = selectedCalendar.get(Calendar.YEAR)
                val m = selectedCalendar.get(Calendar.MONTH) + 1
                PanchangaEngine.calculateMonthlyCalendar(y, m, lat, lon, tzOffsetHours)
            }

            val monthTitle = remember(selectedCalendar) {
                SimpleDateFormat("MMMM yyyy", Locale.ENGLISH).format(selectedCalendar.time)
            }

            val firstDayOfWeek = remember(monthCalendar) {
                monthCalendar.get(Calendar.DAY_OF_WEEK) // 1 = Sunday .. 7 = Saturday
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Month Navigation Header Card
                item {
                    VedicCard(contentPadding = 12.dp) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = {
                                    val newCal = selectedCalendar.clone() as Calendar
                                    newCal.add(Calendar.MONTH, -1)
                                    selectedCalendar = newCal
                                },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(ParchmentBg)
                                    .border(BorderStroke(1.dp, VedicBorder), CircleShape)
                            ) {
                                Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Month", tint = VedicTerracotta, modifier = Modifier.size(20.dp))
                            }

                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    text = monthTitle.uppercase(),
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = VedicCharcoal,
                                    letterSpacing = 1.sp
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "${panchangData.samvat} • $city",
                                    fontSize = 10.5.sp,
                                    color = VedicMutedCharcoal
                                )
                            }

                            IconButton(
                                onClick = {
                                    val newCal = selectedCalendar.clone() as Calendar
                                    newCal.add(Calendar.MONTH, 1)
                                    selectedCalendar = newCal
                                },
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(ParchmentBg)
                                    .border(BorderStroke(1.dp, VedicBorder), CircleShape)
                            ) {
                                Icon(Icons.Default.ChevronRight, contentDescription = "Next Month", tint = VedicTerracotta, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }

                // Month Calendar Grid Card
                item {
                    VedicCard(contentPadding = 12.dp) {
                        // Weekday Headers (Vedic & English)
                        val weekdays = listOf(
                            "रवि\nSun", "सोम\nMon", "मंगल\nTue", "बुध\nWed",
                            "गुरु\nThu", "शुक्र\nFri", "शनि\nSat"
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 8.dp),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            weekdays.forEachIndexed { idx, w ->
                                Text(
                                    text = w,
                                    modifier = Modifier.weight(1f),
                                    textAlign = TextAlign.Center,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    lineHeight = 13.sp,
                                    color = if (idx == 0) VedicTerracotta else VedicCharcoal
                                )
                            }
                        }

                        HorizontalDivider(color = VedicLightBorder, thickness = 1.dp)
                        Spacer(modifier = Modifier.height(8.dp))

                        // Grid of days
                        val totalSlots = (firstDayOfWeek - 1) + monthDays.size
                        val rowCount = (totalSlots + 6) / 7

                        Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            for (r in 0 until rowCount) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    for (c in 0 until 7) {
                                        val slotIndex = r * 7 + c
                                        val dayIndex = slotIndex - (firstDayOfWeek - 1)

                                        if (dayIndex in monthDays.indices) {
                                            val dayInfo = monthDays[dayIndex]
                                            val isToday = remember(selectedCalendar, dayInfo.dayOfMonth) {
                                                val today = Calendar.getInstance()
                                                today.get(Calendar.YEAR) == selectedCalendar.get(Calendar.YEAR) &&
                                                        today.get(Calendar.MONTH) == selectedCalendar.get(Calendar.MONTH) &&
                                                        today.get(Calendar.DAY_OF_MONTH) == dayInfo.dayOfMonth
                                            }

                                            val isSelected = selectedCalendar.get(Calendar.DAY_OF_MONTH) == dayInfo.dayOfMonth

                                            val specialColor = when {
                                                dayInfo.isEkadashi -> VedicAmber
                                                dayInfo.isPurnima -> AuspiciousGreen
                                                dayInfo.isAmavasya -> VedicCharcoal
                                                else -> null
                                            }

                                            Surface(
                                                shape = RoundedCornerShape(8.dp),
                                                color = when {
                                                    isSelected -> VedicTerracotta.copy(alpha = 0.14f)
                                                    isToday -> VedicGold.copy(alpha = 0.12f)
                                                    else -> ParchmentBg
                                                },
                                                border = BorderStroke(
                                                    if (isSelected || isToday) 1.5.dp else 0.5.dp,
                                                    if (isSelected) VedicTerracotta else if (isToday) VedicGold else VedicLightBorder
                                                ),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .aspectRatio(0.85f)
                                                    .clickable {
                                                        val newCal = selectedCalendar.clone() as Calendar
                                                        newCal.set(Calendar.DAY_OF_MONTH, dayInfo.dayOfMonth)
                                                        selectedCalendar = newCal
                                                        viewModeIndex = 0 // Switch to Dainika view for this date!
                                                    }
                                            ) {
                                                Column(
                                                    modifier = Modifier
                                                        .fillMaxSize()
                                                        .padding(2.dp),
                                                    horizontalAlignment = Alignment.CenterHorizontally,
                                                    verticalArrangement = Arrangement.SpaceBetween
                                                ) {
                                                    // Day Number
                                                    Text(
                                                        text = "${dayInfo.dayOfMonth}",
                                                        fontSize = 12.sp,
                                                        fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.SemiBold,
                                                        color = if (isSelected) VedicTerracotta else VedicCharcoal
                                                    )

                                                    // Tithi Badge
                                                    val prefix = if (dayInfo.isShukla) "शु" else "कृ"
                                                    val tLabel = when {
                                                        dayInfo.isPurnima -> "पूर्णिमा"
                                                        dayInfo.isAmavasya -> "अमावस"
                                                        dayInfo.isEkadashi -> "एकादशी"
                                                        else -> "$prefix${dayInfo.tithiNumber}"
                                                    }

                                                    Text(
                                                        text = tLabel,
                                                        fontSize = 7.5.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = specialColor ?: VedicTerracotta,
                                                        maxLines = 1,
                                                        textAlign = TextAlign.Center
                                                    )

                                                    // Nakshatra abbreviation
                                                    Text(
                                                        text = dayInfo.nakshatraName.take(3),
                                                        fontSize = 7.sp,
                                                        color = VedicMutedCharcoal,
                                                        maxLines = 1
                                                    )
                                                }
                                            }
                                        } else {
                                            // Empty cell outside month bounds
                                            Box(modifier = Modifier.weight(1f).aspectRatio(0.85f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                item {
                    Text(
                        text = "सूचना: किसी भी दिनांक पर स्पर्श करके उस दिन का पूर्ण दैनिक पञ्चाङ्ग, वैदिक काल व चौघड़िया देखें।",
                        fontSize = 11.sp,
                        color = VedicMutedCharcoal,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(20.dp))
                }
            }
        }
    }
}

@Composable
private fun AstroTimeCol(icon: ImageVector, label: String, time: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(icon, contentDescription = null, tint = VedicTerracotta, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = label, fontSize = 9.sp, color = VedicMutedCharcoal, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(1.dp))
        Text(text = time, fontSize = 11.sp, color = VedicCharcoal, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun DataPill(label: String, value: String, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = ParchmentBg,
        border = BorderStroke(1.dp, VedicLightBorder),
        modifier = modifier.defaultMinSize(minHeight = 46.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = label,
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                color = VedicGold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = VedicCharcoal,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun AngaCard(title: String, anga: PanchangaEngine.PanchangaAnga, icon: ImageVector) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = ParchmentBg,
        border = BorderStroke(1.dp, VedicLightBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(icon, contentDescription = null, tint = VedicTerracotta, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = title,
                        fontSize = 11.5.sp,
                        color = VedicCharcoal,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = anga.name,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    modifier = Modifier.padding(start = 8.dp)
                )
            }

            if (anga.details.isNotEmpty()) {
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = anga.details,
                    fontSize = 10.sp,
                    color = VedicMutedCharcoal
                )
            }

            if (anga.progressPercent > 0.0 && anga.progressPercent < 1.0) {
                Spacer(modifier = Modifier.height(6.dp))
                LinearProgressIndicator(
                    progress = { anga.progressPercent.toFloat() },
                    color = VedicGold,
                    trackColor = VedicLightBorder,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                )
                if (anga.endTime != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 2.dp),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Text(text = "समाप्ति काल: ${anga.endTime}", fontSize = 9.sp, color = VedicMutedCharcoal)
                    }
                }
            }
        }
    }
}

@Composable
private fun TimingRow(title: String, time: String, meaning: String, accentColor: Color) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = ParchmentBg,
        border = BorderStroke(1.dp, accentColor.copy(alpha = 0.25f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicCharcoal,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = meaning,
                    fontSize = 9.5.sp,
                    color = VedicMutedCharcoal,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Text(
                text = time,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = accentColor,
                textAlign = TextAlign.End,
                modifier = Modifier
                    .width(135.dp)
                    .padding(start = 6.dp)
            )
        }
    }
}

@Composable
private fun ChoghadiyaRow(slot: PanchangaEngine.ChoghadiyaSlot) {
    val natureColor = when (slot.nature.lowercase()) {
        "auspicious" -> AuspiciousGreen
        "inauspicious" -> InauspiciousRed
        else -> VedicAmber
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (slot.isCurrent) natureColor.copy(alpha = 0.10f) else ParchmentBg,
        border = BorderStroke(if (slot.isCurrent) 1.2.dp else 0.5.dp, if (slot.isCurrent) natureColor else VedicLightBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Fixed-width prefix column for indicator dot to avoid any text shifting!
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (slot.isCurrent) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(natureColor)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = slot.name,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = VedicCharcoal
                    )
                    Text(
                        text = "स्वामी: ${slot.planet}",
                        fontSize = 9.5.sp,
                        color = VedicMutedCharcoal
                    )
                }
            }

            Column(
                horizontalAlignment = Alignment.End,
                modifier = Modifier.width(135.dp)
            ) {
                Text(
                    text = "${slot.start} - ${slot.end}",
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Medium,
                    color = VedicCharcoal
                )
                Text(
                    text = slot.nature,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = natureColor
                )
            }
        }
    }
}

@Composable
private fun HoraRow(hora: PanchangaEngine.HoraSlot) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (hora.isCurrent) VedicTerracotta.copy(alpha = 0.10f) else ParchmentBg,
        border = BorderStroke(if (hora.isCurrent) 1.2.dp else 0.5.dp, if (hora.isCurrent) VedicTerracotta else VedicLightBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Fixed indicator column to prevent jitter
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier.size(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (hora.isCurrent) {
                        Box(
                            modifier = Modifier
                                .size(7.dp)
                                .clip(CircleShape)
                                .background(VedicTerracotta)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column {
                    Text(
                        text = "होरा #${hora.horaNumber}: ${hora.planet}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = VedicCharcoal
                    )
                    if (hora.description.isNotEmpty()) {
                        Text(
                            text = hora.description,
                            fontSize = 9.5.sp,
                            color = VedicMutedCharcoal
                        )
                    }
                }
            }

            Text(
                text = "${hora.start} - ${hora.end}",
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Medium,
                color = VedicCharcoal,
                textAlign = TextAlign.End,
                modifier = Modifier.width(135.dp)
            )
        }
    }
}

@Composable
private fun ChoiceChip(text: String, selected: Boolean, onSelect: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (selected) VedicTerracotta else ParchmentBg,
        border = BorderStroke(1.dp, if (selected) VedicTerracotta else VedicBorder),
        modifier = Modifier.clickable { onSelect() }
    ) {
        Text(
            text = text,
            fontSize = 10.5.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            color = if (selected) Color.White else VedicMutedCharcoal,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}
