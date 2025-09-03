/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Eliminar la sección env para que no se lean variables del .env
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
}

export default nextConfig
