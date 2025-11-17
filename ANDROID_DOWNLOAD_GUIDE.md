# دليل التحميل في الأندرويد

## 📦 البنية الجديدة

```
uploads/processed/{contentId}/
├── thumbnail.jpg
└── hls/
    ├── master.m3u8           # القائمة الرئيسية
    ├── video/
    │   ├── 1080p.m3u8       # قائمة 1080p
    │   ├── 1080p_000.ts     # مقاطع 1080p
    │   ├── 1080p_001.ts
    │   ├── 720p.m3u8        # قائمة 720p
    │   ├── 720p_000.ts      # مقاطع 720p
    │   ├── 480p.m3u8
    │   ├── 480p_000.ts
    │   ├── 360p.m3u8
    │   └── 360p_000.ts
    └── audio/
        ├── audio.m3u8       # قائمة الصوت
        ├── audio_000.ts     # مقاطع الصوت
        └── audio_001.ts
```

## 🎬 للمشاهدة (ExoPlayer)

```kotlin
// فتح master.m3u8 - ExoPlayer يختار الدقة تلقائياً
val player = ExoPlayer.Builder(context).build()
val mediaItem = MediaItem.fromUri("https://api.com/uploads/processed/{id}/hls/master.m3u8")
player.setMediaItem(mediaItem)
player.prepare()
player.play()
```

## 🎵 للاستماع فقط

```kotlin
// فتح audio.m3u8 - صوت فقط بدون فيديو
val player = ExoPlayer.Builder(context).build()
val mediaItem = MediaItem.fromUri("https://api.com/uploads/processed/{id}/hls/audio/audio.m3u8")
player.setMediaItem(mediaItem)
player.prepare()
player.play()
```

## 📥 للتحميل (جمع المقاطع)

### الخطوة 1: قراءة playlist
```kotlin
suspend fun downloadVideo(contentId: String, quality: String): File {
    // 1. تحميل playlist
    val playlistUrl = "https://api.com/uploads/processed/$contentId/hls/video/$quality.m3u8"
    val playlist = downloadPlaylist(playlistUrl)
    
    // 2. استخراج أسماء المقاطع
    val segments = parseM3U8(playlist)
    // مثال: ["1080p_000.ts", "1080p_001.ts", "1080p_002.ts"]
    
    // 3. تحميل كل مقطع
    val downloadedSegments = mutableListOf<File>()
    segments.forEach { segment ->
        val segmentUrl = "https://api.com/uploads/processed/$contentId/hls/video/$segment"
        val file = downloadSegment(segmentUrl)
        downloadedSegments.add(file)
    }
    
    // 4. دمج المقاطع
    val outputFile = File(context.filesDir, "video_$quality.mp4")
    mergeSegments(downloadedSegments, outputFile)
    
    return outputFile
}
```

### الخطوة 2: قراءة M3U8
```kotlin
fun parseM3U8(content: String): List<String> {
    return content.lines()
        .filter { !it.startsWith("#") && it.isNotBlank() }
        .map { it.trim() }
}
```

### الخطوة 3: دمج المقاطع
```kotlin
fun mergeSegments(segments: List<File>, output: File) {
    output.outputStream().use { out ->
        segments.forEach { segment ->
            segment.inputStream().use { input ->
                input.copyTo(out)
            }
        }
    }
}
```

## 📱 مثال كامل مع Progress

```kotlin
class VideoDownloader(private val context: Context) {
    
    suspend fun downloadWithProgress(
        contentId: String,
        quality: String,
        onProgress: (Int) -> Unit
    ): File = withContext(Dispatchers.IO) {
        
        // 1. تحميل playlist
        val playlistUrl = "$BASE_URL/uploads/processed/$contentId/hls/video/$quality.m3u8"
        val playlist = URL(playlistUrl).readText()
        
        // 2. استخراج المقاطع
        val segments = parseM3U8(playlist)
        val totalSegments = segments.size
        
        // 3. تحميل المقاطع
        val downloadedFiles = mutableListOf<File>()
        segments.forEachIndexed { index, segment ->
            val segmentUrl = "$BASE_URL/uploads/processed/$contentId/hls/video/$segment"
            val file = File(context.cacheDir, segment)
            
            // تحميل المقطع
            URL(segmentUrl).openStream().use { input ->
                file.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            
            downloadedFiles.add(file)
            
            // تحديث Progress
            val progress = ((index + 1) * 100) / totalSegments
            onProgress(progress)
        }
        
        // 4. دمج المقاطع
        val outputFile = File(context.filesDir, "video_${contentId}_$quality.mp4")
        mergeSegments(downloadedFiles, outputFile)
        
        // 5. حذف الملفات المؤقتة
        downloadedFiles.forEach { it.delete() }
        
        outputFile
    }
    
    private fun parseM3U8(content: String): List<String> {
        return content.lines()
            .filter { !it.startsWith("#") && it.isNotBlank() }
    }
    
    private fun mergeSegments(segments: List<File>, output: File) {
        output.outputStream().use { out ->
            segments.forEach { segment ->
                segment.inputStream().use { it.copyTo(out) }
            }
        }
    }
}
```

## 🎯 الاستخدام

```kotlin
// في Activity أو Fragment
lifecycleScope.launch {
    try {
        val downloader = VideoDownloader(this@MainActivity)
        
        val file = downloader.downloadWithProgress(
            contentId = "abc-123",
            quality = "720p"
        ) { progress ->
            // تحديث UI
            progressBar.progress = progress
            textView.text = "جاري التحميل: $progress%"
        }
        
        Toast.makeText(this@MainActivity, "تم التحميل: ${file.path}", Toast.LENGTH_LONG).show()
        
    } catch (e: Exception) {
        Toast.makeText(this@MainActivity, "فشل التحميل: ${e.message}", Toast.LENGTH_LONG).show()
    }
}
```

## 💾 توفير المساحة

**الحجم المتوقع:**
- 1080p: ~5 MB/دقيقة
- 720p: ~2.8 MB/دقيقة
- 480p: ~1.4 MB/دقيقة
- 360p: ~800 KB/دقيقة
- صوت فقط: ~1.4 MB/دقيقة

**مثال لفيديو 5 دقائق:**
- 1080p: ~25 MB
- 720p: ~14 MB
- 480p: ~7 MB
- صوت: ~7 MB

## ✅ الخلاصة

- ✅ **للمشاهدة:** استخدم `master.m3u8` مع ExoPlayer
- ✅ **للاستماع:** استخدم `audio/audio.m3u8`
- ✅ **للتحميل:** حمل المقاطع واجمعها
- ✅ **توفير المساحة:** بدون نسخ كاملة مكررة
