/**
 * Local Development User Setup Script
 * Creates the super admin user for local testing
 * Run with: node scripts/setup-local-user.js
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function setupLocalUser() {
  try {
    console.log('🔧 Setting up local development user...')
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'aki@diamondnxt.com')
      .single()
    
    if (existingUser) {
      console.log('✅ User aki@diamondnxt.com already exists')
      return
    }
    
    // Hash the password
    const password = 'Aki1234!@#'
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Create the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: 3,
        email: 'aki@diamondnxt.com',
        name: 'Aki Super Admin',
        password_hash: hashedPassword,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (userError) {
      console.error('❌ Error creating user:', userError)
      return
    }
    
    console.log('✅ User created successfully')
    
    // Check if tenant exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', 1)
      .single()
    
    if (!existingTenant) {
      // Create the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          id: 1,
          name: 'DIAMOND NXT TRADING LDA',
          tax_id: '517124548',
          address: 'Vila Nova de Gaia, Portugal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (tenantError) {
        console.error('❌ Error creating tenant:', tenantError)
        return
      }
      
      console.log('✅ Tenant created successfully')
    } else {
      console.log('✅ Tenant already exists')
    }
    
    // Check if user-tenant relationship exists
    const { data: existingRelation } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', '3')
      .eq('tenant_id', 1)
      .single()
    
    if (!existingRelation) {
      // Create user-tenant relationship
      const { error: relationError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: '3',
          tenant_id: 1,
          role: 'admin',
          is_active: true,
          created_at: new Date().toISOString()
        })
      
      if (relationError) {
        console.error('❌ Error creating user-tenant relationship:', relationError)
        return
      }
      
      console.log('✅ User-tenant relationship created successfully')
    } else {
      console.log('✅ User-tenant relationship already exists')
    }
    
    console.log('\n🎉 Local development setup complete!')
    console.log('📧 Email: aki@diamondnxt.com')
    console.log('🔑 Password: Aki1234!@#')
    console.log('🏢 Company: DIAMOND NXT TRADING LDA')
    console.log('👑 Role: Admin')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

setupLocalUser()