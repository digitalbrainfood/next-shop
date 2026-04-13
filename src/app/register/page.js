"use client";
import React, { useState, useEffect } from 'react';
import {
    School, CreditCard, Lock, CheckCircle2, Check, ChevronRight, ChevronLeft,
    ShieldCheck, Loader2, Copy, ClipboardCheck,
    Mail, Globe, Key, Users, GraduationCap, Download, Settings, Palette,
    Plus, Trash2, Image as ImageIcon, Monitor
} from 'lucide-react';
import { getStripe } from '../../lib/stripe';

// --- CONSTANTS ---

const STEPS = [
    { label: 'School Info', icon: School },
    { label: 'Payment', icon: CreditCard },
    { label: 'Confirmation', icon: CheckCircle2 },
];

const MONTHLY_PRICE = 20;

const generateLicenseKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `SCH-${segment()}-${segment()}-${segment()}`;
};

// --- STEP INDICATOR ---

const StepIndicator = ({ currentStep }) => (
    <div className="flex items-center justify-between mb-8 px-4">
        {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
                <React.Fragment key={index}>
                    <div className="flex flex-col items-center relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                            isCurrent ? 'border-blue-600 text-blue-600 bg-blue-50' :
                            'border-gray-300 text-gray-400 bg-white'
                        }`}>
                            {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <span className={`hidden sm:block text-xs mt-2 font-medium ${
                            isCompleted || isCurrent ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                            {step.label}
                        </span>
                    </div>
                    {index < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300 ${
                            index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// --- STEP 1: SCHOOL INFO ---

const SchoolInfoStep = ({ formData, updateFormData, onNext, errors }) => (
    <div>
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
            <p className="text-gray-500 mt-1">Tell us about your institution to get started.</p>
        </div>
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => updateFormData('schoolName', e.target.value)}
                    placeholder="e.g. Riverside Academy"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.schoolName ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.schoolName && <p className="text-red-500 text-xs mt-1">{errors.schoolName}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin First Name *</label>
                    <input
                        type="text"
                        value={formData.adminFirstName}
                        onChange={(e) => updateFormData('adminFirstName', e.target.value)}
                        placeholder="John"
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.adminFirstName ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.adminFirstName && <p className="text-red-500 text-xs mt-1">{errors.adminFirstName}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Last Name *</label>
                    <input
                        type="text"
                        value={formData.adminLastName}
                        onChange={(e) => updateFormData('adminLastName', e.target.value)}
                        placeholder="Smith"
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.adminLastName ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.adminLastName && <p className="text-red-500 text-xs mt-1">{errors.adminLastName}</p>}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="admin@school.edu"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Students *</label>
                    <select
                        value={formData.studentCount}
                        onChange={(e) => updateFormData('studentCount', e.target.value)}
                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white ${errors.studentCount ? 'border-red-400' : 'border-gray-300'}`}
                    >
                        <option value="">Select range...</option>
                        <option value="under-100">Under 100</option>
                        <option value="100-500">100 - 500</option>
                        <option value="500-1000">500 - 1,000</option>
                        <option value="1000+">1,000+</option>
                    </select>
                    {errors.studentCount && <p className="text-red-500 text-xs mt-1">{errors.studentCount}</p>}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Website <span className="text-gray-400">(optional)</span></label>
                <input
                    type="url"
                    value={formData.schoolWebsite}
                    onChange={(e) => updateFormData('schoolWebsite', e.target.value)}
                    placeholder="https://www.school.edu"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
            </div>
        </div>
        <div className="flex justify-end mt-8">
            <button
                onClick={onNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
            >
                Next <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    </div>
);

// --- STEP 2: PAYMENT ---

const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
};

const PaymentStep = ({ formData, updateFormData, onSubmit, onBack, isProcessing, errors }) => {
    const [stripeLoading, setStripeLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'card'
    const [stripeError, setStripeError] = useState('');

    const handleStripeCheckout = async () => {
        setStripeLoading(true);
        setStripeError('');
        try {
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolName: formData.schoolName,
                    email: formData.email,
                    studentCount: formData.studentCount,
                    platforms: formData.platforms || ['products'],
                    adminFirstName: formData.adminFirstName,
                    adminLastName: formData.adminLastName,
                }),
            });

            const data = await response.json();

            if (data.error) {
                setStripeError(data.error);
                setStripeLoading(false);
                return;
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            } else {
                const stripe = await getStripe();
                const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
                if (error) {
                    setStripeError(error.message);
                }
            }
        } catch (err) {
            setStripeError('Unable to connect to payment service. You can use the manual form below.');
            setPaymentMethod('card');
        }
        setStripeLoading(false);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                <p className="text-gray-500 mt-1">Complete your registration with a secure payment.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Order Summary */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-4">
                        <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Professor License</span>
                            <span className="font-semibold">${MONTHLY_PRICE}.00</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">Monthly subscription &middot; per professor</p>
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span>${MONTHLY_PRICE}.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span>$0.00</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${MONTHLY_PRICE}.00</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                            <span>Secure payment powered by Stripe</span>
                        </div>
                    </div>
                </div>

                {/* Payment Options */}
                <div className="lg:col-span-3">
                    {/* Stripe Checkout Button */}
                    <div className="mb-6">
                        <button
                            onClick={handleStripeCheckout}
                            disabled={stripeLoading || isProcessing}
                            className="w-full flex items-center justify-center gap-3 bg-[#635bff] hover:bg-[#5851db] text-white py-4 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-60 text-lg"
                        >
                            {stripeLoading ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Connecting to Stripe...</>
                            ) : (
                                <>
                                    <CreditCard className="h-5 w-5" />
                                    Pay ${MONTHLY_PRICE}.00 with Stripe
                                </>
                            )}
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-2">
                            You&apos;ll be securely redirected to Stripe to complete payment.
                        </p>
                        {stripeError && (
                            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                                {stripeError}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-4 text-gray-400 uppercase tracking-wider">or pay with card</span>
                        </div>
                    </div>

                    {/* Manual Card Form (fallback) */}
                    <div className="relative">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center rounded-xl">
                                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
                                <p className="text-gray-700 font-medium">Processing your payment...</p>
                                <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card *</label>
                                <input
                                    type="text"
                                    value={formData.cardName}
                                    onChange={(e) => updateFormData('cardName', e.target.value)}
                                    placeholder="John Smith"
                                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.cardName ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number *</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.cardNumber}
                                        onChange={(e) => updateFormData('cardNumber', formatCardNumber(e.target.value))}
                                        placeholder="1234 5678 9012 3456"
                                        maxLength={19}
                                        className={`w-full border rounded-lg pl-11 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.cardNumber ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                </div>
                                {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry *</label>
                                    <input
                                        type="text"
                                        value={formData.cardExpiry}
                                        onChange={(e) => updateFormData('cardExpiry', formatExpiry(e.target.value))}
                                        placeholder="MM/YY"
                                        maxLength={5}
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.cardExpiry ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                    {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC *</label>
                                    <input
                                        type="text"
                                        value={formData.cardCvc}
                                        onChange={(e) => updateFormData('cardCvc', e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        placeholder="123"
                                        maxLength={3}
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.cardCvc ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                    {errors.cardCvc && <p className="text-red-500 text-xs mt-1">{errors.cardCvc}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address *</label>
                                <input
                                    type="text"
                                    value={formData.billingAddress}
                                    onChange={(e) => updateFormData('billingAddress', e.target.value)}
                                    placeholder="123 Main Street"
                                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.billingAddress ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {errors.billingAddress && <p className="text-red-500 text-xs mt-1">{errors.billingAddress}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                                    <input
                                        type="text"
                                        value={formData.billingCity}
                                        onChange={(e) => updateFormData('billingCity', e.target.value)}
                                        placeholder="New York"
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.billingCity ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                    {errors.billingCity && <p className="text-red-500 text-xs mt-1">{errors.billingCity}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                                    <input
                                        type="text"
                                        value={formData.billingZip}
                                        onChange={(e) => updateFormData('billingZip', e.target.value)}
                                        placeholder="10001"
                                        className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.billingZip ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                    {errors.billingZip && <p className="text-red-500 text-xs mt-1">{errors.billingZip}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    disabled={isProcessing || stripeLoading}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isProcessing || stripeLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:bg-blue-400"
                >
                    {isProcessing ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                        <>Pay ${MONTHLY_PRICE}.00 with Card</>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- STEP 4: INSTANCE SETUP ---

const COLOR_PRESETS = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Green', value: '#059669' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Pink', value: '#db2777' },
    { name: 'Indigo', value: '#4f46e5' },
];

const InstanceSetupStep = ({ formData, updateFormData, onNext, onBack, errors }) => {
    const [subdomainStatus, setSubdomainStatus] = useState(null); // null | 'checking' | 'available' | 'taken'

    const handleSubdomainChange = (value) => {
        const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
        updateFormData('subdomain', clean);
        if (clean.length >= 3) {
            setSubdomainStatus('checking');
            // Mock availability check
            setTimeout(() => {
                const taken = ['demo', 'test', 'admin', 'shopnext'];
                setSubdomainStatus(taken.includes(clean) ? 'taken' : 'available');
            }, 800);
        } else {
            setSubdomainStatus(null);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            updateFormData('logoFile', file);
            const reader = new FileReader();
            reader.onload = (ev) => updateFormData('logoPreview', ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const togglePlatform = (platform) => {
        const current = formData.platforms;
        if (current.includes(platform)) {
            if (current.length > 1) {
                updateFormData('platforms', current.filter(p => p !== platform));
            }
        } else {
            updateFormData('platforms', [...current, platform]);
        }
    };

    const addAdmin = () => {
        updateFormData('adminAccounts', [...formData.adminAccounts, { name: '', email: '' }]);
    };

    const removeAdmin = (index) => {
        if (formData.adminAccounts.length > 1) {
            updateFormData('adminAccounts', formData.adminAccounts.filter((_, i) => i !== index));
        }
    };

    const updateAdmin = (index, field, value) => {
        const updated = formData.adminAccounts.map((a, i) => i === index ? { ...a, [field]: value } : a);
        updateFormData('adminAccounts', updated);
    };

    const addClass = () => {
        updateFormData('classNames', [...formData.classNames, '']);
    };

    const removeClass = (index) => {
        if (formData.classNames.length > 1) {
            updateFormData('classNames', formData.classNames.filter((_, i) => i !== index));
        }
    };

    const updateClass = (index, value) => {
        const updated = formData.classNames.map((c, i) => i === index ? value : c);
        updateFormData('classNames', updated);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Set Up Your Instance</h2>
                <p className="text-gray-500 mt-1">Configure your platform, branding, and initial accounts.</p>
            </div>

            <div className="space-y-8">
                {/* Subdomain */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" /> Your URL
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain *</label>
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={formData.subdomain}
                                onChange={(e) => handleSubdomainChange(e.target.value)}
                                placeholder="your-school"
                                className={`flex-1 border rounded-l-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.subdomain ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            <span className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-4 py-3 text-gray-500 text-sm whitespace-nowrap">.shopnext.app</span>
                        </div>
                        {errors.subdomain && <p className="text-red-500 text-xs mt-1">{errors.subdomain}</p>}
                        {subdomainStatus === 'checking' && (
                            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking availability...</p>
                        )}
                        {subdomainStatus === 'available' && (
                            <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {formData.subdomain}.shopnext.app is available!</p>
                        )}
                        {subdomainStatus === 'taken' && (
                            <p className="text-red-500 text-xs mt-1">This subdomain is already taken. Try another.</p>
                        )}
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain <span className="text-gray-400">(optional)</span></label>
                        <input
                            type="text"
                            value={formData.customDomain}
                            onChange={(e) => updateFormData('customDomain', e.target.value)}
                            placeholder="shop.yourschool.edu"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        />
                        <p className="text-xs text-gray-400 mt-1">You can configure a custom domain later. DNS setup instructions will be provided.</p>
                    </div>
                </div>

                {/* Branding */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Palette className="h-5 w-5 text-blue-600" /> Branding
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => updateFormData('displayName', e.target.value)}
                                placeholder="e.g. Riverside Academy Store"
                                className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${errors.displayName ? 'border-red-400' : 'border-gray-300'}`}
                            />
                            {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Logo</label>
                            <div className="flex items-center gap-4">
                                {formData.logoPreview ? (
                                    <div className="relative">
                                        <img src={formData.logoPreview} alt="Logo preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                        <button
                                            type="button"
                                            onClick={() => { updateFormData('logoFile', null); updateFormData('logoPreview', ''); }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                    </label>
                                )}
                                <p className="text-xs text-gray-400">Upload a square logo (PNG, JPG). Recommended 200x200px.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => updateFormData('primaryColor', color.value)}
                                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                                            formData.primaryColor === color.value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                                <label className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 relative overflow-hidden" title="Custom color">
                                    <span className="text-xs text-gray-400">+</span>
                                    <input
                                        type="color"
                                        value={formData.primaryColor}
                                        onChange={(e) => updateFormData('primaryColor', e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </label>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.primaryColor }} />
                                <span className="text-xs text-gray-500 font-mono">{formData.primaryColor}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-blue-600" /> Platforms
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">Select which platforms to enable. You can change this later.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => togglePlatform('products')}
                            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                formData.platforms.includes('products') ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900">Products</span>
                                {formData.platforms.includes('products') && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                            </div>
                            <p className="text-xs text-gray-500">Students create and showcase product marketing campaigns.</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => togglePlatform('avatars')}
                            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                formData.platforms.includes('avatars') ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-900">Hirable Talent</span>
                                {formData.platforms.includes('avatars') && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                            </div>
                            <p className="text-xs text-gray-500">Students create avatar profiles with photos and media portfolios.</p>
                        </button>
                    </div>
                </div>

                {/* Admin Accounts */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" /> Admin Accounts
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">Set up initial admin accounts. More can be added later.</p>
                    <div className="space-y-3">
                        {formData.adminAccounts.map((admin, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        value={admin.name}
                                        onChange={(e) => updateAdmin(index, 'name', e.target.value)}
                                        placeholder="Full name"
                                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <input
                                        type="email"
                                        value={admin.email}
                                        onChange={(e) => updateAdmin(index, 'email', e.target.value)}
                                        placeholder="Email address"
                                        className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                </div>
                                {formData.adminAccounts.length > 1 && (
                                    <button type="button" onClick={() => removeAdmin(index)} className="text-red-400 hover:text-red-600 p-2.5 cursor-pointer">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {errors.adminAccounts && <p className="text-red-500 text-xs mt-1">{errors.adminAccounts}</p>}
                    <button
                        type="button"
                        onClick={addAdmin}
                        className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                        <Plus className="h-4 w-4" /> Add another admin
                    </button>
                </div>

                {/* Class Names */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <School className="h-5 w-5 text-blue-600" /> Classes
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">Create your initial classes. Students will be assigned to these.</p>
                    <div className="space-y-2">
                        {formData.classNames.map((cls, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={cls}
                                    onChange={(e) => updateClass(index, e.target.value)}
                                    placeholder={`e.g. Spring 2026 - Section ${index + 1}`}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                {formData.classNames.length > 1 && (
                                    <button type="button" onClick={() => removeClass(index)} className="text-red-400 hover:text-red-600 p-2.5 cursor-pointer">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {errors.classNames && <p className="text-red-500 text-xs mt-1">{errors.classNames}</p>}
                    <button
                        type="button"
                        onClick={addClass}
                        className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                        <Plus className="h-4 w-4" /> Add another class
                    </button>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Instance Preview</h3>
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="h-2" style={{ backgroundColor: formData.primaryColor }} />
                        <div className="p-4 flex items-center gap-3">
                            {formData.logoPreview ? (
                                <img src={formData.logoPreview} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: formData.primaryColor + '20' }}>
                                    <GraduationCap className="h-5 w-5" style={{ color: formData.primaryColor }} />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-sm text-gray-900">{formData.displayName || 'Your School Name'}</p>
                                <p className="text-xs text-gray-400">{formData.subdomain ? `${formData.subdomain}.shopnext.app` : 'your-school.shopnext.app'}</p>
                            </div>
                        </div>
                        <div className="px-4 pb-3 flex gap-2">
                            {formData.platforms.includes('products') && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: formData.primaryColor + '15', color: formData.primaryColor }}>Products</span>
                            )}
                            {formData.platforms.includes('avatars') && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: formData.primaryColor + '15', color: formData.primaryColor }}>Hirable Talent</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                    Complete Setup <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

// --- STEP 5: CONFIRMATION ---

const ConfirmationStep = ({ formData, licenseKey, provisionedSchool, loadingSchool }) => {
    const [copied, setCopied] = useState(false);
    const [showCheck, setShowCheck] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setShowCheck(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loadingSchool) {
        return (
            <div className="text-center py-16">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Setting up your school...</h2>
                <p className="text-gray-500">This usually takes a few seconds. Creating your class, admin account, and license key.</p>
            </div>
        );
    }

    const school = provisionedSchool;
    const displayLicenseKey = licenseKey || school?.licenseKey || 'Generating...';
    const subdomain = school?.subdomain || formData.schoolName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'your-school';

    return (
        <div className="text-center">
            {/* Success Icon */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 transition-transform duration-500 ${showCheck ? 'scale-100' : 'scale-0'}`}>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
            <p className="text-gray-500 text-lg mb-8">Welcome aboard, {formData.schoolName || school?.schoolName || 'New School'}!</p>

            {/* License Key */}
            <div className="max-w-md mx-auto mb-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Your License Key</p>
                <div className="bg-gray-900 rounded-xl px-6 py-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-green-400 text-lg tracking-wider">{displayLicenseKey}</span>
                    <button
                        onClick={() => handleCopy(displayLicenseKey)}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                        title="Copy to clipboard"
                    >
                        {copied ? <ClipboardCheck className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Login Credentials */}
            <div className="max-w-md mx-auto mb-6 bg-blue-50 rounded-xl p-5 text-left">
                <h3 className="font-bold text-gray-900 mb-3 text-center">Your Login Credentials</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs text-gray-500">Platform URL</p>
                        <p className="font-medium text-blue-600">{subdomain}.shopnext.app</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Username</p>
                        <p className="font-mono text-sm text-gray-900">{school?.adminLoginUsername || formData.email?.split('@')[0] || 'your-username'}</p>
                    </div>
                    {school?.initialPassword && !school?.credentialsExpired && (
                        <div>
                            <p className="text-xs text-gray-500">Temporary Password</p>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-sm text-gray-900">{school.initialPassword}</p>
                                <button onClick={() => handleCopy(school.initialPassword)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                    {school?.credentialsExpired && (
                        <div>
                            <p className="text-xs text-amber-600">Credentials have expired for security. Check your email or contact support.</p>
                        </div>
                    )}
                </div>
                <p className="text-xs text-amber-600 mt-3 bg-amber-50 px-3 py-2 rounded-lg">
                    Save these credentials now. For security, we recommend changing your password after first login.
                </p>
            </div>

            {/* Plan Summary */}
            <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4 mb-8 flex justify-between items-center">
                <div className="text-left">
                    <p className="font-semibold text-gray-900">Professor License</p>
                    <p className="text-sm text-gray-500">Monthly subscription</p>
                </div>
                <p className="text-xl font-bold text-blue-600">${MONTHLY_PRICE}/mo</p>
            </div>

            {/* Next Steps */}
            <div className="max-w-lg mx-auto text-left mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Next Steps</h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Key className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-700 pt-1">Sign in with the credentials above at the main site</p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-700 pt-1">Customize your branding, custom domain, and settings at <strong>/settings</strong></p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-700 pt-1">Create student accounts from your dashboard and start building campaigns</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                    <GraduationCap className="h-5 w-5" /> Sign In Now
                </a>
                <a
                    href="/settings"
                    className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                    <Settings className="h-5 w-5" /> Go to Settings
                </a>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

const INITIAL_FORM_DATA = {
    schoolName: '',
    adminFirstName: '',
    adminLastName: '',
    email: '',
    phone: '',
    schoolWebsite: '',
    studentCount: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
    billingAddress: '',
    billingCity: '',
    billingZip: '',
    // Instance Setup
    subdomain: '',
    customDomain: '',
    displayName: '',
    primaryColor: '#2563eb',
    logoFile: null,
    logoPreview: '',
    platforms: ['products'],
    adminAccounts: [{ name: '', email: '' }],
    classNames: [''],
};

export default function TestingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [stripeSessionId, setStripeSessionId] = useState('');
    const [provisionedSchool, setProvisionedSchool] = useState(null);
    const [loadingSchool, setLoadingSchool] = useState(false);

    // Handle Stripe redirect back
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === 'true') {
            const sessionId = params.get('session_id') || '';
            setStripeSessionId(sessionId);
            setCurrentStep(2); // Go straight to confirmation
            window.history.replaceState({}, '', '/register');

            // Fetch the provisioned school data
            if (sessionId) {
                setLoadingSchool(true);
                // Poll for school doc (webhook may take a few seconds)
                const fetchSchool = async (attempts = 0) => {
                    try {
                        const response = await fetch(`/api/school-credentials?session_id=${encodeURIComponent(sessionId)}`);
                        if (response.ok) {
                            const data = await response.json();
                            setProvisionedSchool({
                                ...data.school,
                                adminLoginUsername: data.credentials?.username,
                                initialPassword: data.credentials?.password,
                                credentialsExpired: data.expired,
                            });
                            setLicenseKey(data.school?.licenseKey || '');
                            setLoadingSchool(false);
                        } else if (response.status === 404 && attempts < 10) {
                            // Webhook may not have fired yet, retry
                            setTimeout(() => fetchSchool(attempts + 1), 2000);
                        } else {
                            setLoadingSchool(false);
                        }
                    } catch (err) {
                        console.error('Failed to fetch school:', err);
                        if (attempts < 5) {
                            setTimeout(() => fetchSchool(attempts + 1), 2000);
                        } else {
                            setLoadingSchool(false);
                        }
                    }
                };
                fetchSchool();
            }
        }
        if (params.get('canceled') === 'true') {
            setCurrentStep(1);
            window.history.replaceState({}, '', '/register');
        }
    }, []);

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateStep1 = () => {
        const errs = {};
        if (!formData.schoolName.trim()) errs.schoolName = 'School name is required';
        if (!formData.adminFirstName.trim()) errs.adminFirstName = 'First name is required';
        if (!formData.adminLastName.trim()) errs.adminLastName = 'Last name is required';
        if (!formData.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Please enter a valid email';
        if (!formData.phone.trim()) errs.phone = 'Phone number is required';
        if (!formData.studentCount) errs.studentCount = 'Please select a range';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = () => {
        const errs = {};
        if (!formData.cardName.trim()) errs.cardName = 'Name on card is required';
        if (formData.cardNumber.replace(/\s/g, '').length < 16) errs.cardNumber = 'Enter a valid 16-digit card number';
        if (formData.cardExpiry.length < 5) errs.cardExpiry = 'Enter a valid expiry (MM/YY)';
        if (formData.cardCvc.length < 3) errs.cardCvc = 'Enter a 3-digit CVC';
        if (!formData.billingAddress.trim()) errs.billingAddress = 'Billing address is required';
        if (!formData.billingCity.trim()) errs.billingCity = 'City is required';
        if (!formData.billingZip.trim()) errs.billingZip = 'ZIP code is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateSetup = () => {
        const errs = {};
        if (!formData.subdomain.trim() || formData.subdomain.length < 3) errs.subdomain = 'Subdomain must be at least 3 characters';
        if (!formData.displayName.trim()) errs.displayName = 'Display name is required';
        const hasValidAdmin = formData.adminAccounts.some(a => a.name.trim() && a.email.trim());
        if (!hasValidAdmin) errs.adminAccounts = 'At least one admin with name and email is required';
        const hasValidClass = formData.classNames.some(c => c.trim());
        if (!hasValidClass) errs.classNames = 'At least one class name is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 0 && !validateStep1()) return;
        setErrors({});
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        setErrors({});
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const handlePayment = () => {
        if (!validateStep3()) return;
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setLicenseKey(generateLicenseKey());
            setCurrentStep(2); // Skip setup, go to confirmation
            window.scrollTo(0, 0);
        }, 2500);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <SchoolInfoStep formData={formData} updateFormData={updateFormData} onNext={handleNext} errors={errors} />;
            case 1:
                return <PaymentStep formData={formData} updateFormData={updateFormData} onSubmit={handlePayment} onBack={handleBack} isProcessing={isProcessing} errors={errors} />;
            case 2:
                return <ConfirmationStep formData={formData} licenseKey={licenseKey} provisionedSchool={provisionedSchool} loadingSchool={loadingSchool} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">ShopNext <span className="text-blue-600">for Schools</span></span>
                    </div>
                    <a href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">Back to main site</a>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <StepIndicator currentStep={currentStep} />
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    {renderStep()}
                </div>

                {/* Trust badges */}
                {currentStep < 2 && (
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> SSL Encrypted</span>
                        <span className="flex items-center gap-1"><Lock className="h-4 w-4" /> PCI Compliant</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> 30-Day Money Back</span>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-xs text-gray-400">
                <p>&copy; 2026 ShopNext for Schools. All rights reserved.</p>
                <p className="mt-1">A marketing simulation platform for educators.</p>
            </footer>
        </div>
    );
}
