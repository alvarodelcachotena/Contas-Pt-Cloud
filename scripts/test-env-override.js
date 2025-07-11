#!/usr/bin/env node

/**
 * Test Environment Override
 * Verifies that dotenv override is working correctly
 */

import { config } from 'dotenv'

console.log('🧪 Testing dotenv override functionality\n')

// Check what values exist BEFORE override
console.log('📋 BEFORE override:')
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL?.substring(0, 40)}...`)
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY?.substring(0, 40)}...`)

// Load with override
console.log('\n🔄 Loading .env with override: true...')
config({ override: true })

// Check what values exist AFTER override
console.log('\n📋 AFTER override:')
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL?.substring(0, 40)}...`)
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY?.substring(0, 40)}...`)

// Test connection to verify we're using the correct database
console.log('\n🧪 Testing Supabase connection...')
try {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  
  const { data, error } = await supabase.from('users').select('email').limit(1)
  
  if (error) {
    console.log(`❌ Connection failed: ${error.message}`)
  } else {
    console.log('✅ Connection successful')
    if (data && data.length > 0) {
      console.log(`📧 Found user: ${data[0].email}`)
    } else {
      console.log('📭 No users found in database')
    }
  }
} catch (error) {
  console.log(`❌ Test failed: ${error.message}`)
}