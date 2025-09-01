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
    ignoreBuildErrors: true, // Ignorar errores de TypeScript durante el build
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignorar errores de ESLint durante el build
  },
  // Disable static generation completely
  experimental: {
    // Removed appDir as it's now stable in Next.js 13+
  },
  // Force dynamic rendering for all pages
  generateStaticParams: false,
  // Disable static optimization
  staticPageGenerationTimeout: 0,
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Remove standalone output for Netlify compatibility
  // output: 'standalone'
}

export default nextConfig