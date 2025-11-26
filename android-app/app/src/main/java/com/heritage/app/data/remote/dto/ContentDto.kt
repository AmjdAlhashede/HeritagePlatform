package com.heritage.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class ContentDto(
    @SerializedName("_id")
    val id: String? = null,
    val title: String? = null,
    val description: String? = null,
    val type: String? = null,
    val thumbnailUrl: String? = null,
    val hlsUrl: String? = null,
    val audioUrl: String? = null,
    val duration: Int? = null,
    val viewCount: Int? = null,
    val downloadCount: Int? = null,
    val performer: PerformerDto? = null,
    val performerId: String? = null,
    val originalDate: String? = null,
    val createdAt: String? = null,
    val isProcessed: Boolean? = null
)

data class ContentListResponse(
    val data: List<ContentDto>,
    val meta: MetaDto?
)

data class MetaDto(
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)
