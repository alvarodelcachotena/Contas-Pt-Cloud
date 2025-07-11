# Contas-PT Windows Setup Script
# Automates the local development environment setup on Windows

param(
    [switch]$SkipPrerequisites,
    [switch]$SkipDependencies,
    [string]$ProjectPath = "C:\Dev\contas-pt"
)

Write-Host "🚀 Contas-PT Windows Setup Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to check version requirements
function Test-NodeVersion {
    try {
        $nodeVersion = node --version
        $versionNumber = [Version]($nodeVersion -replace 'v', '')
        $requiredVersion = [Version]"20.0.0"
        
        if ($versionNumber -ge $requiredVersion) {
            Write-Host "✅ Node.js $nodeVersion (meets requirement v20+)" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Node.js $nodeVersion (requires v20+)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
        return $false
    }
}

# Check prerequisites
if (-not $SkipPrerequisites) {
    Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow
    
    $prerequisitesMet = $true
    
    # Check Node.js
    if (Test-Command "node") {
        if (-not (Test-NodeVersion)) {
            $prerequisitesMet = $false
        }
    }
    else {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
        $prerequisitesMet = $false
    }
    
    # Check npm
    if (Test-Command "npm") {
        $npmVersion = npm --version
        Write-Host "✅ npm $npmVersion" -ForegroundColor Green
    }
    else {
        Write-Host "❌ npm not found" -ForegroundColor Red
        $prerequisitesMet = $false
    }
    
    # Check Git
    if (Test-Command "git") {
        $gitVersion = git --version
        Write-Host "✅ $gitVersion" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Git not found" -ForegroundColor Red
        $prerequisitesMet = $false
    }
    
    if (-not $prerequisitesMet) {
        Write-Host "`n❌ Prerequisites not met. Please install:" -ForegroundColor Red
        Write-Host "   - Node.js 20+ LTS: https://nodejs.org/" -ForegroundColor White
        Write-Host "   - Git: https://git-scm.com/download/win" -ForegroundColor White
        Write-Host "`nOr use package managers:" -ForegroundColor White
        Write-Host "   winget install OpenJS.NodeJS.LTS" -ForegroundColor Gray
        Write-Host "   winget install Git.Git" -ForegroundColor Gray
        exit 1
    }
}

# Check if project directory exists
if (Test-Path $ProjectPath) {
    Write-Host "`n📁 Project directory exists: $ProjectPath" -ForegroundColor Yellow
    $response = Read-Host "Continue with existing directory? (y/n)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Setup cancelled." -ForegroundColor Red
        exit 1
    }
    Set-Location $ProjectPath
}
else {
    Write-Host "`n❌ Project directory not found: $ProjectPath" -ForegroundColor Red
    Write-Host "Please clone the repository first or specify correct path." -ForegroundColor White
    Write-Host "Example: git clone <repo-url> $ProjectPath" -ForegroundColor Gray
    exit 1
}

# Install dependencies
if (-not $SkipDependencies) {
    Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Yellow
    
    try {
        # Clear npm cache to avoid potential issues
        npm cache clean --force
        
        # Install dependencies with progress
        Write-Host "Installing Node.js packages (this may take a few minutes)..." -ForegroundColor White
        npm install
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
        }
        else {
            throw "npm install failed"
        }
    }
    catch {
        Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
        Write-Host "Try running manually: npm install" -ForegroundColor White
        exit 1
    }
}

# Setup environment file
Write-Host "`n⚙️ Setting up Environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Created .env from template" -ForegroundColor Green
        Write-Host "⚠️  Please configure your environment variables in .env" -ForegroundColor Yellow
        
        # Offer to open .env for editing
        $response = Read-Host "Open .env file for editing? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            if (Test-Command "code") {
                code .env
            }
            elseif (Test-Command "notepad") {
                notepad .env
            }
            else {
                Write-Host "Please edit .env file manually" -ForegroundColor White
            }
        }
    }
    else {
        Write-Host "❌ .env.example not found" -ForegroundColor Red
    }
}
else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check for required environment variables
Write-Host "`n🔍 Checking Environment Configuration..." -ForegroundColor Yellow

$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$requiredVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "SESSION_SECRET")
$missingVars = @()

foreach ($var in $requiredVars) {
    $found = $envContent | Where-Object { $_ -match "^$var=" -and $_ -notmatch "^$var=.*your-.*" }
    if (-not $found) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  Missing required environment variables:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor White
    }
}
else {
    Write-Host "✅ Required environment variables configured" -ForegroundColor Green
}

# Database setup
Write-Host "`n🗄️ Database Setup..." -ForegroundColor Yellow

if ($missingVars -notcontains "SUPABASE_URL" -and $missingVars -notcontains "SUPABASE_ANON_KEY") {
    try {
        Write-Host "Pushing database schema to Supabase..." -ForegroundColor White
        npm run db:push
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema updated successfully" -ForegroundColor Green
        }
        else {
            throw "Database schema push failed"
        }
    }
    catch {
        Write-Host "❌ Database setup failed: $_" -ForegroundColor Red
        Write-Host "Make sure your Supabase credentials are correct in .env" -ForegroundColor White
    }
}
else {
    Write-Host "⚠️  Skipping database setup - Supabase credentials missing" -ForegroundColor Yellow
}

# Windows-specific optimizations
Write-Host "`n🪟 Windows Optimizations..." -ForegroundColor Yellow

# Check PowerShell execution policy
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Host "⚠️  PowerShell execution policy is Restricted" -ForegroundColor Yellow
    Write-Host "Consider running: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor White
}
else {
    Write-Host "✅ PowerShell execution policy: $executionPolicy" -ForegroundColor Green
}

# Check for long path support
try {
    $longPathEnabled = Get-ItemProperty -Path "HKLM:SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -ErrorAction SilentlyContinue
    if ($longPathEnabled.LongPathsEnabled -eq 1) {
        Write-Host "✅ Long paths enabled" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Long paths not enabled (may cause issues with node_modules)" -ForegroundColor Yellow
        Write-Host "Consider enabling with admin PowerShell: " -ForegroundColor White
        Write-Host "New-ItemProperty -Path 'HKLM:SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1 -PropertyType DWORD -Force" -ForegroundColor Gray
    }
}
catch {
    Write-Host "⚠️  Could not check long path support" -ForegroundColor Yellow
}

# Final setup summary
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure missing environment variables in .env" -ForegroundColor White
Write-Host "2. Start development server: npm run dev" -ForegroundColor White
Write-Host "3. Open browser: http://localhost:5000" -ForegroundColor White
Write-Host "4. Login with: aki@diamondnxt.com / Aki1234!@#" -ForegroundColor White

Write-Host "`n📚 Documentation:" -ForegroundColor Yellow
Write-Host "- Windows Setup Guide: docs/windows-local-setup.md" -ForegroundColor White
Write-Host "- API Reference: docs/api-reference.md" -ForegroundColor White
Write-Host "- Troubleshooting: docs/troubleshooting.md" -ForegroundColor White

Write-Host "`n🚀 Ready to start development!" -ForegroundColor Green

# Offer to start development server
$response = Read-Host "`nStart development server now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
    npm run dev
}