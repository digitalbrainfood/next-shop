"use client";
import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Dices, Plus } from 'lucide-react';
import { generateFriendlyPassword } from './passwordGenerator';

export function StepClassAndCreds({ classes, classKind, value, onChange, existingUsernames }) {
    const [creatingClass, setCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');

    const onPickClass = (e) => {
        const v = e.target.value;
        if (v === '__new__') {
            setCreatingClass(true);
            return;
        }
        onChange({ ...value, class: v });
        setCreatingClass(false);
    };

    const confirmNewClass = () => {
        const trimmed = newClassName.trim().toLowerCase();
        if (trimmed.length < 2) return;
        onChange({ ...value, class: trimmed, _isNewClass: true });
        setCreatingClass(false);
        setNewClassName('');
    };

    const trimmedUser = (value.username || '').trim().toLowerCase();
    const usernameTaken = useMemo(() => {
        if (!trimmedUser || trimmedUser.length < 3) return false;
        if (!existingUsernames) return false;
        return existingUsernames.has(trimmedUser);
    }, [trimmedUser, existingUsernames]);
    const usernameOk = trimmedUser.length >= 3 && !usernameTaken;

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-5">
                Class &amp; credentials
                <span className="ml-2 text-xs font-normal text-gray-400">
                    ({classKind === 'talent' ? 'Talent' : 'Products'})
                </span>
            </h3>

            <div className="space-y-4">
                {/* Class */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                    {!creatingClass ? (
                        <select
                            value={value.class || ''}
                            onChange={onPickClass}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="" disabled>Choose a class...</option>
                            {classes.map(c => (<option key={c.id} value={c.id}>{c.name || c.id}</option>))}
                            <option value="__new__">+ Create new class...</option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g. morning-class"
                                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                            <button type="button" onClick={confirmNewClass}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer">
                                <Plus className="h-4 w-4 inline" /> Add
                            </button>
                            <button type="button" onClick={() => { setCreatingClass(false); setNewClassName(''); }}
                                className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700 cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={value.username}
                            onChange={(e) => onChange({ ...value, username: e.target.value })}
                            className={`w-full px-3 py-2.5 pr-9 border rounded-lg text-sm focus:ring-2 outline-none ${
                                usernameTaken
                                    ? 'border-red-300 focus:ring-red-500'
                                    : usernameOk
                                        ? 'border-green-300 focus:ring-green-500'
                                        : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="e.g. alex"
                            minLength={3}
                        />
                        {trimmedUser.length >= 3 && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                {usernameTaken
                                    ? <AlertCircle className="h-4 w-4 text-red-500" />
                                    : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            </span>
                        )}
                    </div>
                    {usernameTaken ? (
                        <p className="text-xs text-red-600 mt-1">Username already in use. Pick a different one.</p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-1">3+ characters. Will be the student&rsquo;s sign-in username.</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={value.password}
                            onChange={(e) => onChange({ ...value, password: e.target.value })}
                            className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => onChange({ ...value, password: generateFriendlyPassword() })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer flex items-center gap-1.5"
                            title="Regenerate"
                        >
                            <Dices className="h-4 w-4" /> Regenerate
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">6+ characters. Easy to read aloud — students copy it on day one.</p>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                    <input
                        type="text"
                        value={value.notes}
                        onChange={(e) => onChange({ ...value, notes: e.target.value })}
                        placeholder="real name, group, etc."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
