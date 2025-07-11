import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

// Use service role key to bypass RLS and avoid infinite recursion
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || '1'

    const { data: configs, error } = await supabase
      .from('cloud_drive_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cloud drive configs:', error)
      return NextResponse.json({ error: 'Failed to fetch cloud drive configurations' }, { status: 500 })
    }

    const formattedConfigs = configs?.map(config => ({
      id: config.id,
      provider: config.provider,
      folderPath: config.folder_path,
      isActive: config.is_active,
      lastSync: config.last_sync,
      documentCount: config.document_count || 0,
      createdAt: config.created_at
    })) || []

    return NextResponse.json(formattedConfigs)
  } catch (error) {
    console.error('Cloud drives API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data: config, error } = await supabase
      .from('cloud_drive_configs')
      .insert({
        tenant_id: 1,
        provider: body.provider,
        access_token: body.accessToken,
        refresh_token: body.refreshToken,
        folder_path: body.folderPath,
        is_active: body.isActive ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating cloud drive config:', error)
      return NextResponse.json({ error: 'Failed to create cloud drive configuration' }, { status: 500 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Create cloud drive config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Configuration ID required' }, { status: 400 })
    }

    const updateData: any = {}
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.accessToken) updateData.access_token = body.accessToken
    if (body.refreshToken) updateData.refresh_token = body.refreshToken
    if (body.lastSync) updateData.last_sync = body.lastSync
    if (body.documentCount !== undefined) updateData.document_count = body.documentCount

    const { data: config, error } = await supabase
      .from('cloud_drive_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating cloud drive config:', error)
      return NextResponse.json({ error: 'Failed to update cloud drive configuration' }, { status: 500 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Update cloud drive config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}