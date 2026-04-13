import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const VALID_PLATFORMS = ['products', 'avatars'];

function validateInput(body) {
    const errors = [];

    if (!body.schoolName || typeof body.schoolName !== 'string' || body.schoolName.trim().length === 0) {
        errors.push('schoolName is required');
    } else if (body.schoolName.length > 255) {
        errors.push('schoolName must be under 255 characters');
    }

    if (!body.email || typeof body.email !== 'string') {
        errors.push('email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        errors.push('email must be a valid email address');
    }

    if (body.studentCount !== undefined && body.studentCount !== null) {
        if (typeof body.studentCount !== 'string' || body.studentCount.trim().length === 0) {
            errors.push('studentCount must be a non-empty string');
        }
    }

    if (!Array.isArray(body.platforms) || body.platforms.length === 0) {
        errors.push('platforms must be a non-empty array');
    } else if (!body.platforms.every(p => VALID_PLATFORMS.includes(p))) {
        errors.push('platforms contains invalid values');
    }

    // Optional string fields - just validate type and length
    const optionalStrings = ['subdomain', 'displayName', 'primaryColor', 'adminFirstName', 'adminLastName'];
    for (const field of optionalStrings) {
        if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
            if (typeof body[field] !== 'string' || body[field].length > 255) {
                errors.push(`${field} must be a string under 255 characters`);
            }
        }
    }

    return errors;
}

export async function POST(request) {
    try {
        const body = await request.json();
        const validationErrors = validateInput(body);

        if (validationErrors.length > 0) {
            return NextResponse.json(
                { error: validationErrors.join(', ') },
                { status: 400 }
            );
        }

        const { schoolName, email, studentCount, platforms } = body;

        // Create a Stripe Checkout Session
        const session = await getStripe().checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: email.trim(),
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'ShopNext Professor License',
                            description: `Monthly subscription for ${schoolName.trim()}`,
                            metadata: {
                                schoolName: schoolName.trim(),
                                studentCount: studentCount || '',
                                platforms: platforms.join(','),
                                subdomain: body.subdomain || '',
                                displayName: body.displayName || '',
                                primaryColor: body.primaryColor || '#2563eb',
                                adminFirstName: body.adminFirstName || '',
                                adminLastName: body.adminLastName || '',
                            },
                        },
                        unit_amount: 2000, // $20.00
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                schoolName: schoolName.trim(),
                email: email.trim(),
                studentCount: studentCount || '',
                platforms: platforms.join(','),
                subdomain: body.subdomain || '',
                displayName: body.displayName || '',
                primaryColor: body.primaryColor || '#2563eb',
                adminFirstName: body.adminFirstName || '',
                adminLastName: body.adminLastName || '',
            },
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/register?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/register?canceled=true`,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json(
            { error: 'Payment service error. Please try again.' },
            { status: 500 }
        );
    }
}
