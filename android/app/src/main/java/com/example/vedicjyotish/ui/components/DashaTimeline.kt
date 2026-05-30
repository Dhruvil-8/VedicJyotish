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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.MahaDasha
import com.example.vedicjyotish.theme.VedicCharcoal
import com.example.vedicjyotish.theme.VedicGold
import com.example.vedicjyotish.theme.VedicTerracotta

@Composable
fun DashaTimeline(
    mahadashas: List<MahaDasha>,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "VIMSHOTTARI DASHA TIMELINE",
            color = VedicTerracotta,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
        )

        mahadashas.forEach { mahadasha ->
            MahaDashaItem(mahadasha = mahadasha)
        }
    }
}

@Composable
private fun MahaDashaItem(mahadasha: MahaDasha) {
    var expanded by remember { mutableStateOf(false) }
    val arrowRotation by animateFloatAsState(targetValue = if (expanded) 180f else 0f)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 10.dp)
            .clickable { expanded = !expanded },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Timeline Lord Bullet
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .background(VedicTerracotta.copy(alpha = 0.1f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = mahadasha.lord.take(2).uppercase(),
                        color = VedicTerracotta,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${mahadasha.lord.uppercase()} MAHADASHA",
                        color = VedicCharcoal,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${mahadasha.start}  ➡  ${mahadasha.end}",
                        color = Color.Gray,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                if (mahadasha.antardashas?.isNotEmpty() == true) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowDown,
                        contentDescription = "Expand",
                        tint = VedicGold,
                        modifier = Modifier.rotate(arrowRotation)
                    )
                }
            }

            // Antardashas List
            if (mahadasha.antardashas?.isNotEmpty() == true) {
                AnimatedVisibility(visible = expanded) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp, start = 18.dp)
                    ) {
                        // Vertical timeline connector line
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = 18.dp)
                        ) {
                            Column {
                                mahadasha.antardashas.forEachIndexed { index, antar ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        // Small circular node
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .background(VedicGold, CircleShape)
                                        )

                                        Spacer(modifier = Modifier.width(10.dp))

                                        Column {
                                            Text(
                                                text = "${antar.lord.capitalize()} Antardasha",
                                                color = VedicCharcoal,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Medium
                                            )
                                            Text(
                                                text = "${antar.start} to ${antar.end}",
                                                color = Color.Gray,
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
