"use client";
import React, { useState, useEffect } from 'react';
import {
    Settings, Globe, Palette, CreditCard, Key, CheckCircle2, XCircle,
    AlertTriangle, Copy, ClipboardCheck, ExternalLink, Loader2,
    ArrowLeft, Shield, Clock, RefreshCw
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { onIdTokenChanged } from 'firebase/auth';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const DNS_INSTRUCTIONS = [
    { type: 'CNAME', name: 'shop (or @)', value: 'cname.vercel-dns.com', note: 'Point your domain or subdomain to Vercel' },
];

const StatusBadge = ({ status }) => {
    const config = {
        active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
        expiring: { label: 'Payment Issue', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
        expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle },
        pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700', icon: Clock },
    };
    const s = config[status] || config.pending;
    const Icon = s.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${s.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {s.label}
        </span>
    );
};

const SettingsSection = ({ icon: Icon, title, description, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>
            </div>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [school, setSchool] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [copied, setCopied] = useState(false);

    // Domain editing
    const [customDomain, setCustomDomain] = useState('');
    const [domainSaving, setDomainSaving] = useState(false);

    // Branding editing
    const [displayName, setDisplayName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563eb');

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
            if (currentUser) {
                const tokenResult = await currentUser.getIdTokenResult();
                currentUser.customClaims = tokenResult.claims;
                setUser(currentUser);

                // Look up school by the user's class
                const userClass = tokenResult.claims.class || tokenResult.claims.avatarClass;
                if (userClass) {
                    try {
                        const q = query(
                            collection(db, 'schools'),
                            where('subdomain', '==', userClass),
                            limit(1)
                        );
                        const snapshot = await getDocs(q);
                        if (!snapshot.empty) {
                            const schoolData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                            setSchool(schoolData);
                            setCustomDomain(schoolData.customDomain || '');
                            setDisplayName(schoolData.displayName || '');
                            setPrimaryColor(schoolData.primaryColor || '#2563eb');
                        }
                    } catch {
                        // Expected if Firestore rules haven't been deployed yet
                        // or user doesn't have access to schools collection
                    }
                }
            } else {
                setUser(null);
                setSchool(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCopyLicense = async () => {
        if (!school?.licenseKey) return;
        try {
            await navigator.clipboard.writeText(school.licenseKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = school.licenseKey;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getAuthToken = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        return currentUser.getIdToken();
    };

    const handleSaveDomain = async () => {
        if (!school) return;
        setDomainSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = await getAuthToken();
            const cleaned = customDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
            const response = await fetch('/api/school-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    schoolId: school.id,
                    updates: { customDomain: cleaned },
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save');
            setSchool(prev => ({ ...prev, customDomain: cleaned, customDomainVerified: false }));
            setCustomDomain(cleaned);
            setMessage({ type: 'success', text: 'Domain saved. Configure the DNS records below, then verification will happen automatically.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save domain: ' + err.message });
        }
        setDomainSaving(false);
    };

    const handleSaveBranding = async () => {
        if (!school) return;
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = await getAuthToken();
            const response = await fetch('/api/school-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    schoolId: school.id,
                    updates: { displayName: displayName.trim(), primaryColor },
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save');
            setSchool(prev => ({ ...prev, displayName: displayName.trim(), primaryColor }));
            setMessage({ type: 'success', text: 'Branding updated successfully.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save branding: ' + err.message });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h2>
                    <p className="text-gray-500 mb-4">You need to be signed in to access settings.</p>
                    <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">Go to sign in</a>
                </div>
            </div>
        );
    }

    if (!school) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">No school found</h2>
                    <p className="text-gray-500 mb-4">Your account is not linked to a school subscription.</p>
                    <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">Go back</a>
                </div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Settings className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">School Settings</span>
                    </div>
                    <a href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
                        <ArrowLeft className="h-4 w-4" /> Back to app
                    </a>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
                {/* Status banner */}
                {message.text && (
                    <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
                        message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                        {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Subscription */}
                <SettingsSection icon={CreditCard} title="Subscription" description="Your current plan and billing status.">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">ShopNext Professor License</p>
                                <p className="text-sm text-gray-500">$20/month</p>
                            </div>
                            <StatusBadge status={school.status} />
                        </div>
                        {school.renewalDate && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <RefreshCw className="h-4 w-4" />
                                <span>Next billing date: {school.renewalDate}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                To manage your billing, cancel, or update payment method, contact support or manage via Stripe.
                            </p>
                        </div>
                    </div>
                </SettingsSection>

                {/* License Key */}
                <SettingsSection icon={Key} title="License Key" description="Your unique license key for this instance.">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-900 rounded-xl px-5 py-3">
                            <span className="font-mono text-green-400 tracking-wider">{school.licenseKey}</span>
                        </div>
                        <button
                            onClick={handleCopyLicense}
                            className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                            title="Copy to clipboard"
                        >
                            {copied ? <ClipboardCheck className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                    </div>
                </SettingsSection>

                {/* Domain Settings */}
                <SettingsSection icon={Globe} title="Domain" description="Configure your school's URL and custom domain.">
                    <div className="space-y-5">
                        {/* Default subdomain */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default URL</label>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                <span className="text-gray-900 font-medium">{school.subdomain || 'your-school'}.shopnext.app</span>
                                <a
                                    href={`https://${school.subdomain || 'your-school'}.shopnext.app`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 ml-auto"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        {/* Custom domain */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Domain <span className="text-gray-400 font-normal">(included free)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                    placeholder="shop.yourschool.edu"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                                />
                                <button
                                    onClick={handleSaveDomain}
                                    disabled={domainSaving}
                                    className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:bg-blue-400 text-sm"
                                >
                                    {domainSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                </button>
                            </div>
                            {school.customDomain && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs">
                                    {school.customDomainVerified ? (
                                        <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600">Domain verified and active</span></>
                                    ) : (
                                        <><Clock className="h-3.5 w-3.5 text-amber-500" /><span className="text-amber-600">Pending DNS verification</span></>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* DNS Instructions */}
                        {school.customDomain && !school.customDomainVerified && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-amber-900 mb-3">DNS Configuration Required</h4>
                                <p className="text-xs text-amber-700 mb-3">
                                    Add the following DNS record to your domain provider to connect <strong>{school.customDomain}</strong>:
                                </p>
                                <div className="bg-white rounded-lg overflow-hidden border border-amber-200">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-amber-100">
                                                <th className="px-3 py-2 text-left font-medium text-amber-800">Type</th>
                                                <th className="px-3 py-2 text-left font-medium text-amber-800">Name</th>
                                                <th className="px-3 py-2 text-left font-medium text-amber-800">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {DNS_INSTRUCTIONS.map((record, i) => (
                                                <tr key={i} className="border-t border-amber-100">
                                                    <td className="px-3 py-2 font-mono text-amber-900">{record.type}</td>
                                                    <td className="px-3 py-2 font-mono text-amber-900">{record.name}</td>
                                                    <td className="px-3 py-2 font-mono text-amber-900">{record.value}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-amber-600 mt-2">
                                    DNS changes can take up to 48 hours to propagate. Verification is automatic.
                                </p>
                            </div>
                        )}
                    </div>
                </SettingsSection>

                {/* Branding */}
                <SettingsSection icon={Palette} title="Branding" description="Customize how your school appears to students.">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. Riverside Academy Store"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setPrimaryColor(color.value)}
                                        className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                                            primaryColor === color.value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                                <label className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 relative overflow-hidden" title="Custom color">
                                    <span className="text-xs text-gray-400">+</span>
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </label>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: primaryColor }} />
                                <span className="text-xs text-gray-500 font-mono">{primaryColor}</span>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <div className="h-1.5" style={{ backgroundColor: primaryColor }} />
                                <div className="p-3 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor + '20' }}>
                                        <span className="text-xs font-bold" style={{ color: primaryColor }}>{(displayName || 'S')[0]}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs text-gray-900">{displayName || 'Your School Name'}</p>
                                        <p className="text-[10px] text-gray-400">{school.subdomain}.shopnext.app</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveBranding}
                                disabled={saving}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:bg-blue-400 text-sm flex items-center gap-2"
                            >
                                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save Branding'}
                            </button>
                        </div>
                    </div>
                </SettingsSection>

                {/* School Info */}
                <SettingsSection icon={Shield} title="School Information" description="Details from your registration.">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">School Name</p>
                            <p className="font-medium text-gray-900">{school.schoolName}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Contact Email</p>
                            <p className="font-medium text-gray-900">{school.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Platforms</p>
                            <div className="flex gap-1.5 mt-0.5">
                                {(school.platforms || []).map(p => (
                                    <span key={p} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium capitalize">{p}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-500">Students</p>
                            <p className="font-medium text-gray-900">{school.studentCount || 'Not specified'}</p>
                        </div>
                    </div>
                </SettingsSection>
            </main>

            <footer className="container mx-auto px-4 py-8 text-center text-xs text-gray-400">
                <p>&copy; 2026 ShopNext. All rights reserved.</p>
            </footer>
        </div>
    );
}
