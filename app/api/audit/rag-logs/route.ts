import { NextRequest, NextResponse } from 'next/server';
import { auditLoggingService } from '../../../../lib/audit-logging-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const tenantId = searchParams.get('tenantId') ? parseInt(searchParams.get('tenantId')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    switch (action) {
      case 'stats':
        // Get audit log statistics
        const statsResult = await auditLoggingService.getAuditLogStats(tenantId, startDate, endDate);
        if (!statsResult.success) {
          return NextResponse.json(
            { success: false, error: statsResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true, stats: statsResult.stats });

      case 'recent':
        // Get recent audit logs
        const logsResult = await auditLoggingService.getRecentLogs(limit, tenantId);
        if (!logsResult.success) {
          return NextResponse.json(
            { success: false, error: logsResult.error },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true, logs: logsResult.logs });

      case 'export':
        // Export audit logs
        const format = searchParams.get('format') as 'json' | 'csv' || 'json';
        const exportResult = await auditLoggingService.exportAuditLogs({
          format,
          startDate,
          endDate,
          tenantId
        });
        
        if (!exportResult.success) {
          return NextResponse.json(
            { success: false, error: exportResult.error },
            { status: 500 }
          );
        }

        // Return appropriate content type based on format
        const contentType = format === 'csv' ? 'text/csv' : 'application/json';
        const filename = `rag-audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        
        return new NextResponse(exportResult.data, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: stats, recent, or export' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in RAG audit logs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'clean':
        // Clean old audit logs
        const { daysToKeep = 90, tenantId } = params;
        const cleanResult = await auditLoggingService.cleanOldLogs(daysToKeep, tenantId);
        
        if (!cleanResult.success) {
          return NextResponse.json(
            { success: false, error: cleanResult.error },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Cleaned ${cleanResult.deletedCount} old audit logs`,
          deletedCount: cleanResult.deletedCount 
        });

      case 'toggle':
        // Enable/disable audit logging
        const { enabled } = params;
        auditLoggingService.setEnabled(enabled);
        
        return NextResponse.json({ 
          success: true, 
          message: `Audit logging ${enabled ? 'enabled' : 'disabled'}`,
          enabled: auditLoggingService.isAuditLoggingEnabled()
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: clean or toggle' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in RAG audit logs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
