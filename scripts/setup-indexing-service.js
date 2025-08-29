#!/usr/bin/env node

/**
 * Setup Scheduled Indexing Service for Contas-PT
 * This script helps configure the indexing service environment and settings
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function setupIndexingService() {
  console.log('🚀 Setting up Scheduled Indexing Service for Contas-PT...\n');

  try {
    // Step 1: Check environment variables
    console.log('🔍 Step 1: Checking environment variables...');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️ Missing required environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('');
      console.log('Please add these to your .env file and restart the script.');
      return;
    }

    console.log('✅ All required environment variables are set');
    console.log('');

    // Step 2: Check Supabase connection
    console.log('🔍 Step 2: Testing Supabase connection...');
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }

      console.log('✅ Supabase connection successful');
      console.log(`   Available buckets: ${buckets?.map(b => b.name).join(', ') || 'None'}`);
      
      // Check if documents bucket exists
      const documentsBucket = buckets?.find(b => b.name === 'documents');
      if (!documentsBucket) {
        console.log('⚠️ Documents bucket not found. Creating...');
        
        const { error: createError } = await supabase.storage.createBucket('documents', {
          public: false,
          allowedMimeTypes: ['application/pdf', 'image/*', 'text/*'],
          fileSizeLimit: 52428800 // 50MB
        });

        if (createError) {
          console.log('❌ Failed to create documents bucket:', createError.message);
        } else {
          console.log('✅ Documents bucket created successfully');
        }
      } else {
        console.log('✅ Documents bucket exists');
      }
      
    } catch (error) {
      console.log('❌ Supabase connection failed:', error.message);
      console.log('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return;
    }
    console.log('');

    // Step 3: Check vector store setup
    console.log('🔍 Step 3: Checking vector store setup...');
    try {
      const { data: extensions, error } = await supabase.rpc('get_extensions');
      
      if (error) {
        console.log('⚠️ Could not check pgvector extension. Assuming it exists...');
      } else {
        const hasPgvector = extensions?.some((ext: any) => ext.extname === 'vector');
        if (hasPgvector) {
          console.log('✅ pgvector extension is enabled');
        } else {
          console.log('⚠️ pgvector extension not found. Please run vector:setup first');
        }
      }

      // Check if documents_embedding table exists
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'documents_embedding');

      if (tableError) {
        console.log('⚠️ Could not check tables. Assuming documents_embedding exists...');
      } else if (tables && tables.length > 0) {
        console.log('✅ documents_embedding table exists');
      } else {
        console.log('⚠️ documents_embedding table not found. Please run vector:setup first');
      }

    } catch (error) {
      console.log('⚠️ Vector store check failed:', error.message);
    }
    console.log('');

    // Step 4: Create configuration file
    console.log('🔍 Step 4: Creating indexing service configuration...');
    const configPath = join(process.cwd(), 'indexing-service.config.json');
    
    const defaultConfig = {
      scanIntervalMinutes: 15,
      batchSize: 10,
      maxConcurrentJobs: 5,
      retryAttempts: 3,
      retryDelayMinutes: 5,
      fileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      enableIncrementalSync: true,
      storage: {
        bucketName: 'documents',
        maxFileSize: '50MB',
        allowedMimeTypes: ['application/pdf', 'image/*', 'text/*']
      },
      embeddings: {
        model: 'openai',
        dimensions: 1536,
        batchSize: 10,
        cacheEnabled: true,
        cacheTTL: 24 * 60 * 60 * 1000 // 24 hours
      },
      monitoring: {
        enableLogging: true,
        logLevel: 'info',
        enableMetrics: true,
        healthCheckInterval: 60 * 1000 // 1 minute
      }
    };

    if (existsSync(configPath)) {
      console.log('⚠️ Configuration file already exists. Backing up...');
      const backupPath = `${configPath}.backup.${Date.now()}`;
      const existingConfig = readFileSync(configPath, 'utf8');
      writeFileSync(backupPath, existingConfig);
      console.log(`   Backup created at: ${backupPath}`);
    }

    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Configuration file created at:', configPath);
    console.log('');

    // Step 5: Create environment template
    console.log('🔍 Step 5: Creating environment template...');
    const envTemplatePath = join(process.cwd(), '.env.indexing.template');
    
    const envTemplate = `# Indexing Service Environment Variables
# Copy this file to .env.indexing and fill in your values

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Indexing Service Configuration
INDEXING_SCAN_INTERVAL_MINUTES=15
INDEXING_BATCH_SIZE=10
INDEXING_MAX_CONCURRENT_JOBS=5
INDEXING_RETRY_ATTEMPTS=3
INDEXING_RETRY_DELAY_MINUTES=5
INDEXING_FILE_TYPES=pdf,jpg,jpeg,png,tiff
INDEXING_MAX_FILE_SIZE_MB=50
INDEXING_INCREMENTAL_SYNC=true

# Optional: Local Model Paths
INSTRUCTOR_API_URL=
INSTRUCTOR_LOCAL_PATH=
SENTENCE_TRANSFORMERS_PATH=

# Logging Configuration
INDEXING_LOG_LEVEL=info
INDEXING_ENABLE_METRICS=true
INDEXING_HEALTH_CHECK_INTERVAL=60000
`;

    writeFileSync(envTemplatePath, envTemplate);
    console.log('✅ Environment template created at:', envTemplatePath);
    console.log('');

    // Step 6: Create startup script
    console.log('🔍 Step 6: Creating startup script...');
    const startupScriptPath = join(process.cwd(), 'start-indexing-service.js');
    
    const startupScript = `#!/usr/bin/env node

/**
 * Startup script for Scheduled Indexing Service
 * Run this to start the indexing service manually
 */

