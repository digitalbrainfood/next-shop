"use client";
import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle2, X, Mail } from 'lucide-react';
import { functions } from '../../../lib/firebase';
import { generateFriendlyPassword } from '../wizard/passwordGenerator';
import { StepCredentialHandoff } from '../wizard/StepCredentialHandoff';
import { logEvent } from '../../../lib/admin/logEvent';

export function ResendCredentialsDrawer({ open, onClose, students, schoolName, schoolSubdomain, onResolved }) {
    const [busy, setBusy] = useState(null); // uid that's currently being reset
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null); // { username, password, role }

    if (!open) return null;

    const reset = async (s) => {
        setBusy(s.uid);
        setError(null);
        try {
            const newPassword = generateFriendlyPassword();
            const fn = httpsCallable(functions, 'resetStudentPassword');
            await fn({ uid: s.uid, newPassword });
            const role = s.class ? 'Products' : 'Talent';
            const username = (s.email || '').replace(/@shopnext\.dev$/, '') || s.displayName;
            setResult({ username, password: newPassword, role });
            await logEvent({
                type: 'student.password_reset',
                message: `Credentials resent to "${username}".`,
                school: s.class || s.avatarClass,
                target: { uid: s.uid },
            });
            onResolved?.();
        } catch (e) {
            setError(e.message || 'Failed to reset.');
        }
        setBusy(null);
    };

    const loginUrl = schoolSubdomain
        ? `https://${schoolSubdomain}.shopnext.app`
        : (typeof window !== 'undefined' ? window.location.origin : '');

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30" onClick={onClose} />
            <aside className="w-full max-w-md bg-white border-l border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Resend credentials</p>
                        <h2 className="text-base font-semibold text-gray-900">Stagnant students</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {result ? (
                        <StepCredentialHandoff
                            schoolName={schoolName}
                            role={result.role}
                            username={result.username}
                            password={result.password}
                            loginUrl={loginUrl}
                            onDone={() => setResult(null)}
                        />
                    ) : students.length === 0 ? (
                        <div className="text-center py-10">
                            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                            <p className="font-semibold text-gray-900">All caught up</p>
                            <p className="text-sm text-gray-500 mt-1">No stagnant students remain.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">These students were created over 24 hours ago but have never signed in. Reset their password and reshare the credentials.</p>
                            <ul className="space-y-2">
                                {students.map(s => {
                                    const username = (s.email || '').replace(/@shopnext\.dev$/, '') || s.displayName;
                                    return (
                                        <li key={s.uid} className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-lg">
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{s.displayName || username}</p>
                                                <p className="text-xs text-gray-500 truncate">{s.class || s.avatarClass} &middot; created {new Date(s.creationTime).toLocaleDateString()}</p>
                                            </div>
                                            <button
                                                onClick={() => reset(s)}
                                                disabled={busy === s.uid}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer flex-shrink-0"
                                            >
                                                <Mail className="h-3 w-3" />
                                                {busy === s.uid ? 'Resetting...' : 'Reset & resend'}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}
