package com.heritage.app.presentation.content_detail

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.model.Comment
import com.heritage.app.domain.repository.ContentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ContentDetailState(
    val content: Content? = null,
    val performer: Performer? = null,
    val relatedContent: List<Content> = emptyList(),
    val comments: List<Comment> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLiked: Boolean = false
)

@HiltViewModel
class ContentDetailViewModel @Inject constructor(
    private val repository: ContentRepository
) : ViewModel() {

    private val _state = mutableStateOf(ContentDetailState())
    val state: State<ContentDetailState> = _state

    fun loadContent(contentId: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            try {
                // Load content
                val content = repository.getContentById(contentId)
                _state.value = _state.value.copy(content = content)
                
                // Load performer
                content.performerId?.let { performerId ->
                    val performer = repository.getPerformerById(performerId)
                    _state.value = _state.value.copy(performer = performer)
                    
                    // Load related content
                    val related = repository.getPerformerContent(performerId, 1, 10)
                        .filter { it.id != contentId }
                    _state.value = _state.value.copy(relatedContent = related)
                }
                
                // Load comments (TODO: implement API)
                // val comments = repository.getComments(contentId)
                // _state.value = _state.value.copy(comments = comments)
                
                _state.value = _state.value.copy(isLoading = false)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message ?: "حدث خطأ"
                )
            }
        }
    }

    fun toggleLike() {
        _state.value = _state.value.copy(isLiked = !_state.value.isLiked)
        // TODO: Call API
    }

    fun shareContent() {
        // TODO: Implement share
    }

    fun downloadContent() {
        // TODO: Implement download
    }

    fun addComment(text: String) {
        // TODO: Implement add comment
    }
}