import { scheduledIndexingService } from './lib/scheduled-indexing-service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startIndexingService() {
  try {
    console.log('🚀 Starting Scheduled Indexing Service...');
    
    // Start the service
    await scheduledIndexingService.start();
    
    console.log('✅ Indexing service started successfully');
    console.log('Press Ctrl+C to stop the service');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Stopping indexing service...');
      await scheduledIndexingService.stop();
      console.log('✅ Indexing service stopped');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start indexing service:', error);
    process.exit(1);
  }
}

startIndexingService();
`;

    writeFileSync(startupScriptPath, startupScript);
    console.log('✅ Startup script created at:', startupScriptPath);
    console.log('');

    // Step 7: Create systemd service file (Linux)
    console.log('🔍 Step 7: Creating systemd service file...');
    const systemdPath = join(process.cwd(), 'contas-pt-indexing.service');
    
    const systemdService = `[Unit]
Description=Contas-PT Scheduled Indexing Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${process.cwd()}
ExecStart=/usr/bin/node ${startupScriptPath}
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=${process.cwd()}/.env.indexing

[Install]
WantedBy=multi-user.target
`;

    writeFileSync(systemdPath, systemdService);
    console.log('✅ Systemd service file created at:', systemdPath);
    console.log('');

    // Step 8: Create Windows service file
    console.log('🔍 Step 8: Creating Windows service file...');
    const windowsServicePath = join(process.cwd(), 'install-indexing-service.bat');
    
    const windowsService = `@echo off
echo Installing Contas-PT Indexing Service...

REM Check if NSSM is available
where nssm >nul 2>nul
if %errorlevel% neq 0 (
    echo NSSM not found. Please install NSSM first.
    echo Download from: https://nssm.cc/download
    pause
    exit /b 1
)

REM Install the service
nssm install "Contas-PT-Indexing" "${process.cwd()}\\start-indexing-service.js"
nssm set "Contas-PT-Indexing" AppDirectory "${process.cwd()}"
nssm set "Contas-PT-Indexing" AppEnvironmentExtra "NODE_ENV=production"
nssm set "Contas-PT-Indexing" Description "Contas-PT Scheduled Indexing Service"
nssm set "Contas-PT-Indexing" Start SERVICE_AUTO_START

