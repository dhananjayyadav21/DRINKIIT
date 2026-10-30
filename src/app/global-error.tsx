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
      <body style={{ margin: 0, background: '#f7f9fb' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            padding: 24,
            color: '#12233e',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              maxWidth: 380,
              background: '#ffffff',
              border: '1px solid #e5e9ee',
              borderRadius: 16,
              boxShadow: '0 2px 10px rgba(18, 35, 62, 0.04)',
              padding: '36px 32px',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#12233e' }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#6b7686', margin: '0 0 24px', lineHeight: 1.6 }}>
              The app hit an unexpected error. It has been logged - please try again.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '11px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#0f6e94',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15, 110, 148, 0.25)',
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
