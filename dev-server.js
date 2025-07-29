#!/usr/bin/env node

// Simple Next.js development server wrapper
import { spawn } from 'child_process'

console.log('🚀 Starting Next.js development server...')

const nextDev = spawn('npm', ['run', 'next:dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '5000',
    // Configuraciones adicionales para prevenir timeouts
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: '--max_old_space_size=4096'
  }
})

nextDev.on('error', (err) => {
  console.error('❌ Failed to start Next.js development server:', err)
  process.exit(1)
})

nextDev.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Next.js development server exited with code ${code}`)
  }
  process.exit(code || 0)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...')
  nextDev.kill('SIGTERM')
  setTimeout(() => {
    nextDev.kill('SIGKILL')
    process.exit(0)
  }, 5000)
})

// Handle other termination signals
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...')
  nextDev.kill('SIGTERM')
  setTimeout(() => {
    process.exit(0)
  }, 5000)
})