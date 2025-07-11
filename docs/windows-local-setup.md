# Windows Local Development Setup Guide

Complete guide for setting up and running Contas-PT on Windows for local development and testing.

## Prerequisites

### Required Software

1. **Node.js 20+ (LTS)**
   ```powershell
   # Download from https://nodejs.org/
   # Or use Chocolatey
   choco install nodejs

   # Or use winget
   winget install OpenJS.NodeJS.LTS
   ```

2. **Git for Windows**
   ```powershell
   # Download from https://git-scm.com/download/win
   # Or use Chocolatey
   choco install git

   # Or use winget
   winget install Git.Git
   ```

3. **PowerShell 7+ (Recommended)**
   ```powershell
   # Install via winget
   winget install Microsoft.PowerShell

   # Or download from GitHub releases
   # https://github.com/PowerShell/PowerShell/releases
   ```

4. **Code Editor**
   - **VS Code** (Recommended): `winget install Microsoft.VisualStudioCode`
   - **WebStorm**: Commercial IDE with excellent Next.js support
   - **Cursor**: AI-powered VS Code alternative

### Verify Prerequisites

Open PowerShell and verify installations:

```powershell
# Check Node.js version (should be 20+)
node --version

# Check npm version
npm --version

# Check Git version
git --version

# Check PowerShell version
$PSVersionTable.PSVersion
```

## Project Setup

### 1. Clone the Repository

```powershell
# Navigate to your development directory
cd C:\Dev  # or wherever you keep projects

# Clone the repository
git clone <repository-url> contas-pt
cd contas-pt
```

### 2. Install Dependencies

```powershell
# Install all Node.js dependencies
npm install

# This will install 110+ packages including:
# - Next.js 15.3.4 (frontend framework)
# - Supabase client (database)
# - AI libraries (OpenAI, Google Gemini)
# - UI components (Radix UI, Tailwind CSS)
# - Background services (node-cron, WebSocket)
```

### 3. Environment Configuration

```powershell
# Copy the environment template
copy .env.example .env

# Open the .env file in your editor
code .env  # VS Code
# or
notepad .env  # Notepad
```

Configure your `.env` file with these required values:

```env
# Database (Required)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Security (Required)
SESSION_SECRET="generate-secure-32-char-secret"
NODE_ENV="development"
PORT="5000"

# AI Processing (Optional but recommended)
GOOGLE_AI_API_KEY="your-google-ai-api-key"
OPENAI_API_KEY="your-openai-api-key"

# Cloud Storage (Optional)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
DROPBOX_CLIENT_ID="your-dropbox-app-key"
DROPBOX_CLIENT_SECRET="your-dropbox-app-secret"
```

### 4. Database Setup

```powershell
# Push database schema to Supabase
npm run db:push

# This will create all required tables:
# - tenants, users, user_tenants
# - invoices, expenses, clients
# - documents, extracted_invoice_data
# - bank_accounts, payments
# - cloud_drive_configs
```

## Running the Application

### Development Mode

The application uses a hybrid architecture with both Next.js and Express components:

```powershell
# Start the development server (recommended)
npm run dev

# This command:
# 1. Starts the Express server with background services
# 2. Launches Next.js development server on port 5000
# 3. Enables hot reload for both frontend and backend
# 4. Starts WebSocket server for real-time updates
# 5. Initializes Dropbox scheduler for cloud sync
```

**Alternative: Next.js Only**
```powershell
# Start only Next.js (for frontend-only development)
npm run next:dev
```

### Build and Production Mode

```powershell
# Build for production
npm run build

# Start production server
npm run start
```

### Verify Installation

1. **Open your browser** and navigate to: `http://localhost:5000`

2. **Check the console output** for:
   ```
   🚀 Starting Next.js development server on port 5000...
   ▲ Next.js 15.3.4
   - Local:        http://localhost:5000
   ✓ Ready in 2.1s
   ```

3. **Test the login** with default credentials:
   - Email: `aki@diamondnxt.com`
   - Password: `Aki1234!@#`

## Windows-Specific Considerations

### PowerShell Execution Policy

If you encounter script execution errors:

