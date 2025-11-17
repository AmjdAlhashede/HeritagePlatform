package com.heritage.app.presentation.search

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.usecase.SearchContentUseCase
import com.heritage.app.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SearchState(
    val query: String = "",
    val results: List<Content> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchContentUseCase: SearchContentUseCase
) : ViewModel() {

    private val _state = mutableStateOf(SearchState())
    val state: State<SearchState> = _state

    private var searchJob: Job? = null

    fun onQueryChange(query: String) {
        _state.value = _state.value.copy(query = query)
        
        // Auto search after 500ms delay
        searchJob?.cancel()
        if (query.length >= 2) {
            searchJob = viewModelScope.launch {
                delay(500)
                search()
            }
        } else if (query.isEmpty()) {
            _state.value = _state.value.copy(results = emptyList())
        }
    }

    fun search() {
        val query = _state.value.query
        if (query.length < 2) return
        
        searchContentUseCase(query).onEach { result ->
            when (result) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        results = result.data ?: emptyList(),
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
