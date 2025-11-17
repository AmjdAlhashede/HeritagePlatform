package com.heritage.app.presentation.content_detail

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.heritage.app.presentation.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContentDetailScreen(
    contentId: String,
    onBackClick: () -> Unit,
    onContentClick: (String) -> Unit,
    onPerformerClick: (String) -> Unit,
    viewModel: ContentDetailViewModel = hiltViewModel()
) {
    val state = viewModel.state.value

    LaunchedEffect(contentId) {
        viewModel.loadContent(contentId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("تفاصيل المحتوى") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, "رجوع")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingState(
                message = "Loading...!",
                modifier = Modifier.padding(padding)
            )
            state.error != null -> ErrorState(
                message = state.error,
                onRetry = { viewModel.loadContent(contentId) },
                modifier = Modifier.padding(padding),
                title = ""
            )
            state.content != null -> ContentDetailContent(
                content = state.content,
                performer = state.performer,
                relatedContent = state.relatedContent,
                comments = state.comments,
                onContentClick = onContentClick,
                onPerformerClick = onPerformerClick,
                onLikeClick = { viewModel.toggleLike() },
                onShareClick = { viewModel.shareContent() },
                onDownloadClick = { viewModel.downloadContent() },
                onCommentSubmit = { viewModel.addComment(it) },
                modifier = Modifier.padding(padding)
            )
        }
    }
}
