package com.heritage.app.domain.usecase

import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.repository.ContentRepository
import com.heritage.app.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

class GetPerformerByIdUseCase @Inject constructor(
    private val repository: ContentRepository
) {
    operator fun invoke(performerId: String): Flow<Resource<Performer>> = flow {
        try {
            emit(Resource.Loading())
            val performer = repository.getPerformerById(performerId)
            emit(Resource.Success(performer))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "An unexpected error occurred"))
        } catch (e: IOException) {
            emit(Resource.Error("Couldn't reach server. Check your internet connection."))
        }
    }
}
