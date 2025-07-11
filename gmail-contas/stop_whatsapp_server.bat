@echo off
echo ===============================================
echo    🛑 Deteniendo WhatsApp Media Sync
echo ===============================================
echo.

echo 🔌 Cerrando servidor Python...
taskkill /f /im python.exe /t >nul 2>&1

echo 🔌 Cerrando ngrok...
taskkill /f /im ngrok.exe /t >nul 2>&1

echo ✅ Todos los servicios han sido detenidos
echo.
pause 