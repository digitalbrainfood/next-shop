"use client";
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { CheckCircle2, X } from 'lucide-react';
import { functions } from '../../../lib/firebase';
import { useDualAccessStudents } from '../../../lib/admin/useDualAccessStudents';
import { logEvent } from '../../../lib/admin/logEvent';
import { ResolveOptions } from './ResolveOptions';
import { generateFriendlyPassword } from '../wizard/passwordGenerator';
import { StepCredentialHandoff } from '../wizard/StepCredentialHandoff';
import { useSchoolConfig } from '../../../lib/useSchoolConfig';

export function DualAccessDrawer({ open, onClose, onResolved }) {
    const { users, loading, refresh } = useDualAccessStudents();
    const schoolConfig = useSchoolConfig();
    const [index, setIndex] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [splitResult, setSplitResult] = useState(null); // { username, password } after a Split

    useEffect(() => { if (open) { setIndex(0); setError(null); setSplitResult(null); refresh(); } }, [open]);

    if (!open) return null;

    const current = users[index];
    const allDone = !loading && users.length === 0;

    const apply = async ({ choice, splitUsername }) => {
        if (!current) return;
        setBusy(true);
        setError(null);
        try {
            if (choice === 'keep-class') {
                const fn = httpsCallable(functions, 'convertStudentRole');
                await fn({ uid: current.uid, keepRole: 'class' });
                await logEvent({ type: 'student.role_converted', message: `${current.displayName || current.email}: kept Products, dropped Talent.`, school: current.class, target: { uid: current.uid } });
                onResolved?.();
                advance();
            } else if (choice === 'keep-avatarClass') {
                const fn = httpsCallable(functions, 'convertStudentRole');
                await fn({ uid: current.uid, keepRole: 'avatarClass' });
                await logEvent({ type: 'student.role_converted', message: `${current.displayName || current.email}: kept Talent, dropped Products.`, school: current.avatarClass, target: { uid: current.uid } });
                onResolved?.();
                advance();
            } else if (choice === 'split') {
                const conv = httpsCallable(functions, 'convertStudentRole');
                await conv({ uid: current.uid, keepRole: 'class' });
                const password = generateFriendlyPassword();
                const create = httpsCallable(functions, 'createAvatarVendor');
                await create({ username: splitUsername, password, avatarClass: current.avatarClass });
                await logEvent({ type: 'student.split', message: `${current.displayName || current.email} split: kept as Products; new Talent account "${splitUsername}" created.`, school: current.class, target: { uid: current.uid } });
                setSplitResult({ username: splitUsername, password });
                onResolved?.();
            }
        } catch (e) {
            setError(e.message || 'Failed to apply.');
        } finally {
            setBusy(false);
        }
    };

    const advance = () => {
        refresh();
        if (index >= users.length - 1) {
            setIndex(0);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/30" onClick={onClose} />
            <aside className="w-full max-w-md bg-white border-l border-gray-200 flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Resolve dual access</p>
                        <h2 className="text-base font-semibold text-gray-900">Cleanup</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading && <p className="text-sm text-gray-500">Loading...</p>}

                    {!loading && allDone && (
                        <div className="text-center py-10">
                            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                            <p className="font-semibold text-gray-900">All clean</p>
                            <p className="text-sm text-gray-500 mt-1">No students with dual access remain.</p>
                        </div>
                    )}

                    {!loading && current && !splitResult && (
                        <>
                            <p className="text-xs text-gray-400 mb-2">{index + 1} of {users.length}</p>
                            <h3 className="text-lg font-semibold text-gray-900">{current.displayName || current.email}</h3>
                            <p className="text-xs text-gray-500 mb-3">
                                Currently has <strong>class={current.class}</strong> and <strong>avatarClass={current.avatarClass}</strong>.
                            </p>
                            <ResolveOptions student={current} onResolve={apply} busy={busy} />
                            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                        </>
                    )}

                    {splitResult && (
                        <StepCredentialHandoff
                            schoolName={schoolConfig?.displayName || 'My School'}
                            role="Talent"
                            username={splitResult.username}
                            password={splitResult.password}
                            loginUrl={schoolConfig?.subdomain ? `https://${schoolConfig.subdomain}.shopnext.app` : window.location.origin}
                            onDone={() => { setSplitResult(null); advance(); }}
                        />
                    )}
                </div>
            </aside>
        </div>
    );
}
