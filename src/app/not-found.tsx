'use client';

export default function NotFound() {
  // CRITICAL: Ultra-minimal error boundary for Next.js static generation
  // No imports, no React hooks, no context usage - prevent all potential build failures
  if (typeof window === 'undefined') {
    // Return minimal HTML during static generation to prevent build failures
    return (
      <html>
        <body>
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <a href="/">Return Home</a>
        </body>
      </html>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, sans-serif',
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '448px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          color: '#111827',
          margin: '0 0 16px 0'
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 16px 0'
        }}>
          Page Not Found
        </h2>
        <p style={{
          color: '#6b7280',
          margin: '0 0 32px 0',
          lineHeight: '1.5'
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}