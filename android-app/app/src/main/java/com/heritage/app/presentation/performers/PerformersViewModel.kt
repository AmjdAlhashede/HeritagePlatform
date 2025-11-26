package com.heritage.app.presentation.performers

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.usecase.GetPerformersUseCase
import com.heritage.app.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject

data class PerformersState(
    val performers: List<Performer> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class PerformersViewModel @Inject constructor(
    private val getPerformersUseCase: GetPerformersUseCase
) : ViewModel() {

    private val _state = mutableStateOf(PerformersState())
    val state: State<PerformersState> = _state

    fun loadPerformers() {
        getPerformersUseCase().onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        performers = result.data ?: emptyList(),
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
}
