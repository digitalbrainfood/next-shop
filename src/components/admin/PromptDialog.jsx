"use client";
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Single-input prompt modal. Replaces window.prompt().
 * Use via the `usePromptDialog()` hook.
 */
export function PromptDialog({
    open,
    title,
    message,
    label,
    placeholder,
    initialValue = '',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    onSubmit,
    onCancel,
}) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (open) setValue(initialValue);
    }, [open, initialValue]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    const submit = (e) => {
        e?.preventDefault();
        onSubmit?.(value);
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-dialog-title"
        >
            <form
                onSubmit={submit}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 id="prompt-dialog-title" className="text-base font-semibold text-gray-900">
                            {title}
                        </h3>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-700 -m-1 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    {message && <p className="text-sm text-gray-600 mb-3 leading-relaxed">{message}</p>}
                    {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </form>
        </div>
    );
}
