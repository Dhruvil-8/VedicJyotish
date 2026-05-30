package com.example.vedicjyotish.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.vedicjyotish.theme.VedicCharcoal
import com.example.vedicjyotish.theme.VedicGold
import com.example.vedicjyotish.theme.VedicTerracotta

@Composable
fun MarkdownText(
    text: String,
    modifier: Modifier = Modifier
) {
    val lines = text.split("\n")
    Column(modifier = modifier.fillMaxWidth()) {
        lines.forEach { line ->
            val trimmedLine = line.trim()
            when {
                // Header 1: # Title
                trimmedLine.startsWith("# ") -> {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = parseInlineStyles(trimmedLine.removePrefix("# ")),
                        color = VedicTerracotta,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 26.sp,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
                // Header 2: ## Title
                trimmedLine.startsWith("## ") -> {
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = parseInlineStyles(trimmedLine.removePrefix("## ")),
                        color = VedicTerracotta,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 22.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }
                // Header 3: ### Title
                trimmedLine.startsWith("### ") -> {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = parseInlineStyles(trimmedLine.removePrefix("### ")),
                        color = VedicGold,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 18.sp,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }
                // Bullet points: - Bullet or * Bullet
                trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") -> {
                    val bulletText = if (trimmedLine.startsWith("- ")) trimmedLine.removePrefix("- ") else trimmedLine.removePrefix("* ")
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp, horizontal = 4.dp)
                    ) {
                        Text(
                            text = "✦",
                            color = VedicGold,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(end = 8.dp)
                        )
                        Text(
                            text = parseInlineStyles(bulletText),
                            color = VedicCharcoal,
                            fontSize = 13.sp,
                            lineHeight = 18.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                // Blank Line
                trimmedLine.isEmpty() -> {
                    Spacer(modifier = Modifier.height(8.dp))
                }
                // Normal paragraph/line
                else -> {
                    Text(
                        text = parseInlineStyles(line),
                        color = VedicCharcoal,
                        fontSize = 13.sp,
                        lineHeight = 19.sp,
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }
    }
}

/**
 * Super lightweight parser for inline bold (**text**) and italic (*text*) styles.
 */
private fun parseInlineStyles(rawText: String) = buildAnnotatedString {
    var i = 0
    val length = rawText.length

    while (i < length) {
        when {
            // Bold (**text**)
            rawText.startsWith("**", i) -> {
                val endIdx = rawText.indexOf("**", i + 2)
                if (endIdx != -1) {
                    withStyle(style = SpanStyle(fontWeight = FontWeight.Bold, color = VedicCharcoal)) {
                        append(rawText.substring(i + 2, endIdx))
                    }
                    i = endIdx + 2
                } else {
                    append("**")
                    i += 2
                }
            }
            // Italic (*text* or _text_)
            rawText.startsWith("*", i) && !rawText.startsWith("**", i) -> {
                val endIdx = rawText.indexOf("*", i + 1)
                if (endIdx != -1) {
                    withStyle(style = SpanStyle(fontStyle = FontStyle.Italic)) {
                        append(rawText.substring(i + 1, endIdx))
                    }
                    i = endIdx + 1
                } else {
                    append("*")
                    i += 1
                }
            }
            // Normal characters
            else -> {
                append(rawText[i])
                i++
            }
        }
    }
}
