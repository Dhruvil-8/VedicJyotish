package com.example.vedicastroai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicastroai.data.models.PlanetaryRow
import com.example.vedicastroai.theme.VedicCharcoal
import com.example.vedicastroai.theme.VedicGold
import com.example.vedicastroai.theme.VedicTerracotta

@Composable
fun PlanetaryTable(
    planetaryRows: List<PlanetaryRow>,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Text(
                text = "PLANETARY POSITIONS",
                color = VedicTerracotta,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            val scrollState = rememberScrollState()

            // Horizontal Scroll in case screen size is too small for standard layout
            Box(modifier = Modifier.horizontalScroll(scrollState)) {
                Column(modifier = Modifier.width(550.dp)) {
                    // --- HEADER ---
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(VedicTerracotta.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                            .padding(vertical = 8.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        TableCell("PLANET", weight = 1.2f, isHeader = true)
                        TableCell("SIGN", weight = 1.0f, isHeader = true)
                        TableCell("HOUSE", weight = 0.8f, isHeader = true)
                        TableCell("NAKSHATRA (PADA)", weight = 1.8f, isHeader = true)
                        TableCell("DIGNITY", weight = 1.2f, isHeader = true)
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    // --- ROWS ---
                    planetaryRows.forEachIndexed { index, row ->
                        val isEven = index % 2 == 0
                        val rowBg = if (isEven) Color.Transparent else Color(0xFFF9F7F2)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(rowBg, RoundedCornerShape(4.dp))
                                .padding(vertical = 10.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Planet Name with Retrograde / Combust indicator
                            Row(
                                modifier = Modifier.weight(1.2f),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = row.name,
                                    color = VedicCharcoal,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                if (row.retrograde) {
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Badge(
                                        containerColor = Color(0xFFFADBD8),
                                        contentColor = Color(0xFFC0392B)
                                    ) {
                                        Text("R", fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                if (row.combust) {
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Badge(
                                        containerColor = Color(0xFFFDEBD0),
                                        contentColor = Color(0xFFD35400)
                                    ) {
                                        Text("C", fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            // Sign Name
                            TableCell(row.sign, weight = 1.0f)

                            // House
                            TableCell("H${row.house}", weight = 0.8f)

                            // Nakshatra (Pada)
                            TableCell("${row.nakshatra} (P${row.pada})", weight = 1.8f)

                            // Dignity
                            val dignityColor = when (row.dignity.lowercase()) {
                                "exalted", "own sign", "great friend" -> Color(0xFF1B5E20) // Deep green
                                "debilitated", "bitter enemy" -> Color(0xFFB71C1C) // Deep red
                                else -> VedicCharcoal
                            }
                            TableCell(
                                text = row.dignity,
                                weight = 1.2f,
                                textColor = dignityColor,
                                textWeight = if (row.dignity.lowercase() in listOf("exalted", "debilitated")) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RowScope.TableCell(
    text: String,
    weight: Float,
    isHeader: Boolean = false,
    textColor: Color = if (isHeader) VedicTerracotta else VedicCharcoal,
    textWeight: FontWeight = if (isHeader) FontWeight.Bold else FontWeight.Normal
) {
    Text(
        text = text,
        color = textColor,
        fontSize = if (isHeader) 11.sp else 12.sp,
        fontWeight = textWeight,
        letterSpacing = if (isHeader) 1.sp else 0.sp,
        modifier = Modifier.weight(weight),
        textAlign = TextAlign.Start
    )
}
