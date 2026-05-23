package com.example.vedicastroai.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicastroai.data.models.HousePlanet
import com.example.vedicastroai.data.models.HouseData
import com.example.vedicastroai.theme.ParchmentBg
import com.example.vedicastroai.theme.VedicCharcoal
import com.example.vedicastroai.theme.VedicGold
import com.example.vedicastroai.theme.VedicTerracotta

@Composable
fun NorthIndianChart(
    chartData: Map<String, HouseData>,
    title: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title.uppercase(),
                color = VedicTerracotta,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            Box(
                modifier = Modifier
                    .weight(1f)
                    .aspectRatio(1f)
                    .border(2.dp, VedicGold.copy(alpha = 0.8f))
                    .background(Color(0xFFFAF9F6))
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height

                    val goldColor = VedicGold
                    val terracottaColor = VedicTerracotta
                    val charcoalColor = VedicCharcoal

                    val strokeWidth = 2.dp.toPx()
                    val thinStrokeWidth = 1.dp.toPx()

                    // --- DRAW CHART LINES ---
                    // 1. Diagonals
                    drawLine(goldColor, Offset(0f, 0f), Offset(w, h), strokeWidth)
                    drawLine(goldColor, Offset(w, 0f), Offset(0f, h), strokeWidth)

                    // 2. Center Diamond
                    drawLine(goldColor, Offset(w / 2f, 0f), Offset(0f, h / 2f), strokeWidth)
                    drawLine(goldColor, Offset(0f, h / 2f), Offset(w / 2f, h), strokeWidth)
                    drawLine(goldColor, Offset(w / 2f, h), Offset(w, h / 2f), strokeWidth)
                    drawLine(goldColor, Offset(w, h / 2f), Offset(w / 2f, 0f), strokeWidth)
                }

                // --- DRAW HOUSE LABELS & PLANETS (HTML Overlay Style or Math Coordinates) ---
                // We use standard compose layout offsets to absolute-position beautiful native Text elements
                // so we don't have to deal with Canvas text measurement and line wrapping issues!
                // This is extremely premium and looks much sharper.
                BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                    val w = maxWidth
                    val h = maxHeight

                    // Define absolute coordinate centers for each of the 12 houses
                    val housePlacements = listOf(
                        // House 1 (Top Center)
                        HousePlacement(w * 0.5f, h * 0.28f, w * 0.5f, h * 0.16f),
                        // House 2 (Top Left Outer)
                        HousePlacement(w * 0.28f, h * 0.14f, w * 0.22f, h * 0.06f),
                        // House 3 (Left Top Outer)
                        HousePlacement(w * 0.14f, h * 0.28f, w * 0.06f, h * 0.22f),
                        // House 4 (Left Center)
                        HousePlacement(w * 0.28f, h * 0.5f, w * 0.16f, h * 0.5f),
                        // House 5 (Left Bottom Outer)
                        HousePlacement(w * 0.14f, h * 0.72f, w * 0.06f, h * 0.78f),
                        // House 6 (Bottom Left Outer)
                        HousePlacement(w * 0.28f, h * 0.86f, w * 0.22f, h * 0.94f),
                        // House 7 (Bottom Center)
                        HousePlacement(w * 0.5f, h * 0.72f, w * 0.5f, h * 0.84f),
                        // House 8 (Bottom Right Outer)
                        HousePlacement(w * 0.72f, h * 0.86f, w * 0.78f, h * 0.94f),
                        // House 9 (Right Bottom Outer)
                        HousePlacement(w * 0.86f, h * 0.72f, w * 0.94f, h * 0.78f),
                        // House 10 (Right Center)
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
                        Box(
                            modifier = Modifier
                                .absoluteOffset(
                                    x = placement.signX - 10.dp,
                                    y = placement.signY - 10.dp
                                )
                                .size(20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = signNum.toString(),
                                color = VedicTerracotta,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // 2. Draw Planets in this house
                        val planets = houseData.planets
                        if (planets.isNotEmpty()) {
                            // Lay out planets vertically/horizontally in a FlowRow or simple Column/Row
                            // depending on the house shape
                            val maxPlanetsPerRow = if (houseIndex in listOf(1, 4, 7, 10)) 3 else 2
                            val planetChunks = planets.chunked(maxPlanetsPerRow)

                            Column(
                                modifier = Modifier
                                    .width(60.dp)
                                    .absoluteOffset(
                                        x = placement.planetsX - 30.dp,
                                        y = placement.planetsY - 20.dp
                                    ),
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
                                                planet.retrograde -> Color(0xFFC0392B) // Red for retrograde
                                                planet.combust -> Color(0xFFD35400) // Orange for combust
                                                else -> VedicCharcoal
                                            }
                                            Text(
                                                text = if (planet.retrograde) "$tag(R)" else tag,
                                                color = color,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                modifier = Modifier.padding(horizontal = 2.dp)
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

// Helpers
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
        else -> planetName.take(2).capitalize()
    }
}
