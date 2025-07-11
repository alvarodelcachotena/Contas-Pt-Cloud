#!/usr/bin/env node

/**
 * Comprehensive Environment Variable Validation
 * Ensures ONLY .env file is being used, not Replit secrets
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

console.log('🔍 Comprehensive Environment Validation\n')

// First, let's see what environment variables exist BEFORE loading .env
console.log('📋 Environment variables BEFORE loading .env:')
const envBeforeDotenv = { ...process.env }
const relevantKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'OPENAI_API_KEY', 'GOOGLE_AI_API_KEY']

relevantKeys.forEach(key => {
  const value = envBeforeDotenv[key]
  if (value) {
    console.log(`  ⚠️  ${key}: Already exists (${value.substring(0, 30)}...) - POTENTIAL REPLIT SECRET`)
  } else {
    console.log(`  ✅ ${key}: Not set`)
  }
})

console.log('\n📁 Checking .env file...')

// Check if .env file exists
const envPath = join(process.cwd(), '.env')
if (!existsSync(envPath)) {
  console.error('❌ .env file not found!')
  process.exit(1)
}

// Read .env file manually
const envContent = readFileSync(envPath, 'utf8')
console.log('✅ .env file found')
console.log(`📊 .env file size: ${envContent.length} characters`)

// Parse .env file manually to see what it contains
const envFromFile = {}
const lines = envContent.split('\n')
lines.forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=')
    if (key && valueParts.length > 0) {
      envFromFile[key] = valueParts.join('=')
    }
  }
})

console.log('\n📋 Variables found in .env file:')
relevantKeys.forEach(key => {
  const value = envFromFile[key]
  if (value) {
    console.log(`  ✅ ${key}: ${value.substring(0, 30)}...`)
  } else {
    console.log(`  ❌ ${key}: Missing from .env file`)
  }
})

// Now load dotenv and see what changes
console.log('\n🔄 Loading .env with dotenv...')
config()

console.log('\n📋 Environment variables AFTER loading .env:')
relevantKeys.forEach(key => {
  const valueBefore = envBeforeDotenv[key]
  const valueAfter = process.env[key]
  const valueFromFile = envFromFile[key]
  
  console.log(`\n${key}:`)
  console.log(`  Before dotenv: ${valueBefore ? `${valueBefore.substring(0, 30)}...` : 'Not set'}`)
  console.log(`  From .env file: ${valueFromFile ? `${valueFromFile.substring(0, 30)}...` : 'Not in file'}`)
  console.log(`  After dotenv: ${valueAfter ? `${valueAfter.substring(0, 30)}...` : 'Not set'}`)
  
  if (valueBefore && valueAfter === valueBefore) {
    console.log(`  🚨 WARNING: Using pre-existing value (likely Replit secret)`)
  } else if (valueFromFile && valueAfter === valueFromFile) {
    console.log(`  ✅ GOOD: Using value from .env file`)
  } else {
    console.log(`  ❓ UNCLEAR: Value source uncertain`)
  }
})

// Check if we're in Replit environment
console.log('\n🔍 Environment detection:')
console.log(`  REPL_ID: ${process.env.REPL_ID ? 'YES (Replit environment)' : 'NO (Local environment)'}`)
console.log(`  REPLIT_DOMAINS: ${process.env.REPLIT_DOMAINS ? 'YES' : 'NO'}`)
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`)

// Final recommendations
console.log('\n💡 Recommendations:')
if (process.env.REPL_ID) {
  console.log('  - You are in Replit environment')
  console.log('  - Replit may be injecting environment variables')
  console.log('  - Consider using dotenv with { override: true }')
} else {
  console.log('  - You are in local environment')
  console.log('  - Ensure .env file contains all required variables')
}

// Test Supabase connection with current environment
console.log('\n🧪 Testing Supabase connection with current environment...')
try {
  const { createClient } = await import('@supabase/supabase-js')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase credentials')
  } else {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`)
    } else {
      console.log('✅ Supabase connection successful')
    }
  }
} catch (error) {
  console.log(`❌ Supabase test failed: ${error.message}`)
}