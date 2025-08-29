import { NextRequest, NextResponse } from 'next/server';
import { provenanceManager } from '@/lib/provenance-manager';

/**
 * GET /api/provenance/statistics
 * Retrieve provenance statistics for a tenant
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = parseInt(searchParams.get('tenantId') || '1', 10);
        const statistics = await provenanceManager.getProvenanceStatistics(tenantId);

        return NextResponse.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error retrieving provenance statistics:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve provenance statistics' },
            { status: 500 }
        );
    }
}
