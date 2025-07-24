# Local Development Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 20.x (recommended)
- npm 10.x or later
- Git

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd contas-pt
npm install
```

### 3. Environment Setup
Copy the environment template and configure:
```bash
cp .env.example .env
```

**Critical Environment Variables (Required):**
```bash
# Database
SUPABASE_URL=https://mtkjxeewqcbjwjljfmgf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10a2p4ZWV3cWNiandqbGpmbWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTMxNzksImV4cCI6MjA2NjI2OTE3OX0.i0WZRra9XDJxcd2B72yOkBrlvPnjph249zuZpEKQUmw

# Session
SESSION_SECRET=contas-pt-secure-session-secret-2025

# Development
NODE_ENV=development
PORT=5000
```

**Optional Variables (for full functionality):**
```bash
# AI Processing
OPENAI_API_KEY=your-openai-key
GOOGLE_AI_API_KEY=your-google-ai-key

# Cloud Storage
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DROPBOX_CLIENT_ID=your-dropbox-client-id
DROPBOX_CLIENT_SECRET=your-dropbox-client-secret
```

### 4. Development Commands

**Recommended Development Command:**
```bash
# Simplified development server (Next.js only)
npm run next:dev
```

**Full Development Stack:**
```bash
# Complete development server with background services
npm run dev
```

**Alternative Development Commands:**
```bash
# Build for production
npm run build

# Start production server
npm run start

# TypeScript check
npm run check

# Database operations
npm run db:push
```

## Troubleshooting Common Issues

### Issue 1: Port 5000 already in use
```bash
# Check what's using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Kill the process or use different port
PORT=3000 npm run next:dev
```

### Issue 2: Environment variables not loading
```bash
# Verify .env file exists
ls -la .env

# Check if variables are loaded
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
```

### Issue 3: Database connection errors
```bash
# Test database connection
curl -X GET "https://mtkjxeewqcbjwjljfmgf.supabase.co/rest/v1/" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10a2p4ZWV3cWNiandqbGpmbWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTMxNzksImV4cCI6MjA2NjI2OTE3OX0.i0WZRra9XDJxcd2B72yOkBrlvPnjph249zuZpEKQUmw"
```

### Issue 4: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 5: TypeScript errors
```bash
# Generate Next.js types
npm run dev  # Start dev server to generate types
# OR
npx next build  # Generate build types
```

## Local vs Replit Differences

| Feature | Replit | Local |
|---------|--------|-------|
| Environment | Auto-configured | Manual setup required |
| Database | Auto-connected | Same Supabase instance |
| Port | 5000 | 5000 (configurable) |
| AI Keys | Pre-configured | Optional setup |
| Hot Reload | ✅ | ✅ |

## Development Workflow

### Daily Development
```bash
# Start development
npm run next:dev

# Open browser
open http://localhost:5000

# Login with test credentials
# Email: aki@diamondnxt.com
# Password: admin123
```

### Feature Development
```bash
# Pull latest changes
git pull

# Install new dependencies (if any)
npm install

# Start development
npm run next:dev

# Test your changes
# http://localhost:5000
```

### Testing AI Features
1. Configure AI keys in `.env`
2. Navigate to `/documents` for document upload
3. Test document processing with real PDFs
4. Check browser console for processing logs

## Project Structure
```
/
├── app/                    # Next.js app directory (pages & APIs)
├── components/            # React components
├── hooks/                 # Custom React hooks  
├── lib/                   # Utility libraries
├── docs/                  # Documentation
├── public/                # Static assets
├── .env                   # Environment variables (create from .env.example)
├── package.json           # Dependencies and scripts
└── next.config.js         # Next.js configuration
```

## Success Verification

After setup, verify everything works:

1. **Server starts successfully**
   ```
   ▲ Next.js 15.3.4
   - Local: http://localhost:5000
   ✓ Ready in 2.1s
   ```

2. **Login works**
   - Navigate to http://localhost:5000
   - Login with: aki@diamondnxt.com / admin123

3. **Pages load without errors**
   - Dashboard: http://localhost:5000
   - Documents: http://localhost:5000/documents
   - Cloud Drives: http://localhost:5000/cloud-drives

## Getting Help

If you encounter issues:
1. Check this troubleshooting guide first
2. Review browser console for JavaScript errors
3. Check terminal/command prompt for server errors
4. Verify environment variables are set correctly
5. Ensure Node.js version is 20.x

## Production Notes

For production deployment:
- Set `NODE_ENV=production`
- Use `npm run build` followed by `npm run start`
- Ensure all environment variables are configured
- Use HTTPS for secure sessions