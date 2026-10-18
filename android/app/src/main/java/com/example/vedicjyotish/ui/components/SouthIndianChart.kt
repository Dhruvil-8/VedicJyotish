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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.HouseData
import com.example.vedicjyotish.data.models.HousePlanet
import com.example.vedicjyotish.theme.*

/**
 * South Indian (Fixed-Sign Square) Chart Renderer.
 * Traditional layout with 12 fixed zodiac sign cells in clockwise order around a central 2x2 information hub.
 */
@Composable
fun SouthIndianChart(
    chartData: Map<String, HouseData>,
    title: String,
    modifier: Modifier = Modifier,
    ascendantSign: String = "",
    onHouseClick: ((houseNumber: Int, signName: String, houseData: HouseData?) -> Unit)? = null
) {
    // Mapping of fixed sign numbers (1 = Aries .. 12 = Pisces)
    // to their grid row and column in the 4x4 matrix:
    // Row 0: Pisces(12), Aries(1), Taurus(2), Gemini(3)
    // Row 1: Aquarius(11), [CENTER 2x2], Cancer(4)
    // Row 2: Capricorn(10), [CENTER 2x2], Leo(5)
    // Row 3: Sagittarius(9), Scorpio(8), Libra(7), Virgo(6)
    val signGridPositions = mapOf(
        12 to (0 to 0), // Pisces
        1  to (0 to 1), // Aries
        2  to (0 to 2), // Taurus
        3  to (0 to 3), // Gemini
        11 to (1 to 0), // Aquarius
        4  to (1 to 3), // Cancer
        10 to (2 to 0), // Capricorn
        5  to (2 to 3), // Leo
        9  to (3 to 0), // Sagittarius
        8  to (3 to 1), // Scorpio
        7  to (3 to 2), // Libra
        6  to (3 to 3)  // Virgo
    )

    val signNames = listOf(
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    )

    // Build reverse map from sign number to house data
    val signToHouseMap = mutableMapOf<Int, Pair<Int, HouseData>>()
    for (houseNum in 1..12) {
        val hData = chartData[houseNum.toString()]
        if (hData != null) {
            val signIdx = getSignIndex(hData.sign)
            if (signIdx in 1..12) {
                signToHouseMap[signIdx] = houseNum to hData
            }
        }
    }

    VedicCard(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1f),
        shape = RoundedCornerShape(18.dp),
        backgroundColor = ParchmentCardBg,
        borderColor = VedicBorder,
        contentPadding = 10.dp
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(10.dp))
                    .border(1.5.dp, VedicBorder, RoundedCornerShape(10.dp))
                    .background(ParchmentCardBg)
            ) {
                // Outer 4x4 Grid layout
                Column(modifier = Modifier.fillMaxSize()) {
                    for (row in 0..3) {
                        Row(modifier = Modifier.weight(1f).fillMaxWidth()) {
                            for (col in 0..3) {
                                val isCenter = (row == 1 || row == 2) && (col == 1 || col == 2)

                                if (isCenter) {
                                    // The central 2x2 cell is rendered only once at row 1, col 1
                                    if (row == 1 && col == 1) {
                                        Box(
                                            modifier = Modifier
                                                .weight(2f)
                                                .fillMaxHeight()
                                                .background(ParchmentBg)
                                                .border(1.dp, VedicBorder),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.Center,
                                                modifier = Modifier.padding(6.dp)
                                            ) {
                                                Text(
                                                    text = title.uppercase(),
                                                    color = VedicTerracotta,
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    letterSpacing = 1.sp,
                                                    textAlign = TextAlign.Center
                                                )
                                                Spacer(modifier = Modifier.height(3.dp))
                                                Text(
                                                    text = "SOUTH INDIAN STYLE",
                                                    color = VedicGold,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.SemiBold,
                                                    letterSpacing = 0.5.sp
                                                )
                                                if (ascendantSign.isNotEmpty()) {
                                                    Spacer(modifier = Modifier.height(2.dp))
                                                    Text(
                                                        text = "Lagna: $ascendantSign",
                                                        color = VedicCharcoal,
                                                        fontSize = 9.5.sp,
                                                        fontWeight = FontWeight.Medium
                                                    )
                                                }
                                            }
                                        }
                                    } else if (row == 2 && col == 1) {
                                        // Skip lower-left of center (handled by fillMaxHeight of row 1..2)
                                        Box(
                                            modifier = Modifier
                                                .weight(2f)
                                                .fillMaxHeight()
                                                .background(ParchmentBg)
                                                .border(1.dp, VedicBorder),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "Tap any house to inspect",
                                                color = VedicMutedCharcoal,
                                                fontSize = 9.sp,
                                                fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                            )
                                        }
                                    }
                                } else {
                                    // Find which zodiac sign belongs to this cell
                                    val signNumber = signGridPositions.entries.find { it.value == (row to col) }?.key ?: 1
                                    val signName = signNames[signNumber - 1]
                                    val housePair = signToHouseMap[signNumber]
                                    val houseNum = housePair?.first
                                    val houseData = housePair?.second
                                    val isLagnaHouse = houseNum == 1 || signName.equals(ascendantSign, ignoreCase = true)

                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .fillMaxHeight()
                                            .border(0.75.dp, VedicBorder)
                                            .background(if (isLagnaHouse) VedicTerracotta.copy(alpha = 0.08f) else Color.Transparent)
                                            .clickable(enabled = onHouseClick != null && houseNum != null) {
                                                if (houseNum != null) {
                                                    onHouseClick?.invoke(houseNum, signName, houseData)
                                                }
                                            }
                                            .padding(3.dp)
                                    ) {
                                        // Draw diagonal Lagna line if House 1
                                        if (isLagnaHouse) {
                                            Canvas(modifier = Modifier.fillMaxSize()) {
                                                drawLine(
                                                    color = VedicTerracotta.copy(alpha = 0.35f),
                                                    start = Offset(0f, 0f),
                                                    end = Offset(size.width, size.height),
                                                    strokeWidth = 1.dp.toPx()
                                                )
                                            }
                                        }

                                        // Sign badge & House indicator
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.Top
                                        ) {
                                            Text(
                                                text = signName.take(3).uppercase(),
                                                color = if (isLagnaHouse) VedicTerracotta else VedicMutedCharcoal,
                                                fontSize = 8.5.sp,
                                                fontWeight = FontWeight.Bold
                                            )

                                            if (isLagnaHouse) {
                                                Text(
                                                    text = "ASC",
                                                    color = VedicTerracotta,
                                                    fontSize = 8.5.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            } else if (houseNum != null) {
                                                Text(
                                                    text = "H$houseNum",
                                                    color = VedicGold,
                                                    fontSize = 8.sp,
                                                    fontWeight = FontWeight.SemiBold
                                                )
                                            }
                                        }

                                        // Occupant Planets
                                        val planets = houseData?.planets ?: emptyList()
                                        if (planets.isNotEmpty()) {
                                            Column(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .align(Alignment.Center),
                                                horizontalAlignment = Alignment.CenterHorizontally
                                            ) {
                                                planets.take(4).forEach { p ->
                                                    val abbr = getSouthIndianPlanetAbbr(p.name)
                                                    val pColor = when {
                                                        p.retrograde -> InauspiciousRed
                                                        p.combust -> VedicAmber
                                                        p.name.equals("Moon", ignoreCase = true) -> VedicTerracotta
                                                        p.name.equals("Sun", ignoreCase = true) -> VedicGold
                                                        else -> VedicCharcoal
                                                    }
                                                    Text(
                                                        text = if (p.retrograde) "$abbr(R)" else abbr,
                                                        color = pColor,
                                                        fontSize = 9.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        lineHeight = 10.sp
                                                    )
                                                }
                                                if (planets.size > 4) {
                                                    Text(
                                                        text = "+${planets.size - 4}",
                                                        color = VedicMutedCharcoal,
                                                        fontSize = 7.5.sp,
                                                        fontWeight = FontWeight.Bold
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
    }
}

private fun getSignIndex(signName: String): Int {
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

private fun getSouthIndianPlanetAbbr(planetName: String): String {
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
