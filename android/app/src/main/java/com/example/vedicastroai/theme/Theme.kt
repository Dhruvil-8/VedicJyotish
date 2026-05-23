package com.example.vedicastroai.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val ParchmentColorScheme = lightColorScheme(
    primary = VedicTerracotta,
    secondary = VedicGold,
    background = ParchmentBg,
    surface = ParchmentCardBg,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = VedicCharcoal,
    onSurface = VedicCharcoal,
    outline = VedicBorder
)

// We maintain the same warm parchment theme for both dark/light to replicate the unique web experience
private val DarkParchmentColorScheme = darkColorScheme(
    primary = VedicTerracotta,
    secondary = VedicGold,
    background = ParchmentBg,
    surface = ParchmentCardBg,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = VedicCharcoal,
    onSurface = VedicCharcoal,
    outline = VedicBorder
)

@Composable
fun VedicAstroAITheme(
    darkTheme: Boolean = false, // Enforce light parchment theme to match web app design
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkParchmentColorScheme else ParchmentColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
