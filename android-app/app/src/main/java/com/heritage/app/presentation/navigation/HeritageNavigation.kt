package com.heritage.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.heritage.app.presentation.performers.PerformersScreen

@Composable
fun HeritageNavigation() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "performers"
    ) {
        composable("performers") {
            PerformersScreen(navController = navController)
        }
    }
}

