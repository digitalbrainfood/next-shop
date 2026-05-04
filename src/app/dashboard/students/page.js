"use client";
import { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { useStudents } from '../../../lib/admin/useStudents';
import { RolePill } from '../../../components/admin/RolePill';

export default function StudentsPage() {
    const { students, loading } = useStudents();
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const filtered = students.filter(s => {
        const text = (s.displayName || s.email || '').toLowerCase();
        if (q && !text.includes(q.toLowerCase())) return false;
        if (roleFilter === 'products' && !s.class) return false;
        if (roleFilter === 'talent' && !s.avatarClass) return false;
        if (roleFilter === 'dual' && !(s.class && s.avatarClass)) return false;
        return true;
    });

    return (
        <div className="space-y-5 max-w-6xl">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search students..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="all">All roles</option>
                    <option value="products">Products</option>
                    <option value="talent">Talent</option>
                    <option value="dual">Dual access</option>
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading students...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm text-gray-500">No students match.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Class</th>
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(s => {
                                const role = s.class && s.avatarClass ? 'dual'
                                    : s.class ? 'class'
                                    : s.avatarClass ? 'avatarClass' : null;
                                return (
                                    <tr key={s.uid} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-sm text-gray-900">{s.displayName || '—'}</td>
                                        <td className="px-5 py-3"><RolePill role={role} size="xs" /></td>
                                        <td className="px-5 py-3 text-sm text-gray-600">{s.class || s.avatarClass || '—'}</td>
                                        <td className="px-5 py-3 text-sm text-gray-500">{s.email}</td>
                                        <td className="px-5 py-3">
                                            <button className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 cursor-pointer" disabled>
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
