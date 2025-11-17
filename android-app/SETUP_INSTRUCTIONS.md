# تعليمات الإعداد - تطبيق الزوامل

## ✅ المشاكل اللي تم إصلاحها:

### 1. مشكلة الاتصال بالـ Backend
- ✅ تم تحديث الـ API URL من `10.0.2.2` إلى `192.168.8.64`
- ✅ تم تعديل الـ Backend ليستمع على جميع الـ interfaces (`0.0.0.0`)
- ✅ تم إصلاح لون الـ TopAppBar

### 2. الخطوات المطلوبة منك:

#### أ) فتح الـ Firewall (مهم جداً!)

**افتح PowerShell كـ Administrator** وشغل هذا الأمر:

```powershell
netsh advfirewall firewall add rule name="Node.js Server Port 3000" dir=in action=allow protocol=TCP localport=3000
```

أو من Control Panel:
1. افتح **Windows Defender Firewall**
2. اضغط **Advanced settings**
3. اضغط **Inbound Rules** → **New Rule**
4. اختر **Port** → Next
5. اختر **TCP** واكتب `3000` → Next
6. اختر **Allow the connection** → Next
7. اختر جميع الخيارات → Next
8. اسم القاعدة: `Node.js Server Port 3000` → Finish

#### ب) تأكد من الاتصال

شغل هذا الأمر في PowerShell للتأكد:

```powershell
Test-NetConnection -ComputerName 192.168.8.64 -Port 3000
```

أو افتح المتصفح على جهازك واكتب:
```
http://192.168.8.64:3000/api/performers
```

يجب أن تشوف JSON response.

#### ج) في Android Studio

1. **Sync Gradle** (File → Sync Project with Gradle Files)
2. **Clean Project** (Build → Clean Project)
3. **Rebuild Project** (Build → Rebuild Project)
4. **Run** التطبيق على جهازك

---

## 🔧 الإعدادات الحالية:

### Backend:
- 🚀 Server: `http://localhost:3000`
- 📱 Mobile: `http://192.168.8.64:3000`
- 📚 API: `http://192.168.8.64:3000/api/`

### Android App:
- 📱 API URL: `http://192.168.8.64:3000/api/`
- 🎨 Theme: Fixed (TopAppBar colors)

---

## 🐛 إذا ما اشتغل:

### 1. تأكد من الـ Backend شغال:
```bash
cd backend
npm run start:dev
```

يجب أن تشوف:
```
🚀 Backend server running on http://localhost:3000
📱 Mobile access: http://192.168.8.64:3000
📚 API available at http://localhost:3000/api
```

### 2. تأكد من الـ Firewall:
- شغل الأمر اللي فوق كـ Administrator
- أو أطفئ الـ Firewall مؤقتاً للتجربة

### 3. تأكد من الشبكة:
- الجهاز والكمبيوتر على نفس الـ WiFi
- IP الكمبيوتر: `192.168.8.64`
- IP الجهاز: `192.168.8.61`

### 4. جرب من المتصفح على الجهاز:
افتح Chrome على جهازك واكتب:
```
http://192.168.8.64:3000/api/performers
```

إذا اشتغل، معناها المشكلة في التطبيق.
إذا ما اشتغل، معناها المشكلة في الشبكة أو الـ Firewall.

---

## 📝 ملاحظات:

### للمحاكي:
إذا تبغى تستخدم المحاكي بدل الجهاز الحقيقي، غير الـ API URL في `build.gradle.kts`:

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://10.0.2.2:3000/api/\"")
```

### للجهاز الحقيقي:
استخدم IP جهازك (الحالي):

```kotlin
buildConfigField("String", "API_BASE_URL", "\"http://192.168.8.64:3000/api/\"")
```

---

## ✨ بعد ما تخلص:

التطبيق يجب أن يشتغل بشكل كامل:
- ✅ Splash Screen
- ✅ Home Screen مع المحتوى
- ✅ Player للفيديو والصوت
- ✅ Performer profiles
- ✅ Search
- ✅ Downloads UI

**جرب الحين!** 🚀
