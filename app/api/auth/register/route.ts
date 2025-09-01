import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } from '../../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Get environment variables using strict loader - using service role key for full permissions
const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_SERVICE_ROLE_KEY = getSupabaseServiceRoleKey()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando proceso de registro...')

    const body = await request.json()
    console.log('📝 Datos recibidos:', { ...body, password: '[HIDDEN]' })

    const { email, password, name, companyName, nif } = body

    // Validar campos requeridos
    if (!email || !password || !name) {
      console.log('❌ Campos requeridos faltantes:', { email: !!email, password: !!password, name: !!name })
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
    console.log('🔍 Verificando si el usuario ya existe...')
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', userCheckError)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('❌ Usuario ya existe:', email)
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      )
    }

    console.log('✅ Usuario no existe, procediendo con la creación...')

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    console.log('🔐 Generando hash de contraseña...')
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)
    console.log('✅ Hash generado correctamente')

    // Crear el usuario
    console.log('👤 Creando usuario en la base de datos...')
    const userData = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password_hash: passwordHash,
      role: 'user'
      // No especificar created_at para usar el valor por defecto de la base de datos
    }
    console.log('📝 Datos del usuario a insertar:', { ...userData, password_hash: '[HIDDEN]' })

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(userData)
      .select('id, email, name, role')
      .single()

    if (userError) {
      console.error('❌ Error creating user:', userError)
      console.error('❌ Error details:', JSON.stringify(userError, null, 2))
      return NextResponse.json(
        { error: 'Error al crear el usuario: ' + userError.message },
        { status: 500 }
      )
    }

    console.log('✅ Usuario creado exitosamente:', newUser)

    // Si se proporciona información de empresa, crear tenant
    let tenantId = 1 // Default tenant
    if (companyName && nif) {
      console.log('🏢 Creando tenant para la empresa...')
      const tenantData = {
        name: companyName.trim(),
        nif: nif.trim(),
        address: ''
        // No especificar created_at para usar el valor por defecto de la base de datos
      }
      console.log('📝 Datos del tenant:', tenantData)

      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select('id')
        .single()

      if (tenantError) {
        console.error('❌ Error creating tenant:', tenantError)
        console.error('❌ Tenant error details:', JSON.stringify(tenantError, null, 2))
        // No fallar el registro si no se puede crear el tenant
      } else {
        tenantId = newTenant.id
        console.log('✅ Tenant creado exitosamente con ID:', tenantId)
      }
    } else {
      console.log('🏢 Usando tenant por defecto (ID: 1)')
    }

    // Asignar usuario al tenant
    console.log('🔗 Asignando usuario al tenant...')
    const userTenantData = {
      user_id: newUser.id,
      tenant_id: tenantId,
      role: 'admin',
      is_active: true
      // No especificar created_at para usar el valor por defecto de la base de datos
    }
    console.log('📝 Datos de asignación:', userTenantData)

    const { error: userTenantError } = await supabase
      .from('user_tenants')
      .insert(userTenantData)

    if (userTenantError) {
      console.error('❌ Error assigning user to tenant:', userTenantError)
      console.error('❌ UserTenant error details:', JSON.stringify(userTenantError, null, 2))
      // No fallar el registro si no se puede asignar al tenant
    } else {
      console.log('✅ Usuario asignado al tenant exitosamente')
    }

    console.log('✅ Usuario registrado exitosamente:', email)
    console.log('🎉 Proceso de registro completado con éxito')

    const responseData = {
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    }

    console.log('📤 Enviando respuesta exitosa:', responseData)
    return NextResponse.json(responseData)

  } catch (error) {
    console.error('💥 Registration error:', error)
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack available')

    // Determinar el tipo de error para dar una respuesta más específica
    let errorMessage = 'Error interno del servidor'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con la base de datos'
        statusCode = 503
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Error en el formato de datos'
        statusCode = 400
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    )
  }
}
