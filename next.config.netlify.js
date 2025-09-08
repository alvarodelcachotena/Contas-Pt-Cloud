// Configuración específica para Netlify
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@supabase/supabase-js', 'bcrypt'],
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
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
  // Configuración para evitar problemas de build
  trailingSlash: false,
  // Deshabilitar optimización de imágenes
  images: {
    unoptimized: true,
  },
  // Configuración para evitar problemas de generación estática
  generateStaticParams: false,
  // Deshabilitar generación estática de páginas de error
  skipTrailingSlashRedirect: true,
  // Configuración para Netlify
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig
