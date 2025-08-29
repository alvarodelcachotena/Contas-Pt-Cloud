// Force load environment variables from .env file ONLY
import { loadEnvStrict } from './lib/env-loader.js';
loadEnvStrict();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@supabase/supabase-js', 'bcrypt'],
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Disable static generation completely
  experimental: {
    appDir: true,
  },
  // Force dynamic rendering for all pages
  generateStaticParams: false,
  // Disable static optimization
  staticPageGenerationTimeout: 0,
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Use standalone output for API routes
  output: 'standalone'
}

export default nextConfig