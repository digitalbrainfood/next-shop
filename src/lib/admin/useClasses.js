"use client";
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useClasses(kind) {
    const collectionName = kind === 'talent' ? 'avatar-classes' : 'classes';
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, collectionName), (snap) => {
            setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [collectionName]);

    return { classes, loading, kind, collectionName };
}
