// Import strict environment loader
import { loadEnvStrict } from './env-loader.js';

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

// ML Confidence Calibration Feature Flags
export const ML_CONFIDENCE_CONFIG = {
  enableLearnedScoring: process.env.ENABLE_ML_CONFIDENCE_SCORING === 'true',
  enableConsensusDataCollection: process.env.ENABLE_CONSENSUS_DATA_COLLECTION === 'true',
  enableManualCorrectionCollection: process.env.ENABLE_MANUAL_CORRECTION_COLLECTION === 'true',
  enableAutomaticRetraining: process.env.ENABLE_AUTOMATIC_RETRAINING === 'true',
  retrainingThreshold: parseInt(process.env.ML_RETRAINING_THRESHOLD || '100', 10),
  modelPersistenceEnabled: process.env.ENABLE_MODEL_PERSISTENCE === 'true',
  maxTrainingDataSize: parseInt(process.env.MAX_TRAINING_DATA_SIZE || '1000', 10)
};

// Log ML configuration
console.log('🤖 ML Confidence Calibration Configuration:');
console.log(`  - Learned Scoring: ${ML_CONFIDENCE_CONFIG.enableLearnedScoring ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`  - Consensus Data Collection: ${ML_CONFIDENCE_CONFIG.enableConsensusDataCollection ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`  - Manual Correction Collection: ${ML_CONFIDENCE_CONFIG.enableManualCorrectionCollection ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`  - Automatic Retraining: ${ML_CONFIDENCE_CONFIG.enableAutomaticRetraining ? '✅ Enabled' : '❌ Disabled'}`);
console.log(`  - Retraining Threshold: ${ML_CONFIDENCE_CONFIG.retrainingThreshold} samples`);
console.log(`  - Model Persistence: ${ML_CONFIDENCE_CONFIG.modelPersistenceEnabled ? '✅ Enabled' : '❌ Disabled'}`);

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

  // Check ML configuration
  if (ML_CONFIDENCE_CONFIG.enableLearnedScoring && !GOOGLE_AI_API_KEY) {
    warnings.push('ML confidence scoring enabled but Google AI API key missing - falling back to traditional scoring');
  }

  // Log warnings
  warnings.forEach(warning => console.warn(`⚠️ ${warning}`));

  // Throw errors
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }

  console.log('✅ Configuration validation completed');
}