# استخراج cookies من Edge لـ Twitter/X
$ErrorActionPreference = "Stop"

Write-Host "🔍 جاري استخراج cookies من Edge..." -ForegroundColor Cyan

# مسار قاعدة بيانات Edge
$edgePath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Network\Cookies"

if (-not (Test-Path $edgePath)) {
    Write-Host "❌ ملف cookies غير موجود في: $edgePath" -ForegroundColor Red
    Write-Host "💡 تأكد من أن Edge مثبت ومسجل دخول في Twitter/X" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ تم العثور على ملف cookies" -ForegroundColor Green
Write-Host "📝 استخدم yt-dlp لاستخراج الـ cookies..." -ForegroundColor Cyan

# استخدام yt-dlp مع --cookies-from-browser
# نحاول مع تشغيل كـ Administrator
try {
    $result = yt-dlp --cookies-from-browser edge --cookies cookies.txt "https://twitter.com" 2>&1
    
    if (Test-Path "cookies.txt") {
        $lines = (Get-Content "cookies.txt" | Measure-Object -Line).Lines
        Write-Host "✅ تم استخراج ملف cookies بنجاح!" -ForegroundColor Green
        Write-Host "📊 عدد الأسطر: $lines" -ForegroundColor Cyan
        
        # عرض أول 10 أسطر
        Write-Host "`n📄 محتوى الملف:" -ForegroundColor Cyan
        Get-Content "cookies.txt" | Select-Object -First 10
        
        exit 0
    } else {
        Write-Host "❌ فشل إنشاء ملف cookies" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "❌ خطأ: $_" -ForegroundColor Red
    exit 1
}
