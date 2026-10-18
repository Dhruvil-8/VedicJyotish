package com.example.vedicjyotish.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.HousePlanet
import com.example.vedicjyotish.data.models.HouseData
import com.example.vedicjyotish.theme.*

@Composable
fun NorthIndianChart(
    chartData: Map<String, HouseData>,
    title: String,
    modifier: Modifier = Modifier,
    onHouseClick: ((houseNumber: Int, signName: String, houseData: HouseData?) -> Unit)? = null
) {
    VedicCard(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f),
        shape = RoundedCornerShape(18.dp),
        backgroundColor = ParchmentCardBg,
        borderColor = VedicBorder,
        contentPadding = 12.dp
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title.uppercase(),
                color = LiquidGold,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Box(
                modifier = Modifier
                    .weight(1f)
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .border(1.5.dp, VedicBorder, RoundedCornerShape(10.dp))
                    .background(ParchmentCardBg)
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height

                    val lineTerracotta = VedicTerracotta.copy(alpha = 0.45f)
                    val strokeWidth = 1.2.dp.toPx()

                    // 1. Diagonals
                    drawLine(lineTerracotta, Offset(0f, 0f), Offset(w, h), strokeWidth)
                    drawLine(lineTerracotta, Offset(w, 0f), Offset(0f, h), strokeWidth)

                    // 2. Center Diamond (Houses 1, 4, 7, 10)
                    drawLine(lineTerracotta, Offset(w / 2f, 0f), Offset(0f, h / 2f), strokeWidth)
                    drawLine(lineTerracotta, Offset(0f, h / 2f), Offset(w / 2f, h), strokeWidth)
                    drawLine(lineTerracotta, Offset(w / 2f, h), Offset(w, h / 2f), strokeWidth)
                    drawLine(lineTerracotta, Offset(w, h / 2f), Offset(w / 2f, 0f), strokeWidth)
                }

                BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                    val w = maxWidth
                    val h = maxHeight

                    val housePlacements = listOf(
                        // House 1 (Top Center Kendra)
                        HousePlacement(w * 0.5f, h * 0.28f, w * 0.5f, h * 0.16f),
                        // House 2 (Top Left Outer)
                        HousePlacement(w * 0.28f, h * 0.14f, w * 0.22f, h * 0.06f),
                        // House 3 (Left Top Outer)
                        HousePlacement(w * 0.14f, h * 0.28f, w * 0.06f, h * 0.22f),
                        // House 4 (Left Center Kendra)
                        HousePlacement(w * 0.28f, h * 0.5f, w * 0.16f, h * 0.5f),
                        // House 5 (Left Bottom Outer)
                        HousePlacement(w * 0.14f, h * 0.72f, w * 0.06f, h * 0.78f),
                        // House 6 (Bottom Left Outer)
                        HousePlacement(w * 0.28f, h * 0.86f, w * 0.22f, h * 0.94f),
                        // House 7 (Bottom Center Kendra)
                        HousePlacement(w * 0.5f, h * 0.72f, w * 0.5f, h * 0.84f),
                        // House 8 (Bottom Right Outer)
                        HousePlacement(w * 0.72f, h * 0.86f, w * 0.78f, h * 0.94f),
                        // House 9 (Right Bottom Outer)
                        HousePlacement(w * 0.86f, h * 0.72f, w * 0.94f, h * 0.78f),
                        // House 10 (Right Center Kendra)
                        HousePlacement(w * 0.72f, h * 0.5f, w * 0.84f, h * 0.5f),
                        // House 11 (Right Top Outer)
                        HousePlacement(w * 0.86f, h * 0.28f, w * 0.94f, h * 0.22f),
                        // House 12 (Top Right Outer)
                        HousePlacement(w * 0.72f, h * 0.14f, w * 0.78f, h * 0.06f)
                    )

                    for (houseIndex in 1..12) {
                        val houseStr = houseIndex.toString()
                        val houseData = chartData[houseStr] ?: continue
                        val placement = housePlacements[houseIndex - 1]

                        // 1. Draw Zodiac Sign Number
                        val signNum = getSignNumber(houseData.sign)
                        val houseClickModifier = if (onHouseClick != null) {
                            Modifier.clickable { onHouseClick(houseIndex, houseData.sign, houseData) }
                        } else Modifier

                        Box(
                            modifier = Modifier
                                .absoluteOffset(
                                    x = placement.signX - 12.dp,
                                    y = placement.signY - 12.dp
                                )
                                .size(24.dp)
                                .then(houseClickModifier),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = signNum.toString(),
                                color = if (houseIndex == 1) VedicTerracotta else VedicGold,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // 2. Draw Planets in this house
                        val planets = houseData.planets
                        if (planets.isNotEmpty()) {
                            val maxPlanetsPerRow = if (houseIndex in listOf(1, 4, 7, 10)) 3 else 2
                            val planetChunks = planets.chunked(maxPlanetsPerRow)

                            Column(
                                modifier = Modifier
                                    .width(64.dp)
                                    .absoluteOffset(
                                        x = placement.planetsX - 32.dp,
                                        y = placement.planetsY - 20.dp
                                    )
                                    .then(houseClickModifier),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                planetChunks.forEach { chunk ->
                                    Row(
                                        horizontalArrangement = Arrangement.Center,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        chunk.forEach { planet ->
                                            val tag = getPlanetAbbreviation(planet.name)
                                            val color = when {
                                                planet.retrograde -> LiquidRose
                                                planet.combust -> VedicAmber
                                                planet.name.equals("Moon", ignoreCase = true) -> VedicTerracotta
                                                planet.name.equals("Sun", ignoreCase = true) -> VedicGold
                                                else -> VedicCharcoal
                                            }
                                            Text(
                                                text = if (planet.retrograde) "$tag(R)" else tag,
                                                color = color,
                                                fontSize = 9.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 1.5.dp)
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

private data class HousePlacement(
    val planetsX: androidx.compose.ui.unit.Dp,
    val planetsY: androidx.compose.ui.unit.Dp,
    val signX: androidx.compose.ui.unit.Dp,
    val signY: androidx.compose.ui.unit.Dp
)

private fun getSignNumber(signName: String): Int {
    return when (signName.trim().lowercase()) {
        "aries" -> 1
        "taurus" -> 2
        "gemini" -> 3
        "cancer" -> 4
        "leo" -> 5
        "virgo" -> 6
        "libra" -> 7
        "scorpio" -> 8
        "sagittarius" -> 9
        "capricorn" -> 10
        "aquarius" -> 11
        "pisces" -> 12
        else -> 1
    }
}

private fun getPlanetAbbreviation(planetName: String): String {
    return when (planetName.trim().lowercase()) {
        "sun" -> "Su"
        "moon" -> "Mo"
        "mars" -> "Ma"
        "mercury" -> "Me"
        "jupiter" -> "Ju"
        "venus" -> "Ve"
        "saturn" -> "Sa"
        "rahu" -> "Ra"
        "ketu" -> "Ke"
        "ascendant", "lagna" -> "As"
        else -> planetName.take(2).replaceFirstChar { it.uppercase() }
    }
}
