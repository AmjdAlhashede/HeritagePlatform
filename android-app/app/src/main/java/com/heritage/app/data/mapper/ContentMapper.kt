package com.heritage.app.data.mapper

import com.heritage.app.data.remote.dto.ContentDto
import com.heritage.app.data.remote.dto.PerformerDto
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.ContentType
import com.heritage.app.domain.model.Performer

fun ContentDto.toDomain(): Content {
    return Content(
        id = id ?: "",
        title = title ?: "Untitled",
        description = description,
        type = when (type?.lowercase()) {
            "video" -> ContentType.VIDEO
            "audio" -> ContentType.AUDIO
            else -> ContentType.VIDEO
        },
        thumbnailUrl = thumbnailUrl,
        hlsUrl = hlsUrl,
        audioUrl = audioUrl,
        duration = duration ?: 0,
        viewCount = viewCount ?: 0,
        downloadCount = downloadCount ?: 0,
        performer = performer?.toDomain(),
        performerId = performerId ?: "",
        originalDate = originalDate,
        createdAt = createdAt ?: "",
        isProcessed = isProcessed ?: false
    )
}

fun PerformerDto.toDomain(): Performer {
    return Performer(
        id = id ?: "",
        name = name ?: "Unknown",
        bio = bio,
        imageUrl = imageUrl,
        location = location,
        socialLinks = socialLinks,
        isActive = isActive ?: true,
        createdAt = createdAt ?: "",
        contentCount = contentCount ?: 0
    )
}
