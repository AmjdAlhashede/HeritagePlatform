package com.heritage.app.domain.model

data class Content(
    val id: String,
    val title: String,
    val description: String?,
    val type: ContentType,
    val thumbnailUrl: String?,
    val hlsUrl: String?,
    val audioUrl: String?,
    val duration: Int, // seconds
    val viewCount: Int,
    val downloadCount: Int,
    val performer: Performer?,
    val performerId: String,
    val originalDate: String?,
    val createdAt: String,
    val isProcessed: Boolean
) {
    val durationFormatted: String
        get() {
            val minutes = duration / 60
            val seconds = duration % 60
            return String.format("%d:%02d", minutes, seconds)
        }
    
    val isVideo: Boolean
        get() = type == ContentType.VIDEO
    
    val isAudio: Boolean
        get() = type == ContentType.AUDIO
}

enum class ContentType {
    VIDEO,
    AUDIO
}
