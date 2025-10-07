/**
 * Strict Environment Loader
 * Forces loading ONLY from .env file, ignoring any pre-existing environment variables
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

let envLoaded = false

export function loadEnvStrict() {
  if (envLoaded) return

  // En Netlify, usar variables de entorno directamente
  if (process.env.NETLIFY) {
    console.log('🌐 Netlify environment detected - using environment variables directly')
    envLoaded = true
    return
  }

  // En desarrollo local, intentar cargar desde .env si existe
  console.log('🔒 Loading environment variables...')

  const envPath = join(process.cwd(), '.env')

  if (existsSync(envPath)) {
    console.log('📁 .env file found, loading...')

    // Define all environment variables we need to control
    const allRelevantKeys = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'DATABASE_URL',
      'OPENAI_API_KEY',
      'GOOGLE_AI_API_KEY',
      'GEMINI_API_KEY',
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

      console.log('✅ Environment loaded from .env file')

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
        console.log(`🎯 Successfully overridden ${overriddenCount} environment variables with .env values`)
      }

    } catch (error) {
      console.warn(`⚠️ Failed to load .env file: ${error.message}`)
    }
  } else {
    console.log('📁 No .env file found, using system environment variables')
  }

  envLoaded = true
}

// Export individual environment getters that ensure strict loading
export function getSupabaseUrl() {
  loadEnvStrict()
  const url = process.env.SUPABASE_URL
  if (!url) throw new Error('SUPABASE_URL not found in .env file')
  if (url.includes('tu_supabase_url_aqui') || url === 'tu_supabase_url_aqui/') {
    throw new Error('SUPABASE_URL contains invalid placeholder URL')
  }
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
  // En Netlify, usar directamente las variables de entorno
  if (process.env.NETLIFY) {
    return process.env.OPENAI_API_KEY || null
  }
  return process.env.OPENAI_API_KEY || null
}

export function getGoogleAIKey() {
  loadEnvStrict()
  // En Netlify, usar directamente las variables de entorno
  if (process.env.NETLIFY) {
    return process.env.GOOGLE_AI_API_KEY || null
  }
  return process.env.GOOGLE_AI_API_KEY || null
}

export function getGeminiKey() {
  loadEnvStrict()
  // En Netlify, usar directamente las variables de entorno
  if (process.env.NETLIFY) {
    return process.env.GEMINI_API_KEY || null
  }
  return process.env.GEMINI_API_KEY || null
}