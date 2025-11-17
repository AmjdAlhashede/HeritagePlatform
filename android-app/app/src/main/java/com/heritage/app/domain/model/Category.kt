package com.heritage.app.domain.model

data class Category(
    val id: String,
    val name: String,
    val nameEn: String?,
    val description: String?,
    val icon: String?,
    val order: Int,
    val isActive: Boolean,
    val contentCount: Int = 0
)
