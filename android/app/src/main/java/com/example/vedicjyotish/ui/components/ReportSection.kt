package com.example.vedicjyotish.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
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
import com.example.vedicjyotish.theme.*


@Composable
fun ReportSection(
    reportText: String,
    isGenerating: Boolean,
    errorMsg: String?,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0x18FFFFFF), RoundedCornerShape(18.dp))
            .border(androidx.compose.foundation.BorderStroke(1.dp, GlassBorder), RoundedCornerShape(18.dp))
            .padding(16.dp)
    ) {
        // --- HEADER ---
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "DEEP CELESTIAL ANALYSIS",
                    color = LiquidGold,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.5.sp
                )
                Text(
                    text = "Comprehensive Astrological AI Synthesis",
                    color = AstralCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            if (!isGenerating && reportText.isNotEmpty()) {
                IconButton(onClick = onRetryClick) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Regenerate Report",
                        tint = LiquidGold
                    )
                }
            }
        }

        HorizontalDivider(color = GlassBorderSubtle)

        Spacer(modifier = Modifier.height(12.dp))

        // --- CONTENT PORTION ---
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            when {
                isGenerating && reportText.isEmpty() -> {
                    // Initial loader
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            color = LiquidGold,
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Consulting celestial alignments with your selected AI...",
                            color = LiquidGold,
                            fontSize = 14.sp,
                            fontStyle = FontStyle.Italic,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Translating ancient charts into profound insights",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp)
                        )
                    }
                }
                    errorMsg != null -> {
                    // Error message
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Star Map Distorted",
                            color = LiquidRose,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = errorMsg,
                            color = TextPrimary,
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 24.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = onRetryClick,
                            colors = ButtonDefaults.buttonColors(containerColor = LiquidGold)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = "Retry", modifier = Modifier.size(16.dp), tint = CosmicVoid)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Retry Celestial Reading", fontSize = 13.sp, color = CosmicVoid, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                reportText.isEmpty() -> {
                    // Empty state (should not happen if trigger happens on opening, but just in case)
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Button(
                            onClick = onRetryClick,
                            colors = ButtonDefaults.buttonColors(containerColor = LiquidGold)
                        ) {
                            Text("Generate Full Analysis", color = CosmicVoid, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                else -> {
                    // Streamed / rendered report content
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                    ) {
                        MarkdownText(text = reportText)
                        
                        if (isGenerating) {
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(
                                    color = LiquidGold,
                                    strokeWidth = 2.dp,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Rishi is still writing...",
                                    color = TextSecondary,
                                    fontSize = 12.sp,
                                    fontStyle = FontStyle.Italic
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
