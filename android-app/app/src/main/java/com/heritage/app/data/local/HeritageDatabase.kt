package com.heritage.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [DownloadEntity::class],
    version = 1,
    exportSchema = false
)
abstract class HeritageDatabase : RoomDatabase() {
    abstract fun downloadDao(): DownloadDao
}
