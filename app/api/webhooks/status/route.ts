import { NextRequest, NextResponse } from 'next/server'
import { webhookManager } from '@/lib/webhook-manager'

export async function GET(request: NextRequest) {
  try {
    const status = webhookManager.getActiveConfigStatus()
    
    return NextResponse.json({
      success: true,
      activeConfigurations: Object.keys(status).length,
      tenantConfigs: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting webhook status:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to get webhook status' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'reload':
        await webhookManager.reloadConfigurations()
        return NextResponse.json({ 
          success: true, 
          message: 'Configurations reloaded successfully' 
        })
      
      case 'stop':
        webhookManager.stopAllProcessing()
        return NextResponse.json({ 
          success: true, 
          message: 'All processing stopped' 
        })
      
      case 'start':
        await webhookManager.loadActiveConfigurations()
        webhookManager.startAllProcessing()
        return NextResponse.json({ 
          success: true, 
          message: 'Processing started for all active configurations' 
        })
      
      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error handling webhook status action:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to handle action' 
    }, { status: 500 })
  }
}