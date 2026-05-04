"use client";
import { useState } from 'react';
import { CheckCircle2, Clipboard, ClipboardCheck, Download, Mail } from 'lucide-react';
import { downloadCredentialPdf } from './credentialPdf';

export function StepCredentialHandoff({ schoolName, role, username, password, loginUrl, onDone }) {
    const [copied, setCopied] = useState(null);
    const copy = async (key, text) => {
        try { await navigator.clipboard.writeText(text); }
        catch { /* fall back to nothing — user can still type it */ }
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    const Field = ({ label, value, k }) => (
        <div className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0">
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
                <p className="font-mono text-sm text-gray-900 truncate">{value}</p>
            </div>
            <button onClick={() => copy(k, value)} className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 cursor-pointer" title="Copy">
                {copied === k ? <ClipboardCheck className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />}
            </button>
        </div>
    );

    const all = `Username: ${username}\nPassword: ${password}\nLogin: ${loginUrl}`;

    return (
        <div>
            <div className="flex items-center gap-2 text-green-700 mb-3">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Student created</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Hand these credentials to the student. They&rsquo;ll sign in at the URL below.</p>

            <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-2 mb-5">
                <Field label="Username" value={username} k="user" />
                <Field label="Password" value={password} k="pass" />
                <Field label="Login URL" value={loginUrl} k="url" />
            </div>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => copy('all', all)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                    {copied === 'all' ? <ClipboardCheck className="h-4 w-4 text-green-600" /> : <Clipboard className="h-4 w-4" />} Copy all
                </button>
                <button onClick={() => downloadCredentialPdf({ schoolName, role, username, password, loginUrl })}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                    <Download className="h-4 w-4" /> Download PDF handout
                </button>
                <a href={`mailto:?subject=Your%20${role}%20account&body=${encodeURIComponent(all)}`}
                    className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
                    <Mail className="h-4 w-4" /> Email to me
                </a>
                <button onClick={onDone}
                    className="ml-auto flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer">
                    Done
                </button>
            </div>
        </div>
    );
}
