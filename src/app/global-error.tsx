'use client';

import { useEffect } from 'react';

// Catches errors thrown by the root layout itself (error.tsx can't - it
// renders inside the layout, so it's not reached if the layout is what
// broke). Must render its own <html>/<body> since it replaces the layout.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error in root layout:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0b10' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            padding: 24,
            color: '#f2f3f5',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#8b8fa3', margin: '0 0 24px', lineHeight: 1.6 }}>
              The app hit an unexpected error. It has been logged - please try again.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '11px 24px',
                borderRadius: 9,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
