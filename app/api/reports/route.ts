import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

const SUPABASE_URL = getSupabaseUrl()
const SUPABASE_ANON_KEY = getSupabaseAnonKey()

// Use anon key for API access
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id') || '1'
        console.log('📊 Fetching reports for tenant:', tenantId)

        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('generated_date', { ascending: false })

        if (error) {
            console.error('❌ Error fetching reports:', error)
            return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
        }

        console.log(`✅ Found ${reports?.length || 0} reports`)

        const formattedReports = reports?.map(report => ({
            id: report.id,
            name: report.name,
            type: report.type,
            generatedDate: report.generated_date,
            period: report.period,
            status: report.status,
            filePath: report.file_path,
            fileSize: report.file_size,
            parameters: report.parameters,
            createdAt: report.created_at
        })) || []

        return NextResponse.json(formattedReports)
    } catch (error) {
        console.error('❌ Reports API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('📊 Creating report for tenant: 1', body)

        // Prepare report data
        const reportData = {
            tenant_id: 1,
            name: body.name,
            type: body.type,
            generated_date: body.generatedDate,
            period: body.period,
            status: body.status || 'generated',
            file_path: body.filePath,
            file_size: body.fileSize,
            parameters: body.parameters
        }

        console.log('📋 Report data to insert:', reportData)

        const { data: report, error } = await supabase
            .from('reports')
            .insert(reportData)
            .select()
            .single()

        if (error) {
            console.error('❌ Error creating report:', error)
            return NextResponse.json({
                error: 'Failed to create report',
                details: error.message
            }, { status: 500 })
        }

        console.log('✅ Report created successfully:', report.id)
        return NextResponse.json(report)
    } catch (error) {
        console.error('❌ Create report error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}






