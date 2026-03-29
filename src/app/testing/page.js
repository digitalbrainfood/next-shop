"use client";
import React, { useState, useEffect } from 'react';
import {
    School, CreditCard, Lock, CheckCircle2, Check, ChevronRight, ChevronLeft,
    Zap, Star, Building, ShieldCheck, Loader2, Copy, ClipboardCheck,
    Mail, Globe, Key, Users, GraduationCap, Download
} from 'lucide-react';

// --- CONSTANTS ---

const STEPS = [
    { label: 'School Info', icon: School },
    { label: 'Select Plan', icon: CreditCard },
    { label: 'Payment', icon: Lock },
    { label: 'Confirmation', icon: CheckCircle2 },
];

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 499,
        icon: Zap,
        color: 'text-amber-500',
        features: [
            'Up to 200 students',
            'Basic analytics dashboard',
            'Email support',
            '5 admin accounts',
            '1 platform instance',
        ],
    },
    {
        id: 'standard',
        name: 'Standard',
        price: 999,
        icon: Star,
        color: 'text-blue-600',
        recommended: true,
        features: [
            'Up to 1,000 students',
            'Advanced analytics & reporting',
            'Priority email & phone support',
            '25 admin accounts',
            'Custom branding',
            '2 platform instances',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2499,
        icon: Building,
        color: 'text-purple-600',
        features: [
            'Unlimited students',
            'Full analytics suite with exports',
            'Dedicated account manager',
            'Unlimited admin accounts',
            'Custom branding & domain',
            'API access',
        ],
    },
];

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

// --- STEP 2: PLAN SELECTION ---

const PlanSelectionStep = ({ formData, updateFormData, onNext, onBack }) => (
    <div>
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-gray-500 mt-1">Select the plan that best fits your institution.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan) => {
                const Icon = plan.icon;
                const isSelected = formData.selectedPlan === plan.id;
                return (
                    <div
                        key={plan.id}
                        onClick={() => updateFormData('selectedPlan', plan.id)}
                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                            isSelected ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-600' : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
                            </div>
                        )}
                        <div className="text-center mb-4 pt-2">
                            <Icon className={`h-8 w-8 mx-auto mb-2 ${plan.color}`} />
                            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                            <div className="mt-2">
                                <span className="text-3xl font-bold text-gray-900">${plan.price.toLocaleString()}</span>
                                <span className="text-gray-500 text-sm"> /year</span>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        {isSelected && (
                            <div className="mt-4 text-center">
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                                    <CheckCircle2 className="h-4 w-4" /> Selected
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
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
                Next <ChevronRight className="h-5 w-5" />
            </button>
        </div>
    </div>
);

// --- STEP 3: PAYMENT ---

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
    const selectedPlan = PLANS.find(p => p.id === formData.selectedPlan) || PLANS[1];

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
                            <span className="text-gray-600">{selectedPlan.name} Plan</span>
                            <span className="font-semibold">${selectedPlan.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">Annual subscription</p>
                        <div className="border-t border-gray-200 pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span>${selectedPlan.price.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span>$0.00</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${selectedPlan.price.toLocaleString()}.00</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                            <span>256-bit SSL encrypted payment</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="lg:col-span-3 relative">
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
            <div className="flex justify-between mt-8">
                <button
                    onClick={onBack}
                    disabled={isProcessing}
                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                    <ChevronLeft className="h-5 w-5" /> Back
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors cursor-pointer disabled:bg-blue-400"
                >
                    {isProcessing ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                    ) : (
                        <>Pay ${selectedPlan.price.toLocaleString()}.00</>
                    )}
                </button>
            </div>
        </div>
    );
};

// --- STEP 4: CONFIRMATION ---

