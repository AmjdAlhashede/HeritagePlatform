package com.heritage.app.presentation.categories

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Category
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CategoriesState(
    val categories: List<Category> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CategoriesViewModel @Inject constructor(
    // TODO: Inject repository
) : ViewModel() {

    private val _state = mutableStateOf(CategoriesState())
    val state: State<CategoriesState> = _state

    init {
        loadCategories()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            
            try {
                // TODO: Load from API
                val mockCategories = listOf(
                    Category("1", "زوامل حماسية", null, null, "🔥", 1, true),
                    Category("2", "زوامل وطنية", null, null, "🇾🇪", 2, true),
                    Category("3", "زوامل تراثية", null, null, "🏛️", 3, true),
                    Category("4", "زوامل دينية", null, null, "🕌", 4, true)
                )
                
                _state.value = _state.value.copy(
                    categories = mockCategories,
                    isLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
}
