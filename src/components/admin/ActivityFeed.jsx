"use client";
import { Activity, UserPlus, UserMinus, Key, BookOpen, Trash2, RefreshCw, Split } from 'lucide-react';
import { useActivityFeed } from '../../lib/admin/useActivityFeed';

const ICONS = {
    'student.created': UserPlus,
    'student.deleted': UserMinus,
    'student.password_reset': Key,
    'student.role_converted': RefreshCw,
    'student.split': Split,
    'class.created': BookOpen,
    'class.renamed': BookOpen,
    'class.deleted': Trash2,
};

const COLORS = {
    'student.created': 'text-green-600 bg-green-50',
    'student.deleted': 'text-red-600 bg-red-50',
    'student.password_reset': 'text-amber-600 bg-amber-50',
    'student.role_converted': 'text-blue-600 bg-blue-50',
    'student.split': 'text-purple-600 bg-purple-50',
    'class.created': 'text-indigo-600 bg-indigo-50',
    'class.renamed': 'text-gray-600 bg-gray-100',
    'class.deleted': 'text-red-600 bg-red-50',
};

function relTime(date) {
    if (!date) return '';
    const now = Date.now();
    const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const seconds = Math.floor((now - t) / 1000);
    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(date).toLocaleDateString();
}

export function ActivityFeed({ school }) {
    const { events, loading } = useActivityFeed(school, 10);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Recent activity</h3>
            </div>
            {loading ? (
                <div className="px-5 py-6 text-sm text-gray-500">Loading...</div>
            ) : events.length === 0 ? (
                <div className="px-5 py-8 text-center">
                    <p className="text-sm text-gray-500">No activity yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Events will appear here as you create students, classes, and resolve issues.</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {events.map(e => {
                        const Icon = ICONS[e.type] || Activity;
                        const color = COLORS[e.type] || 'text-gray-600 bg-gray-50';
                        return (
                            <li key={e.id} className="px-5 py-3 flex items-start gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-900 truncate">{e.message}</p>
                                    <p className="text-xs text-gray-400">
                                        {e.actorName || 'Someone'} &middot; {relTime(e.createdAt)}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
