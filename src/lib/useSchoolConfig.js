'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, query, where, limit, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// Cache school configs to avoid re-fetching on every render
const configCache = new Map();

export function useSchoolConfig() {
    const [schoolConfig, setSchoolConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadConfig() {
            // In the browser, we can read the hostname directly
            const hostname = window.location.hostname;
            const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'shopnext.app';

            let subdomain = null;
            let customDomain = null;

            if (hostname.includes(rootDomain)) {
                const parts = hostname.split('.');
                const rootParts = rootDomain.split('.');
                if (parts.length > rootParts.length) {
                    subdomain = parts[0];
                }
            } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
                // No subdomain in basic localhost
                subdomain = null;
            } else if (hostname.includes('localhost')) {
                const parts = hostname.split('.');
                if (parts[0] !== 'localhost') {
                    subdomain = parts[0];
                }
            } else {
                customDomain = hostname;
            }

            // No tenant context — this is the main app
            if (!subdomain && !customDomain) {
                setSchoolConfig(null);
                setLoading(false);
                return;
            }

            const cacheKey = subdomain || customDomain;
            if (configCache.has(cacheKey)) {
                setSchoolConfig(configCache.get(cacheKey));
                setLoading(false);
                return;
            }

            try {
                let schoolData = null;

                if (subdomain) {
                    // Look up by subdomain
                    const q = query(
                        collection(db, 'schools'),
                        where('subdomain', '==', subdomain),
                        where('status', 'in', ['active', 'expiring']),
                        limit(1)
                    );
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        schoolData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                } else if (customDomain) {
                    // Look up by custom domain
                    const q = query(
                        collection(db, 'schools'),
                        where('customDomain', '==', customDomain),
                        where('customDomainVerified', '==', true),
                        where('status', 'in', ['active', 'expiring']),
                        limit(1)
                    );
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        schoolData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                }

                if (schoolData) {
                    configCache.set(cacheKey, schoolData);
                }
                setSchoolConfig(schoolData);
            } catch (err) {
                console.error('Failed to load school config:', err);
                setSchoolConfig(null);
            }

            setLoading(false);
        }

        loadConfig();
    }, []);

    return { schoolConfig, loading };
}
