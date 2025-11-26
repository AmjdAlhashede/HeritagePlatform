package com.heritage.app.presentation.navigation

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.heritage.app.presentation.downloads.DownloadsScreen
import com.heritage.app.presentation.home.HomeScreen
import com.heritage.app.presentation.performer.PerformerDetailScreen
import com.heritage.app.presentation.player.PlayerScreen
import com.heritage.app.presentation.search.SearchScreen
import com.heritage.app.presentation.splash.SplashScreen

@Composable
fun HeritageNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route,
        enterTransition = {
            fadeIn(animationSpec = tween(300)) + 
                    slideInHorizontally(animationSpec = tween(300)) { it / 4 }
        },
        exitTransition = {
            fadeOut(animationSpec = tween(300)) + 
                    slideOutHorizontally(animationSpec = tween(300)) { -it / 4 }
        },
        popEnterTransition = {
            fadeIn(animationSpec = tween(300)) + 
                    slideInHorizontally(animationSpec = tween(300)) { -it / 4 }
        },
        popExitTransition = {
            fadeOut(animationSpec = tween(300)) + 
                    slideOutHorizontally(animationSpec = tween(300)) { it / 4 }
        }
    ) {
        // Splash Screen
        composable(
            route = Screen.Splash.route,
            enterTransition = { fadeIn(tween(300)) },
            exitTransition = { fadeOut(tween(300)) }
        ) {
            SplashScreen(
                onNavigateToHome = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                }
            )
        }

        // Home Screen
        composable(Screen.Home.route) {
            HomeScreen(
                onContentClick = { contentId ->
                    navController.navigate(Screen.Player.createRoute(contentId))
                },
                onPerformerClick = { performerId ->
                    navController.navigate(Screen.Performer.createRoute(performerId))
                },
                onSearchClick = {
                    navController.navigate(Screen.Search.route)
                }
            )
        }

        // Player Screen
        composable(
            route = Screen.Player.route,
            arguments = listOf(navArgument("contentId") { type = NavType.StringType })
        ) { backStackEntry ->
            val contentId = backStackEntry.arguments?.getString("contentId") ?: return@composable
            PlayerScreen(
                contentId = contentId,
                navController = navController
            )
        }

        // Performer Detail Screen
        composable(
            route = Screen.Performer.route,
            arguments = listOf(navArgument("performerId") { type = NavType.StringType })
        ) { backStackEntry ->
            val performerId = backStackEntry.arguments?.getString("performerId") ?: return@composable
            PerformerDetailScreen(
                performerId = performerId,
                navController = navController
            )
        }

        // Search Screen
        composable(Screen.Search.route) {
            SearchScreen(navController = navController)
        }

        // Downloads Screen
        composable(Screen.Downloads.route) {
            DownloadsScreen(navController = navController)
        }
    }
}
