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
        const expenseId = id

        if (!expenseId || isNaN(Number(expenseId))) {
            return NextResponse.json(
                { error: 'ID de despesa inválido' },
                { status: 400 }
            )
        }

        const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

        // Verificar que la despesa existe
        const { data: expense, error: fetchError } = await supabase
            .from('expenses')
            .select('id, vendor')
            .eq('id', expenseId)
            .eq('tenant_id', 1)
            .single()

        if (fetchError || !expense) {
            return NextResponse.json(
                { error: 'Despesa no encontrada' },
                { status: 404 }
            )
        }

        // Eliminar la despesa
        const { error: deleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)
            .eq('tenant_id', 1)

        if (deleteError) {
            console.error('Error deleting expense:', deleteError)
            return NextResponse.json(
                { error: 'Error al eliminar la despesa' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                success: true,
                message: `Despesa de ${expense.vendor} eliminada correctamente`
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error in DELETE /api/expenses/[id]:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
