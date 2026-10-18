package com.example.vedicjyotish.theme

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Vedic Design System
 * Inspired by Dimillian/Skills clean modular component architecture and Twitter/X Android mobile UI principles:
 * - Semantic design tokens and atomic building blocks
 * - Warm Vedic Parchment palette (#F4F3EF, #FAF9F6, #8B4513, #B8860B, #262421)
 * - Restrained hairlines, soft elevations, and tactile pill-segmented controls
 * - Zero technical clutter on primary surfaces
 */

/**
 * Clean card container with subtle hairline border and warm parchment surface.
 */
@Composable
fun VedicCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(16.dp),
    backgroundColor: Color = ParchmentCardBg,
    borderColor: Color = VedicBorder,
    borderWidth: Dp = 1.dp,
    contentPadding: Dp = 16.dp,
    shadowElevation: Dp = 1.5.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        modifier = modifier,
        shape = shape,
        color = backgroundColor,
        border = BorderStroke(borderWidth, borderColor),
        shadowElevation = shadowElevation
    ) {
        Column(modifier = Modifier.padding(contentPadding)) {
            content()
        }
    }
}

/**
 * Pill badge for tags, statuses, planetary states, and dignities.
 */
@Composable
fun VedicBadge(
    text: String,
    modifier: Modifier = Modifier,
    accentColor: Color = VedicTerracotta,
    textColor: Color = VedicCharcoal,
    fontSize: Int = 11,
    shape: Shape = RoundedCornerShape(20.dp)
) {
    Box(
        modifier = modifier
            .clip(shape)
            .background(accentColor.copy(alpha = 0.12f))
            .border(
                BorderStroke(1.dp, accentColor.copy(alpha = 0.35f)),
                shape
            )
            .padding(horizontal = 10.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = textColor,
            fontSize = fontSize.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 0.3.sp
        )
    }
}

/**
 * Modern pill-segmented tab control with smooth terracotta active indicator.
 * Inspired by Twitter/X timeline tab switchers and Dimillian segmented controls.
 */
@Composable
fun VedicSegmentedControl(
    options: List<String>,
    selectedIndex: Int,
    onOptionSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = Color(0xFFEDE9DF),
    activeColor: Color = VedicTerracotta,
    activeTextColor: Color = Color.White,
    inactiveTextColor: Color = VedicMutedCharcoal
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(containerColor)
            .border(BorderStroke(1.dp, Color(0x228B4513)), RoundedCornerShape(14.dp))
            .padding(3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        options.forEachIndexed { index, title ->
            val isSelected = index == selectedIndex
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(11.dp))
                    .background(if (isSelected) activeColor else Color.Transparent)
                    .clickable { onOptionSelected(index) }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = title,
                    fontSize = 12.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                    color = if (isSelected) activeTextColor else inactiveTextColor
                )
            }
        }
    }
}

/**
 * Profile Avatar Pill or Circle for navigation drawer opening and profile display.
 * Signature Twitter/X top-left avatar pattern.
 */
@Composable
fun VedicAvatarPill(
    initials: String,
    modifier: Modifier = Modifier,
    size: Dp = 36.dp,
    backgroundColor: Color = VedicTerracotta.copy(alpha = 0.15f),
    textColor: Color = VedicTerracotta,
    borderColor: Color = VedicTerracotta.copy(alpha = 0.4f),
    onClick: (() -> Unit)? = null
) {
    val boxModifier = modifier
        .size(size)
        .clip(CircleShape)
        .background(backgroundColor)
        .border(BorderStroke(1.dp, borderColor), CircleShape)
        .then(
            if (onClick != null) {
                Modifier.clickable(onClick = onClick)
            } else Modifier
        )

    Box(
        modifier = boxModifier,
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = initials,
            color = textColor,
            fontSize = (size.value * 0.38f).sp,
            fontWeight = FontWeight.Bold
        )
    }
}

/**
 * Clean Section Header for settings lists, drawer menus, and data breakdowns.
 */
@Composable
fun VedicSectionHeader(
    title: String,
    modifier: Modifier = Modifier,
    color: Color = VedicTerracotta,
    fontSize: Int = 11,
    letterSpacing: Double = 1.2
) {
    Text(
        text = title.uppercase(),
        color = color,
        fontSize = fontSize.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = letterSpacing.sp,
        modifier = modifier.padding(horizontal = 4.dp, vertical = 6.dp)
    )
}

/**
 * Clean semantic list row with leading icon, title, subtitle, and optional trailing element.
 * Follows Twitter Android & Dimillian list patterns.
 */
@Composable
fun VedicListRow(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    leadingIcon: ImageVector? = null,
    iconTint: Color = VedicTerracotta,
    trailing: @Composable (() -> Unit)? = null,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .then(
                if (onClick != null) {
                    Modifier.clickable(onClick = onClick)
                } else Modifier
            )
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (leadingIcon != null) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(iconTint.copy(alpha = 0.10f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = leadingIcon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = VedicCharcoal
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = VedicMutedCharcoal
                )
            }
        }

        if (trailing != null) {
            Spacer(modifier = Modifier.width(8.dp))
            trailing()
        }
    }
}

// =========================================================================
// Backward-Compatibility Aliases (Deprecated)
// Allows seamless migration while keeping old calls working until updated.
// =========================================================================

@Deprecated("Use VedicCard instead", ReplaceWith("VedicCard(modifier, shape, backgroundColor, borderColor, 1.dp, contentPadding, 2.dp, content)"))
@Composable
fun LiquidGlassCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(16.dp),
    backgroundColor: Color = ParchmentCardBg,
    borderColor: Color = VedicBorder,
    contentPadding: Dp = 16.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    VedicCard(
        modifier = modifier,
        shape = shape,
        backgroundColor = backgroundColor,
        borderColor = borderColor,
        contentPadding = contentPadding,
        content = content
    )
}

@Deprecated("Use VedicBadge instead", ReplaceWith("VedicBadge(text, modifier, accentColor, textColor, fontSize)"))
@Composable
fun LiquidGlassBadge(
    text: String,
    modifier: Modifier = Modifier,
    accentColor: Color = VedicTerracotta,
    textColor: Color = VedicCharcoal,
    fontSize: Int = 11
) {
    VedicBadge(
        text = text,
        modifier = modifier,
        accentColor = accentColor,
        textColor = textColor,
        fontSize = fontSize
    )
}

@Deprecated("Use VedicSegmentedControl instead", ReplaceWith("VedicSegmentedControl(options, selectedIndex, onOptionSelected, modifier)"))
@Composable
fun LiquidGlassSegmentedControl(
    options: List<String>,
    selectedIndex: Int,
    onOptionSelected: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    VedicSegmentedControl(
        options = options,
        selectedIndex = selectedIndex,
        onOptionSelected = onOptionSelected,
        modifier = modifier
    )
}
