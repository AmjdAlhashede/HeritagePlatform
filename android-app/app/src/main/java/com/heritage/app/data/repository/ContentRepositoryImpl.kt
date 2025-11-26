package com.heritage.app.data.repository

import com.heritage.app.data.mapper.toDomain
import com.heritage.app.data.remote.api.HeritageApi
import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.repository.ContentRepository
import javax.inject.Inject

class ContentRepositoryImpl @Inject constructor(
    private val api: HeritageApi
) : ContentRepository {
    
    override suspend fun getContent(
        page: Int,
        limit: Int,
        performerId: String?
    ): List<Content> {
        return api.getContent(page, limit, performerId).data.map { it.toDomain() }
    }
    
    override suspend fun getContentById(id: String): Content {
        return api.getContentById(id).toDomain()
    }
    
    override suspend fun getTrendingContent(limit: Int): List<Content> {
        return api.getTrendingContent(limit).data.map { it.toDomain() }
    }
    
    override suspend fun getRecommendedContent(limit: Int): List<Content> {
        return api.getRecommendedContent(limit).data.map { it.toDomain() }
    }
    
    override suspend fun getRecentContent(limit: Int): List<Content> {
        return api.getRecentContent(limit).data.map { it.toDomain() }
    }
    
    override suspend fun getPerformers(): List<Performer> {
        return api.getPerformers().map { it.toDomain() }
    }
    
    override suspend fun getPerformerById(id: String): Performer {
        return api.getPerformerById(id).toDomain()
    }
    
    override suspend fun getPerformerContent(
        performerId: String,
        page: Int,
        limit: Int
    ): List<Content> {
        return api.getPerformerContent(performerId, page, limit).data.map { it.toDomain() }
    }
    
    override suspend fun searchContent(
        query: String,
        page: Int,
        limit: Int
    ): List<Content> {
        // For now, return all content and filter client-side
        // TODO: Add search endpoint to backend
        return api.getContent(page, limit).data.map { it.toDomain() }.filter {
            it.title.contains(query, ignoreCase = true) ||
            it.description?.contains(query, ignoreCase = true) == true ||
            it.performer?.name?.contains(query, ignoreCase = true) == true
        }
    }
}
