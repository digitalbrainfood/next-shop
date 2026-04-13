import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb, adminAuth } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SCH-${segment()}-${segment()}-${segment()}`;
}

function generatePassword(length = 12) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function provisionSchool(session) {
    const metadata = session.metadata || {};
    const licenseKey = generateLicenseKey();
    const schoolName = (metadata.schoolName || 'New School').trim();
    const email = (metadata.email || session.customer_email || '').trim();
    const subdomain = (metadata.subdomain || schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)).trim();
    const platforms = metadata.platforms ? metadata.platforms.split(',') : ['products'];
    const displayName = metadata.displayName || schoolName;
    const primaryColor = metadata.primaryColor || '#2563eb';

    // 1. Create public school document (readable by anyone for subdomain/branding lookup)
    const schoolRef = adminDb.collection('schools').doc(session.id);
    await schoolRef.set({
        schoolName,
        email,
        subdomain,
        displayName,
        primaryColor,
        logoUrl: '',
        customDomain: '',
        customDomainVerified: false,
        studentCount: metadata.studentCount || '',
        platforms,
        licenseKey,
        stripeSubscriptionId: session.subscription,
        status: 'active',
        signupDate: FieldValue.serverTimestamp(),
        renewalDate: null,
        revenue: 20,
    });

    // Store sensitive data in private subcollection (server-only access)
    await adminDb.collection('schools').doc(session.id).collection('private').doc('config').set({
        stripeCustomerId: session.customer,
    });

    // 2. Create product class for this school
    const classId = subdomain;
    const classDisplayName = displayName;

    if (platforms.includes('products')) {
        await adminDb.collection('classes').doc(classId).set({
            name: classDisplayName,
            schoolId: session.id,
        });
    }

    // 3. Create avatar class if enabled
    if (platforms.includes('avatars')) {
        await adminDb.collection('avatar-classes').doc(classId).set({
            name: classDisplayName,
            schoolId: session.id,
        });
    }

    // 4. Create admin user account
    const adminPassword = generatePassword();
    const adminUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const adminEmail = `${adminUsername}@shopnext.dev`;

    try {
        // Check if user already exists
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(adminEmail);
        } catch {
            // User doesn't exist, create them
            userRecord = await adminAuth.createUser({
                email: adminEmail,
                password: adminPassword,
                displayName: metadata.adminFirstName
                    ? `${metadata.adminFirstName} ${metadata.adminLastName || ''}`.trim()
                    : schoolName,
            });
        }

        // Set custom claims for the admin user
        const claims = { class: classId };
        if (platforms.includes('avatars')) {
            claims.avatarClass = classId;
        }
        await adminAuth.setCustomUserClaims(userRecord.uid, claims);

        // 5. Store credentials in private subcollection (not publicly readable)
        await adminDb.collection('schools').doc(session.id).collection('private').doc('config').update({
            adminUid: userRecord.uid,
            adminLoginUsername: adminUsername,
            adminLoginEmail: adminEmail,
            initialPassword: adminPassword,
        });

        console.log(`School provisioned: ${schoolName}`);
        console.log(`  License: ${licenseKey}`);
        console.log(`  Class: ${classId}`);
        console.log(`  Admin: ${adminEmail}`);
    } catch (err) {
        console.error('Failed to create admin user:', err);
        // School and class are still created — admin can be added manually
        await schoolRef.update({
            provisioningError: `Failed to create admin user: ${err.message}`,
        });
    }
}

export async function POST(request) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event;

    try {
        event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await provisionSchool(session);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;

                const snapshot = await adminDb
                    .collection('schools')
                    .where('stripeSubscriptionId', '==', subscription.id)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    const schoolDoc = snapshot.docs[0];
                    const status = subscription.status === 'active' ? 'active' :
                                   subscription.status === 'past_due' ? 'expiring' :
                                   subscription.status === 'canceled' ? 'expired' : subscription.status;

                    await schoolDoc.ref.update({
                        status,
                        renewalDate: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000).toISOString().split('T')[0]
                            : null,
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;

                const snapshot = await adminDb
                    .collection('schools')
                    .where('stripeSubscriptionId', '==', subscription.id)
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    await snapshot.docs[0].ref.update({ status: 'expired' });
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;

                if (invoice.subscription) {
                    const snapshot = await adminDb
                        .collection('schools')
                        .where('stripeSubscriptionId', '==', invoice.subscription)
                        .limit(1)
                        .get();

                    if (!snapshot.empty) {
                        await snapshot.docs[0].ref.update({ status: 'expiring' });
                    }
                }
                break;
            }

            default:
                console.log('Unhandled event type:', event.type);
        }
    } catch (err) {
        console.error('Error processing webhook event:', err);
    }

    return NextResponse.json({ received: true });
}
