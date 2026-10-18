package com.example.vedicjyotish.ui.tabs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.theme.*
import com.example.vedicjyotish.ui.components.PlanetaryTable

@Composable
fun PlanetsTab(chart: ChartResponse) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        PlanetaryTable(planetaryRows = chart.planetaryTable)

        // Directional Strengths (Dig Bala)
        val digBalaPlanets = chart.chartData.values
            .flatMap { it.planets }
            .filter { it.digBalaPoints != null && it.digBalaPoints > 0.0 }
            .distinctBy { it.name }
            .sortedByDescending { it.digBalaPoints }

        if (digBalaPlanets.isNotEmpty()) {
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "PLANETARY DIRECTIONAL STRENGTHS (DIG BALA)",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Directional strength coordinates determining a planet's capability to manifest outcomes.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    digBalaPlanets.forEach { p ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0x12FFFFFF))
                                .border(BorderStroke(1.dp, Color(0x18FFFFFF)), RoundedCornerShape(10.dp))
                                .padding(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(p.name, fontSize = 12.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                                Text("${p.digBalaPoints?.toInt() ?: 0} Pts", fontSize = 11.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            val pct = p.digBalaPercentage ?: 0.0
                            LinearProgressIndicator(
                                progress = { (pct / 100.0).toFloat().coerceIn(0f, 1f) },
                                color = LiquidGold,
                                trackColor = Color(0x20FFFFFF),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(5.dp)
                                    .clip(RoundedCornerShape(2.5.dp))
                            )
                            Spacer(modifier = Modifier.height(3.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Lagna Power", fontSize = 9.sp, color = TextMuted)
                                Text("${pct.toInt()}%", fontSize = 9.sp, color = AstralCyan)
                            }
                        }
                    }
                }
            }
        }

        // Jaimini Lagnas & Karakas
        chart.jaimini?.let { jaimini ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "JAIMINI SPECIAL LAGNAS & KARAKAS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Focal coordinates representing soul desires, material status, and public image.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Lagnas grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val lagnas = listOf(
                        Triple("Arudha Lagna (AL)", jaimini.arudhaLagna.sign, jaimini.arudhaLagna.house),
                        Triple("Upapada Lagna (UL)", jaimini.upapadaLagna.sign, jaimini.upapadaLagna.house),
                        Triple("Karakamsha (KL)", jaimini.karakamshaLagna.sign, jaimini.karakamshaLagna.house)
                    )
                    lagnas.forEach { (name, sign, house) ->
                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0x12FFFFFF))
                                .border(BorderStroke(1.dp, Color(0x18FFFFFF)), RoundedCornerShape(10.dp))
                                .padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(name, fontSize = 9.sp, color = TextSecondary, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(sign, fontSize = 12.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                            Text("House $house", fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Chara Karakas (Soul Role Indicators)",
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                val karakaSignificances = listOf(
                    "AK" to ("Atmakaraka" to "Soul indicator, primary spiritual lessons."),
                    "AmK" to ("Amatyakaraka" to "Career, intellect, vocation & counselors."),
                    "BK" to ("Bhratrukaraka" to "Siblings, guides & gurus."),
                    "MK" to ("Matrukaraka" to "Mother, home, emotional peace & luxury."),
                    "PiK" to ("Pitrukaraka" to "Father, lineage, ancestors & duty."),
                    "PK" to ("Putrakaraka" to "Children, creative intelligence & learning."),
                    "GK" to ("Gnatikaraka" to "Rivals, disputes, tests & health hurdles."),
                    "DK" to ("Darakaraka" to "Spouse, partnership & physical longevity.")
                )

                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    karakaSignificances.forEach { (code, data) ->
                        val (fullName, meaning) = data
                        val planet = jaimini.charaKarakas.entries.find { it.value.contains(code) }?.key ?: "None"
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0x10FFFFFF))
                                .padding(horizontal = 10.dp, vertical = 7.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("$code ($fullName)", fontSize = 11.sp, color = TextPrimary, fontWeight = FontWeight.Bold)
                                Text(meaning, fontSize = 9.sp, color = TextSecondary)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(planet, fontSize = 11.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Graha & Rasi Aspects
        chart.aspects?.let { aspects ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "GRAHA & RASI ASPECTS",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Graha Drishti (planetary desire aspects) and Rasi Drishti (sign-based spatial aspects).",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                // Graha Drishti
                Text(
                    text = "Graha Drishti (Planetary Aspects)",
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    aspects.grahaDrishti.forEach { (planet, details) ->
                        if (details.aspectedPlanets.isNotEmpty() || details.aspectedSigns.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0x10FFFFFF))
                                    .padding(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(planet, fontSize = 11.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                                    Text("Houses: ${details.aspectedHouses.joinToString(", ")}", fontSize = 9.sp, color = TextSecondary)
                                }
                                Spacer(modifier = Modifier.height(3.dp))
                                Text("Aspected Planets: ${details.aspectedPlanets.joinToString(", ").ifEmpty { "None" }}", fontSize = 10.sp, color = TextPrimary)
                                Text("Aspected Signs: ${details.aspectedSigns.joinToString(", ").ifEmpty { "None" }}", fontSize = 10.sp, color = AstralCyan)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Rasi Drishti
                Text(
                    text = "Rasi Drishti (Sign Aspects)",
                    color = TextPrimary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    aspects.rasiDrishti.forEach { (sign, details) ->
                        if (details.aspectedPlanets.isNotEmpty() || details.aspectedSigns.isNotEmpty()) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0x10FFFFFF))
                                    .padding(8.dp)
                            ) {
                                Text(sign, fontSize = 11.sp, color = AstralCyan, fontWeight = FontWeight.Bold)
                                Spacer(modifier = Modifier.height(3.dp))
                                Text("Aspected Signs: ${details.aspectedSigns.joinToString(", ")}", fontSize = 10.sp, color = TextPrimary)
                                Text("Aspected Planets: ${details.aspectedPlanets.joinToString(", ").ifEmpty { "None" }}", fontSize = 10.sp, color = TextSecondary)
                            }
                        }
                    }
                }
            }
        }
    }
}
