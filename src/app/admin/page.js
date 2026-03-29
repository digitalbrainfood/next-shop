"use client";
import React, { useState } from 'react';
import {
    GraduationCap, Users, DollarSign, Globe, TrendingUp, ChevronDown, ChevronUp,
    Search, Eye, CheckCircle2, XCircle, Clock, MoreVertical, ArrowUpRight,
    BarChart3, Activity, CreditCard, Calendar, Mail, ExternalLink, ShieldCheck,
    AlertTriangle, RefreshCw
} from 'lucide-react';

// --- MOCK DATA ---

const MOCK_CUSTOMERS = [
    {
        id: 1,
        schoolName: 'Riverside Academy',
        professor: 'Dr. Sarah Chen',
        email: 'schen@riverside.edu',
        subdomain: 'riverside',
        status: 'active',
        platforms: ['products', 'avatars'],
        students: 142,
        licenseKey: 'SCH-A7K2-MN4P-X9R1',
        signupDate: '2025-09-15',
        renewalDate: '2026-09-15',
        lastActive: '2 hours ago',
        primaryColor: '#2563eb',
        revenue: 50,
    },
    {
        id: 2,
        schoolName: 'Metro State University',
        professor: 'Prof. James Wright',
        email: 'jwright@metrostate.edu',
        subdomain: 'metrostate',
        status: 'active',
        platforms: ['products'],
        students: 287,
        licenseKey: 'SCH-B3F8-QW2L-Y6T4',
        signupDate: '2025-08-22',
        renewalDate: '2026-08-22',
        lastActive: '1 day ago',
        primaryColor: '#7c3aed',
        revenue: 50,
    },
    {
        id: 3,
        schoolName: 'Pacific Northwest College',
        professor: 'Dr. Maria Lopez',
        email: 'mlopez@pnc.edu',
        subdomain: 'pnc-marketing',
        status: 'active',
        platforms: ['products', 'avatars'],
        students: 95,
        licenseKey: 'SCH-C1D5-RT8N-Z3V7',
        signupDate: '2025-11-03',
        renewalDate: '2026-11-03',
        lastActive: '5 hours ago',
        primaryColor: '#059669',
        revenue: 50,
    },
    {
        id: 4,
        schoolName: 'Eastbrook Institute',
        professor: 'Dr. Kevin Park',
        email: 'kpark@eastbrook.edu',
        subdomain: 'eastbrook',
        status: 'expiring',
        platforms: ['avatars'],
        students: 63,
        licenseKey: 'SCH-D9G3-HJ6K-W1M2',
        signupDate: '2025-04-10',
        renewalDate: '2026-04-10',
        lastActive: '3 days ago',
        primaryColor: '#ea580c',
        revenue: 50,
    },
    {
        id: 5,
        schoolName: 'Summit Valley HS',
        professor: 'Ms. Angela Torres',
        email: 'atorres@svhs.org',
        subdomain: 'summitvalley',
        status: 'active',
        platforms: ['products'],
        students: 178,
        licenseKey: 'SCH-E4P7-VN9C-B5X8',
        signupDate: '2025-10-28',
        renewalDate: '2026-10-28',
        lastActive: '12 hours ago',
        primaryColor: '#db2777',
        revenue: 50,
    },
    {
        id: 6,
        schoolName: 'Lakeview Community College',
        professor: 'Prof. Robert Kim',
        email: 'rkim@lakeviewcc.edu',
        subdomain: 'lakeview',
        status: 'expired',
        platforms: ['products', 'avatars'],
        students: 0,
        licenseKey: 'SCH-F2S6-YL3T-Q8W4',
        signupDate: '2024-12-01',
        renewalDate: '2025-12-01',
        lastActive: '45 days ago',
        primaryColor: '#4f46e5',
        revenue: 0,
    },
    {
        id: 7,
        schoolName: 'Harper College of Business',
        professor: 'Dr. Emily Nguyen',
        email: 'enguyen@harper.edu',
        subdomain: 'harper-biz',
        status: 'active',
        platforms: ['products', 'avatars'],
        students: 210,
        licenseKey: 'SCH-G8K1-DN7F-J4R9',
        signupDate: '2025-07-14',
        renewalDate: '2026-07-14',
        lastActive: '30 minutes ago',
        primaryColor: '#0d9488',
        revenue: 50,
    },
    {
        id: 8,
        schoolName: 'Central Arts Academy',
        professor: 'Prof. David Martinez',
        email: 'dmartinez@centralarts.edu',
        subdomain: 'centralarts',
        status: 'pending',
        platforms: ['avatars'],
        students: 0,
        licenseKey: 'SCH-H5M3-XP2G-T7V6',
        signupDate: '2026-03-25',
        renewalDate: '2027-03-25',
        lastActive: 'Never',
        primaryColor: '#dc2626',
        revenue: 50,
    },
];

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    expiring: { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle },
    pending: { label: 'Pending Setup', color: 'bg-blue-100 text-blue-700', icon: Clock },
};

