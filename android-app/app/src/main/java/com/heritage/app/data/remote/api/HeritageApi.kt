package com.heritage.app.data.remote.api

import com.heritage.app.data.remote.dto.ContentDto
import com.heritage.app.data.remote.dto.ContentListResponse
import com.heritage.app.data.remote.dto.PerformerDto
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface HeritageApi {
    
    // Content endpoints
    @GET("content")
    suspend fun getContent(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("performerId") performerId: String? = null
    ): ContentListResponse
    
    @GET("content/{id}")
    suspend fun getContentById(
        @Path("id") id: String
    ): ContentDto
    
    @GET("content/trending")
    suspend fun getTrendingContent(
        @Query("limit") limit: Int = 10
    ): ContentListResponse
    
    @GET("content/recommended")
    suspend fun getRecommendedContent(
        @Query("limit") limit: Int = 10
    ): ContentListResponse
    
    @GET("content/recent")
    suspend fun getRecentContent(
        @Query("limit") limit: Int = 10
    ): ContentListResponse
    
    // Performers endpoints
    @GET("performers")
    suspend fun getPerformers(): List<PerformerDto>
    
    @GET("performers/{id}")
    suspend fun getPerformerById(
        @Path("id") id: String
    ): PerformerDto
    
    @GET("performers/{id}/content")
    suspend fun getPerformerContent(
        @Path("id") id: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ContentListResponse
}
