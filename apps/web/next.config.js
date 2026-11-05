/** @type {import('next').NextConfig} */
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://localhost:4000'

module.exports = {
  poweredByHeader: false,
  reactStrictMode: true,
  // o pacote compartilhado é consumido como TypeScript de origem
  transpilePackages: ['@amazon-trade/shared'],
  // mesmo domínio para o navegador => cookies httpOnly sem CORS
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_INTERNAL_URL}/:path*` }]
  },
}
