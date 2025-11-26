package com.heritage.app.`data`.local

import androidx.room.EntityDeleteOrUpdateAdapter
import androidx.room.EntityInsertAdapter
import androidx.room.RoomDatabase
import androidx.room.coroutines.createFlow
import androidx.room.util.getColumnIndexOrThrow
import androidx.room.util.performSuspending
import androidx.sqlite.SQLiteStatement
import javax.`annotation`.processing.Generated
import kotlin.Boolean
import kotlin.IllegalArgumentException
import kotlin.Int
import kotlin.Long
import kotlin.String
import kotlin.Suppress
import kotlin.Unit
import kotlin.collections.List
import kotlin.collections.MutableList
import kotlin.collections.mutableListOf
import kotlin.reflect.KClass
import kotlinx.coroutines.flow.Flow

@Generated(value = ["androidx.room.RoomProcessor"])
@Suppress(names = ["UNCHECKED_CAST", "DEPRECATION", "REDUNDANT_PROJECTION", "REMOVAL"])
public class DownloadDao_Impl(
  __db: RoomDatabase,
) : DownloadDao {
  private val __db: RoomDatabase

  private val __insertAdapterOfDownloadEntity: EntityInsertAdapter<DownloadEntity>

  private val __deleteAdapterOfDownloadEntity: EntityDeleteOrUpdateAdapter<DownloadEntity>
  init {
    this.__db = __db
    this.__insertAdapterOfDownloadEntity = object : EntityInsertAdapter<DownloadEntity>() {
      protected override fun createQuery(): String = "INSERT OR REPLACE INTO `downloads` (`contentId`,`title`,`performerName`,`thumbnailUrl`,`localFilePath`,`fileSize`,`duration`,`isVideo`,`downloadedAt`,`status`) VALUES (?,?,?,?,?,?,?,?,?,?)"

      protected override fun bind(statement: SQLiteStatement, entity: DownloadEntity) {
        statement.bindText(1, entity.contentId)
        statement.bindText(2, entity.title)
        val _tmpPerformerName: String? = entity.performerName
        if (_tmpPerformerName == null) {
          statement.bindNull(3)
        } else {
          statement.bindText(3, _tmpPerformerName)
        }
        val _tmpThumbnailUrl: String? = entity.thumbnailUrl
        if (_tmpThumbnailUrl == null) {
          statement.bindNull(4)
        } else {
          statement.bindText(4, _tmpThumbnailUrl)
        }
        statement.bindText(5, entity.localFilePath)
        statement.bindLong(6, entity.fileSize)
        statement.bindLong(7, entity.duration.toLong())
        val _tmp: Int = if (entity.isVideo) 1 else 0
        statement.bindLong(8, _tmp.toLong())
        statement.bindLong(9, entity.downloadedAt)
        statement.bindText(10, __DownloadStatus_enumToString(entity.status))
      }
    }
    this.__deleteAdapterOfDownloadEntity = object : EntityDeleteOrUpdateAdapter<DownloadEntity>() {
      protected override fun createQuery(): String = "DELETE FROM `downloads` WHERE `contentId` = ?"

      protected override fun bind(statement: SQLiteStatement, entity: DownloadEntity) {
        statement.bindText(1, entity.contentId)
      }
    }
  }

  public override suspend fun insertDownload(download: DownloadEntity): Unit = performSuspending(__db, false, true) { _connection ->
    __insertAdapterOfDownloadEntity.insert(_connection, download)
  }

  public override suspend fun deleteDownload(download: DownloadEntity): Unit = performSuspending(__db, false, true) { _connection ->
    __deleteAdapterOfDownloadEntity.handle(_connection, download)
  }

  public override fun getAllDownloads(): Flow<List<DownloadEntity>> {
    val _sql: String = "SELECT * FROM downloads ORDER BY downloadedAt DESC"
    return createFlow(__db, false, arrayOf("downloads")) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        val _columnIndexOfContentId: Int = getColumnIndexOrThrow(_stmt, "contentId")
        val _columnIndexOfTitle: Int = getColumnIndexOrThrow(_stmt, "title")
        val _columnIndexOfPerformerName: Int = getColumnIndexOrThrow(_stmt, "performerName")
        val _columnIndexOfThumbnailUrl: Int = getColumnIndexOrThrow(_stmt, "thumbnailUrl")
        val _columnIndexOfLocalFilePath: Int = getColumnIndexOrThrow(_stmt, "localFilePath")
        val _columnIndexOfFileSize: Int = getColumnIndexOrThrow(_stmt, "fileSize")
        val _columnIndexOfDuration: Int = getColumnIndexOrThrow(_stmt, "duration")
        val _columnIndexOfIsVideo: Int = getColumnIndexOrThrow(_stmt, "isVideo")
        val _columnIndexOfDownloadedAt: Int = getColumnIndexOrThrow(_stmt, "downloadedAt")
        val _columnIndexOfStatus: Int = getColumnIndexOrThrow(_stmt, "status")
        val _result: MutableList<DownloadEntity> = mutableListOf()
        while (_stmt.step()) {
          val _item: DownloadEntity
          val _tmpContentId: String
          _tmpContentId = _stmt.getText(_columnIndexOfContentId)
          val _tmpTitle: String
          _tmpTitle = _stmt.getText(_columnIndexOfTitle)
          val _tmpPerformerName: String?
          if (_stmt.isNull(_columnIndexOfPerformerName)) {
            _tmpPerformerName = null
          } else {
            _tmpPerformerName = _stmt.getText(_columnIndexOfPerformerName)
          }
          val _tmpThumbnailUrl: String?
          if (_stmt.isNull(_columnIndexOfThumbnailUrl)) {
            _tmpThumbnailUrl = null
          } else {
            _tmpThumbnailUrl = _stmt.getText(_columnIndexOfThumbnailUrl)
          }
          val _tmpLocalFilePath: String
          _tmpLocalFilePath = _stmt.getText(_columnIndexOfLocalFilePath)
          val _tmpFileSize: Long
          _tmpFileSize = _stmt.getLong(_columnIndexOfFileSize)
          val _tmpDuration: Int
          _tmpDuration = _stmt.getLong(_columnIndexOfDuration).toInt()
          val _tmpIsVideo: Boolean
          val _tmp: Int
          _tmp = _stmt.getLong(_columnIndexOfIsVideo).toInt()
          _tmpIsVideo = _tmp != 0
          val _tmpDownloadedAt: Long
          _tmpDownloadedAt = _stmt.getLong(_columnIndexOfDownloadedAt)
          val _tmpStatus: DownloadStatus
          _tmpStatus = __DownloadStatus_stringToEnum(_stmt.getText(_columnIndexOfStatus))
          _item = DownloadEntity(_tmpContentId,_tmpTitle,_tmpPerformerName,_tmpThumbnailUrl,_tmpLocalFilePath,_tmpFileSize,_tmpDuration,_tmpIsVideo,_tmpDownloadedAt,_tmpStatus)
          _result.add(_item)
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun getDownloadById(contentId: String): DownloadEntity? {
    val _sql: String = "SELECT * FROM downloads WHERE contentId = ?"
    return performSuspending(__db, true, false) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, contentId)
        val _columnIndexOfContentId: Int = getColumnIndexOrThrow(_stmt, "contentId")
        val _columnIndexOfTitle: Int = getColumnIndexOrThrow(_stmt, "title")
        val _columnIndexOfPerformerName: Int = getColumnIndexOrThrow(_stmt, "performerName")
        val _columnIndexOfThumbnailUrl: Int = getColumnIndexOrThrow(_stmt, "thumbnailUrl")
        val _columnIndexOfLocalFilePath: Int = getColumnIndexOrThrow(_stmt, "localFilePath")
        val _columnIndexOfFileSize: Int = getColumnIndexOrThrow(_stmt, "fileSize")
        val _columnIndexOfDuration: Int = getColumnIndexOrThrow(_stmt, "duration")
        val _columnIndexOfIsVideo: Int = getColumnIndexOrThrow(_stmt, "isVideo")
        val _columnIndexOfDownloadedAt: Int = getColumnIndexOrThrow(_stmt, "downloadedAt")
        val _columnIndexOfStatus: Int = getColumnIndexOrThrow(_stmt, "status")
        val _result: DownloadEntity?
        if (_stmt.step()) {
          val _tmpContentId: String
          _tmpContentId = _stmt.getText(_columnIndexOfContentId)
          val _tmpTitle: String
          _tmpTitle = _stmt.getText(_columnIndexOfTitle)
          val _tmpPerformerName: String?
          if (_stmt.isNull(_columnIndexOfPerformerName)) {
            _tmpPerformerName = null
          } else {
            _tmpPerformerName = _stmt.getText(_columnIndexOfPerformerName)
          }
          val _tmpThumbnailUrl: String?
          if (_stmt.isNull(_columnIndexOfThumbnailUrl)) {
            _tmpThumbnailUrl = null
          } else {
            _tmpThumbnailUrl = _stmt.getText(_columnIndexOfThumbnailUrl)
          }
          val _tmpLocalFilePath: String
          _tmpLocalFilePath = _stmt.getText(_columnIndexOfLocalFilePath)
          val _tmpFileSize: Long
          _tmpFileSize = _stmt.getLong(_columnIndexOfFileSize)
          val _tmpDuration: Int
          _tmpDuration = _stmt.getLong(_columnIndexOfDuration).toInt()
          val _tmpIsVideo: Boolean
          val _tmp: Int
          _tmp = _stmt.getLong(_columnIndexOfIsVideo).toInt()
          _tmpIsVideo = _tmp != 0
          val _tmpDownloadedAt: Long
          _tmpDownloadedAt = _stmt.getLong(_columnIndexOfDownloadedAt)
          val _tmpStatus: DownloadStatus
          _tmpStatus = __DownloadStatus_stringToEnum(_stmt.getText(_columnIndexOfStatus))
          _result = DownloadEntity(_tmpContentId,_tmpTitle,_tmpPerformerName,_tmpThumbnailUrl,_tmpLocalFilePath,_tmpFileSize,_tmpDuration,_tmpIsVideo,_tmpDownloadedAt,_tmpStatus)
        } else {
          _result = null
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun isDownloaded(contentId: String): Boolean {
    val _sql: String = "SELECT EXISTS(SELECT 1 FROM downloads WHERE contentId = ?)"
    return performSuspending(__db, true, false) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, contentId)
        val _result: Boolean
        if (_stmt.step()) {
          val _tmp: Int
          _tmp = _stmt.getLong(0).toInt()
          _result = _tmp != 0
        } else {
          _result = false
        }
        _result
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun deleteDownloadById(contentId: String) {
    val _sql: String = "DELETE FROM downloads WHERE contentId = ?"
    return performSuspending(__db, false, true) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, contentId)
        _stmt.step()
      } finally {
        _stmt.close()
      }
    }
  }

  public override suspend fun updateDownloadStatus(contentId: String, status: DownloadStatus) {
    val _sql: String = "UPDATE downloads SET status = ? WHERE contentId = ?"
    return performSuspending(__db, false, true) { _connection ->
      val _stmt: SQLiteStatement = _connection.prepare(_sql)
      try {
        var _argIndex: Int = 1
        _stmt.bindText(_argIndex, __DownloadStatus_enumToString(status))
        _argIndex = 2
        _stmt.bindText(_argIndex, contentId)
        _stmt.step()
      } finally {
        _stmt.close()
      }
    }
  }

  private fun __DownloadStatus_enumToString(_value: DownloadStatus): String = when (_value) {
    DownloadStatus.PENDING -> "PENDING"
    DownloadStatus.DOWNLOADING -> "DOWNLOADING"
    DownloadStatus.COMPLETED -> "COMPLETED"
    DownloadStatus.FAILED -> "FAILED"
    DownloadStatus.PAUSED -> "PAUSED"
  }

  private fun __DownloadStatus_stringToEnum(_value: String): DownloadStatus = when (_value) {
    "PENDING" -> DownloadStatus.PENDING
    "DOWNLOADING" -> DownloadStatus.DOWNLOADING
    "COMPLETED" -> DownloadStatus.COMPLETED
    "FAILED" -> DownloadStatus.FAILED
    "PAUSED" -> DownloadStatus.PAUSED
    else -> throw IllegalArgumentException("Can't convert value to enum, unknown value: " + _value)
  }

  public companion object {
    public fun getRequiredConverters(): List<KClass<*>> = emptyList()
  }
}
