/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  transpilePackages: [
    '@united-cars/db',
    '@united-cars/core',
    '@united-cars/calc',
    '@united-cars/ui',
    '@united-cars/pdf'
  ]
}

module.exports = nextConfig