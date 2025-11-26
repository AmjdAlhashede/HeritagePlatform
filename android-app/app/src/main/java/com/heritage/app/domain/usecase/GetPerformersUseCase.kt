package com.heritage.app.domain.usecase

import com.heritage.app.domain.model.Performer
import com.heritage.app.domain.repository.ContentRepository
import com.heritage.app.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

class GetPerformersUseCase @Inject constructor(
    private val repository: ContentRepository
) {
    operator fun invoke(): Flow<Resource<List<Performer>>> = flow {
        try {
            emit(Resource.Loading())
            val performers = repository.getPerformers()
            emit(Resource.Success(performers))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "خطأ في الاتصال"))
        } catch (e: IOException) {
            emit(Resource.Error("تحقق من اتصال الإنترنت"))
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "حدث خطأ غير متوقع"))
        }
    }
}
