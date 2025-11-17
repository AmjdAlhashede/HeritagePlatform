package com.heritage.app.presentation.player

import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.navigation.NavController
import coil3.compose.AsyncImage
import com.heritage.app.R
import com.heritage.app.presentation.components.ErrorState
import com.heritage.app.presentation.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    contentId: String,
    navController: NavController,
    viewModel: PlayerViewModel = hiltViewModel()
) {
    val state = viewModel.state.value
    val context = LocalContext.current
    
    var showControls by remember { mutableStateOf(true) }
    
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    when (playbackState) {
                        Player.STATE_BUFFERING -> viewModel.setBuffering(true)
                        Player.STATE_READY -> viewModel.setBuffering(false)
                        else -> {}
                    }
                }
            })
        }
    }
    
    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
        }
    }
    
    LaunchedEffect(state.content) {
        state.content?.let { content ->
            val mediaUrl = if (content.isVideo) content.hlsUrl else content.audioUrl
            mediaUrl?.let {
                val mediaItem = MediaItem.fromUri("http://10.0.2.2:3000$it")
                exoPlayer.setMediaItem(mediaItem)
                exoPlayer.prepare()
            }
        }
    }

    Scaffold(
        topBar = {
            AnimatedVisibility(
                visible = showControls || state.content?.isAudio == true,
                enter = fadeIn() + slideInVertically(),
                exit = fadeOut() + slideOutVertically()
            ) {
                TopAppBar(
                    title = {
                        Text(
                            text = state.content?.title ?: stringResource(R.string.now_playing),
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navController.navigateUp() }) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = stringResource(R.string.back)
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = if (state.content?.isVideo == true) 
                            Color.Black.copy(alpha = 0.7f) 
                        else 
                            MaterialTheme.colorScheme.surface
                    )
                )
            }
        },
        containerColor = if (state.content?.isVideo == true) Color.Black else MaterialTheme.colorScheme.background
    ) { padding ->
        when {
            state.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    LoadingState(message = stringResource(R.string.loading))
                }
            }
            
            state.error != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    ErrorState(
                        title = stringResource(R.string.error),
                        message = state.error,
                        onRetry = { viewModel.retry() }
                    )
                }
            }
            
            state.content != null -> {
                if (state.content.isVideo) {
                    VideoPlayer(
                        exoPlayer = exoPlayer,
                        content = state.content,
                        showControls = showControls,
                        onToggleControls = { showControls = !showControls },
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                    )
                } else {
                    AudioPlayer(
                        exoPlayer = exoPlayer,
                        content = state.content,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                    )
                }
            }
        }
    }
}

@Composable
private fun VideoPlayer(
    exoPlayer: ExoPlayer,
    content: com.heritage.app.domain.model.Content,
    showControls: Boolean,
    onToggleControls: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clickable(
                indication = null,
                interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
            ) { onToggleControls() }
    ) {
        AndroidView(
            factory = { context ->
                PlayerView(context).apply {
                    player = exoPlayer
                    useController = false
                    layoutParams = FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
            },
            modifier = Modifier.fillMaxSize()
        )
        
        AnimatedVisibility(
            visible = showControls,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.Center)
        ) {
            VideoControls(exoPlayer = exoPlayer)
        }
    }
}

@Composable
private fun AudioPlayer(
    exoPlayer: ExoPlayer,
    content: com.heritage.app.domain.model.Content,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Spacer(modifier = Modifier.weight(0.5f))
        
        // Artwork
        Card(
            modifier = Modifier
                .size(300.dp)
                .clip(RoundedCornerShape(24.dp)),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            if (content.thumbnailUrl != null) {
                AsyncImage(
                    model = "http://10.0.2.2:3000${content.thumbnailUrl}",
                    contentDescription = content.title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.MusicNote,
                        contentDescription = null,
                        modifier = Modifier.size(120.dp),
                        tint = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Title & Performer
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = content.title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            content.performer?.let {
                Text(
                    text = it.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        // Controls
        AudioControls(exoPlayer = exoPlayer)
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
private fun VideoControls(
    exoPlayer: ExoPlayer
) {
    var isPlaying by remember { mutableStateOf(exoPlayer.isPlaying) }
    
    LaunchedEffect(exoPlayer) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }
        }
        exoPlayer.addListener(listener)
    }
    
    Surface(
        modifier = Modifier.size(80.dp),
        shape = CircleShape,
        color = Color.White.copy(alpha = 0.9f)
    ) {
        IconButton(
            onClick = {
                if (isPlaying) exoPlayer.pause() else exoPlayer.play()
            },
            modifier = Modifier.fillMaxSize()
        ) {
            Icon(
                imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                contentDescription = if (isPlaying) "Pause" else "Play",
                modifier = Modifier.size(48.dp),
                tint = Color.Black
            )
        }
    }
}

@Composable
private fun AudioControls(
    exoPlayer: ExoPlayer
) {
    var isPlaying by remember { mutableStateOf(exoPlayer.isPlaying) }
    var currentPosition by remember { mutableStateOf(0L) }
    var duration by remember { mutableStateOf(0L) }
    
    LaunchedEffect(exoPlayer) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }
        }
        exoPlayer.addListener(listener)
        
        while (true) {
            currentPosition = exoPlayer.currentPosition
            duration = exoPlayer.duration.coerceAtLeast(0L)
            kotlinx.coroutines.delay(100)
        }
    }
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Progress bar
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Slider(
                value = if (duration > 0) currentPosition.toFloat() / duration else 0f,
                onValueChange = { value ->
                    exoPlayer.seekTo((value * duration).toLong())
                },
                modifier = Modifier.fillMaxWidth()
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = formatTime(currentPosition),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = formatTime(duration),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        // Control buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { exoPlayer.seekTo(exoPlayer.currentPosition - 10000) }
            ) {
                Icon(
                    Icons.Default.Replay10,
                    contentDescription = "Replay 10s",
                    modifier = Modifier.size(32.dp)
                )
            }
            
            Surface(
                modifier = Modifier.size(72.dp),
                shape = CircleShape,
                color = MaterialTheme.colorScheme.primary
            ) {
                IconButton(
                    onClick = {
                        if (isPlaying) exoPlayer.pause() else exoPlayer.play()
                    },
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                        contentDescription = if (isPlaying) "Pause" else "Play",
                        modifier = Modifier.size(40.dp),
                        tint = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
            
            IconButton(
                onClick = { exoPlayer.seekTo(exoPlayer.currentPosition + 10000) }
            ) {
                Icon(
                    Icons.Default.Forward10,
                    contentDescription = "Forward 10s",
                    modifier = Modifier.size(32.dp)
                )
            }
        }
    }
}

private fun formatTime(millis: Long): String {
    val seconds = (millis / 1000).toInt()
    val minutes = seconds / 60
    val secs = seconds % 60
    return String.format("%d:%02d", minutes, secs)
}

