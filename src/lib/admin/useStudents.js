"use client";
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export function useStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        const fn = httpsCallable(functions, 'listAllUsers');
        fn()
            .then((result) => {
                if (!alive) return;
                const list = (result.data?.users || [])
                    .filter(u => u.customClaims && (u.customClaims.class || u.customClaims.avatarClass || u.customClaims.viewer))
                    .map(u => ({
                        uid: u.uid,
                        email: u.email,
                        displayName: u.displayName,
                        class: u.customClaims?.class || null,
                        avatarClass: u.customClaims?.avatarClass || null,
                        viewer: u.customClaims?.viewer === true,
                    }));
                setStudents(list);
                setLoading(false);
            })
            .catch((e) => {
                if (!alive) return;
                setError(e);
                setLoading(false);
            });
        return () => { alive = false; };
    }, [tick]);

    return { students, loading, error, refresh: () => setTick((t) => t + 1) };
}