echo Service installed successfully!
echo To start: net start "Contas-PT-Indexing"
echo To stop: net stop "Contas-PT-Indexing"
pause
`;

    writeFileSync(windowsServicePath, windowsService);
    console.log('✅ Windows service installer created at:', windowsServicePath);
    console.log('');

    // Step 9: Create monitoring dashboard
    console.log('🔍 Step 9: Creating monitoring dashboard...');
    const dashboardPath = join(process.cwd(), 'indexing-dashboard.html');
    
    const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contas-PT Indexing Service Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .stat-label { color: #6b7280; margin-top: 5px; }
        .controls { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .btn { background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px; }
        .btn:hover { background: #1d4ed8; }
        .btn.danger { background: #dc2626; }
        .btn.danger:hover { background: #b91c1c; }
        .jobs-table { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .status-completed { color: #059669; }
        .status-processing { color: #d97706; }
        .status-failed { color: #dc2626; }
        .refresh-info { color: #6b7280; font-size: 0.9em; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Contas-PT Indexing Service Dashboard</h1>
            <p>Monitor and control the scheduled indexing service</p>
        </div>

        <div class="controls">
            <h3>Service Controls</h3>
            <button class="btn" onclick="startService()">Start Service</button>
            <button class="btn danger" onclick="stopService()">Stop Service</button>
            <button class="btn" onclick="forceScan()">Force Scan</button>
            <button class="btn" onclick="refreshStats()">Refresh Stats</button>
            <div class="refresh-info">Auto-refresh every 30 seconds</div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="totalDocuments">-</div>
                <div class="stat-label">Total Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="indexedDocuments">-</div>
                <div class="stat-label">Indexed Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="failedDocuments">-</div>
                <div class="stat-label">Failed Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="pendingDocuments">-</div>
                <div class="stat-label">Pending Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="serviceStatus">-</div>
                <div class="stat-label">Service Status</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="lastSyncTime">-</div>
                <div class="stat-label">Last Sync Time</div>
            </div>
        </div>

        <div class="jobs-table">
            <h3>Active Jobs</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Filename</th>
                        <th>Status</th>
                        <th>Started At</th>
                        <th>Processing Time</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody id="jobsTableBody">
                    <tr><td colspan="6">No active jobs</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <script>
        const API_BASE = '/api/indexing';
        
        async function apiCall(endpoint, options = {}) {
            try {
                const response = await fetch(\`\${API_BASE}\${endpoint}\`, options);
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('API call failed:', error);
                return { success: false, error: error.message };
            }
        }

        async function refreshStats() {
            const stats = await apiCall('?action=stats');
            const status = await apiCall('?action=status');
            
            if (stats.success) {
                document.getElementById('totalDocuments').textContent = stats.data.totalDocuments;
                document.getElementById('indexedDocuments').textContent = stats.data.indexedDocuments;
                document.getElementById('failedDocuments').textContent = stats.data.failedDocuments;
                document.getElementById('pendingDocuments').textContent = stats.data.pendingDocuments;
                document.getElementById('lastSyncTime').textContent = new Date(stats.data.lastSyncTime).toLocaleString();
            }
            
            if (status.success) {
                document.getElementById('serviceStatus').textContent = status.data.isRunning ? 'Running' : 'Stopped';
                updateJobsTable(status.data.activeJobs);
            }
        }

        function updateJobsTable(jobs) {
            const tbody = document.getElementById('jobsTableBody');
            
            if (!jobs || jobs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">No active jobs</td></tr>';
                return;
            }
            
            tbody.innerHTML = jobs.map(job => \`
                <tr>
                    <td>\${job.id}</td>
                    <td>\${job.filename}</td>
                    <td class="status-\${job.status}">\${job.status}</td>
                    <td>\${job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}</td>
                    <td>\${job.processingTime ? job.processingTime + 'ms' : '-'}</td>
                    <td>\${job.error || '-'}</td>
                </tr>
            \`).join('');
        }

        async function startService() {
            const result = await apiCall('', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });
            
            if (result.success) {
                alert('Service started successfully');
                refreshStats();
            } else {
                alert('Failed to start service: ' + result.error);
            }
        }

        async function stopService() {
            const result = await apiCall('', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });
            
            if (result.success) {
                alert('Service stopped successfully');
                refreshStats();
            } else {
                alert('Failed to stop service: ' + result.error);
            }
        }

        async function forceScan() {
            const result = await apiCall('', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'force-scan' })
            });
            
            if (result.success) {
                alert('Force scan initiated successfully');
                refreshStats();
            } else {
                alert('Failed to initiate force scan: ' + result.error);
            }
        }

        // Auto-refresh every 30 seconds
        setInterval(refreshStats, 30000);
        
        // Initial load
        refreshStats();
    </script>
</body>
</html>`;

    writeFileSync(dashboardPath, dashboardHTML);
    console.log('✅ Monitoring dashboard created at:', dashboardPath);
    console.log('');

    // Step 10: Create README
    console.log('🔍 Step 10: Creating README...');
    const readmePath = join(process.cwd(), 'INDEXING_SERVICE_README.md');
    
    const readmeContent = `# Contas-PT Scheduled Indexing Service

## Overview

The Scheduled Indexing Service automatically scans Supabase storage for new or changed documents and generates vector embeddings for RAG (Retrieval-Augmented Generation) functionality.

## Features

- **Automatic Scanning**: Scans storage every 15 minutes (configurable)
- **Incremental Sync**: Only processes new or changed documents
- **Batch Processing**: Processes documents in configurable batches
- **Retry Logic**: Automatic retry for failed jobs
- **Real-time Monitoring**: Dashboard for service status and statistics
- **Multi-format Support**: PDF, images, and text documents
- **Embedding Caching**: Avoids regenerating embeddings for unchanged content

## Quick Start

### 1. Environment Setup

Copy the environment template and fill in your values:

\`\`\`bash
cp .env.indexing.template .env.indexing
# Edit .env.indexing with your actual values
\`\`\`

### 2. Start the Service

\`\`\`bash
# Manual start
node start-indexing-service.js

# Or use npm script
npm run indexing:start
\`\`\`

### 3. Monitor the Service

Open \`indexing-dashboard.html\` in your browser to monitor:
- Service status
- Processing statistics
- Active jobs
- Error logs

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`INDEXING_SCAN_INTERVAL_MINUTES\` | 15 | Minutes between storage scans |
| \`INDEXING_BATCH_SIZE\` | 10 | Documents processed per batch |
| \`INDEXING_MAX_CONCURRENT_JOBS\` | 5 | Maximum concurrent processing jobs |
| \`INDEXING_RETRY_ATTEMPTS\` | 3 | Number of retry attempts for failed jobs |
| \`INDEXING_RETRY_DELAY_MINUTES\` | 5 | Minutes to wait between retries |
| \`INDEXING_FILE_TYPES\` | pdf,jpg,jpeg,png,tiff | Supported file extensions |
| \`INDEXING_MAX_FILE_SIZE_MB\` | 50 | Maximum file size in MB |
| \`INDEXING_INCREMENTAL_SYNC\` | true | Enable incremental scanning |

### Runtime Configuration

Update configuration at runtime via API:

\`\`\`javascript
// Example: Update scan interval
fetch('/api/indexing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update-config',
    config: { scanIntervalMinutes: 30 }
  })
});
\`\`\`

## API Endpoints

### GET /api/indexing?action=stats
Get indexing statistics and metrics.

### GET /api/indexing?action=status
Get service status and active jobs.

### GET /api/indexing?action=health
Health check endpoint.

### POST /api/indexing
Control the service:
- \`{ "action": "start" }\` - Start the service
- \`{ "action": "stop" }\` - Stop the service
- \`{ "action": "force-scan" }\` - Force a scan now
- \`{ "action": "update-config", "config": {...} }\` - Update configuration
- \`{ "action": "clear-failed" }\` - Clear failed job counters

### DELETE /api/indexing?action=stop
Stop the service.

## Service Management

### Linux (systemd)

\`\`\`bash
# Install the service
sudo cp contas-pt-indexing.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable contas-pt-indexing
sudo systemctl start contas-pt-indexing

# Check status
sudo systemctl status contas-pt-indexing

# View logs
sudo journalctl -u contas-pt-indexing -f
\`\`\`

### Windows

\`\`\`cmd
# Install the service (requires NSSM)
install-indexing-service.bat

# Start the service
net start "Contas-PT-Indexing"

# Stop the service
net stop "Contas-PT-Indexing"
\`\`\`

### Docker

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "start-indexing-service.js"]
\`\`\`

## Monitoring and Troubleshooting

### Dashboard

The HTML dashboard provides real-time monitoring:
- Service status indicators
- Processing statistics
- Active job queue
- Error logs

### Logs

Monitor service logs for debugging:
- Service startup/shutdown
- Document processing status
- Error details
- Performance metrics

### Common Issues

1. **Service won't start**: Check environment variables and Supabase connection
2. **No documents processed**: Verify storage bucket permissions and file types
3. **High failure rate**: Check embedding service configuration and API limits
4. **Slow processing**: Adjust batch size and concurrent job limits

### Performance Tuning

- **Batch Size**: Increase for faster processing, decrease for lower memory usage
- **Scan Interval**: Balance between responsiveness and resource usage
- **Concurrent Jobs**: Adjust based on your system's capabilities
- **File Size Limits**: Set appropriate limits for your storage and processing capacity

## Integration

### With Existing Systems

The service integrates with:
- **Supabase Storage**: Document scanning and metadata extraction
- **Vector Store**: Embedding storage and retrieval
- **RAG System**: Semantic search and document retrieval
- **Document Processing**: OCR and text extraction

### Webhooks

Configure webhooks to trigger immediate processing:
- File upload notifications
- Document change events
- Manual processing requests

## Security

- **Service Role Key**: Uses Supabase service role for full access
- **File Validation**: Validates file types and sizes
- **Tenant Isolation**: Maintains multi-tenant security boundaries
- **Error Handling**: Prevents information leakage in error messages

## Development

### Testing

\`\`\`bash
# Run the test suite
npm run indexing:test

# Test specific functionality
node scripts/test-scheduled-indexing.js
\`\`\`

### Local Development

\`\`\`bash
# Start with development configuration
NODE_ENV=development node start-indexing-service.js

# Enable debug logging
INDEXING_LOG_LEVEL=debug node start-indexing-service.js
\`\`\`

## Support

For issues and questions:
1. Check the logs and dashboard
2. Review configuration settings
3. Test with the provided test scripts
4. Check Supabase and OpenAI service status

## License

This service is part of the Contas-PT platform and follows the same licensing terms.
`;

    writeFileSync(readmePath, readmeContent);
    console.log('✅ README created at:', readmePath);
    console.log('');

    console.log('🎉 Indexing Service Setup Completed Successfully!');
    console.log('');
    console.log('📋 What was created:');
    console.log('   ✅ Configuration file: indexing-service.config.json');
    console.log('   ✅ Environment template: .env.indexing.template');
    console.log('   ✅ Startup script: start-indexing-service.js');
    console.log('   ✅ Systemd service file: contas-pt-indexing.service');
    console.log('   ✅ Windows service installer: install-indexing-service.bat');
    console.log('   ✅ Monitoring dashboard: indexing-dashboard.html');
    console.log('   ✅ Comprehensive README: INDEXING_SERVICE_README.md');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Copy .env.indexing.template to .env.indexing and fill in your values');
    console.log('   2. Ensure your Supabase storage has a "documents" bucket');
    console.log('   3. Run the vector store setup if not already done: npm run vector:setup');
    console.log('   4. Start the service: node start-indexing-service.js');
    console.log('   5. Open indexing-dashboard.html to monitor the service');
    console.log('');
    console.log('📚 For detailed information, see: INDEXING_SERVICE_README.md');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupIndexingService().catch(error => {
  console.error('❌ Setup execution failed:', error);
  process.exit(1);
});
