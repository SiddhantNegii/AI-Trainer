/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don't fail production builds on lint warnings.
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    // Clerk validates the publishableKey format at build time. The placeholder
    // below decodes to "build-placeholder.clerk.accounts.dev$" so the build
    // passes; the real key is supplied via env var in dev and production.
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      'pk_test_YnVpbGQtcGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA',
  },
}

module.exports = nextConfig
