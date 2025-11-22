/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================================================
  
  // Next.js 16.0.1 compatible optimizations
  experimental: {
    optimizeCss: true,
    // Reduce compilation overhead
    webVitalsAttribution: ['CLS', 'LCP'],
    // Optimize import resolution
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns'
    ],
    // WORKAROUND: Disable React 19 canary features that cause useContext errors during static generation
    // This prevents the "Cannot read properties of null (reading 'useContext')" error in global-error page
    ppr: false,
  },

  // FIXED: Moved from experimental to root level (Next.js 16+ requirement)
  // Updated deprecated option name for Next.js 16+
  skipProxyUrlNormalize: true,
  skipTrailingSlashRedirect: true,

  // Server external packages (updated from deprecated serverComponentsExternalPackages)
  serverExternalPackages: [
    'sharp',
    'ioredis',
    '@supabase/supabase-js',
    'kafkajs'
  ],

  // Compiler optimizations
  compiler: {
    // Remove console.logs in production, keep in development
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // React optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Optimize styled-components if used
    styledComponents: true
  },

  // Turbopack configuration (Next.js 16 compatibility)
  turbopack: {},

  // Bundle analyzer and optimization
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev) {
      // Faster source maps in development
      config.devtool = 'eval-source-map';
      
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        providedExports: false,
        usedExports: false,
        sideEffects: false,
      };
    }

    // Optimize imports and reduce compilation time
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize common library imports
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
    };

    // Optimize external dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Image optimizations (updated for Next.js 16.0.1)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Output optimization for production
  output: 'standalone',

  // Disable unnecessary features to reduce compilation time
  poweredByHeader: false,
  compress: true,

  // React strict mode for better development experience
  reactStrictMode: true,
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
      // Phase URL redirects - from old long URLs to new short URLs
      {
        source: '/engine/results/strategy-plans/phases/phase-1%3A-foundation-%280-3-months%29',
        destination: '/engine/results/strategy-plans/phases/phase-1',
        permanent: true
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-2%3A-growth-%283-6-months%29',
        destination: '/engine/results/strategy-plans/phases/phase-2',
        permanent: true
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-3%3A-optimization-%286-12-months%29',
        destination: '/engine/results/strategy-plans/phases/phase-3',
        permanent: true
      },
      {
        source: '/engine/results/strategy-plans/phases/phase-4%3A-innovation-%2812%2B-months%29',
        destination: '/engine/results/strategy-plans/phases/phase-4',
        permanent: true
      },
      {
        source: '/engine/results/strategy-plans/phases/cross-phase-dependencies',
        destination: '/engine/results/strategy-plans/phases/cross-phase',
        permanent: true
      },
    ];
  },
  async rewrites() {
    // Exclude dev and admin pages in production
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/dev/:path*',
          destination: '/404',
        },
        {
          // SECURITY PATTERN: Block admin UI routes while preserving API access
          // Uses negative lookahead (?!api) to allow /api/admin/* routes
          // Blocks: /admin/dashboard, /admin/users, /admin/settings
          // Allows: /api/admin/osa/integration-status, /api/admin/health
          // HOTFIX 2025-11-22: Fixed 404 errors for admin API endpoints
          source: '/admin/:path((?!api).*)',
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