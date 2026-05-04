"use client";
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Append an event to the events/ collection.
 * Best-effort — returns silently on failure (we never want a failed event
 * write to break the user-facing operation it's logging).
 *
 * @param {Object} args
 * @param {string} args.type — short event-type identifier (e.g. 'student.created')
 * @param {string} args.message — human-readable summary
 * @param {string} [args.school] — school scope (subdomain). Required for read-rules.
 * @param {Object} [args.target] — optional reference (e.g. { uid: '...' })
 */
export async function logEvent({ type, message, school, target }) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await addDoc(collection(db, 'events'), {
            type,
            message,
            school: school || null,
            actor: user.uid,
            actorName: user.displayName || user.email,
            target: target || null,
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('logEvent failed:', err);
    }
}
