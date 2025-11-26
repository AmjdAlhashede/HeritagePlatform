package com.heritage.app.domain.usecase

import com.heritage.app.domain.model.Content
import com.heritage.app.domain.repository.ContentRepository
import com.heritage.app.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

class SearchContentUseCase @Inject constructor(
    private val repository: ContentRepository
) {
    operator fun invoke(query: String, page: Int = 1, limit: Int = 20): Flow<Resource<List<Content>>> = flow {
        try {
            emit(Resource.Loading())
            val results = repository.searchContent(query, page, limit)
            emit(Resource.Success(results))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "An unexpected error occurred"))
        } catch (e: IOException) {
            emit(Resource.Error("Couldn't reach server. Check your internet connection."))
        }
    }
}