// --- STAT CARD ---

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtext && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" />{subtext}</p>}
    </div>
);

// --- CUSTOMER ROW ---

const CustomerRow = ({ customer, isExpanded, onToggle }) => {
    const status = STATUS_CONFIG[customer.status];
    const StatusIcon = status.icon;

    return (
        <>
            <tr
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={onToggle}
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: customer.primaryColor }}>
                            {customer.schoolName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{customer.schoolName}</p>
                            <p className="text-xs text-gray-400">{customer.subdomain}.shopnext.app</p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4">
                    <p className="text-sm text-gray-700">{customer.professor}</p>
                    <p className="text-xs text-gray-400">{customer.email}</p>
                </td>
                <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{customer.students}</td>
                <td className="px-5 py-4 text-sm text-gray-700">${customer.revenue}</td>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                        {customer.platforms.includes('products') && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Products</span>
                        )}
                        {customer.platforms.includes('avatars') && (
                            <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">Talent</span>
                        )}
                    </div>
                </td>
                <td className="px-5 py-4">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-50">
                    <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">License Key</p>
                                <p className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{customer.licenseKey}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Signup Date</p>
                                <p className="text-gray-700">{customer.signupDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Renewal Date</p>
                                <p className={`${customer.status === 'expiring' ? 'text-amber-600 font-medium' : customer.status === 'expired' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{customer.renewalDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Last Active</p>
                                <p className="text-gray-700">{customer.lastActive}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Visit Instance
                            </button>
                            <button className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer flex items-center gap-1">
                                <Mail className="h-3 w-3" /> Contact
                            </button>
                            {customer.status === 'expired' && (
                                <button className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3" /> Send Renewal
                                </button>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

// --- MAIN PAGE ---

export default function AdminDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);

    const filtered = MOCK_CUSTOMERS.filter(c => {
        const matchesSearch = !searchQuery ||
            c.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.professor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = MOCK_CUSTOMERS.filter(c => c.status !== 'expired').reduce((sum, c) => sum + c.revenue, 0);
    const totalStudents = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.students, 0);
    const activeCount = MOCK_CUSTOMERS.filter(c => c.status === 'active').length;
    const expiringCount = MOCK_CUSTOMERS.filter(c => c.status === 'expiring').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="h-7 w-7 text-blue-600" />
                        <span className="text-xl font-bold text-gray-900">ShopNext <span className="text-blue-600">Admin</span></span>
                        <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                            <ShieldCheck className="h-3 w-3" /> Super Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="/testing" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Registration</a>
                        <a href="/" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">Main Site</a>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage all customer instances and subscriptions.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={Users}
                        label="Total Customers"
                        value={MOCK_CUSTOMERS.length}
                        subtext="+2 this month"
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        icon={DollarSign}
                        label="Annual Revenue"
                        value={`$${totalRevenue.toLocaleString()}`}
                        subtext="+$100 this month"
                        color="bg-green-100 text-green-600"
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Total Students"
                        value={totalStudents.toLocaleString()}
                        color="bg-purple-100 text-purple-600"
                    />
                    <StatCard
                        icon={Activity}
                        label="Active Instances"
                        value={`${activeCount}/${MOCK_CUSTOMERS.length}`}
                        subtext={expiringCount > 0 ? `${expiringCount} expiring soon` : undefined}
                        color="bg-amber-100 text-amber-600"
                    />
                </div>

                {/* Revenue Chart Placeholder */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-gray-400" /> Revenue Overview
                        </h2>
                        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                            <option>Last 12 months</option>
                            <option>Last 6 months</option>
                            <option>Last 30 days</option>
                        </select>
                    </div>
                    <div className="flex items-end gap-2 h-40">
                        {[35, 40, 30, 45, 55, 50, 60, 75, 70, 85, 90, 100].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                                    style={{ height: `${h}%` }}
                                    title={`$${h * 3.5}`}
                                />
                                <span className="text-[10px] text-gray-400">
                                    {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Customer Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-5 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="search"
                                        placeholder="Search customers..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="expiring">Expiring</option>
                                    <option value="expired">Expired</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Professor</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platforms</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((customer) => (
                                    <CustomerRow
                                        key={customer.id}
                                        customer={customer}
                                        isExpanded={expandedRow === customer.id}
                                        onToggle={() => setExpandedRow(expandedRow === customer.id ? null : customer.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <Search className="h-8 w-8 mx-auto mb-2" />
                                <p>No customers match your search.</p>
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                        <span>Showing {filtered.length} of {MOCK_CUSTOMERS.length} customers</span>
                        <span className="text-gray-400">Mock data for demonstration</span>
                    </div>
                </div>
            </main>

            <footer className="container mx-auto px-4 py-8 text-center text-xs text-gray-400">
                <p>&copy; 2025 ShopNext. Super Admin Dashboard. All rights reserved.</p>
            </footer>
        </div>
    );
}
