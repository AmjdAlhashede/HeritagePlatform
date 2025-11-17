package com.heritage.app.domain.model

data class Performer(
    val id: String,
    val name: String,
    val bio: String?,
    val imageUrl: String?,
    val location: String?,
    val socialLinks: Map<String, String>?,
    val isActive: Boolean,
    val createdAt: String
)
