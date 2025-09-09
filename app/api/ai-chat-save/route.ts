import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict } from '../../../lib/env-loader.js'

// Force loading from .env file only
loadEnvStrict()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { message, response, isFromUser, context } = body

        const tenantId = request.headers.get('x-tenant-id') || '1'
        const userId = 1 // Hardcoded for now, should come from auth context

        console.log('💬 Saving chat message:', { tenantId, userId, isFromUser, messageLength: message?.length })

        const { data, error } = await supabase
            .from('ai_chat_messages')
            .insert({
                tenant_id: parseInt(tenantId),
                user_id: userId,
                message: message,
                response: response || null,
                is_from_user: isFromUser,
                context: context || null
            })
            .select()
            .single()

        if (error) {
            console.error('❌ Error saving chat message:', error)
            return NextResponse.json({
                error: 'Failed to save chat message',
                details: error.message
            }, { status: 500 })
        }

        console.log('✅ Chat message saved successfully:', data.id)
        return NextResponse.json({ success: true, messageId: data.id })
    } catch (error) {
        console.error('❌ Chat save API error:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
