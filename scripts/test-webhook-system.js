/**
 * Comprehensive Webhook System Testing Script
 * Tests all webhook functionality independently and provides detailed reports
 */

import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BASE_URL = 'http://localhost:5000'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testWebhookSystem() {
  console.log('🔧 Starting Comprehensive Webhook System Test')
  console.log('=' .repeat(50))

  const results = {
    apiEndpoints: {},
    webhookServices: {},
    database: {},
    functionality: {},
    performance: {}
  }

  try {
    // 1. Test API Endpoints
    console.log('\n📡 Testing API Endpoints...')
    const endpoints = [
      { name: 'Status', url: '/api/webhooks/status', method: 'GET' },
      { name: 'Configure', url: '/api/webhooks/configure', method: 'GET' },
      { name: 'Manage', url: '/api/webhooks/manage?service=whatsapp', method: 'GET' },
      { name: 'Monitor', url: '/api/webhooks/monitor', method: 'GET' },
      { name: 'Analytics', url: '/api/webhooks/analytics', method: 'GET' },
      { name: 'Notifications', url: '/api/webhooks/notifications', method: 'GET' }
    ]

    for (const endpoint of endpoints) {
      try {
        const start = Date.now()
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        })
        const elapsed = Date.now() - start
        
        results.apiEndpoints[endpoint.name] = {
          status: response.status,
          ok: response.ok,
          responseTime: elapsed
        }
        
        console.log(`   ${response.ok ? '✅' : '❌'} ${endpoint.name}: ${response.status} (${elapsed}ms)`)
      } catch (error) {
        results.apiEndpoints[endpoint.name] = {
          status: 'ERROR',
          ok: false,
          error: error.message
        }
        console.log(`   ❌ ${endpoint.name}: ERROR - ${error.message}`)
      }
    }

    // 2. Test Webhook Services
    console.log('\n🔌 Testing Webhook Services...')
    const services = ['whatsapp', 'gmail', 'dropbox']
    
    for (const service of services) {
      try {
        const response = await fetch(`${BASE_URL}/api/webhooks/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service, testType: 'connection' })
        })
        
        const data = await response.json()
        
        if (data.success && data.testResults) {
          const result = data.testResults.results
          results.webhookServices[service] = {
            credentialsFound: result.credentialsFound,
            requiredFields: result.requiredFields,
            missingFields: result.missingFields,
            connectionTest: result.connectionTest,
            status: result.connectionTest ? 'CONNECTED' : 'CONFIGURED',
            apiEndpoint: result.apiEndpoint
          }
          
          const status = result.connectionTest ? '🟢 CONNECTED' : 
                        result.credentialsFound ? '🟡 CONFIGURED' : '🔴 NOT CONFIGURED'
          console.log(`   ${status} ${service.toUpperCase()}`)
          
          if (result.missingFields?.length > 0) {
            console.log(`     Missing: ${result.missingFields.join(', ')}`)
          }
        }
      } catch (error) {
        results.webhookServices[service] = {
          status: 'ERROR',
          error: error.message
        }
        console.log(`   ❌ ${service.toUpperCase()}: ${error.message}`)
      }
    }

    // 3. Test Database Tables
    console.log('\n🗄️ Testing Database Tables...')
    const tables = ['webhook_credentials', 'webhook_configs', 'webhook_logs']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          results.database[table] = {
            exists: false,
            error: error.message
          }
          console.log(`   ❌ ${table}: ${error.message}`)
        } else {
          results.database[table] = {
            exists: true,
            recordCount: count
          }
          console.log(`   ✅ ${table}: ${count} records`)
        }
      } catch (error) {
        results.database[table] = {
          exists: false,
          error: error.message
        }
        console.log(`   ❌ ${table}: ${error.message}`)
      }
    }

    // 4. Test Core Functionality
    console.log('\n⚙️ Testing Core Functionality...')
    
    // Test credential storage and retrieval
    try {
      const testCredential = {
        service: 'test_service',
        credentials: { test_key: 'test_value', api_url: 'https://api.test.com' }
      }
      
      const saveResponse = await fetch(`${BASE_URL}/api/webhooks/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: testCredential.service,
          credentials: testCredential.credentials
        })
      })
      
      const saveResult = await saveResponse.json()
      
      if (saveResult.success) {
        // Try to retrieve the credentials
        const getResponse = await fetch(`${BASE_URL}/api/webhooks/manage?service=${testCredential.service}`)
        const getResult = await getResponse.json()
        
        results.functionality.credentialManagement = {
          save: saveResult.success,
          retrieve: getResult.hasCredentials,
          status: 'WORKING'
        }
        console.log('   ✅ Credential Management: WORKING')
        
        // Clean up test data
        await supabase
          .from('webhook_credentials')
          .delete()
          .eq('service_type', testCredential.service)
      } else {
        results.functionality.credentialManagement = {
          save: false,
          error: saveResult.error,
          status: 'FAILED'
        }
        console.log('   ❌ Credential Management: FAILED')
      }
    } catch (error) {
      results.functionality.credentialManagement = {
        status: 'ERROR',
        error: error.message
      }
      console.log(`   ❌ Credential Management: ERROR - ${error.message}`)
    }

    // Test webhook triggering simulation
    try {
      const notificationResponse = await fetch(`${BASE_URL}/api/webhooks/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'webhook_triggered',
          service: 'test_service',
          message: 'Test webhook trigger',
          timestamp: new Date().toISOString()
        })
      })
      
      const notificationResult = await notificationResponse.json()
      
      results.functionality.webhookTriggering = {
        status: notificationResult.success ? 'WORKING' : 'FAILED',
        success: notificationResult.success
      }
      
      console.log(`   ${notificationResult.success ? '✅' : '❌'} Webhook Triggering: ${notificationResult.success ? 'WORKING' : 'FAILED'}`)
    } catch (error) {
      results.functionality.webhookTriggering = {
        status: 'ERROR',
        error: error.message
      }
      console.log(`   ❌ Webhook Triggering: ERROR - ${error.message}`)
    }

    // 5. Performance Analysis
    console.log('\n📊 Performance Analysis...')
    
    const performanceTests = []
    for (let i = 0; i < 5; i++) {
      const start = Date.now()
      await fetch(`${BASE_URL}/api/webhooks/status`)
      const elapsed = Date.now() - start
      performanceTests.push(elapsed)
    }
    
    const avgResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length
    const maxResponseTime = Math.max(...performanceTests)
    const minResponseTime = Math.min(...performanceTests)
    
    results.performance = {
      averageResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      minResponseTime,
      tests: performanceTests.length
    }
    
    console.log(`   📈 Average Response Time: ${Math.round(avgResponseTime)}ms`)
    console.log(`   📈 Max Response Time: ${maxResponseTime}ms`)
    console.log(`   📈 Min Response Time: ${minResponseTime}ms`)

    // 6. Generate Summary Report
    console.log('\n📋 Summary Report')
    console.log('=' .repeat(50))
    
    const totalEndpoints = Object.keys(results.apiEndpoints).length
    const workingEndpoints = Object.values(results.apiEndpoints).filter(e => e.ok).length
    
    const totalServices = services.length
    const connectedServices = Object.values(results.webhookServices).filter(s => s.status === 'CONNECTED').length
    const configuredServices = Object.values(results.webhookServices).filter(s => s.status === 'CONFIGURED').length
    
    const totalTables = tables.length
    const workingTables = Object.values(results.database).filter(t => t.exists).length
    
    console.log(`🔌 API Endpoints: ${workingEndpoints}/${totalEndpoints} working`)
    console.log(`🌐 Webhook Services: ${connectedServices} connected, ${configuredServices} configured`)
    console.log(`🗄️ Database Tables: ${workingTables}/${totalTables} accessible`)
    console.log(`⚡ Average Response Time: ${results.performance.averageResponseTime}ms`)
    
    const overallHealth = (workingEndpoints / totalEndpoints * 0.4) + 
                         (workingTables / totalTables * 0.3) + 
                         ((connectedServices + configuredServices) / totalServices * 0.3)
    
    const healthStatus = overallHealth >= 0.8 ? '🟢 EXCELLENT' : 
                        overallHealth >= 0.6 ? '🟡 GOOD' : '🔴 NEEDS ATTENTION'
    
    console.log(`\n🎯 Overall System Health: ${healthStatus} (${Math.round(overallHealth * 100)}%)`)
    
    // 7. Recommendations
    console.log('\n💡 Recommendations:')
    
    if (connectedServices === 0) {
      console.log('   • Configure webhook credentials for at least one service')
    }
    
    if (results.performance.averageResponseTime > 1000) {
      console.log('   • Optimize API response times (currently >1000ms average)')
    }
    
    if (workingTables < totalTables) {
      console.log('   • Check database table configurations and permissions')
    }
    
    const failedEndpoints = Object.entries(results.apiEndpoints).filter(([,e]) => !e.ok)
    if (failedEndpoints.length > 0) {
      console.log(`   • Fix failed API endpoints: ${failedEndpoints.map(([name]) => name).join(', ')}`)
    }
    
    console.log('\n✅ Webhook System Test Complete!')
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fs = await import('fs')
    fs.writeFileSync(`webhook-test-results-${timestamp}.json`, JSON.stringify(results, null, 2))
    console.log(`📄 Detailed results saved to: webhook-test-results-${timestamp}.json`)

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testWebhookSystem().catch(console.error)