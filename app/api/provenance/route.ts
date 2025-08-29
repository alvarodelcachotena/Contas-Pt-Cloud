import { NextRequest, NextResponse } from 'next/server';
import { provenanceManager } from '@/lib/provenance-manager';

/**
 * GET /api/provenance
 * Retrieve provenance metadata for documents
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');
        const tenantId = parseInt(searchParams.get('tenantId') || '1', 10);

        if (!documentId) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        const provenance = await provenanceManager.getDocumentProvenance(tenantId, documentId);

        return NextResponse.json({
            success: true,
            data: provenance
        });
    } catch (error) {
        console.error('Error retrieving provenance:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve provenance metadata' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/provenance
 * Store provenance metadata for a document
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { documentId, extractionResult, tenantId } = body;
        const finalTenantId = parseInt(tenantId || '1', 10);

        if (!documentId || !extractionResult) {
            return NextResponse.json(
                { error: 'Document ID and extraction result are required' },
                { status: 400 }
            );
        }

        await provenanceManager.extractAndStoreProvenance(finalTenantId, documentId, extractionResult);

        return NextResponse.json({
            success: true,
            message: 'Provenance metadata stored successfully'
        });
    } catch (error) {
        console.error('Error storing provenance:', error);
        return NextResponse.json(
            { error: 'Failed to store provenance metadata' },
            { status: 500 }
        );
    }
}
