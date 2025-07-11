#!/usr/bin/env node

// Simple Next.js development server wrapper
import { spawn } from 'child_process'

console.log('🚀 Starting Next.js development server...')

const nextDev = spawn('npm', ['run', 'next:dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '5000'
  }
})

nextDev.on('error', (err) => {
  console.error('Failed to start Next.js development server:', err)
  process.exit(1)
})

nextDev.on('exit', (code) => {
  process.exit(code || 0)
})

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  nextDev.kill('SIGTERM')
  process.exit(0)
})