package com.heritage.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class PerformerDto(
    @SerializedName("_id")
    val id: String? = null,
    val name: String? = null,
    val bio: String? = null,
    val imageUrl: String? = null,
    val location: String? = null,
    val socialLinks: Map<String, String>? = null,
    val isActive: Boolean? = null,
    val contentCount: Int? = null,
    val createdAt: String? = null
)
