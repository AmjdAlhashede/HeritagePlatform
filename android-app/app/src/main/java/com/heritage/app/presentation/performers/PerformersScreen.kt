package com.heritage.app.presentation.performers

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.heritage.app.R
import com.heritage.app.presentation.components.EmptyState
import com.heritage.app.presentation.components.ErrorState
import com.heritage.app.presentation.components.LoadingState
import com.heritage.app.presentation.components.PerformerChip

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PerformersScreen(
    navController: NavController,
    viewModel: PerformersViewModel = hiltViewModel()
) {
    val state = viewModel.state.value
    
    LaunchedEffect(Unit) {
        viewModel.loadPerformers()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = stringResource(R.string.performers),
                        fontWeight = FontWeight.Bold
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.back)
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                state.isLoading -> {
                    LoadingState(
                        message = stringResource(R.string.loading),
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                
                state.error != null -> {
                    ErrorState(
                        title = stringResource(R.string.error),
                        message = state.error,
                        onRetry = { viewModel.loadPerformers() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                
                state.performers.isEmpty() -> {
                    EmptyState(
                        emoji = "🎭",
                        title = stringResource(R.string.no_performers),
                        message = "لا يوجد مؤدون حالياً",
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                
                else -> {
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(110.dp),
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.performers) { performer ->
                            PerformerChip(
                                performer = performer,
                                onClick = {
                                    navController.navigate("performer/${performer.id}")
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
