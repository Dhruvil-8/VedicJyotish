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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.data.models.ChartResponse
import com.example.vedicjyotish.theme.*
import com.example.vedicjyotish.ui.components.DashaTimeline
import com.example.vedicjyotish.ui.components.YogaCards

@Composable
fun DashasAndYogasTab(chart: ChartResponse) {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        YogaCards(yogas = chart.yogas)
        DashaTimeline(mahadashas = chart.vimshottariTimeline)

        // Jaimini Chara Dasha
        chart.charaDasha?.let { charaDasha ->
            VedicCard(
                shape = RoundedCornerShape(18.dp),
                contentPadding = 16.dp
            ) {
                Text(
                    text = "JAIMINI CHARA DASHA",
                    color = LiquidGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
                Text(
                    text = "Sign-based cyclic timeline mapping spiritual and material periods of experiences.",
                    color = TextSecondary,
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 12.dp)
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    charaDasha.periods.forEach { period ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0x12FFFFFF))
                                .border(BorderStroke(1.dp, Color(0x18FFFFFF)), RoundedCornerShape(10.dp))
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(period.sign, fontSize = 12.sp, color = LiquidGold, fontWeight = FontWeight.Bold)
                                Text("${period.durationYears} Years Duration", fontSize = 9.sp, color = TextSecondary)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("From: ${period.startDate}", fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                                Text("To: ${period.endDate}", fontSize = 10.sp, color = TextPrimary, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }
    }
}
