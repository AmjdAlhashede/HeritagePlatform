package com.heritage.app.data.remote

import com.heritage.app.domain.model.Content
import com.heritage.app.domain.model.Performer
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    
    @GET("performers")
    suspend fun getPerformers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ApiResponse<List<Performer>>
    
    @GET("performers/{id}")
    suspend fun getPerformer(@Path("id") id: String): Performer
    
    @GET("content")
    suspend fun getContent(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("performerId") performerId: String? = null
    ): ApiResponse<List<Content>>
    
    @GET("content/{id}")
    suspend fun getContentById(@Path("id") id: String): Content
}

data class ApiResponse<T>(
    val data: T,
    val meta: Meta
)

data class Meta(
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)
