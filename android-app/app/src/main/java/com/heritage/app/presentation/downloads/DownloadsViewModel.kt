package com.heritage.app.presentation.downloads

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.heritage.app.data.local.DownloadDao
import com.heritage.app.data.local.DownloadEntity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DownloadsState(
    val downloads: List<DownloadEntity> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class DownloadsViewModel @Inject constructor(
    private val downloadDao: DownloadDao
) : ViewModel() {

    private val _state = mutableStateOf(DownloadsState())
    val state: State<DownloadsState> = _state

    init {
        loadDownloads()
    }

    private fun loadDownloads() {
        downloadDao.getAllDownloads().onEach { downloads ->
            _state.value = _state.value.copy(
                downloads = downloads,
                isLoading = false
            )
        }.launchIn(viewModelScope)
    }

    fun deleteDownload(download: DownloadEntity) {
        viewModelScope.launch {
            try {
                downloadDao.deleteDownload(download)
                // TODO: Delete actual file from storage
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    error = e.localizedMessage
                )
            }
        }
    }
}
