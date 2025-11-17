package com.heritage.app.domain.repository

import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.Performer

interface ContentRepository {
    
    suspend fun getContent(
        page: Int = 1,
        limit: Int = 20,
        performerId: String? = null
    ): List<Content>
    
    suspend fun getContentById(id: String): Content
    
    suspend fun getTrendingContent(limit: Int = 10): List<Content>
    
    suspend fun getRecommendedContent(limit: Int = 10): List<Content>
    
    suspend fun getRecentContent(limit: Int = 10): List<Content>
    
    suspend fun getPerformers(): List<Performer>
    
    suspend fun getPerformerById(id: String): Performer
    
    suspend fun getPerformerContent(
        performerId: String,
        page: Int = 1,
        limit: Int = 20
    ): List<Content>
    
    suspend fun searchContent(query: String, page: Int = 1, limit: Int = 20): List<Content>
}
