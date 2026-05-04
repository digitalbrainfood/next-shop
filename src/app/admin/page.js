"use client";
import React, { useState, useEffect } from 'react';
import {
    Users, DollarSign, GraduationCap, TrendingUp, ChevronDown, ChevronUp,
    Search, CheckCircle2, XCircle, Clock, Activity, Mail, ExternalLink, AlertTriangle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { StatCard } from '../../components/admin/StatCard';
import { useDualAccessStudents } from '../../lib/admin/useDualAccessStudents';

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    expiring: { label: 'Expiring Soon', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
    expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle },
    pending: { label: 'Pending Setup', color: 'bg-blue-100 text-blue-700', icon: Clock },
};

const CustomerRow = ({ customer, isExpanded, onToggle }) => {
    const status = STATUS_CONFIG[customer.status] || STATUS_CONFIG.pending;
    const StatusIcon = status.icon;

    return (
        <>
            <tr
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={onToggle}
            >
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: customer.primaryColor || '#2563eb' }}>
                            {(customer.schoolName || '?').charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 text-sm">{customer.schoolName || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{customer.subdomain || '—'}.shopnext.app</p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4">
                    <p className="text-sm text-gray-700">{customer.email || '—'}</p>
                </td>
                <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                    </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700">{customer.studentCount || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-700">${customer.revenue || 0}</td>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                        {(customer.platforms || []).includes('products') && (
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Products</span>
                        )}
                        {(customer.platforms || []).includes('avatars') && (
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
                                <p className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{customer.licenseKey || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Signup Date</p>
                                <p className="text-gray-700">{customer.signupDate?.toDate?.()?.toLocaleDateString() || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Renewal Date</p>
                                <p className={`${customer.status === 'expiring' ? 'text-amber-600 font-medium' : customer.status === 'expired' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>{customer.renewalDate || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Subdomain</p>
                                <p className="text-gray-700">{customer.subdomain || '—'}</p>
                            </div>
                        </div>
                        {customer.customDomain && (
                            <div className="mt-3 text-sm">
                                <p className="text-xs text-gray-400 mb-1">Custom Domain</p>
                                <p className="text-gray-700 flex items-center gap-1">
                                    {customer.customDomain}
                                    {customer.customDomainVerified ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                </p>
                            </div>
                        )}
                        <div className="flex gap-2 mt-3">
                            {customer.subdomain && (
                                <a href={`https://${customer.subdomain}.shopnext.app`} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" /> Visit Instance
                                </a>
                            )}
                            {customer.email && (
                                <a href={`mailto:${customer.email}`} className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> Contact
                                </a>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default function AdminDashboardPage() {
    const [schools, setSchools] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedRow, setExpandedRow] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'schools'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const dualAccess = useDualAccessStudents();

    const filtered = schools.filter(c => {
        const matchesSearch = !searchQuery ||
            (c.schoolName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.subdomain || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = schools.filter(c => c.status !== 'expired').reduce((sum, c) => sum + (c.revenue || 0), 0);
    const totalStudents = schools.reduce((sum, c) => {
        const count = parseInt(c.studentCount) || 0;
        return sum + count;
    }, 0);
    const activeCount = schools.filter(c => c.status === 'active').length;
    const expiringCount = schools.filter(c => c.status === 'expiring').length;

    return (
        <div className="space-y-6 max-w-6xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
                <p className="text-gray-500 mt-1">Manage all customer instances and subscriptions.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Customers"
                    value={schools.length}
                    color="bg-blue-100 text-blue-600"
                />
                <StatCard
                    icon={DollarSign}
                    label="Monthly Revenue"
                    value={`$${totalRevenue.toLocaleString()}`}
                    color="bg-green-100 text-green-600"
                />
                <StatCard
                    icon={GraduationCap}
                    label="Student Reach"
                    value={totalStudents > 0 ? totalStudents.toLocaleString() : '—'}
                    color="bg-purple-100 text-purple-600"
                />
                <StatCard
                    icon={Activity}
                    label="Active Instances"
                    value={`${activeCount}/${schools.length}`}
                    subtext={expiringCount > 0 ? `${expiringCount} expiring soon` : undefined}
                    color="bg-amber-100 text-amber-600"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Dual-access students"
                    value={dualAccess.users.length}
                    subtext={dualAccess.users.length > 0 ? 'Across all schools' : undefined}
                    color="bg-amber-100 text-amber-600"
                />
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
                                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
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
                        <div className="text-center py-16 text-gray-400">
                            {schools.length === 0 ? (
                                <>
                                    <GraduationCap className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                    <p className="font-medium text-gray-500">No schools registered yet</p>
                                    <p className="text-sm mt-1">Schools will appear here after they complete registration at <a href="/register" className="text-blue-600 hover:underline">/register</a></p>
                                </>
                            ) : (
                                <>
                                    <Search className="h-8 w-8 mx-auto mb-2" />
                                    <p>No customers match your search.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {schools.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
                        <span>Showing {filtered.length} of {schools.length} customers</span>
                    </div>
                )}
            </div>
        </div>
    );
}
