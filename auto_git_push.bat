@echo off
title GEP Git Auto-Sync (10 Mins)
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo ========================================================
2: echo   GEP Packaging ERP - Git Auto-Sync Service
3: echo   Pushing to: https://github.com/thienanna799-spec/weP-app-gep
4: echo   Interval: Every 10 Minutes
5: echo ========================================================
6: 

:loop
echo.
echo [%date% %time%] Bắt đầu đồng bộ dữ liệu lên Git...

:: Thêm tất cả các thay đổi
git add -A

:: Kiểm tra xem có gì để commit không
git diff-index --quiet HEAD --
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] Phát hiện có thay đổi mới, đang commit...
    git commit -m "auto: đồng bộ mã nguồn định kỳ"
    echo [%date% %time%] Đang đẩy lên GitHub...
    git push origin main
    if %ERRORLEVEL% EQU 0 (
        echo [%date% %time%] Đã đẩy mã nguồn lên GitHub thành công!
    ) else (
        echo [%date% %time%] [LỖI] Đẩy lên GitHub thất bại. Sẽ thử lại sau.
    )
) else (
    echo [%date% %time%] Không có thay đổi mới. Bỏ qua commit.
)

echo [%date% %time%] Chờ 10 phút trước lần đồng bộ tiếp theo...
timeout /t 600 /nobreak
goto loop