```powershell
# Check current execution policy
Get-ExecutionPolicy

# Set execution policy for current user (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Path Length Limitations

Windows has a 260-character path limit that can cause issues with node_modules:

```powershell
# Enable long paths (requires admin PowerShell)
New-ItemProperty -Path "HKLM:SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Or use shorter project paths
cd C:\Dev\contas  # instead of C:\Users\YourName\Documents\Projects\contas-pt
```

### Windows Defender Exclusions

Add your development folder to Windows Defender exclusions for better performance:

1. Open **Windows Security** → **Virus & threat protection**
2. Click **Manage settings** under "Virus & threat protection settings"
3. Click **Add or remove exclusions**
4. Add your development folder (e.g., `C:\Dev`)

### File Watching Issues

If hot reload doesn't work properly:

```powershell
# Increase file watcher limits
$env:CHOKIDAR_USEPOLLING = "true"

# Or add to your .env file
echo "CHOKIDAR_USEPOLLING=true" >> .env
```

## Available Scripts Explanation

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `npm run dev` | **Main development command** | Daily development work |
| `npm run next:dev` | Next.js only | Frontend-only changes |
| `npm run build` | Production build | Before deployment |
| `npm run start` | Production server | Testing production build |
| `npm run db:push` | Update database schema | After schema changes |
| `npm run db:clean` | Clean all data | Reset for testing |
| `npm run check` | TypeScript check | Verify type safety |

## Common Development Workflows

### 1. Daily Development

```powershell
# Start your development session
cd C:\Dev\contas-pt
npm run dev

# Application available at: http://localhost:5000
# Console shows real-time updates and errors
```

### 2. Testing New Features

```powershell
# Pull latest changes
git pull

# Install any new dependencies
npm install

# Update database if schema changed
npm run db:push

# Start development
npm run dev
```

### 3. Working with AI Features

```powershell
# Ensure AI keys are configured in .env
# GOOGLE_AI_API_KEY and/or OPENAI_API_KEY

# Test document upload at: http://localhost:5000/documents
# Check AI processing in browser console and server logs
```

### 4. Cloud Storage Integration

```powershell
# Configure cloud credentials in .env
# Test at: http://localhost:5000/cloud-drives
# Monitor sync in server console output
```

## Troubleshooting Windows Issues

### Issue: npm install fails with permission errors

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Use different registry if needed
npm install --registry https://registry.npmjs.org/

# Or install with different permissions
npm install --no-optional
```

### Issue: Port 5000 already in use

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <process-id> /F

# Or use different port
$env:PORT = "3000"
npm run dev
```

### Issue: ENOENT errors with long paths

**Solution:**
```powershell
# Use shorter project path
cd C:\Dev
git clone <repo-url> cp  # shorter name

# Or enable long paths (requires admin)
git config --system core.longpaths true
```

### Issue: TypeScript errors in VS Code

**Solution:**
```powershell
# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or check TypeScript manually
npm run check
```

### Issue: Hot reload not working

**Solution:**
```powershell
# Enable polling mode
$env:CHOKIDAR_USEPOLLING = "true"
npm run dev

# Or add to .env permanently
echo "CHOKIDAR_USEPOLLING=true" >> .env
```

## Performance Tips for Windows

### 1. Use Windows Terminal
- Better performance than Command Prompt
- Multiple tabs and panes
- Better Unicode support for Portuguese characters

### 2. SSD Storage
- Install Node.js and projects on SSD for faster builds
- Avoid network drives for development

### 3. Antivirus Exclusions
- Exclude `node_modules` folders from real-time scanning
- Exclude your development directory

### 4. Memory Management
```powershell
# Check Node.js memory usage
# Task Manager → Details → node.exe

# Increase Node.js memory limit if needed
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm run dev
```

## VS Code Extensions for Development

Recommended extensions for optimal development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-npm-script-runner"
  ]
}
```

Install via VS Code command palette:
```
Ctrl+Shift+P → "Extensions: Install Extensions"
```

## Next Steps

Once your development environment is running:

1. **Explore the Application**
   - Dashboard: `http://localhost:5000`
   - Login with: `aki@diamondnxt.com` / `Aki1234!@#`

2. **Test Key Features**
   - Document upload and AI processing
   - Invoice and expense management
   - Portuguese VAT calculations
   - Cloud storage integration

3. **Review Documentation**
   - [API Reference](api-reference.md)
   - [Database Schema](supabase-database-architecture.md)
   - [AI Processing Pipeline](ai-processing-pipeline.md)

4. **Development Workflow**
   - Make changes and see hot reload
   - Check browser console for client errors
   - Monitor PowerShell for server logs

---

**Need Help?** Check our [Troubleshooting Guide](troubleshooting.md) or review the [Project Overview](project-overview.md) for more detailed information.

**Last Updated**: January 2, 2025 | **Windows Version**: Windows 10/11 | **Node.js**: 20+ LTS