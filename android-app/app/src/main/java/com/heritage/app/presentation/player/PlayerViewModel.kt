package com.heritage.app.presentation.player

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.usecase.GetContentByIdUseCase
import com.heritage.app.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject

data class PlayerState(
    val content: Content? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isPlaying: Boolean = false,
    val currentPosition: Long = 0L,
    val duration: Long = 0L,
    val isBuffering: Boolean = false
)

@HiltViewModel
class PlayerViewModel @Inject constructor(
    private val getContentByIdUseCase: GetContentByIdUseCase,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _state = mutableStateOf(PlayerState())
    val state: State<PlayerState> = _state

    private val contentId: String = checkNotNull(savedStateHandle["contentId"])

    init {
        loadContent()
    }

    private fun loadContent() {
        getContentByIdUseCase(contentId).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        content = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(
                        error = result.message,
                        isLoading = false
                    )
                }
                is Resource.Loading -> {
                    _state.value = _state.value.copy(isLoading = true)
                }
            }
        }.launchIn(viewModelScope)
    }

    fun onPlayPause() {
        _state.value = _state.value.copy(
            isPlaying = !_state.value.isPlaying
        )
    }

    fun onSeek(position: Long) {
        _state.value = _state.value.copy(
            currentPosition = position
        )
    }

    fun updatePosition(position: Long) {
        _state.value = _state.value.copy(
            currentPosition = position
        )
    }

    fun updateDuration(duration: Long) {
        _state.value = _state.value.copy(
            duration = duration
        )
    }

    fun setBuffering(isBuffering: Boolean) {
        _state.value = _state.value.copy(
            isBuffering = isBuffering
        )
    }

    fun retry() {
        loadContent()
    }
}
