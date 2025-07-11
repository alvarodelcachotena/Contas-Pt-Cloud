import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from './env-loader.js'

/**
 * Get tenant ID from various sources with proper fallback handling
 */
export async function getTenantId(request: NextRequest, userEmail?: string): Promise<number> {
  // Load environment variables
  loadEnvStrict()
  
  // Try to get tenant ID from headers first (for authenticated requests)
  const tenantIdHeader = request.headers.get('x-tenant-id')
  if (tenantIdHeader) {
    return parseInt(tenantIdHeader)
  }

  // If userEmail is provided, look up their tenant association
  if (userEmail) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
    )

    const { data: userData } = await supabase
      .from('users')
      .select(`
        user_tenants (
          tenant_id
        )
      `)
      .eq('email', userEmail)
      .single()

    if (userData?.user_tenants && userData.user_tenants.length > 0) {
      const firstTenant = userData.user_tenants[0] as any
      return firstTenant.tenant_id
    }
  }

  // Fallback to tenant ID 1 for development
  return 1
}

/**
 * Get tenant information by ID
 */
export async function getTenantInfo(tenantId: number): Promise<{ id: number; name: string } | null> {
  loadEnvStrict()
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
  )

  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', tenantId)
    .single()

  return tenantData || null
}

/**
 * Create new tenant (for admin functions)
 */
export async function createTenant(name: string, nif?: string, address?: string): Promise<number | null> {
  loadEnvStrict()
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
  )

  const { data: newTenant, error } = await supabase
    .from('tenants')
    .insert({
      name,
      nif,
      address
    })
    .select('id')
    .single()

  if (error) {
    console.error('❌ Error creating tenant:', error)
    return null
  }

  return newTenant.id
}

/**
 * Associate user with tenant
 */
export async function associateUserWithTenant(userId: number, tenantId: number, role: string = 'user'): Promise<boolean> {
  loadEnvStrict()
  
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('user_tenants')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      role
    })

  if (error) {
    console.error('❌ Error associating user with tenant:', error)
    return false
  }

  return true
}