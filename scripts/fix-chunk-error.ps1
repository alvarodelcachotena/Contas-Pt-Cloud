# Script para solucionar errores de ChunkLoadError en Next.js
# Uso: .\scripts\fix-chunk-error.ps1

Write-Host "🔧 Solucionando errores de ChunkLoadError..." -ForegroundColor Yellow

# Paso 1: Detener cualquier proceso de Node.js ejecutándose
Write-Host "📝 Deteniendo procesos de Node.js..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "next" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Paso 2: Limpiar archivos de caché y temporales
Write-Host "🧹 Limpiando archivos de caché..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .turbo -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Paso 3: Limpiar caché de npm
Write-Host "🔄 Limpiando caché de npm..." -ForegroundColor Cyan
npm cache clean --force

# Paso 4: Reinstalar dependencias
Write-Host "📦 Reinstalando dependencias..." -ForegroundColor Cyan
npm install

# Paso 5: Verificar que todo esté correcto
Write-Host "✅ Verificando instalación..." -ForegroundColor Cyan
npm run check

Write-Host "🎉 ¡Limpieza completada! Ahora puedes ejecutar 'npm run next:dev'" -ForegroundColor Green
Write-Host "💡 Si el problema persiste, verifica la configuración de next.config.js" -ForegroundColor Yellow 