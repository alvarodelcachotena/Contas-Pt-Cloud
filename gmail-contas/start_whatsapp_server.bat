@echo off
echo ===============================================
echo    🚀 WhatsApp Media Sync - Iniciando
echo ===============================================
echo.

echo 🔧 Iniciando servidor Python...
start "WhatsApp Server" python what.py

echo ⏳ Esperando a que el servidor se inicie...
timeout /t 3 /nobreak > nul

echo 🌐 Iniciando ngrok...
echo.
echo ⚠️  IMPORTANTE: Copia la URL https que aparecerá abajo
echo    Ejemplo: https://abc123.ngrok.io
echo.
echo 🔗 Usa esta URL para configurar el webhook:
echo    https://tu-url-ngrok.ngrok.io/webhook
echo.
echo 🔐 Token de verificación: 1c7eba0ef1c438301a9b0f369d6e1708
echo.
echo ===============================================
echo    📋 Sigue estos pasos:
echo    1. Copia la URL https de ngrok
echo    2. Ve a developers.facebook.com
echo    3. Configura el webhook con la URL + /webhook
echo    4. Usa el token de verificación mostrado arriba
echo ===============================================
echo.

ngrok http 5000
pause 