@echo off
chcp 65001 >nul
cls

echo.
echo ════════════════════════════════════════════════════════
echo   إصلاح PostgreSQL - Fix PostgreSQL Connection
echo ════════════════════════════════════════════════════════
echo.

echo الخطوة 1: تعديل pg_hba.conf
echo.
echo افتح هذا الملف كـ Administrator:
echo C:\Program Files\PostgreSQL\17\data\pg_hba.conf
echo.
echo ابحث عن هذه الأسطر:
echo   host    all             all             127.0.0.1/32            md5
echo   host    all             all             ::1/128                 md5
echo.
echo وغيرها إلى:
echo   host    all             all             127.0.0.1/32            trust
echo   host    all             all             ::1/128                 trust
echo.
pause

echo.
echo الخطوة 2: إعادة تشغيل PostgreSQL
echo.
net stop postgresql-x64-17
timeout /t 2 /nobreak >nul
net start postgresql-x64-17

echo.
echo الخطوة 3: تعيين كلمة المرور
echo.
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'admin123';"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] تم تعيين كلمة المرور بنجاح!
    echo.
    echo الخطوة 4: إرجاع الإعدادات
    echo.
    echo افتح pg_hba.conf مرة أخرى وغير trust إلى md5
    echo ثم أعد تشغيل PostgreSQL
    echo.
) else (
    echo.
    echo [ERROR] فشل تعيين كلمة المرور
    echo.
)

pause
