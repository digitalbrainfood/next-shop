import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';

// Verify the requesting user owns this school
async function verifySchoolOwner(authHeader, schoolId) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        // Check if user's class matches the school's subdomain
        const schoolDoc = await adminDb.collection('schools').doc(schoolId).get();
        if (!schoolDoc.exists) return null;
        const schoolData = schoolDoc.data();
        const userClass = decoded.class || decoded.avatarClass;
        if (userClass === schoolData.subdomain || decoded.superAdmin === true) {
            return { uid: decoded.uid, schoolData, schoolRef: schoolDoc.ref };
        }
        return null;
    } catch {
        return null;
    }
}

export async function PUT(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const body = await request.json();
        const { schoolId, updates } = body;

        if (!schoolId || !updates) {
            return NextResponse.json({ error: 'Missing schoolId or updates' }, { status: 400 });
        }

        const verified = await verifySchoolOwner(authHeader, schoolId);
        if (!verified) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Only allow updating safe fields
        const ALLOWED_FIELDS = ['displayName', 'primaryColor', 'logoUrl', 'customDomain', 'customDomainVerified'];
        const safeUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (ALLOWED_FIELDS.includes(key)) {
                if (typeof value === 'string' && value.length <= 500) {
                    safeUpdates[key] = value;
                } else if (typeof value === 'boolean') {
                    safeUpdates[key] = value;
                }
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        // If custom domain is being set, reset verification
        if ('customDomain' in safeUpdates) {
            safeUpdates.customDomain = safeUpdates.customDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
            safeUpdates.customDomainVerified = false;
        }

        await verified.schoolRef.update(safeUpdates);

        return NextResponse.json({ success: true, updated: Object.keys(safeUpdates) });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
