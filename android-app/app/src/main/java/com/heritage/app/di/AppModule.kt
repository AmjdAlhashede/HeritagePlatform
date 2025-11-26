package com.heritage.app.di

import android.content.Context
import androidx.room.Room
import com.heritage.app.BuildConfig
import com.heritage.app.data.local.DownloadDao
import com.heritage.app.data.local.HeritageDatabase
import com.heritage.app.data.remote.api.HeritageApi
import com.heritage.app.data.repository.ContentRepositoryImpl
import com.heritage.app.domain.repository.ContentRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BODY
                }
            )
            .build()
    }

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideHeritageApi(retrofit: Retrofit): HeritageApi {
        return retrofit.create(HeritageApi::class.java)
    }
    
    @Provides
    @Singleton
    fun provideContentRepository(api: HeritageApi): ContentRepository {
        return ContentRepositoryImpl(api)
    }
    
    @Provides
    @Singleton
    fun provideHeritageDatabase(@ApplicationContext context: Context): HeritageDatabase {
        return Room.databaseBuilder(
            context,
            HeritageDatabase::class.java,
            "heritage_database"
        ).build()
    }
    
    @Provides
    @Singleton
    fun provideDownloadDao(database: HeritageDatabase): DownloadDao {
        return database.downloadDao()
    }
}
