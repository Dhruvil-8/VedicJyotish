package com.example.vedicjyotish.ui.tabs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.theme.*

@Composable
fun HorizontalScrollableTable(
    houses: List<Int>,
    planets: List<String>,
    bhinnashtakavarga: Map<String, List<Int>>,
    sarvashtakavarga: List<Int>
) {
    val scrollState = rememberScrollState()
    val cellWidth = 42.dp
    val headerWidth = 72.dp
    val totalWidth = headerWidth + (cellWidth * houses.size)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState)
    ) {
        Column(modifier = Modifier.width(totalWidth)) {
            // Houses Row (Header)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(ParchmentBg)
                    .border(BorderStroke(1.dp, VedicBorder), RoundedCornerShape(8.dp))
                    .padding(vertical = 8.dp, horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PLANET",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    modifier = Modifier.width(headerWidth).padding(start = 6.dp),
                    textAlign = TextAlign.Start
                )
                houses.forEach { h ->
                    Text(
                        text = "H$h",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = VedicTerracotta,
                        modifier = Modifier.width(cellWidth),
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // BAV Rows
            planets.forEachIndexed { index, p ->
                val scores = bhinnashtakavarga[p] ?: List(12) { 0 }
                val isEven = index % 2 == 0
                val rowBg = if (isEven) ParchmentBg.copy(alpha = 0.5f) else ParchmentCardBg

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(rowBg)
                        .border(BorderStroke(0.5.dp, VedicLightBorder), RoundedCornerShape(6.dp))
                        .padding(vertical = 6.dp, horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = p,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = VedicCharcoal,
                        modifier = Modifier.width(headerWidth).padding(start = 6.dp),
                        textAlign = TextAlign.Start
                    )
                    scores.forEach { score ->
                        val isHigh = score >= 5
                        val isLow = score <= 2
                        val scoreColor = when {
                            isHigh -> AuspiciousGreen
                            isLow -> InauspiciousRed
                            else -> VedicCharcoal
                        }
                        Box(
                            modifier = Modifier
                                .width(cellWidth)
                                .height(26.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "$score",
                                fontSize = 11.sp,
                                fontWeight = if (isHigh || isLow) FontWeight.Bold else FontWeight.Normal,
                                color = scoreColor,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))
            }

            Spacer(modifier = Modifier.height(4.dp))

            // SAV Row (Sarvashtakavarga Totals)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(VedicTerracotta.copy(alpha = 0.10f))
                    .border(BorderStroke(1.dp, VedicBorder), RoundedCornerShape(8.dp))
                    .padding(vertical = 8.dp, horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "SAV TOTAL",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = VedicTerracotta,
                    modifier = Modifier.width(headerWidth).padding(start = 6.dp),
                    textAlign = TextAlign.Start
                )
                sarvashtakavarga.forEach { total ->
                    val isAuspicious = total >= 28
                    val isChallenging = total < 24
                    val totalColor = when {
                        isAuspicious -> AuspiciousGreen
                        isChallenging -> InauspiciousRed
                        else -> VedicCharcoal
                    }

                    Box(
                        modifier = Modifier
                            .width(cellWidth)
                            .height(26.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "$total",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = totalColor,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}
