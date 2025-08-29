import { NextRequest, NextResponse } from 'next/server';
import { scheduledIndexingService } from '../../../lib/scheduled-indexing-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        // Get indexing statistics
        const stats = scheduledIndexingService.getStats();
        return NextResponse.json({ 
          success: true, 
          data: stats 
        });

      case 'status':
        // Get service status
        const status = scheduledIndexingService.getQueueStatus();
        const activeJobs = scheduledIndexingService.getActiveJobs();
        return NextResponse.json({ 
          success: true, 
          data: {
            ...status,
            activeJobs: activeJobs.map(job => ({
              id: job.id,
              status: job.status,
              filename: job.filename,
              startedAt: job.startedAt,
              processingTime: job.processingTime,
              error: job.error
            }))
          }
        });

      case 'health':
        // Health check
        return NextResponse.json({ 
          success: true, 
          status: 'healthy',
          service: 'Scheduled Indexing Service',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use: stats, status, health' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in indexing GET endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        // Start the indexing service
        await scheduledIndexingService.start();
        return NextResponse.json({ 
          success: true, 
          message: 'Indexing service started successfully' 
        });

      case 'stop':
        // Stop the indexing service
        await scheduledIndexingService.stop();
        return NextResponse.json({ 
          success: true, 
          message: 'Indexing service stopped successfully' 
        });

      case 'force-scan':
        // Force a scan now
        await scheduledIndexingService.forceScan();
        return NextResponse.json({ 
          success: true, 
          message: 'Forced scan initiated successfully' 
        });

      case 'update-config':
        // Update configuration
        if (!config) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Configuration object is required' 
            },
            { status: 400 }
          );
        }

        scheduledIndexingService.updateConfig(config);
        return NextResponse.json({ 
          success: true, 
          message: 'Configuration updated successfully' 
        });

      case 'clear-failed':
        // Clear failed jobs
        scheduledIndexingService.clearFailedJobs();
        return NextResponse.json({ 
          success: true, 
          message: 'Failed jobs cleared successfully' 
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use: start, stop, force-scan, update-config, clear-failed' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in indexing POST endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stop') {
      // Stop the indexing service
      await scheduledIndexingService.stop();
      return NextResponse.json({ 
        success: true, 
        message: 'Indexing service stopped successfully' 
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action. Use: stop' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in indexing DELETE endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
