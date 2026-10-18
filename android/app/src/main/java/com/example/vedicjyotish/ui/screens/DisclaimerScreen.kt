package com.example.vedicjyotish.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.SmartToy
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.theme.*

@Composable
fun DisclaimerScreen(
    onAccept: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()
    val uriHandler = LocalUriHandler.current
    var showDetailedPrivacyDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(ParchmentBg)
            .padding(horizontal = 20.dp, vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f, fill = false)
                .verticalScroll(scrollState),
            shape = RoundedCornerShape(20.dp),
            color = ParchmentCardBg,
            border = BorderStroke(1.dp, VedicBorder),
            shadowElevation = 3.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header & Sacred Vedic Invocation
                Text(
                    text = "VEDIC JYOTISH",
                    color = VedicTerracotta,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 4.sp,
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "॥ ॐ गं गणपतये नमः ॥",
                    color = VedicGold,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 4.dp)
                )

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = "Welcome, seeker. Vedic Jyotish computes authentic classical Parashari astrology calculations directly on your device with high-precision mathematical ephemerides, offering deep celestial reflections and spiritual guidance.",
                    color = VedicCharcoal,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center,
                    lineHeight = 19.sp
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Dignified Terms of Use Card
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = ParchmentBg,
                    border = BorderStroke(1.dp, VedicBorder)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Important Advisory:",
                            color = VedicTerracotta,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )

                        AdvisoryBullet(
                            text = "This application is designed for spiritual self-reflection, philosophical inquiry, and educational study of classical Jyotish principles."
                        )

                        AdvisoryBullet(
                            text = "Astrological forecasts and chart interpretations are mathematical projections and do not substitute certified medical, legal, psychological, or financial counsel."
                        )

                        AdvisoryBullet(
                            text = "AI-synthesized interpretations may occasionally offer speculative reflections. Always exercise personal agency, intellect, and discernment."
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Primary CTA
                Button(
                    onClick = onAccept,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = VedicTerracotta),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Text(
                        text = "I AGREE & ENTER",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        letterSpacing = 1.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Footer Privacy & Terms Links
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Privacy Policy",
                        color = VedicGold,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier
                            .clickable { showDetailedPrivacyDialog = true }
                            .padding(4.dp)
                    )
                    Text(
                        text = "•",
                        color = VedicMutedCharcoal,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 6.dp)
                    )
                    Text(
                        text = "Online Policy",
                        color = VedicGold,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier
                            .clickable {
                                uriHandler.openUri("https://vedic-jyotish.vercel.app/privacy")
                            }
                            .padding(4.dp)
                    )
                }
            }
        }
    }

    // Detailed Privacy Architecture Dialog (Shown only when tapped)
    if (showDetailedPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showDetailedPrivacyDialog = false },
            containerColor = ParchmentCardBg,
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Privacy & Data Architecture",
                        color = VedicTerracotta,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = { showDetailedPrivacyDialog = false }, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = VedicMutedCharcoal)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    PrivacyDetailItem(
                        icon = Icons.Default.Lock,
                        title = "100% On-Device Calculations",
                        desc = "All planetary positions, divisional charts (D1 to D60), Vimshottari Dashas, and Panchanga are calculated entirely on your phone. Zero birth data, coordinates, or device telemetry are uploaded."
                    )
                    PrivacyDetailItem(
                        icon = Icons.Default.SmartToy,
                        title = "User-Selected AI Provider (BYOK)",
                        desc = "You can choose your preferred AI intelligence (Gemini, Claude, OpenAI, Groq, DeepSeek, or local Ollama) by adding your private API key in AI Settings."
                    )
                    PrivacyDetailItem(
                        icon = Icons.Default.VisibilityOff,
                        title = "Data Transmitted to AI",
                        desc = "When consulting the AI Astrologer or generating a deep report, ONLY the anonymized astrological summary (planetary signs, houses, nakshatras) and your chat question are sent. Names, exact birth dates, birth times, phone numbers, GPS coordinates, and device IDs are NEVER transmitted."
                    )
                    PrivacyDetailItem(
                        icon = Icons.Default.Psychology,
                        title = "Local Offline AI (Ollama)",
                        desc = "If you select local Ollama on your home network, 100% of chat interactions stay on your private local network without any internet traffic."
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showDetailedPrivacyDialog = false }) {
                    Text("Close", color = VedicTerracotta, fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}

@Composable
private fun AdvisoryBullet(text: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Text(
            text = "•",
            color = VedicGold,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(end = 6.dp)
        )
        Text(
            text = text,
            color = VedicCharcoal,
            fontSize = 11.5.sp,
            lineHeight = 16.sp,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun PrivacyDetailItem(
    icon: ImageVector,
    title: String,
    desc: String
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = VedicTerracotta,
            modifier = Modifier
                .size(16.dp)
                .padding(top = 2.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = VedicCharcoal
            )
            Text(
                text = desc,
                fontSize = 11.sp,
                color = VedicMutedCharcoal,
                lineHeight = 15.sp
            )
        }
    }
}
