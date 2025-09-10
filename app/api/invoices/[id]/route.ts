import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadEnvStrict, getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/env-loader'

loadEnvStrict()

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const invoiceId = id

        if (!invoiceId || isNaN(Number(invoiceId))) {
            return NextResponse.json(
                { error: 'ID de factura inválido' },
                { status: 400 }
            )
        }

        const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

        // Verificar que la factura existe
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('id, number')
            .eq('id', invoiceId)
            .eq('tenant_id', 1)
            .single()

        if (fetchError || !invoice) {
            return NextResponse.json(
                { error: 'Factura no encontrada' },
                { status: 404 }
            )
        }

        // Eliminar la factura
        const { error: deleteError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', invoiceId)
            .eq('tenant_id', 1)

        if (deleteError) {
            console.error('Error deleting invoice:', deleteError)
            return NextResponse.json(
                { error: 'Error al eliminar la factura' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                message: `Factura ${invoice.number} eliminada correctamente`
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in DELETE /api/invoices/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
