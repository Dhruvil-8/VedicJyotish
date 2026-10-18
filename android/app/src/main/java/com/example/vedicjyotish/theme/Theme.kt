package com.example.vedicjyotish.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val VedicParchmentColorScheme = lightColorScheme(
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
fun VedicJyotishTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = VedicParchmentColorScheme,
        typography = Typography,
        content = content
    )
}
