#!/usr/bin/env node

// Start Next.js development server
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Starting Next.js development server on port 5000...')

const nextProcess = spawn('node', ['dev-server.js'], {
  stdio: 'inherit',
  cwd: dirname(__dirname),
  env: { ...process.env, PORT: '5000' }
})

process.on('SIGINT', () => {
  nextProcess.kill('SIGTERM')
  process.exit(0)
})

nextProcess.on('error', (err) => {
  console.error('Error starting Next.js:', err)
  process.exit(1)
})

nextProcess.on('exit', (code) => {
  process.exit(code || 0)
})
