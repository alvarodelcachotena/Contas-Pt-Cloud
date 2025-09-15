# Package Scripts Explanation

## Available npm Scripts

### Development Scripts

**`npm run dev`** (Primary development command)
- Runs: `cross-env NODE_ENV=development tsx server/index.ts`
- Purpose: Starts the full development stack with background services
- Includes: Next.js server + WebSocket + Dropbox scheduler + background services
- Port: 5000
- Use for: Complete development with all features

**`npm run next:dev`** (Simple development)
- Runs: `next dev -p 5000`
- Purpose: Starts only the Next.js development server
- Includes: Next.js server with hot reload
- Port: 5000
- Use for: Frontend-focused development, debugging UI issues


hhidhjdspgpjegmpsgg






### Build & Production Scripts

**`npm run build`**
- Runs: `next build`
- Purpose: Creates optimized production build
- Output: `.next/` directory with compiled assets
- Use for: Preparing for production deployment

**`npm run start`**
- Runs: `cross-env NODE_ENV=production node dist/index.js`
- Purpose: Starts production server
- Requires: Build completed first (`npm run build`)
- Use for: Production deployment

### Database Scripts

**`npm run db:push`**
- Runs: `drizzle-kit push`
- Purpose: Pushes database schema changes to Supabase
- Use for: After modifying `shared/schema.ts`

**`npm run db:clean`**
- Runs: `tsx -r dotenv/config db-clean.ts`
- Purpose: Cleans all data from database
- ⚠️ Warning: Destructive operation - removes all data
- Use for: Resetting database for testing

### Utility Scripts

**`npm run check`**
- Runs: `tsc`
- Purpose: TypeScript type checking without compilation
- Use for: Validating TypeScript code

**`npm run setup`**
- Runs: `cross-env NODE_ENV=development tsx setup.ts`
- Purpose: Initial project setup and configuration
- Use for: First-time project initialization

**`npm run test:setup`**
- Runs: `cross-env NODE_ENV=development tsx test-setup.ts`
- Purpose: Test environment setup
- Use for: Setting up test data and configuration

## Script Architecture Flow

```
npm run dev
    ↓
tsx server/index.ts
    ↓
spawn('node', ['dev-server.js'])
    ↓
spawn('npm', ['run', 'next:dev'])
    ↓
next dev -p 5000
```

## When to Use Each Script

| Scenario | Recommended Script | Why |
|----------|-------------------|-----|
| Regular development | `npm run dev` | Full feature set |
| UI/Frontend only | `npm run next:dev` | Faster startup, simpler |
| Schema changes | `npm run db:push` | Updates database |
| Type checking | `npm run check` | Validates TypeScript |
| Production build | `npm run build` | Optimized build |
| Production deploy | `npm run start` | Production server |
| Clean database | `npm run db:clean` | Reset data |

## Local Development Recommendations

**For Windows users:**
```bash
# Use PowerShell or Command Prompt
npm run next:dev
```

**For macOS/Linux users:**
```bash
# Use Terminal
npm run next:dev
```

**For debugging:**
```bash
# Check TypeScript first
npm run check

# Then start development
npm run next:dev
```

## Environment Dependencies

All scripts depend on these environment variables:
- `NODE_ENV` - Set automatically by cross-env
- `PORT` - Defaults to 5000
- `SUPABASE_URL` - Required for database
- `SUPABASE_ANON_KEY` - Required for database
- `SESSION_SECRET` - Required for authentication

## Script Troubleshooting

**If `npm run dev` fails:**
1. Try `npm run next:dev` instead
2. Check environment variables in `.env`
3. Verify Node.js version (20.x recommended)

**If `npm run build` fails:**
1. Run `npm run check` to find TypeScript errors
2. Fix any type errors
3. Retry build

**If `npm run db:push` fails:**
1. Check database connection
2. Verify `drizzle.config.ts` configuration
3. Ensure Supabase credentials are correct