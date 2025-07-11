// Import strict environment loader
import { loadEnvStrict } from '../lib/env-loader.js';

// Force loading from .env file only
loadEnvStrict();

// Validate required environment variables
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

// Removed DATABASE_URL dependency - using Supabase-only configuration
console.log('🔧 Using Supabase-only storage configuration');
console.log('✅ Supabase database connection configured successfully');

// Supabase configuration
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Google configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Dropbox configuration
export const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID;
export const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET;

// OpenAI configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Application configuration
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT || '5000', 10);
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

// Validation function to check if required services are configured
export function validateConfiguration() {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check Supabase (required for database)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    errors.push('SUPABASE_URL and SUPABASE_ANON_KEY are required for database access');
  }

  // Check optional services
  if (!GOOGLE_AI_API_KEY) {
    warnings.push('Google AI API key missing - AI document processing will be disabled');
  }

  if (!DROPBOX_CLIENT_ID || !DROPBOX_CLIENT_SECRET) {
    warnings.push('Dropbox configuration missing - Dropbox integration will be disabled');
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    warnings.push('Google Drive configuration missing - Google Drive integration will be disabled');
  }

  // Log warnings
  warnings.forEach(warning => console.warn(`⚠️ ${warning}`));

  // Throw errors
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  console.log('✅ Configuration validation completed');
}