package com.heritage.app.util

import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

enum class WindowSize {
    COMPACT,  // Phones in portrait
    MEDIUM,   // Tablets in portrait, phones in landscape
    EXPANDED  // Tablets in landscape
}

data class WindowSizeInfo(
    val widthSizeClass: WindowSize,
    val heightSizeClass: WindowSize,
    val screenWidth: Dp,
    val screenHeight: Dp
)

@Composable
fun rememberWindowSizeInfo(): WindowSizeInfo {
    val configuration = LocalConfiguration.current
    val screenWidth = configuration.screenWidthDp.dp
    val screenHeight = configuration.screenHeightDp.dp
    
    return WindowSizeInfo(
        widthSizeClass = when {
            screenWidth < 600.dp -> WindowSize.COMPACT
            screenWidth < 840.dp -> WindowSize.MEDIUM
            else -> WindowSize.EXPANDED
        },
        heightSizeClass = when {
            screenHeight < 480.dp -> WindowSize.COMPACT
            screenHeight < 900.dp -> WindowSize.MEDIUM
            else -> WindowSize.EXPANDED
        },
        screenWidth = screenWidth,
        screenHeight = screenHeight
    )
}

// Responsive values based on screen size
@Composable
fun responsiveCardWidth(windowSize: WindowSizeInfo): Dp {
    return when (windowSize.widthSizeClass) {
        WindowSize.COMPACT -> 160.dp
        WindowSize.MEDIUM -> 200.dp
        WindowSize.EXPANDED -> 240.dp
    }
}

@Composable
fun responsiveFeaturedHeight(windowSize: WindowSizeInfo): Dp {
    return when (windowSize.widthSizeClass) {
        WindowSize.COMPACT -> 220.dp
        WindowSize.MEDIUM -> 280.dp
        WindowSize.EXPANDED -> 340.dp
    }
}

@Composable
fun responsiveGridColumns(windowSize: WindowSizeInfo): Int {
    return when (windowSize.widthSizeClass) {
        WindowSize.COMPACT -> 2
        WindowSize.MEDIUM -> 3
        WindowSize.EXPANDED -> 4
    }
}

@Composable
fun responsivePadding(windowSize: WindowSizeInfo): Dp {
    return when (windowSize.widthSizeClass) {
        WindowSize.COMPACT -> 16.dp
        WindowSize.MEDIUM -> 24.dp
        WindowSize.EXPANDED -> 32.dp
    }
}
