package com.heritage.app.presentation.home

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.heritage.app.R
import com.heritage.app.presentation.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onContentClick: (String) -> Unit,
    onPerformerClick: (String) -> Unit,
    onSearchClick: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state = viewModel.state.value
    val windowSize = com.heritage.app.util.rememberWindowSizeInfo()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = stringResource(R.string.app_name),
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.headlineMedium
                    ) 
                },
                actions = {
                    IconButton(onClick = onSearchClick) {
                        Icon(
                            Icons.Default.Search,
                            contentDescription = stringResource(R.string.search)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        AnimatedContent(
            targetState = when {
                state.isLoading -> ContentState.Loading
                state.error != null -> ContentState.Error
                else -> ContentState.Success
            },
            transitionSpec = {
                fadeIn(animationSpec = tween(300)) togetherWith
                        fadeOut(animationSpec = tween(300))
            },
            label = "content_state"
        ) { contentState ->
            when (contentState) {
                ContentState.Loading -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            CircularProgressIndicator()
                            Text(
                                text = stringResource(R.string.loading),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                
                ContentState.Error -> {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding),
                        contentAlignment = Alignment.Center
                    ) {
                        ErrorState(
                            title = stringResource(R.string.error),
                            message = state.error ?: "حدث خطأ",
                            onRetry = { viewModel.loadData() }
                        )
                    }
                }
                
                ContentState.Success -> {
                    AllSectionsScreen(
                        performers = state.performers,
                        trendingContent = state.trendingContent,
                        recommendedContent = state.recommendedContent,
                        recentContent = state.recentContent,
                        onContentClick = onContentClick,
                        onPerformerClick = onPerformerClick,
                        windowSize = windowSize,
                        modifier = Modifier.padding(padding)
                    )
                }
            }
        }
    }
}

private enum class ContentState {
    Loading, Error, Success
}

@Composable
private fun AllSectionsScreen(
    performers: List<com.heritage.app.domain.model.Performer>,
    trendingContent: List<com.heritage.app.domain.model.Content>,
    recommendedContent: List<com.heritage.app.domain.model.Content>,
    recentContent: List<com.heritage.app.domain.model.Content>,
    onContentClick: (String) -> Unit,
    onPerformerClick: (String) -> Unit,
    windowSize: com.heritage.app.util.WindowSizeInfo,
    modifier: Modifier = Modifier
) {
    val padding = com.heritage.app.util.responsivePadding(windowSize)
    val featuredHeight = com.heritage.app.util.responsiveFeaturedHeight(windowSize)
    val cardWidth = com.heritage.app.util.responsiveCardWidth(windowSize)
    val gridColumns = com.heritage.app.util.responsiveGridColumns(windowSize)
    
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(32.dp),
        contentPadding = PaddingValues(vertical = padding)
    ) {
        // Hero Section - Featured Content
        if (trendingContent.isNotEmpty()) {
            item {
                FeaturedContentCard(
                    content = trendingContent.first(),
                    onClick = { onContentClick(trendingContent.first().id) },
                    height = featuredHeight,
                    modifier = Modifier.padding(horizontal = padding)
                )
            }
        }

        // Trending Section Card (Horizontal - 5 items max)
        if (trendingContent.size > 1) {
            item {
                SectionCard(
                    title = "الأكثر مشاهدة",
                    emoji = "🔥",
                    padding = padding
                ) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(horizontal = padding)
                    ) {
                        items(trendingContent.drop(1).take(5)) { content ->
                            CompactContentCard(
                                content = content,
                                onClick = { onContentClick(content.id) },
                                width = cardWidth
                            )
                        }
                    }
                }
            }
        }

        // Recommended Section Card (Horizontal - 5 items max)
        if (recommendedContent.isNotEmpty()) {
            item {
                SectionCard(
                    title = "موصى به",
                    emoji = "⭐",
                    padding = padding
                ) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(horizontal = padding)
                    ) {
                        items(recommendedContent.take(5)) { content ->
                            CompactContentCard(
                                content = content,
                                onClick = { onContentClick(content.id) },
                                width = cardWidth
                            )
                        }
                    }
                }
            }
        }

        // Recent Section Card (Horizontal - 5 items max)
        if (recentContent.isNotEmpty()) {
            item {
                SectionCard(
                    title = "الأحدث",
                    emoji = "🆕",
                    padding = padding
                ) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(horizontal = padding)
                    ) {
                        items(recentContent.take(5)) { content ->
                            CompactContentCard(
                                content = content,
                                onClick = { onContentClick(content.id) },
                                width = cardWidth
                            )
                        }
                    }
                }
            }
        }

        // All Performers Section (Vertical Grid)
        if (performers.isNotEmpty()) {
            item {
                Text(
                    text = "🎭 جميع المؤدين",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = padding)
                )
            }
            
            items(performers.chunked(gridColumns)) { rowPerformers ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = padding),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    rowPerformers.forEach { performer ->
                        Box(modifier = Modifier.weight(1f)) {
                            PerformerChip(
                                performer = performer,
                                onClick = { onPerformerClick(performer.id) }
                            )
                        }
                    }
                    // Fill empty spaces
                    repeat(gridColumns - rowPerformers.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    emoji: String,
    padding: androidx.compose.ui.unit.Dp,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = padding),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(
            modifier = Modifier.padding(vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = padding),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = emoji,
                    style = MaterialTheme.typography.headlineMedium
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            content()
        }
    }
}


