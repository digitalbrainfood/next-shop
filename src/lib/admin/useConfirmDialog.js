"use client";
import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

/**
 * Promise-returning replacement for window.confirm().
 *
 * Usage:
 *   const { confirm, dialog } = useConfirmDialog();
 *   const ok = await confirm({ title, message, variant: 'destructive', confirmLabel: 'Delete' });
 *   if (!ok) return;
 *   ...
 *   return (<>{...your UI...}{dialog}</>);
 */
export function useConfirmDialog() {
    const [state, setState] = useState(null);

    const confirm = useCallback((opts) => {
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
        <ConfirmDialog
            open={!!state}
            title={state?.title || ''}
            message={state?.message}
            confirmLabel={state?.confirmLabel || 'Confirm'}
            cancelLabel={state?.cancelLabel || 'Cancel'}
            variant={state?.variant || 'default'}
            onConfirm={() => close(true)}
            onCancel={() => close(false)}
        />
    );

    return { confirm, dialog };
}
