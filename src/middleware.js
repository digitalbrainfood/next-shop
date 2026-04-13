import { NextResponse } from 'next/server';

// The main app domain — subdomains of this are school instances
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'shopnext.app';

// Paths that should never be rewritten (API routes, static files, etc.)
const IGNORED_PATHS = ['/api/', '/_next/', '/favicon.ico', '/admin', '/register'];

export function middleware(request) {
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';
    const pathname = url.pathname;

    // Skip middleware for ignored paths
    if (IGNORED_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Extract subdomain from hostname
    // Examples:
    //   riverside.shopnext.app → subdomain = "riverside"
    //   shopnext.app → subdomain = null (root domain)
    //   localhost:3000 → subdomain = null (development)
    //   riverside.localhost:3000 → subdomain = "riverside" (local dev)
    let subdomain = null;
    let customDomain = null;

    if (hostname.includes(ROOT_DOMAIN)) {
        // Production: check for subdomain of the root domain
        const parts = hostname.replace(`:${url.port}`, '').split('.');
        const rootParts = ROOT_DOMAIN.split('.');
        if (parts.length > rootParts.length) {
            subdomain = parts[0];
        }
    } else if (hostname.includes('localhost')) {
        // Development: support subdomain.localhost:3000
        const parts = hostname.split('.')[0];
        if (parts !== 'localhost' && !parts.includes(':')) {
            subdomain = parts;
        }
    } else {
        // Custom domain — the entire hostname IS the identifier
        // e.g., shop.riverside.edu
        customDomain = hostname.replace(/:\d+$/, ''); // strip port
    }

    // If we found a subdomain or custom domain, pass it through headers
    // The app will use these to load the right school config
    const response = NextResponse.next();

    if (subdomain) {
        response.headers.set('x-school-subdomain', subdomain);
    }

    if (customDomain) {
        response.headers.set('x-school-custom-domain', customDomain);
    }

    return response;
}

export const config = {
    matcher: [
        // Match all paths except static files and internal Next.js paths
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
