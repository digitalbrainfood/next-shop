'use client';

export default function GlobalError({ error, reset }) {
    return (
        <html>
            <body>
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#f9fafb',
                    padding: '1rem',
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                            A critical error occurred. Please try refreshing the page.
                        </p>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '0.625rem 1.5rem',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
