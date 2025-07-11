@echo off
REM Contas-PT Windows Quick Start
REM Simple batch script for quick development start

echo 🚀 Contas-PT Windows Quick Start
echo =================================

REM Check if we're in the project directory
if not exist "package.json" (
    echo ❌ Error: package.json not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check Node.js
echo 📋 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 20+ LTS
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Check npm
echo 📋 Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not found
    pause
    exit /b 1
)

echo ✅ npm found
npm --version

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Setup environment file
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Created .env from template
        echo ⚠️  Please configure your environment variables in .env
        echo.
        set /p openenv="Open .env file for editing? (y/n): "
        if /i "%openenv%"=="y" (
            if exist "%PROGRAMFILES%\Microsoft VS Code\Code.exe" (
                "%PROGRAMFILES%\Microsoft VS Code\Code.exe" .env
            ) else (
                notepad .env
            )
        )
    ) else (
        echo ❌ .env.example not found
    )
) else (
    echo ✅ .env file exists
)

echo.
echo 🎉 Quick setup complete!
echo.
echo 📋 Next steps:
echo 1. Configure environment variables in .env
echo 2. Start development server with: npm run dev
echo 3. Open browser: http://localhost:5000
echo 4. Login with: aki@diamondnxt.com / Aki1234!@#
echo.
echo 📚 For detailed setup instructions:
echo    docs/windows-local-setup.md
echo.

set /p startdev="Start development server now? (y/n): "
if /i "%startdev%"=="y" (
    echo.
    echo 🚀 Starting development server...
    npm run dev
)

pause