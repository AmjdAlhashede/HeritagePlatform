# 📱 دليل إكمال Android App

## ✅ ما تم إنجازه:

### 1. Bottom Navigation ✅
- `BottomNavItem.kt` - تعريف عناصر القائمة
- `BottomNavigationBar.kt` - UI مع animations
- 4 أقسام: Home, Categories, Performers, Downloads

### 2. Navigation System ✅
- تحديث `Screen.kt` مع جميع الشاشات
- ContentDetail, CategoryDetail, AllContent

### 3. Categories ✅
- `Category.kt` - Model
- `CategoriesScreen.kt` - UI
- `CategoriesViewModel.kt` - Logic

### 4. Content Detail (بداية) ✅
- `ContentDetailScreen.kt` - الهيكل
- `ContentDetailViewModel.kt` - Logic
- `Comment.kt` - Model

---

## 🔧 ما يجب إكماله:

### 1. ContentDetailScreen - المحتوى الكامل
يحتاج:
```kotlin
@Composable
fun ContentDetailContent(
    content: Content,
    performer: Performer?,
    relatedContent: List<Content>,
    comments: List<Comment>,
    onContentClick: (String) -> Unit,
    onPerformerClick: (String) -> Unit,
    onLikeClick: () -> Unit,
    onShareClick: () -> Unit,
    onDownloadClick: () -> Unit,
    onCommentSubmit: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(modifier = modifier) {
        // 1. Video/Audio Player
        item { VideoPlayerSection(content) }
        
        // 2. Content Info
        item { ContentInfoSection(content) }
        
        // 3. Action Buttons (Like, Share, Download)
        item { ActionButtonsRow(onLikeClick, onShareClick, onDownloadClick) }
        
        // 4. Performer Info
        item { PerformerSection(performer, onPerformerClick) }
        
        // 5. Comments Section
        item { CommentsSection(comments, onCommentSubmit) }
        
        // 6. Related Content
        item { RelatedContentSection(relatedContent, onContentClick) }
    }
}
```

### 2. API Integration
في `data/remote/ApiService.kt` أضف:
```kotlin
@GET("categories")
suspend fun getCategories(): List<Category>

@GET("categories/{id}/content")
suspend fun getCategoryContent(@Path("id") id: String): ApiResponse<List<Content>>

@GET("content/{id}/comments")
suspend fun getComments(@Path("id") id: String): ApiResponse<List<Comment>>

@POST("content/{id}/like")
suspend fun likeContent(@Path("id") id: String)

@POST("content/{id}/share")
suspend fun shareContent(@Path("id") id: String)

@POST("comments")
suspend fun addComment(@Body comment: CommentRequest)
```

### 3. Repository Updates
في `ContentRepository` أضف:
```kotlin
suspend fun getCategories(): List<Category>
suspend fun getCategoryContent(categoryId: String): List<Content>
suspend fun getComments(contentId: String): List<Comment>
suspend fun likeContent(contentId: String)
suspend fun shareContent(contentId: String)
suspend fun addComment(contentId: String, userName: String, text: String)
```

### 4. تحديث Navigation
في `HeritageNavigation.kt` أضف:
```kotlin
// Bottom Navigation
val navController = rememberNavController()

Scaffold(
    bottomBar = {
        HeritageBottomNavigationBar(navController)
    }
) { padding ->
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = Modifier.padding(padding)
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onContentClick = { navController.navigate(Screen.ContentDetail.createRoute(it)) }
            )
        }
        
        composable(Screen.Categories.route) {
            CategoriesScreen(
                onCategoryClick = { navController.navigate(Screen.CategoryDetail.createRoute(it)) }
            )
        }
        
        composable(Screen.ContentDetail.route) { backStackEntry ->
            val contentId = backStackEntry.arguments?.getString("contentId")!!
            ContentDetailScreen(
                contentId = contentId,
                onBackClick = { navController.popBackStack() }
            )
        }
        
        // ... باقي الشاشات
    }
}
```

### 5. Components المطلوبة
أنشئ في `presentation/components/`:

- `VideoPlayerSection.kt` - عرض الفيديو
- `ContentInfoSection.kt` - معلومات المحتوى
- `ActionButtonsRow.kt` - أزرار Like, Share, Download
- `PerformerSection.kt` - معلومات المؤدي
- `CommentsSection.kt` - التعليقات
- `RelatedContentSection.kt` - محتوى مقترح
- `LoadingState.kt` - حالة التحميل
- `ErrorState.kt` - حالة الخطأ

---

## 🎯 الأولويات:

### المرحلة 1 (الآن):
1. ✅ إكمال ContentDetailScreen UI
2. ✅ إضافة Components المطلوبة
3. ✅ تحديث Navigation

### المرحلة 2:
4. ✅ API Integration
5. ✅ Repository Updates
6. ✅ Testing

---

## 📝 ملاحظات:

- استخدم ExoPlayer للفيديو
- استخدم Coil للصور
- استخدم Material 3 Design
- كل الـ UI يجب أن يكون Responsive
- استخدم Animations للتحسين

---

هل تريد أن أكمل الآن؟
