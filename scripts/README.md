# Windows Setup Scripts

This directory contains automation scripts for setting up the Contas-PT development environment on Windows.

## Available Scripts

### 🚀 Quick Start (Batch)
**File**: `windows-quickstart.bat`

Simple batch script for immediate setup and development start.

```cmd
# Run from project root directory
scripts\windows-quickstart.bat
```

**Features:**
- Checks Node.js and npm installation
- Installs dependencies if needed
- Creates .env from template
- Offers to start development server
- Works on any Windows version

### ⚙️ Full Setup (PowerShell)
**File**: `windows-setup.ps1`

Comprehensive PowerShell script with advanced features and validation.

```powershell
# Basic usage
PowerShell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1

# Advanced usage with parameters
PowerShell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1 -ProjectPath "D:\Projects\contas-pt" -SkipPrerequisites
```

**Parameters:**
- `-ProjectPath`: Custom project directory path
- `-SkipPrerequisites`: Skip prerequisite checks
- `-SkipDependencies`: Skip npm install

**Features:**
- Comprehensive prerequisite checking (Node.js 20+, npm, Git)
- Automated dependency installation with error handling
- Environment configuration with validation
- Database schema setup via Supabase
- Windows-specific optimizations
- PowerShell execution policy checks
- Long path support detection
- Interactive prompts for configuration

## Usage Recommendations

### For Beginners
Use the **batch script** (`windows-quickstart.bat`):
- Simple double-click execution
- No PowerShell knowledge required
- Basic error checking
- Fast setup for immediate development

### For Advanced Users
Use the **PowerShell script** (`windows-setup.ps1`):
- Comprehensive validation and error handling
- Detailed system optimization checks
- Automated database setup
- Better error reporting and troubleshooting
- Configurable parameters

## Prerequisites

Both scripts require:
- **Node.js 20+ LTS**: Download from [nodejs.org](https://nodejs.org/)
- **Git**: Download from [git-scm.com](https://git-scm.com/download/win)

Optional package manager installation:
```powershell
# Using winget (Windows 10+)
winget install OpenJS.NodeJS.LTS
winget install Git.Git

# Using Chocolatey
choco install nodejs
choco install git
```

## Troubleshooting

### PowerShell Execution Policy
If you get execution policy errors:

```powershell
# Check current policy
Get-ExecutionPolicy

# Allow scripts for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass (one-time)
PowerShell -ExecutionPolicy Bypass -File scripts\windows-setup.ps1
```

### Long Path Issues
For node_modules path length issues (requires admin PowerShell):

```powershell
# Enable long paths system-wide
New-ItemProperty -Path "HKLM:SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Enable for Git
git config --system core.longpaths true
```

### Common Issues

1. **"npm install fails"**
   - Clear cache: `npm cache clean --force`
   - Try different registry: `npm install --registry https://registry.npmjs.org/`

2. **"Port 5000 in use"**
   - Find process: `netstat -ano | findstr :5000`
   - Kill process: `taskkill /PID <process-id> /F`

3. **"Permission denied"**
   - Run PowerShell as Administrator
   - Check antivirus exclusions for development folder

## Post-Setup

After running either script:

1. **Configure Environment**: Edit `.env` with your Supabase and AI API keys
2. **Start Development**: Run `npm run dev`
3. **Open Application**: Navigate to `http://localhost:5000`
4. **Test Login**: Use `aki@diamondnxt.com` / `Aki1234!@#`

## Additional Resources

- **[Complete Windows Setup Guide](../docs/windows-local-setup.md)** - Detailed documentation
- **[Troubleshooting](../docs/troubleshooting.md)** - Common issues and solutions
- **[Project Architecture](../ARCHITECTURE.md)** - System overview
- **[Environment Configuration](../.env.example)** - Configuration template

---

**Need Help?** Check the [Windows Local Setup Guide](../docs/windows-local-setup.md) for comprehensive instructions and troubleshooting.