/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
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

// Debug de variables de entorno durante el build
console.log('🔧 Variables de entorno en build:')
console.log('OPENAI_API_KEY definida:', !!process.env.OPENAI_API_KEY)
if (process.env.OPENAI_API_KEY) {
  console.log('Longitud de OPENAI_API_KEY:', process.env.OPENAI_API_KEY.length)
}

export default nextConfig
