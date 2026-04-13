import { NextResponse } from 'next/server';

// Only allow proxying from Firebase Storage domains
const ALLOWED_HOSTS = [
    'firebasestorage.googleapis.com',
    'storage.googleapis.com',
    'nextshop-a17fe.firebasestorage.app',
];

const MAX_RESPONSE_SIZE = 100 * 1024 * 1024; // 100 MB max

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Validate URL format
    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Enforce HTTPS only
    if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 });
    }

    // Allowlist: only Firebase Storage domains
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
        return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(30000), // 30s timeout
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch: ${response.status}` },
                { status: response.status }
            );
        }

        // Check content-length before downloading
        const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
        if (contentLength > MAX_RESPONSE_SIZE) {
            return NextResponse.json({ error: 'File too large' }, { status: 413 });
        }

        const blob = await response.blob();

        if (blob.size > MAX_RESPONSE_SIZE) {
            return NextResponse.json({ error: 'File too large' }, { status: 413 });
        }

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Content-Length', blob.size.toString());

        return new NextResponse(blob, { status: 200, headers });
    } catch (err) {
        if (err.name === 'TimeoutError') {
            return NextResponse.json({ error: 'Request timed out' }, { status: 504 });
        }
        return NextResponse.json(
            { error: 'Failed to fetch resource' },
            { status: 500 }
        );
    }
}
