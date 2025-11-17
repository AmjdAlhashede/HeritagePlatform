package com.heritage.app.presentation.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Home : Screen("home")
    object Categories : Screen("categories")
    object CategoryDetail : Screen("category/{categoryId}") {
        fun createRoute(categoryId: String) = "category/$categoryId"
    }
    object Performers : Screen("performers")
    object Performer : Screen("performer/{performerId}") {
        fun createRoute(performerId: String) = "performer/$performerId"
    }
    object ContentDetail : Screen("content/{contentId}") {
        fun createRoute(contentId: String) = "content/$contentId"
    }
    object AllContent : Screen("all-content")
    object Player : Screen("player/{contentId}") {
        fun createRoute(contentId: String) = "player/$contentId"
    }
    object Search : Screen("search")
    object Downloads : Screen("downloads")
    object Settings : Screen("settings")
}
