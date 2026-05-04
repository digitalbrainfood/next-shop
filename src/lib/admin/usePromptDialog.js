"use client";
import { useCallback, useState } from 'react';
import { PromptDialog } from '../../components/admin/PromptDialog';

/**
 * Promise-returning replacement for window.prompt().
 *
 * Usage:
 *   const { prompt, dialog } = usePromptDialog();
 *   const url = await prompt({ title: 'Enter URL', initialValue: '' });
 *   if (url == null) return; // user cancelled
 */
export function usePromptDialog() {
    const [state, setState] = useState(null);

    const prompt = useCallback((opts) => {
        return new Promise((resolve) => {
            setState({ ...opts, resolve });
        });
    }, []);

    const close = (result) => {
        const r = state?.resolve;
        setState(null);
        if (r) r(result);
    };

    const dialog = (
        <PromptDialog
            open={!!state}
            title={state?.title || ''}
            message={state?.message}
            label={state?.label}
            placeholder={state?.placeholder}
            initialValue={state?.initialValue || ''}
            confirmLabel={state?.confirmLabel || 'OK'}
            cancelLabel={state?.cancelLabel || 'Cancel'}
            onSubmit={(v) => close(v)}
            onCancel={() => close(null)}
        />
    );

    return { prompt, dialog };
}
