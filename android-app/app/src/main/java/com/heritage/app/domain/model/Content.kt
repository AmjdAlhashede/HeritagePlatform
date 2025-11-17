package com.heritage.app.domain.model

data class Content(
    val id: String,
    val title: String,
    val description: String?,
    val type: ContentType,
    val originalFileUrl: String,
    val hlsUrl: String?,
    val audioUrl: String?,
    val thumbnailUrl: String?,
    val duration: Int,
    val fileSize: Long,
    val viewCount: Int,
    val downloadCount: Int,
    val isProcessed: Boolean,
    val performer: Performer,
    val createdAt: String
)

enum class ContentType {
    VIDEO, AUDIO
}