const ConfirmationStep = ({ formData, licenseKey }) => {
    const [copied, setCopied] = useState(false);
    const [showCheck, setShowCheck] = useState(false);
    const selectedPlan = PLANS.find(p => p.id === formData.selectedPlan) || PLANS[1];

    useEffect(() => {
        const timer = setTimeout(() => setShowCheck(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(licenseKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for non-HTTPS
            const textarea = document.createElement('textarea');
            textarea.value = licenseKey;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const nextSteps = [
        { icon: Mail, text: `Check your email at ${formData.email} for setup instructions` },
        { icon: Globe, text: 'Your hosted instance will be ready within 24 hours' },
        { icon: Key, text: 'Use your license key to activate your platform' },
        { icon: Users, text: 'Our team will reach out for onboarding' },
    ];

    return (
        <div className="text-center">
            {/* Success Icon */}
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 transition-transform duration-500 ${showCheck ? 'scale-100' : 'scale-0'}`}>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
            <p className="text-gray-500 text-lg mb-8">Welcome aboard, {formData.schoolName}!</p>

            {/* License Key */}
            <div className="max-w-md mx-auto mb-8">
                <p className="text-sm font-medium text-gray-600 mb-2">Your License Key</p>
                <div className="bg-gray-900 rounded-xl px-6 py-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-green-400 text-lg tracking-wider">{licenseKey}</span>
                    <button
                        onClick={handleCopy}
                        className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                        title="Copy to clipboard"
                    >
                        {copied ? <ClipboardCheck className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
                    </button>
                </div>
                {copied && <p className="text-green-600 text-xs mt-2">Copied to clipboard!</p>}
            </div>

            {/* Plan Summary */}
            <div className="max-w-md mx-auto bg-blue-50 rounded-xl p-4 mb-8 flex justify-between items-center">
                <div className="text-left">
                    <p className="font-semibold text-gray-900">{selectedPlan.name} Plan</p>
                    <p className="text-sm text-gray-500">Annual subscription</p>
                </div>
                <p className="text-xl font-bold text-blue-600">${selectedPlan.price.toLocaleString()}/yr</p>
            </div>

            {/* Next Steps */}
            <div className="max-w-lg mx-auto text-left mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Next Steps</h3>
                <div className="space-y-3">
                    {nextSteps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Icon className="h-4 w-4 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-700 pt-1">{step.text}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                    <GraduationCap className="h-5 w-5" /> Go to Dashboard
                </a>
                <button
                    onClick={() => alert('Receipt downloaded! (mock)')}
                    className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                    <Download className="h-5 w-5" /> Download Receipt
                </button>
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
    selectedPlan: 'standard',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
    billingAddress: '',
    billingCity: '',
    billingZip: '',
};

export default function TestingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');

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
            setCurrentStep(3);
            window.scrollTo(0, 0);
        }, 2500);
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <SchoolInfoStep formData={formData} updateFormData={updateFormData} onNext={handleNext} errors={errors} />;
            case 1:
                return <PlanSelectionStep formData={formData} updateFormData={updateFormData} onNext={handleNext} onBack={handleBack} />;
            case 2:
                return <PaymentStep formData={formData} updateFormData={updateFormData} onSubmit={handlePayment} onBack={handleBack} isProcessing={isProcessing} errors={errors} />;
            case 3:
                return <ConfirmationStep formData={formData} licenseKey={licenseKey} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 text-blue-600" />
                        <span className="text-xl font-bold text-gray-900">ShopNext <span className="text-blue-600">for Schools</span></span>
                    </div>
                    <a href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Back to main site</a>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-3xl">
                <StepIndicator currentStep={currentStep} />
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                    {renderStep()}
                </div>

                {/* Trust badges */}
                {currentStep < 3 && (
                    <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> SSL Encrypted</span>
                        <span className="flex items-center gap-1"><Lock className="h-4 w-4" /> PCI Compliant</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> 30-Day Money Back</span>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-xs text-gray-400">
                <p>&copy; 2025 ShopNext for Schools. All rights reserved.</p>
                <p className="mt-1">A prototype for educational purposes.</p>
            </footer>
        </div>
    );
}
