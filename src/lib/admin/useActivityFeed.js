"use client";
import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Subscribes to the last N events for a given school scope.
 * @param {string|null} school — subdomain to scope by, or null to skip
 * @param {number} max — how many events to return
 */
export function useActivityFeed(school, max = 10) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!school) {
            setEvents([]);
            setLoading(false);
            return;
        }
        const q = query(
            collection(db, 'events'),
            where('school', '==', school),
            orderBy('createdAt', 'desc'),
            limit(max),
        );
        const unsub = onSnapshot(q, (snap) => {
            setEvents(snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || null,
                };
            }));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [school, max]);

    return { events, loading };
}
