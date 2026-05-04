"use client";
import { useState } from 'react';

export function ResolveOptions({ student, onResolve, busy }) {
    const [choice, setChoice] = useState(null);
    const [splitUsername, setSplitUsername] = useState('');

    const Option = ({ value, label, hint }) => (
        <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${choice === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <input type="radio" name="resolve" value={value} checked={choice === value} onChange={() => setChoice(value)}
                className="mt-1" />
            <div>
                <p className="font-medium text-sm text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
            </div>
        </label>
    );

    const apply = () => {
        if (!choice) return;
        if (choice === 'split' && splitUsername.trim().length < 3) return;
        onResolve({ choice, splitUsername: splitUsername.trim() });
    };

    return (
        <div className="space-y-3">
            <Option value="keep-class" label="Keep Products only" hint={`Drop avatarClass=${student.avatarClass}; student keeps class=${student.class}.`} />
            <Option value="keep-avatarClass" label="Keep Talent only" hint={`Drop class=${student.class}; student keeps avatarClass=${student.avatarClass}.`} />
            <Option value="split" label="Split into 2 accounts" hint="Current account becomes Products only. A new Talent account is created with a fresh username." />

            {choice === 'split' && (
                <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New username for the Talent account</label>
                    <input value={splitUsername} onChange={(e) => setSplitUsername(e.target.value)} placeholder="e.g. alex-talent"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button disabled={!choice || busy} onClick={apply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer">
                    {busy ? 'Applying...' : 'Apply →'}
                </button>
            </div>
        </div>
    );
}
