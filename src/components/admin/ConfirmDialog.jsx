"use client";
import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Polished confirmation modal. Replaces window.confirm() across the app.
 * Use via the `useConfirmDialog()` hook for the cleanest API.
 */
export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default', // 'default' | 'destructive'
    onConfirm,
    onCancel,
}) {
    // ESC closes the dialog
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;
    const isDestructive = variant === 'destructive';

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 flex items-start gap-4">
                    {isDestructive && (
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
                            {title}
                        </h3>
                        {message && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                                {message}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-700 -m-1 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        autoFocus
                        className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                            isDestructive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
