"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { onIdTokenChanged } from 'firebase/auth';
import { Loader2, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../../../../../lib/firebase';
import { CreateItemForm } from '../../../../../../components/CreateItemForm';

export default function EditContentPage() {
    const params = useParams();
    const router = useRouter();
    const type = params?.type === 'talent' ? 'talent' : 'product';
    const id = params?.id;
    const collectionName = type === 'talent' ? 'avatars' : 'products';

    const [item, setItem] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsub = onIdTokenChanged(auth, async (current) => {
            if (current) {
                const tokenResult = await current.getIdTokenResult();
                current.customClaims = tokenResult.claims;
                setUser(current);
            } else {
                setUser(null);
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        let alive = true;
        if (!id) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, collectionName, id));
                if (!alive) return;
                if (!snap.exists()) {
                    setError('Item not found.');
                } else {
                    setItem({ id: snap.id, ...snap.data() });
                }
            } catch (e) {
                if (alive) setError(e.message || 'Failed to load.');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [collectionName, id]);

    const goBack = () => router.push('/dashboard/content');

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="max-w-2xl mx-auto py-10 text-center">
                <p className="text-gray-600 mb-3">{error || 'Item not found.'}</p>
                <button onClick={goBack} className="text-blue-600 hover:text-blue-700 text-sm">
                    Back to content
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4 cursor-pointer">
                <ArrowLeft className="h-4 w-4" /> Back to content
            </button>
            <CreateItemForm
                setVendorView={goBack}
                user={user}
                editingItem={item}
                mode={type}
            />
        </div>
    );
}
