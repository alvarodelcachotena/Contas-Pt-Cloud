import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } from '../../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Get environment variables using strict loader - using service role key for authentication
const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_SERVICE_ROLE_KEY = getSupabaseServiceRoleKey()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, companyName, nif } = await request.json()

    // Validar campos requeridos
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password y name son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validar longitud de password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userCheckError)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Crear el usuario
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password_hash: passwordHash,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, email, name, role')
      .single()

    if (userError) {
      console.error('Error creating user:', userError)
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      )
    }

    // Si se proporciona información de empresa, crear tenant
    let tenantId = 1 // Default tenant
    if (companyName && nif) {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: companyName.trim(),
          tax_id: nif.trim(),
          address: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (tenantError) {
        console.error('Error creating tenant:', tenantError)
        // No fallar el registro si no se puede crear el tenant
      } else {
        tenantId = newTenant.id
      }
    }

    // Asignar usuario al tenant
    const { error: userTenantError } = await supabase
      .from('user_tenants')
      .insert({
        user_id: newUser.id,
        tenant_id: tenantId,
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (userTenantError) {
      console.error('Error assigning user to tenant:', userTenantError)
      // No fallar el registro si no se puede asignar al tenant
    }

    console.log('✅ Usuario registrado exitosamente:', email)

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
