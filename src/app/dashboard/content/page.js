"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where, writeBatch } from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { Edit, GripVertical, Trash2 } from 'lucide-react';
import { db, storage } from '../../../lib/firebase';
import { useClasses } from '../../../lib/admin/useClasses';
import { useSchoolConfig } from '../../../lib/useSchoolConfig';
import { useConfirmDialog } from '../../../lib/admin/useConfirmDialog';

export default function ContentPage() {
    const { schoolConfig } = useSchoolConfig();
    const platformsArray = schoolConfig?.platforms || ['products', 'avatars'];
    const showTalent = platformsArray.includes('avatars');
    const [tab, setTab] = useState('products');

    const product = useClasses('product');
    const talent = useClasses('talent');
    const classes = tab === 'talent' ? talent.classes : product.classes;
    const collectionName = tab === 'talent' ? 'avatars' : 'products';

    const [selectedClass, setSelectedClass] = useState('');
    const [items, setItems] = useState([]);
    const [dragged, setDragged] = useState(null);
    const { confirm, dialog: confirmDialog } = useConfirmDialog();

    useEffect(() => {
        if (classes.length && !selectedClass) setSelectedClass(classes[0].id);
    }, [classes, selectedClass]);

    useEffect(() => {
        if (!selectedClass) { setItems([]); return; }
        const q = query(collection(db, collectionName), where('class', '==', selectedClass), orderBy('featuredOrder', 'asc'));
        const unsub = onSnapshot(q, (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [collectionName, selectedClass]);

    const onDragStart = (i) => setDragged(items[i]);
    const onDragOver = (e, i) => {
        e.preventDefault();
        const over = items[i];
        if (!dragged || dragged === over) return;
        const next = items.filter(x => x !== dragged);
        next.splice(i, 0, dragged);
        setItems(next);
    };
    const onDragEnd = async () => {
        setDragged(null);
        const batch = writeBatch(db);
        items.forEach((item, i) => batch.update(doc(db, collectionName, item.id), { featuredOrder: i }));
        await batch.commit();
    };
    const onDelete = async (item) => {
        const ok = await confirm({
            title: `Delete “${item.name}”?`,
            message: `This will remove the ${tab === 'talent' ? 'talent' : 'product'} permanently, including all uploaded images and videos.`,
            confirmLabel: 'Delete permanently',
            cancelLabel: 'Cancel',
            variant: 'destructive',
        });
        if (!ok) return;
        await deleteDoc(doc(db, collectionName, item.id));
        (item.imageUrls || []).forEach(u => deleteObject(storageRef(storage, u)).catch(() => {}));
        (item.videoUrls || []).forEach(u => deleteObject(storageRef(storage, u)).catch(() => {}));
    };

    return (
        <div className="space-y-4 max-w-5xl">
            <div className="flex gap-1 border-b border-gray-200">
                <button onClick={() => setTab('products')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${tab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Products
                </button>
                {showTalent && (
                    <button onClick={() => setTab('talent')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${tab === 'talent' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Talent
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Class:</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {classes.length === 0 && <option value="">No classes yet</option>}
                    {classes.map(c => (<option key={c.id} value={c.id}>{c.name || c.id}</option>))}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No content in this class yet.</div>
                ) : items.map((it, i) => (
                    <div key={it.id} draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDragEnd={onDragEnd}
                        className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 cursor-move">
                        <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            <img src={it.imageUrl || it.imageUrls?.[0]} alt={it.name}
                                className="h-10 w-10 rounded object-cover" />
                            <div>
                                <p className="font-medium text-gray-900 text-sm">{it.name}</p>
                                <p className="text-xs text-gray-500">{it.vendor}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/dashboard/content/edit/${tab === 'talent' ? 'talent' : 'product'}/${it.id}`}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="Edit"
                            >
                                <Edit className="h-4 w-4" />
                            </Link>
                            <button onClick={() => onDelete(it)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {confirmDialog}
        </div>
    );
}
