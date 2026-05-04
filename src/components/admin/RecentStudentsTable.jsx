import Link from 'next/link';
import { RolePill } from './RolePill';

export function RecentStudentsTable({ students, max = 8 }) {
    const list = (students || []).slice(0, max);
    if (list.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-sm text-gray-500">No students yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click <strong>Add Student</strong> to create your first.</p>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Recent students</h3>
                <Link href="/dashboard/students" className="text-xs text-blue-600 hover:text-blue-700">View all →</Link>
            </div>
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase">Class</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {list.map((s) => {
                        const role = s.class && s.avatarClass ? 'dual'
                            : s.class ? 'class'
                            : s.avatarClass ? 'avatarClass' : null;
                        return (
                            <tr key={s.uid} className="hover:bg-gray-50">
                                <td className="px-5 py-2.5 text-sm text-gray-900">{s.displayName || s.email}</td>
                                <td className="px-5 py-2.5"><RolePill role={role} size="xs" /></td>
                                <td className="px-5 py-2.5 text-sm text-gray-600">{s.class || s.avatarClass || '—'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
