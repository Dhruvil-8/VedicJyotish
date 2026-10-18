package com.example.vedicjyotish.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.AntarDasha
import com.example.vedicjyotish.data.models.MahaDasha
import com.example.vedicjyotish.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private fun parseFlexibleDate(dateStr: String?): Date? {
    if (dateStr.isNullOrBlank()) return null
    val clean = dateStr.trim()
    val formats = listOf("dd-MM-yyyy", "dd/MM/yyyy", "yyyy-MM-dd", "yyyy/MM/dd")
    for (fmt in formats) {
        try {
            val d = SimpleDateFormat(fmt, Locale.ENGLISH).parse(clean)
            if (d != null) return d
        } catch (_: Exception) {}
    }
    return null
}

@Composable
fun DashaTimeline(
    mahadashas: List<MahaDasha>,
    modifier: Modifier = Modifier
) {
    val now = remember { Date() }

    // Find currently active Mahadasha and Antardasha
    val activeDashaPair = remember(mahadashas) {
        var foundMaha: MahaDasha? = null
        var foundAntar: AntarDasha? = null
        for (m in mahadashas) {
            val ms = parseFlexibleDate(m.start)
            val me = parseFlexibleDate(m.end)
            if (ms != null && me != null && now in ms..me) {
                foundMaha = m
                foundAntar = m.antardashas?.find { a ->
                    val asDate = parseFlexibleDate(a.start)
                    val aeDate = parseFlexibleDate(a.end)
                    asDate != null && aeDate != null && now in asDate..aeDate
                }
                break
            }
        }
        foundMaha to foundAntar
    }

    val activeMaha = activeDashaPair.first
    val activeAntar = activeDashaPair.second

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "VIMSHOTTARI DASHA TIMELINE",
            color = LiquidGold,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.5.sp,
            modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
        )

        // Active Dasha Hero Card
        if (activeMaha != null) {
            VedicCard(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 14.dp),
                shape = RoundedCornerShape(16.dp),
                backgroundColor = ParchmentCardBg,
                borderColor = VedicGold.copy(alpha = 0.6f),
                borderWidth = 1.5.dp,
                contentPadding = 14.dp,
                shadowElevation = 2.dp
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(VedicTerracotta.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = activeMaha.lord.take(2).uppercase(),
                            color = VedicTerracotta,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "ACTIVE PERIOD",
                                color = VedicGold,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(AuspiciousGreen)
                            )
                        }

                        val title = if (activeAntar != null) {
                            "${activeMaha.lord.uppercase()} - ${activeAntar.lord.uppercase()}"
                        } else {
                            "${activeMaha.lord.uppercase()} MAHADASHA"
                        }

                        Text(
                            text = title,
                            color = VedicCharcoal,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )

                        val dates = if (activeAntar != null) {
                            "${activeAntar.start}  ➡  ${activeAntar.end}"
                        } else {
                            "${activeMaha.start}  ➡  ${activeMaha.end}"
                        }

                        Text(
                            text = dates,
                            color = VedicMutedCharcoal,
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Progress Bar for current period
                if (activeAntar != null) {
                    val s = parseFlexibleDate(activeAntar.start)
                    val e = parseFlexibleDate(activeAntar.end)
                    if (s != null && e != null && e.time > s.time) {
                        val progress = ((now.time - s.time).toFloat() / (e.time - s.time).toFloat()).coerceIn(0f, 1f)
                        Spacer(modifier = Modifier.height(10.dp))
                        LinearProgressIndicator(
                            progress = { progress },
                            color = VedicTerracotta,
                            trackColor = VedicLightBorder,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(5.dp)
                                .clip(RoundedCornerShape(2.5.dp))
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Antardasha Progress",
                                fontSize = 9.5.sp,
                                color = VedicMutedCharcoal
                            )
                            Text(
                                text = "${(progress * 100).toInt()}% elapsed",
                                fontSize = 9.5.sp,
                                color = VedicTerracotta,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        mahadashas.forEach { mahadasha ->
            val isActiveMaha = mahadasha.lord.equals(activeMaha?.lord, ignoreCase = true)
            MahaDashaItem(mahadasha = mahadasha, initiallyExpanded = isActiveMaha)
        }
    }
}

@Composable
private fun MahaDashaItem(
    mahadasha: MahaDasha,
    initiallyExpanded: Boolean = false
) {
    var expanded by remember { mutableStateOf(initiallyExpanded) }
    val arrowRotation by animateFloatAsState(targetValue = if (expanded) 180f else 0f)

    VedicCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp)
            .clickable { expanded = !expanded },
        shape = RoundedCornerShape(16.dp),
        backgroundColor = ParchmentCardBg,
        borderColor = VedicBorder,
        contentPadding = 14.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Timeline Lord Bullet
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .clip(CircleShape)
                        .background(LiquidGold.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = mahadasha.lord.take(2).uppercase(),
                        color = LiquidGold,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${mahadasha.lord.uppercase()} MAHADASHA",
                        color = TextPrimary,
                        fontSize = 13.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${mahadasha.start}  ➡  ${mahadasha.end}",
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                if (mahadasha.antardashas?.isNotEmpty() == true) {
                    IconButton(
                        onClick = { expanded = !expanded },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.KeyboardArrowDown,
                            contentDescription = "Expand",
                            tint = LiquidGold,
                            modifier = Modifier.rotate(arrowRotation)
                        )
                    }
                }
            }

            // Antardashas List
            if (mahadasha.antardashas?.isNotEmpty() == true) {
                AnimatedVisibility(visible = expanded) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp, start = 14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = 14.dp)
                        ) {
                            Column {
                                mahadasha.antardashas.forEach { antar ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 5.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(7.dp)
                                                .clip(CircleShape)
                                                .background(AstralCyan)
                                        )

                                        Spacer(modifier = Modifier.width(10.dp))

                                        Column {
                                            Text(
                                                text = "${antar.lord.replaceFirstChar { it.uppercase() }} Antardasha",
                                                color = TextPrimary,
                                                fontSize = 12.5.sp,
                                                fontWeight = FontWeight.Medium
                                            )
                                            Text(
                                                text = "${antar.start} to ${antar.end}",
                                                color = TextSecondary,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
