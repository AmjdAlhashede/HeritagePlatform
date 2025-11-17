package com.heritage.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DownloadDao {
    
    @Query("SELECT * FROM downloads ORDER BY downloadedAt DESC")
    fun getAllDownloads(): Flow<List<DownloadEntity>>
    
    @Query("SELECT * FROM downloads WHERE contentId = :contentId")
    suspend fun getDownloadById(contentId: String): DownloadEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDownload(download: DownloadEntity)
    
    @Delete
    suspend fun deleteDownload(download: DownloadEntity)
    
    @Query("DELETE FROM downloads WHERE contentId = :contentId")
    suspend fun deleteDownloadById(contentId: String)
    
    @Query("UPDATE downloads SET status = :status WHERE contentId = :contentId")
    suspend fun updateDownloadStatus(contentId: String, status: DownloadStatus)
    
    @Query("SELECT EXISTS(SELECT 1 FROM downloads WHERE contentId = :contentId)")
    suspend fun isDownloaded(contentId: String): Boolean
}
