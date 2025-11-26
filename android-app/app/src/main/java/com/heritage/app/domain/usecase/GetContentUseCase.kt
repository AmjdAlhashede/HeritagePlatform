package com.heritage.app.domain.usecase

import com.heritage.app.domain.model.Content
import com.heritage.app.domain.repository.ContentRepository
import com.heritage.app.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

class GetContentUseCase @Inject constructor(
    private val repository: ContentRepository
) {
    operator fun invoke(
        page: Int = 1,
        limit: Int = 20,
        performerId: String? = null
    ): Flow<Resource<List<Content>>> = flow {
        try {
            emit(Resource.Loading())
            val content = repository.getContent(page, limit, performerId)
            emit(Resource.Success(content))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "خطأ في الاتصال"))
        } catch (e: IOException) {
            emit(Resource.Error("تحقق من اتصال الإنترنت"))
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "حدث خطأ غير متوقع"))
        }
    }
}

class GetTrendingContentUseCase @Inject constructor(
    private val repository: ContentRepository
) {
    operator fun invoke(limit: Int = 10): Flow<Resource<List<Content>>> = flow {
        try {
            emit(Resource.Loading())
            val content = repository.getTrendingContent(limit)
            emit(Resource.Success(content))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "خطأ في الاتصال"))
        } catch (e: IOException) {
            emit(Resource.Error("تحقق من اتصال الإنترنت"))
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "حدث خطأ غير متوقع"))
        }
    }
}
