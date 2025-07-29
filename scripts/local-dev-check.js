#!/usr/bin/env node

/**
 * Local Development Environment Checker
 * Run this script to diagnose common local development issues
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = dirname(__dirname)

console.log('🔍 Contas-PT Local Development Environment Check\n')

// Check 1: Node.js and npm versions
console.log('1. Checking Node.js and npm versions...')
try {
  const nodeVersion = process.version
  console.log(`   ✅ Node.js: ${nodeVersion}`)
  
  if (parseInt(nodeVersion.split('.')[0].slice(1)) < 18) {
    console.log('   ⚠️  Warning: Node.js 18+ recommended')
  }
} catch (error) {
  console.log('   ❌ Error checking Node.js version')
}

// Check 2: Package.json exists
console.log('\n2. Checking package.json...')
const packageJsonPath = join(projectRoot, 'package.json')
if (existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    console.log(`   ✅ Package.json found`)
    console.log(`   ✅ Project name: ${packageJson.name}`)
    console.log(`   ✅ Next.js version: ${packageJson.dependencies.next || 'Not found'}`)
  } catch (error) {
    console.log('   ❌ Error reading package.json')
  }
} else {
  console.log('   ❌ package.json not found')
}

// Check 3: Environment file
console.log('\n3. Checking environment configuration...')
const envPath = join(projectRoot, '.env')
const envExamplePath = join(projectRoot, '.env.example')

if (existsSync(envPath)) {
  console.log('   ✅ .env file found')
  try {
    const envContent = readFileSync(envPath, 'utf8')
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SESSION_SECRET']
    
    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        console.log(`   ✅ ${varName} configured`)
      } else {
        console.log(`   ⚠️  ${varName} missing`)
      }
    })
  } catch (error) {
    console.log('   ❌ Error reading .env file')
  }
} else if (existsSync(envExamplePath)) {
  console.log('   ⚠️  .env file not found, but .env.example exists')
  console.log('   💡 Copy .env.example to .env and configure your variables')
} else {
  console.log('   ❌ No environment configuration found')
}

// Check 4: Node modules
console.log('\n4. Checking dependencies...')
const nodeModulesPath = join(projectRoot, 'node_modules')
if (existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules directory found')
  
  // Check key dependencies
  const keyDeps = ['next', '@supabase/supabase-js', 'react', 'typescript']
  keyDeps.forEach(dep => {
    const depPath = join(nodeModulesPath, dep)
    if (existsSync(depPath)) {
      console.log(`   ✅ ${dep} installed`)
    } else {
      console.log(`   ⚠️  ${dep} missing`)
    }
  })
} else {
  console.log('   ❌ node_modules not found')
  console.log('   💡 Run: npm install')
}

// Check 5: Next.js configuration
console.log('\n5. Checking Next.js configuration...')
const nextConfigPath = join(projectRoot, 'next.config.js')
if (existsSync(nextConfigPath)) {
  console.log('   ✅ next.config.js found')
} else {
  console.log('   ⚠️  next.config.js not found')
}

// Check 6: TypeScript configuration
console.log('\n6. Checking TypeScript configuration...')
const tsconfigPath = join(projectRoot, 'tsconfig.json')
if (existsSync(tsconfigPath)) {
  console.log('   ✅ tsconfig.json found')
} else {
  console.log('   ⚠️  tsconfig.json not found')
}

// Check 7: Database connection (if possible)
console.log('\n7. Testing database connection...')
if (existsSync(envPath)) {
  try {
    // Load environment variables
    const envContent = readFileSync(envPath, 'utf8')
    const supabaseUrl = envContent.match(/SUPABASE_URL=(.+)/)?.[1]
    const supabaseKey = envContent.match(/SUPABASE_ANON_KEY=(.+)/)?.[1]
    
    if (supabaseUrl && supabaseKey) {
      console.log('   ✅ Database credentials found')
      console.log('   💡 Test connection by starting the development server')
    } else {
      console.log('   ⚠️  Database credentials incomplete')
    }
  } catch (error) {
    console.log('   ❌ Error checking database credentials')
  }
} else {
  console.log('   ⚠️  Cannot test - no .env file')
}

// Recommendations
console.log('\n📋 Recommendations for Local Development:')
console.log('   1. Use: npm run next:dev (for simple development)')
console.log('   2. Use: npm run dev (for full feature development)')
console.log('   3. Open: http://localhost:5000')
console.log('   4. Login: aki@diamondnxt.com / admin123')

console.log('\n🚀 Ready to start development!')
console.log('   Run: npm run next:dev')