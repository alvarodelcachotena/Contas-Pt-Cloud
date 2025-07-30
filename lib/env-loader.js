/**
 * Strict Environment Loader
 * Forces loading ONLY from .env file, ignoring any pre-existing environment variables
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

let envLoaded = false

export function loadEnvStrict() {
  if (envLoaded) return
  
  console.log('🔒 Forcing .env file values over Replit secrets...')
  
  const envPath = join(process.cwd(), '.env')
  
  if (!existsSync(envPath)) {
    throw new Error('.env file not found! Please ensure .env file exists in project root.')
  }
  
  // Define all environment variables we need to control
  const allRelevantKeys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'DROPBOX_CLIENT_ID',
    'DROPBOX_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SESSION_SECRET',
    'NODE_ENV',
    'PORT'
  ]
  
  // Backup original values for debugging
  const originalValues = {}
  allRelevantKeys.forEach(key => {
    if (process.env[key]) {
      originalValues[key] = process.env[key]
      delete process.env[key] // Clear pre-existing values
    }
  })
  
  // Manually parse and load .env file
  try {
    const envContent = readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key] = value
        }
      }
    })
    
    console.log('✅ Environment loaded from .env file only')
    
    // COMPLETELY REMOVE DATABASE_URL to prevent any direct database connections
    // System should use ONLY Supabase client with ANON_KEY from .env
    if (process.env.DATABASE_URL) {
      const oldUrl = process.env.DATABASE_URL
      delete process.env.DATABASE_URL
      console.log('🚫 REMOVED DATABASE_URL - Using ONLY Supabase client from .env')
      if (oldUrl.includes('neon')) {
        console.log('🚫 BLOCKED NEON DATABASE - System now uses ONLY Supabase')
      }
    }

    // Verify critical variables are now set
    const requiredKeys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
    const missing = requiredKeys.filter(key => !process.env[key])
    if (missing.length > 0) {
      console.error('❌ Missing required variables in .env file:', missing.join(', '))
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
    
    // Log which variables were overridden
    let overriddenCount = 0
    allRelevantKeys.forEach(key => {
      const original = originalValues[key]
      const current = process.env[key]
      
      if (original && current && original !== current) {
        console.log(`🔄 ${key}: Overridden with .env value`)
        overriddenCount++
      } else if (current && !original) {
        console.log(`✅ ${key}: Loaded from .env`)
      }
    })
    
    if (overriddenCount > 0) {
      console.log(`🎯 Successfully overridden ${overriddenCount} Replit secrets with .env values`)
    }
    
  } catch (error) {
    throw new Error(`Failed to load .env file: ${error.message}`)
  }
  
  envLoaded = true
}

// Export individual environment getters that ensure strict loading
export function getSupabaseUrl() {
  loadEnvStrict()
  const url = process.env.SUPABASE_URL
  if (!url) throw new Error('SUPABASE_URL not found in .env file')
  return url
}

export function getSupabaseAnonKey() {
  loadEnvStrict()
  const key = process.env.SUPABASE_ANON_KEY
  if (!key) throw new Error('SUPABASE_ANON_KEY not found in .env file')
  return key
}

export function getSupabaseServiceRoleKey() {
  loadEnvStrict()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in .env file')
  return key
}

export function getOpenAIKey() {
  loadEnvStrict()
  return process.env.OPENAI_API_KEY || null
}

export function getGoogleAIKey() {
  loadEnvStrict()
  return process.env.GOOGLE_AI_API_KEY || null
}