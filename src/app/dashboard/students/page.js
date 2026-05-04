"use client";
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Search, MoreVertical } from 'lucide-react';
import { useStudents } from '../../../lib/admin/useStudents';
import { RolePill } from '../../../components/admin/RolePill';
import { functions, db } from '../../../lib/firebase';
import { generateFriendlyPassword } from '../../../components/admin/wizard/passwordGenerator';
import { logEvent } from '../../../lib/admin/logEvent';
import { useSchoolConfig } from '../../../lib/useSchoolConfig';

function relTime(value) {
    if (!value) return 'Never';
    const t = new Date(value).getTime();
    if (isNaN(t)) return '—';
    const seconds = Math.floor((Date.now() - t) / 1000);
    if (seconds < 60) return 'just now';
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(value).toLocaleDateString();
}

export default function StudentsPage() {
    const { students, loading, refresh } = useStudents();
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [menuOpenFor, setMenuOpenFor] = useState(null); // uid of the row whose menu is open
    const [busyUid, setBusyUid] = useState(null);
    const [feedback, setFeedback] = useState(null); // { uid, type, text }
    const [notesEditFor, setNotesEditFor] = useState(null); // { uid, displayName }
    const [notesValue, setNotesValue] = useState('');
    const [notesBusy, setNotesBusy] = useState(false);
    const { schoolConfig } = useSchoolConfig();

    const openNotesEditor = async (uid, displayName) => {
        try {
            const snap = await getDoc(doc(db, 'students', uid));
            setNotesValue(snap.exists() ? (snap.data().notes || '') : '');
        } catch {
            setNotesValue('');
        }
        setNotesEditFor({ uid, displayName });
        setMenuOpenFor(null);
    };

    const saveNotes = async () => {
        if (!notesEditFor) return;
        setNotesBusy(true);
        try {
            await setDoc(doc(db, 'students', notesEditFor.uid), { notes: notesValue }, { merge: true });
            setFeedback({ uid: notesEditFor.uid, type: 'success', text: 'Notes saved.' });
            setNotesEditFor(null);
        } catch (e) {
            setFeedback({ uid: notesEditFor.uid, type: 'error', text: e.message || 'Failed to save.' });
        }
        setNotesBusy(false);
    };

    const handleResetPassword = async (uid, displayName) => {
        const newPassword = generateFriendlyPassword();
        if (!window.confirm(`Reset password for "${displayName}" to "${newPassword}"?\n\nThe student must sign in with the new password and you should share it with them now.`)) return;
        setBusyUid(uid);
        try {
            const fn = httpsCallable(functions, 'resetStudentPassword');
            await fn({ uid, newPassword });
            setFeedback({ uid, type: 'success', text: `New password: ${newPassword}` });
            await logEvent({
                type: 'student.password_reset',
                message: `Password reset for "${displayName}".`,
                school: schoolConfig?.subdomain,
                target: { uid },
            });
        } catch (e) {
            setFeedback({ uid, type: 'error', text: e.message || 'Failed to reset password.' });
        }
        setBusyUid(null);
        setMenuOpenFor(null);
    };

    const handleDeleteStudent = async (uid, displayName) => {
        if (!window.confirm(`Permanently delete "${displayName}"? Their content (products/avatars) is NOT deleted automatically; remove it separately if needed.`)) return;
        setBusyUid(uid);
        try {
            const fn = httpsCallable(functions, 'deleteUser');
            await fn({ uid });
            setFeedback({ uid, type: 'success', text: 'Student deleted.' });
            await logEvent({
                type: 'student.deleted',
                message: `Student "${displayName}" deleted.`,
                school: schoolConfig?.subdomain,
                target: { uid },
            });
        } catch (e) {
            setFeedback({ uid, type: 'error', text: e.message || 'Failed to delete.' });
        }
        setBusyUid(null);
        setMenuOpenFor(null);
        refresh();
    };

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
                                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Last active</th>
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
                                        <td className="px-5 py-3 text-sm text-gray-500">{relTime(s.lastSignInTime)}</td>
                                        <td className="px-5 py-3">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={() => setMenuOpenFor(menuOpenFor === s.uid ? null : s.uid)}
                                                    disabled={busyUid === s.uid}
                                                    className="text-gray-400 hover:text-gray-700 p-1.5 rounded hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                                                    title="Actions"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                                {menuOpenFor === s.uid && (
                                                    <div className="absolute right-0 top-8 z-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                                                        <button
                                                            onClick={() => handleResetPassword(s.uid, s.displayName || s.email)}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                                        >
                                                            Reset password
                                                        </button>
                                                        <button
                                                            onClick={() => openNotesEditor(s.uid, s.displayName || s.email)}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                                        >
                                                            Edit notes
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStudent(s.uid, s.displayName || s.email)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                                        >
                                                            Delete student
                                                        </button>
                                                    </div>
                                                )}
                                                {feedback && feedback.uid === s.uid && (
                                                    <div className={`absolute right-0 top-12 z-20 w-72 p-2 rounded-lg text-xs shadow-lg ${
                                                        feedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                                                    }`}>
                                                        {feedback.text}
                                                        <button onClick={() => setFeedback(null)} className="ml-2 underline cursor-pointer">close</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {notesEditFor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNotesEditFor(null)}>
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-3 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900">Notes for {notesEditFor.displayName}</h3>
                        </div>
                        <div className="px-5 py-4">
                            <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                rows={5}
                                placeholder="Real name, group, accommodations, anything you want to remember about this student."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
                            <button onClick={() => setNotesEditFor(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">Cancel</button>
                            <button onClick={saveNotes} disabled={notesBusy} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer">
                                {notesBusy ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
