package com.example.vedicjyotish.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.HouseData
import com.example.vedicjyotish.theme.*

@Composable
fun HouseInspectorDialog(
    houseNumber: Int,
    signName: String,
    houseData: HouseData?,
    onDismiss: () -> Unit
) {
    val sanskritHouseNames = listOf(
        "Tanu Bhava (Self & Vitality)",
        "Dhana Bhava (Wealth & Speech)",
        "Sahaja Bhava (Courage & Siblings)",
        "Sukha Bhava (Mother & Happiness)",
        "Putra Bhava (Children & Intellect)",
        "Ari Bhava (Health & Service)",
        "Kalathra Bhava (Spouse & Partnerships)",
        "Randhra Bhava (Longevity & Transformation)",
        "Dharma Bhava (Fortune & Higher Wisdom)",
        "Karma Bhava (Career & Public Status)",
        "Labha Bhava (Gains & Social Circles)",
        "Vyaya Bhava (Expenditure & Liberation)"
    )

    val houseSignifications = listOf(
        "Physical body, self-identity, personality, longevity, and overall vitality.",
        "Accumulated wealth, speech eloquence, family heritage, food intake, and visual perception.",
        "Siblings, courage, communicative power, short travels, manual skills, and artistic drive.",
        "Mother, landed property, conveyances, domestic happiness, and inner emotional peace.",
        "Children, creative intelligence, speculative investments, romantic inclinations, and past-life merits.",
        "Physical health hurdles, competitive edge, litigation, debts, daily service, and dispute resolution.",
        "Spouse, marriage harmony, legal contracts, business partnerships, and diplomacy.",
        "Longevity, hidden secrets, mystical studies, sudden inheritances, transformation, and regeneration.",
        "Higher philosophy, spiritual guides (Gurus), ethical values, long voyages, and divine fortune.",
        "Profession, career pinnacle, reputation, public leadership, authority, and father.",
        "Financial gains, fulfilment of desires, influential networks, and elder siblings.",
        "Foreign journeys, subconscious realms, charity, expenses, isolation, and spiritual liberation (Moksha)."
    )

    val signLords = mapOf(
        "Aries" to "Mars (Mangal)",
        "Taurus" to "Venus (Shukra)",
        "Gemini" to "Mercury (Budh)",
        "Cancer" to "Moon (Chandra)",
        "Leo" to "Sun (Surya)",
        "Virgo" to "Mercury (Budh)",
        "Libra" to "Venus (Shukra)",
        "Scorpio" to "Mars / Ketu",
        "Sagittarius" to "Jupiter (Guru)",
        "Capricorn" to "Saturn (Shani)",
        "Aquarius" to "Saturn / Rahu",
        "Pisces" to "Jupiter (Guru)"
    )

    val houseIdx = (houseNumber - 1).coerceIn(0, 11)
    val bhavaTitle = sanskritHouseNames[houseIdx]
    val signification = houseSignifications[houseIdx]
    val lord = signLords[signName] ?: "Ruler"

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = ParchmentCardBg,
        shape = RoundedCornerShape(20.dp),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "HOUSE $houseNumber: $signName".uppercase(),
                        color = VedicTerracotta,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = bhavaTitle,
                        color = VedicGold,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = VedicMutedCharcoal
                    )
                }
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Lord & Signification summary card
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = ParchmentBg,
                    border = BorderStroke(1.dp, VedicBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "HOUSE LORD",
                                fontSize = 10.sp,
                                color = VedicMutedCharcoal,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = lord,
                                fontSize = 11.5.sp,
                                color = VedicTerracotta,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = signification,
                            fontSize = 11.sp,
                            color = VedicCharcoal,
                            lineHeight = 15.sp
                        )
                    }
                }

                // Occupant Planets
                val planets = houseData?.planets ?: emptyList()
                Text(
                    text = if (planets.isEmpty()) "OCCUPANT PLANETS: NONE" else "OCCUPANT PLANETS (${planets.size})",
                    fontSize = 11.sp,
                    color = VedicMutedCharcoal,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.8.sp
                )

                if (planets.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        planets.forEach { p ->
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = ParchmentBg,
                                border = BorderStroke(1.dp, VedicLightBorder),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.Stars,
                                            contentDescription = null,
                                            tint = if (p.retrograde) InauspiciousRed else VedicGold,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Column {
                                            Text(
                                                text = p.name + if (p.retrograde) " (R)" else "",
                                                fontSize = 12.5.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = VedicCharcoal
                                            )
                                            if (p.nakshatra.isNotEmpty()) {
                                                Text(
                                                    text = "${p.nakshatra} (Pada ${p.nakshatraPada})",
                                                    fontSize = 10.sp,
                                                    color = VedicMutedCharcoal
                                                )
                                            }
                                        }
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        if (p.degInSign > 0.0) {
                                            val degInt = p.degInSign.toInt()
                                            val minInt = ((p.degInSign - degInt) * 60).toInt()
                                            Text(
                                                text = "$degInt°$minInt'",
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = VedicTerracotta
                                            )
                                        }
                                        if (p.combust) {
                                            Text(
                                                text = "Combust",
                                                fontSize = 9.sp,
                                                color = VedicAmber,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    Text(
                        text = "This house has no occupant planets. Its significations are primarily governed by the placement and aspects of its lord: $lord.",
                        fontSize = 11.sp,
                        color = VedicMutedCharcoal,
                        fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    text = "Close",
                    color = VedicTerracotta,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    )
}
