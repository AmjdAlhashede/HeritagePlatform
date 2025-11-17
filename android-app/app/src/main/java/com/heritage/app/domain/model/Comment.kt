package com.heritage.app.domain.model

import java.time.LocalDateTime

data class Comment(
    val id: String,
    val contentId: String,
    val userName: String,
    val text: String,
    val likes: Int,
    val createdAt: String
)
