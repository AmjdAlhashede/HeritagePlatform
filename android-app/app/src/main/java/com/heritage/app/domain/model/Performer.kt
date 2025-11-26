package com.heritage.app.domain.model

data class Performer(
    val id: String,
    val name: String,
    val bio: String? = null,
    val imageUrl: String? = null,
    val location: String? = null,
    val socialLinks: Map<String, String>? = null,
    val isActive: Boolean = true,
    val createdAt: String = "",
    val contentCount: Int = 0
)
