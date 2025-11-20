// CRITICAL: Explicit server component - prevent all client-side hydration
// This fixes Next.js 16 + React 19 useEffect error during static generation
import * as React from 'react';

export const dynamic = 'force-static';
export const runtime = 'nodejs';

export default function NotFound() {
  // Check if React hooks are available - during static generation they may not be
  const isStaticGeneration = typeof window === 'undefined' && (!React || !(React as any).useEffect);

  if (isStaticGeneration) {
    // Return minimal HTML for static generation
    return (
      <html>
        <body>
          <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#f9fafb',fontFamily:'system-ui, sans-serif',padding:'16px'}}>
            <div style={{maxWidth:'448px',width:'100%',textAlign:'center'}}>
              <h1 style={{fontSize:'6rem',fontWeight:'bold',color:'#111827',margin:'0 0 16px 0'}}>404</h1>
              <h2 style={{fontSize:'1.5rem',fontWeight:'600',color:'#1f2937',margin:'0 0 16px 0'}}>Page Not Found</h2>
              <p style={{color:'#6b7280',margin:'0 0 32px 0',lineHeight:'1.5'}}>The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
              <a href="/" style={{display:'inline-block',padding:'12px 24px',backgroundColor:'#2563eb',color:'white',borderRadius:'8px',textDecoration:'none',fontWeight:'500'}}>Go Back Home</a>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // Runtime HTML - same content, formatted for readability
  return (
    <html>
      <body>
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
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
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
      </body>
    </html>
  );
}