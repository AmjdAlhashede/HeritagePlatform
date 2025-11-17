package com.heritage.app.domain.usecase

import com.heritage.app.domain.model.Content
import com.heritage.app.domain.repository.ContentRepository
import com.heritage.app.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

class GetRecentContentUseCase @Inject constructor(
    private val repository: ContentRepository
) {
    operator fun invoke(limit: Int = 10): Flow<Resource<List<Content>>> = flow {
        try {
            emit(Resource.Loading())
            val content = repository.getRecentContent(limit)
            emit(Resource.Success(content))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "An unexpected error occurred"))
        } catch (e: IOException) {
            emit(Resource.Error("Couldn't reach server. Check your internet connection."))
        }
    }
}
