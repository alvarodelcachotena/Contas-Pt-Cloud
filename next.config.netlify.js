// Configuración específica para Netlify
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@supabase/supabase-js', 'bcrypt'],
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://dummy.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'dummy_anon_key_for_build',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy_openai_key_for_build',
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || 'dummy_google_ai_key_for_build',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuración específica para Netlify
  experimental: {
    // Removed appDir as it's now stable in Next.js 13+
  },
  // Disable static optimization
  staticPageGenerationTimeout: 0,
  // Disable image optimization
  images: {
    unoptimized: true,
  },
  // Configuración para evitar problemas de build
  trailingSlash: false,
  // Disable static generation for API routes
  generateStaticParams: false,
}

export default nextConfig
