"use client";
import { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth, SUPER_ADMIN_UID } from '../firebase';

export function useAdminAuth(requirement = 'teacher') {
    const [user, setUser] = useState(null);
    const [claims, setClaims] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onIdTokenChanged(auth, async (current) => {
            if (!current) {
                setUser(null);
                setClaims(null);
                setLoading(false);
                return;
            }
            const tokenResult = await current.getIdTokenResult();
            current.customClaims = tokenResult.claims;
            setUser(current);
            setClaims(tokenResult.claims);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const isSuperAdmin = !!claims && (claims.superAdmin === true || user?.uid === SUPER_ADMIN_UID);
    const isTeacher = !!claims && (claims.class || claims.avatarClass);

    let allowed = false;
    if (requirement === 'superAdmin') allowed = isSuperAdmin;
    else if (requirement === 'teacher') allowed = isSuperAdmin || isTeacher;

    return { user, claims, loading, allowed, isSuperAdmin };
}
