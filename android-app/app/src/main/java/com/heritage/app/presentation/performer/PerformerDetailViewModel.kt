package com.heritage.app.presentation.performer

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.usecase.GetPerformerByIdUseCase
import com.heritage.app.domain.usecase.GetPerformerContentUseCase
import com.heritage.app.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject

data class PerformerDetailState(
    val performer: Performer? = null,
    val content: List<Content> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingContent: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class PerformerDetailViewModel @Inject constructor(
    private val getPerformerByIdUseCase: GetPerformerByIdUseCase,
    private val getPerformerContentUseCase: GetPerformerContentUseCase
) : ViewModel() {

    private val _state = mutableStateOf(PerformerDetailState())
    val state: State<PerformerDetailState> = _state

    fun loadPerformer(performerId: String) {
        loadPerformerInfo(performerId)
        loadPerformerContent(performerId)
    }

    private fun loadPerformerInfo(performerId: String) {
        getPerformerByIdUseCase(performerId).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        performer = result.data,
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

    private fun loadPerformerContent(performerId: String) {
        getPerformerContentUseCase(performerId).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        content = result.data ?: emptyList(),
                        isLoadingContent = false
                    )
                }
                is Resource.Error -> {
                    _state.value = _state.value.copy(
                        isLoadingContent = false
                    )
                }
                is Resource.Loading -> {
                    _state.value = _state.value.copy(isLoadingContent = true)
                }
            }
        }.launchIn(viewModelScope)
    }
}
