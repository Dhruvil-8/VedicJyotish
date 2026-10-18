package com.example.vedicjyotish.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.PlanetaryRow
import com.example.vedicjyotish.theme.*

@Composable
fun PlanetaryTable(
    planetaryRows: List<PlanetaryRow>,
    modifier: Modifier = Modifier
) {
    VedicCard(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        backgroundColor = ParchmentCardBg,
        borderColor = VedicBorder,
        contentPadding = 14.dp
    ) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PLANETARY POSITIONS & DIGNITIES",
                    color = VedicTerracotta,
                    fontSize = 12.5.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )
                Text(
                    text = "Scroll ➡",
                    color = VedicMutedCharcoal,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            val scrollState = rememberScrollState()

            val colPlanetWidth = 92.dp
            val colSignWidth = 78.dp
            val colHouseWidth = 58.dp
            val colDegWidth = 66.dp
            val colNakWidth = 138.dp
            val colDignityWidth = 104.dp
            val totalTableWidth = colPlanetWidth + colSignWidth + colHouseWidth + colDegWidth + colNakWidth + colDignityWidth

            Box(modifier = Modifier.horizontalScroll(scrollState)) {
                Column(modifier = Modifier.width(totalTableWidth)) {
                    // --- TABLE HEADER ---
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(ParchmentBg)
                            .border(BorderStroke(1.dp, VedicBorder), RoundedCornerShape(8.dp))
                            .padding(vertical = 9.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        HeaderCell("PLANET", colPlanetWidth)
                        HeaderCell("SIGN", colSignWidth)
                        HeaderCell("HOUSE", colHouseWidth, textAlign = TextAlign.Center)
                        HeaderCell("DEGREE", colDegWidth)
                        HeaderCell("NAKSHATRA (PADA)", colNakWidth)
                        HeaderCell("DIGNITY", colDignityWidth)
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // --- TABLE ROWS ---
                    planetaryRows.forEachIndexed { index, row ->
                        val isEven = index % 2 == 0
                        val rowBg = if (isEven) ParchmentBg.copy(alpha = 0.6f) else ParchmentCardBg

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(6.dp))
                                .background(rowBg)
                                .border(BorderStroke(0.5.dp, VedicLightBorder), RoundedCornerShape(6.dp))
                                .padding(vertical = 8.dp, horizontal = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // 1. Planet Name with Retrograde / Combust Badges
                            Row(
                                modifier = Modifier
                                    .width(colPlanetWidth)
                                    .padding(start = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = row.name,
                                    color = when (row.name.lowercase()) {
                                        "sun" -> VedicGold
                                        "moon" -> VedicTerracotta
                                        else -> VedicCharcoal
                                    },
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold
                                )

                                if (row.retrograde) {
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(3.dp))
                                            .background(InauspiciousRed.copy(alpha = 0.15f))
                                            .padding(horizontal = 3.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = "R",
                                            color = InauspiciousRed,
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }

                                if (row.combust) {
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(3.dp))
                                            .background(VedicAmber.copy(alpha = 0.18f))
                                            .padding(horizontal = 3.dp, vertical = 1.dp)
                                    ) {
                                        Text(
                                            text = "C",
                                            color = VedicAmber,
                                            fontSize = 8.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            // 2. Sign Name
                            Text(
                                text = row.sign,
                                modifier = Modifier.width(colSignWidth),
                                fontSize = 11.5.sp,
                                color = VedicCharcoal,
                                fontWeight = FontWeight.Medium
                            )

                            // 3. House
                            Text(
                                text = "H${row.house}",
                                modifier = Modifier.width(colHouseWidth),
                                fontSize = 11.5.sp,
                                color = VedicGold,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )

                            // 4. Exact Degree
                            val degInt = row.degInSign.toInt()
                            val minInt = ((row.degInSign - degInt) * 60).toInt()
                            Text(
                                text = "$degInt°$minInt'",
                                modifier = Modifier.width(colDegWidth),
                                fontSize = 11.sp,
                                color = VedicMutedCharcoal,
                                fontWeight = FontWeight.SemiBold
                            )

                            // 5. Nakshatra & Pada
                            Text(
                                text = "${row.nakshatra} (P${row.pada})",
                                modifier = Modifier.width(colNakWidth),
                                fontSize = 11.5.sp,
                                color = VedicTerracotta,
                                fontWeight = FontWeight.SemiBold
                            )

                            // 6. Dignity
                            val dignityColor = when (row.dignity.lowercase()) {
                                "exalted", "own sign", "great friend" -> AuspiciousGreen
                                "debilitated", "bitter enemy" -> InauspiciousRed
                                else -> VedicMutedCharcoal
                            }
                            Text(
                                text = row.dignity,
                                modifier = Modifier.width(colDignityWidth),
                                fontSize = 11.sp,
                                color = dignityColor,
                                fontWeight = if (row.dignity.lowercase() in listOf("exalted", "debilitated")) FontWeight.Bold else FontWeight.Medium
                            )
                        }

                        Spacer(modifier = Modifier.height(3.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun HeaderCell(
    text: String,
    width: androidx.compose.ui.unit.Dp,
    textAlign: TextAlign = TextAlign.Start
) {
    Text(
        text = text,
        color = VedicTerracotta,
        fontSize = 10.5.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp,
        modifier = Modifier
            .width(width)
            .padding(horizontal = 4.dp),
        textAlign = textAlign
    )
}
