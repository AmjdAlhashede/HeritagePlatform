package com.heritage.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "downloads")
data class DownloadEntity(
    @PrimaryKey
    val contentId: String,
    val title: String,
    val performerName: String?,
    val thumbnailUrl: String?,
    val localFilePath: String,
    val fileSize: Long,
    val duration: Int,
    val isVideo: Boolean,
    val downloadedAt: Long,
    val status: DownloadStatus = DownloadStatus.COMPLETED
)

enum class DownloadStatus {
    PENDING,
    DOWNLOADING,
    COMPLETED,
    FAILED,
    PAUSED
}
