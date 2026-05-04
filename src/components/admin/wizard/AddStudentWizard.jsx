"use client";
import { useMemo, useState } from 'react';
import { X, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc } from 'firebase/firestore';
import { functions, db } from '../../../lib/firebase';
import { useClasses } from '../../../lib/admin/useClasses';
import { useStudents } from '../../../lib/admin/useStudents';
import { logEvent } from '../../../lib/admin/logEvent';
import { generateFriendlyPassword } from './passwordGenerator';
import { StepRolePicker } from './StepRolePicker';
import { StepClassAndCreds } from './StepClassAndCreds';
import { StepCredentialHandoff } from './StepCredentialHandoff';

export function AddStudentWizard({ open, onClose, schoolName, schoolSubdomain, onCreated }) {
    const [step, setStep] = useState(1); // 1: role, 2: class+creds, 3: handoff
    const [role, setRole] = useState(null); // 'products' | 'talent'
    const [form, setForm] = useState({ class: '', username: '', password: generateFriendlyPassword(), notes: '', _isNewClass: false });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const productClasses = useClasses('product');
    const talentClasses = useClasses('talent');
    const classes = role === 'talent' ? talentClasses.classes : productClasses.classes;
    const classKind = role === 'talent' ? 'talent' : 'product';

    // Live username availability check — reactive against current student snapshot.
    const { students } = useStudents();
    const existingUsernames = useMemo(() => {
        const set = new Set();
        students.forEach(s => {
            if (s.email) set.add(s.email.replace(/@shopnext\.dev$/, '').toLowerCase());
            if (s.displayName) set.add(s.displayName.toLowerCase());
        });
        return set;
    }, [students]);

    const reset = () => {
        setStep(1);
        setRole(null);
        setForm({ class: '', username: '', password: generateFriendlyPassword(), notes: '', _isNewClass: false });
        setError(null);
        setSubmitting(false);
    };

    const close = () => { reset(); onClose?.(); };

    if (!open) return null;

    const canContinue1 = !!role;
    const trimmedUser = form.username.trim().toLowerCase();
    const usernameTaken = trimmedUser.length >= 3 && existingUsernames.has(trimmedUser);
    const canContinue2 = form.class && trimmedUser.length >= 3 && !usernameTaken && form.password.length >= 6;

    const submit = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const collectionName = classKind === 'talent' ? 'avatar-classes' : 'classes';
            if (form._isNewClass) {
                const display = form.class.charAt(0).toUpperCase() + form.class.slice(1).replace(/-/g, ' ');
                await setDoc(doc(db, collectionName, form.class), { name: display });
            }
            const fnName = classKind === 'talent' ? 'createAvatarVendor' : 'createNewVendor';
            const payload = classKind === 'talent'
                ? { username: form.username, password: form.password, avatarClass: form.class }
                : { username: form.username, password: form.password, class: form.class };
            const callable = httpsCallable(functions, fnName);
            const result = await callable(payload);
            const uid = result.data.uid;

            // Best-effort note write — don't block on failure (the student record itself succeeded)
            if (form.notes && uid) {
                try {
                    await setDoc(doc(db, 'students', uid), {
                        notes: form.notes,
                        class: classKind === 'product' ? form.class : null,
                        avatarClass: classKind === 'talent' ? form.class : null,
                        createdAt: new Date().toISOString(),
                    });
                } catch { /* swallow */ }
            }

            onCreated?.({ uid, ...form, role });
            await logEvent({
                type: 'student.created',
                message: `${role === 'talent' ? 'Talent' : 'Product'} student "${form.username}" added to class "${form.class}".`,
                school: form.class,
                target: { uid },
            });
            setStep(3);
        } catch (e) {
            setError(e.message || 'Failed to create student.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Step {step} of 3</p>
                        <h2 className="text-lg font-semibold text-gray-900">Add Student</h2>
                    </div>
                    <button onClick={close} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-5 overflow-y-auto">
                    {step === 1 && <StepRolePicker value={role} onChange={setRole} />}
                    {step === 2 && (
                        <StepClassAndCreds
                            classes={classes}
                            classKind={classKind}
                            value={form}
                            onChange={setForm}
                            existingUsernames={existingUsernames}
                        />
                    )}
                    {step === 3 && (
                        <StepCredentialHandoff
                            schoolName={schoolName}
                            role={role === 'talent' ? 'Talent' : 'Products'}
                            username={form.username}
                            password={form.password}
                            loginUrl={schoolSubdomain ? `https://${schoolSubdomain}.shopnext.app` : window.location.origin}
                            onDone={close}
                        />
                    )}
                    {error && (
                        <div className="mt-4 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {step !== 3 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={step === 1 ? close : () => setStep(step - 1)}
                            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg cursor-pointer"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>
                        {step === 1 && (
                            <button
                                disabled={!canContinue1}
                                onClick={() => setStep(2)}
                                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer"
                            >
                                Continue <ArrowRight className="h-4 w-4" />
                            </button>
                        )}
                        {step === 2 && (
                            <button
                                disabled={!canContinue2 || submitting}
                                onClick={submit}
                                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer"
                            >
                                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : 'Create student'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
