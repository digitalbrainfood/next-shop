import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 200) {
        return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    try {
        // Get public school data
        const schoolDoc = await adminDb.collection('schools').doc(sessionId).get();
        if (!schoolDoc.exists) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 });
        }

        const schoolData = schoolDoc.data();

        // Check that school was created recently (within 1 hour) for security
        const signupDate = schoolData.signupDate?.toDate?.();
        if (signupDate) {
            const hoursSinceCreation = (Date.now() - signupDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreation > 1) {
                return NextResponse.json({
                    school: {
                        schoolName: schoolData.schoolName,
                        subdomain: schoolData.subdomain,
                        licenseKey: schoolData.licenseKey,
                        platforms: schoolData.platforms,
                        displayName: schoolData.displayName,
                    },
                    credentials: null,
                    expired: true,
                });
            }
        }

        // Get private credentials
        const privateDoc = await adminDb
            .collection('schools').doc(sessionId)
            .collection('private').doc('config')
            .get();

        const privateData = privateDoc.exists ? privateDoc.data() : {};

        return NextResponse.json({
            school: {
                schoolName: schoolData.schoolName,
                subdomain: schoolData.subdomain,
                licenseKey: schoolData.licenseKey,
                platforms: schoolData.platforms,
                displayName: schoolData.displayName,
                status: schoolData.status,
            },
            credentials: {
                username: privateData.adminLoginUsername || null,
                email: privateData.adminLoginEmail || null,
                password: privateData.initialPassword || null,
            },
            expired: false,
        });
    } catch (error) {
        console.error('Credential fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }
}
