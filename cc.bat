@echo off
title Tạo Tài Khoản Bot Tự Động
echo =============================================
echo    CÔNG CỤ TẠO TÀI KHOẢN BOT TỰ ĐỘNG
echo    (Nhấn Enter để sử dụng giá trị mặc định)
echo =============================================
echo.

cd /d "%~dp0"
node scripts/createBotAccounts.js

pause