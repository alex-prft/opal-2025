/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      // Strategy Plans redirects - from clean URLs to working URLs with special characters
      // Use URL encoding for special characters to avoid parsing errors
      {
        source: '/engine/results/strategy-plans/quick-wins/implementation-roadmap-30-day',
        destination: '/engine/results/strategy-plans/quick-wins/implementation-roadmap-%2830-day%29',
        permanent: false
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-1%3A-foundation-0-3-months',
        destination: '/engine/results/strategy-plans/phases/phase-1%3A-foundation-%280-3-months%29',
        permanent: false
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-2%3A-growth-3-6-months',
        destination: '/engine/results/strategy-plans/phases/phase-2%3A-growth-%283-6-months%29',
        permanent: false
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-3%3A-optimization-6-12-months',
        destination: '/engine/results/strategy-plans/phases/phase-3%3A-optimization-%286-12-months%29',
        permanent: false
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-4%3A-innovation-12%2B-months',
        destination: '/engine/results/strategy-plans/phases/phase-4%3A-innovation-%2812%2B-months%29',
        permanent: false
      },
    ];
  },
  async rewrites() {
    // Exclude dev pages in production
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/dev/:path*',
          destination: '/404',
        },
      ];
    }
    return [];
  },
  async headers() {
    // Environment-based CORS configuration for security
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowedOrigins = isDevelopment
      ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
      : [
          'https://opal-2025.vercel.app',
          'https://ifpa-strategy.vercel.app',
          'https://ifpa-strategy-git-main-alex-harris-projects-f468cccf.vercel.app',
          ...(process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [])
        ];

    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: isDevelopment ? 'http://localhost:3000' : 'https://opal-2025.vercel.app'
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,POST,PUT,DELETE' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Accept, Content-Type, Authorization, X-API-Key'
          },
          { key: 'Access-Control-Allow-Credentials', value: 'false' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ]
      },
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: isDevelopment
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*; frame-src 'self' http://localhost:*;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.app; style-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel.app; img-src 'self' data: blob: https://vercel.live https://*.vercel.app; connect-src 'self' https: wss://vercel.live; font-src 'self' https://vercel.live https://*.vercel.app; frame-src 'self' https://vercel.live https://*.vercel.app;"
          },
        ]
      }
    ];
  },
};

module.exports = nextConfig;