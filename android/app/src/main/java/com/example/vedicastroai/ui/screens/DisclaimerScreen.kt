package com.example.vedicastroai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicastroai.theme.ParchmentBg
import com.example.vedicastroai.theme.VedicCharcoal
import com.example.vedicastroai.theme.VedicGold
import com.example.vedicastroai.theme.VedicTerracotta

@Composable
fun DisclaimerScreen(
    onAccept: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ParchmentBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f, fill = false)
                .verticalScroll(scrollState),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFFFAF9F6)),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Celestial Icon Placeholder (drawn or simple text character)
                Text(
                    text = "✦",
                    color = VedicGold,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "VEDIC JYOTISH",
                    color = VedicTerracotta,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 4.sp,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "ANCIENT WISDOM • GEMINI INSIGHTS",
                    color = VedicGold,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 2.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "✦ ASTRONOMIC BETA DISCLAIMER ✦",
                    color = VedicTerracotta,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Welcome, seeker. Vedic Jyotish integrates Vedic Astrology rules with advanced Google Gemini Large Language Models to offer intuitive analysis and spiritual guidance.",
                    color = VedicCharcoal,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF4F3EF), RoundedCornerShape(8.dp))
                        .padding(14.dp)
                ) {
                    Text(
                        text = "Important Spiritual Rules:",
                        color = VedicTerracotta,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                    BulletItem("This application is for educational, entertainment, and self-discovery purposes only.")
                    BulletItem("Astrological calculations are mathematical projections using the Swiss Ephemeris and do not constitute absolute legal, medical, or financial advice.")
                    BulletItem("Generative AI can sometimes synthesize speculative readings. Always exercise personal agency and wisdom when making major life decisions.")
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onAccept,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = VedicTerracotta),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text(
                        text = "I ACCEPT & SEEK WISDOM",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun BulletItem(text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "•",
            color = VedicGold,
            fontSize = 14.sp,
            modifier = Modifier.padding(end = 6.dp)
        )
        Text(
            text = text,
            color = VedicCharcoal,
            fontSize = 11.sp,
            lineHeight = 15.sp,
            modifier = Modifier.weight(1f)
        )
    }
}
