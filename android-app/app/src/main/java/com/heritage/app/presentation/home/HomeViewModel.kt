package com.heritage.app.presentation.home

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.usecase.*
import com.heritage.app.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeState(
    val isLoading: Boolean = false,
    val trendingContent: List<Content> = emptyList(),
    val recommendedContent: List<Content> = emptyList(),
    val recentContent: List<Content> = emptyList(),
    val performers: List<Performer> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getTrendingContentUseCase: GetTrendingContentUseCase,
    private val getRecommendedContentUseCase: GetRecommendedContentUseCase,
    private val getRecentContentUseCase: GetRecentContentUseCase,
    private val getPerformersUseCase: GetPerformersUseCase
) : ViewModel() {

    private val _state = mutableStateOf(HomeState())
    val state: State<HomeState> = _state

    init {
        loadData()
    }

    fun loadData() {
        loadTrendingContent()
        loadRecommendedContent()
        loadRecentContent()
        loadPerformers()
    }

    private fun loadTrendingContent() {
        getTrendingContentUseCase(limit = 10).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        trendingContent = result.data ?: emptyList(),
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

    private fun loadRecommendedContent() {
        getRecommendedContentUseCase(limit = 10).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        recommendedContent = result.data ?: emptyList()
                    )
                }
                is Resource.Error -> {}
                is Resource.Loading -> {}
            }
        }.launchIn(viewModelScope)
    }

    private fun loadRecentContent() {
        getRecentContentUseCase(limit = 10).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        recentContent = result.data ?: emptyList()
                    )
                }
                is Resource.Error -> {}
                is Resource.Loading -> {}
            }
        }.launchIn(viewModelScope)
    }

    private fun loadPerformers() {
        getPerformersUseCase().onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        performers = result.data ?: emptyList()
                    )
                }
                is Resource.Error -> {}
                is Resource.Loading -> {}
            }
        }.launchIn(viewModelScope)
    }
}
