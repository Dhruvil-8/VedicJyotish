package com.example.vedicjyotish.theme

import androidx.compose.ui.graphics.Color

// Web App Aligned Vedic Parchment Palette (oklch precision)
val ParchmentBg = Color(0xFFF4F3EF)              // Warm Parchment Cream (oklch 0.93 0.012 80)
val ParchmentCardBg = Color(0xFFFAF9F6)          // Ivory Card Surface (oklch 0.95 0.008 80)
val ParchmentElevated = Color(0xFFFFFFFF)        // High surface card
val VedicCharcoal = Color(0xFF262421)            // Deep Charcoal text (oklch 0.12 0.02 30)
val VedicTerracotta = Color(0xFF8B4513)          // Rich Terracotta primary (oklch 0.5 0.18 45)
val VedicGold = Color(0xFFB8860B)                // Antique Gold secondary (oklch 0.65 0.16 70)
val VedicBorder = Color(0x338B4513)              // Subtle warm primary border
val VedicMutedCharcoal = Color(0xFF57534E)       // Muted Charcoal text (oklch 0.22 0.03 35)
val VedicLightBorder = Color(0xFFE2DDD2)         // Soft warm hairline border

// Semantic accents
val AuspiciousGreen = Color(0xFF15803D)          // Deep Emerald (Auspicious)
val InauspiciousRed = Color(0xFFB91C1C)          // Deep Crimson (Inauspicious)
val VedicAmber = Color(0xFFD97706)               // Warm Saffron/Amber

// Aliases mapped to the warm web palette
val CosmicVoid = ParchmentBg                     // App background = Warm Parchment
val CosmicCard = ParchmentCardBg                 // Card background = Ivory Card
val GlassSurface = ParchmentCardBg               // Glass surface = Ivory Card
val GlassSurfaceHigh = ParchmentElevated         // White highlight
val GlassBorder = Color(0x288B4513)              // Warm Terracotta border
val GlassBorderSubtle = Color(0x188B4513)        // Subtle separator
val LiquidGold = VedicTerracotta                 // Primary accent = Terracotta
val LiquidGoldDark = VedicGold                   // Secondary accent = Antique Gold
val LiquidAmber = VedicAmber                     // Amber
val LiquidEmerald = AuspiciousGreen              // Auspicious Green
val LiquidRose = InauspiciousRed                 // Inauspicious Red
val AstralCyan = VedicGold                       // Gold accent
val AstralIndigo = VedicTerracotta               // Terracotta accent

// High-contrast clean typography matching the web app
val TextPrimary = VedicCharcoal                  // Deep Charcoal (high contrast on parchment)
val TextSecondary = VedicMutedCharcoal           // Muted Charcoal
val TextMuted = Color(0xFF78716C)                // Tertiary text
