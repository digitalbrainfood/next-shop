"use client";
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export function useDualAccessStudents(scope = null) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        const fn = httpsCallable(functions, 'listDualAccessStudents');
        fn(scope ? { scope } : {})
            .then((res) => {
                if (!alive) return;
                setUsers(res.data?.users || []);
                setLoading(false);
            })
            .catch((e) => {
                if (!alive) return;
                setError(e);
                setLoading(false);
            });
        return () => { alive = false; };
    }, [scope, tick]);

    return { users, loading, error, refresh: () => setTick((t) => t + 1) };
}
