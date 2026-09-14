'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error in app:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, #1b1330 0%, #0a0b10 45%, #0a0b10 100%)',
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
          This page hit an unexpected error. It has been logged - please try again.
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
  );
}
