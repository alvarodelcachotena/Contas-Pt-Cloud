/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://dummy.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'dummy_anon_key_for_build',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key_for_build',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy_openai_key_for_build',
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY || 'dummy_google_ai_key_for_build',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
}

export default nextConfig
