package com.heritage.app.presentation.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    object Home : BottomNavItem(
        route = Screen.Home.route,
        title = "الرئيسية",
        icon = Icons.Default.Home
    )
    
    object Categories : BottomNavItem(
        route = Screen.Categories.route,
        title = "الأقسام",
        icon = Icons.Default.Category
    )
    
    object Performers : BottomNavItem(
        route = Screen.Performers.route,
        title = "المؤدين",
        icon = Icons.Default.Person
    )
    
    object Downloads : BottomNavItem(
        route = Screen.Downloads.route,
        title = "التنزيلات",
        icon = Icons.Default.Download
    )
}

fun getBottomNavItems() = listOf(
    BottomNavItem.Home,
    BottomNavItem.Categories,
    BottomNavItem.Performers,
    BottomNavItem.Downloads
)
