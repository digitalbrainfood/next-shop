"use client";
import { useState } from 'react';
import { doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useClasses } from '../../../lib/admin/useClasses';
import { useStudents } from '../../../lib/admin/useStudents';
import { logEvent } from '../../../lib/admin/logEvent';
import { useSchoolConfig } from '../../../lib/useSchoolConfig';

function ClassesSection({ kind, title, classes, students, collectionName, school }) {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const studentCount = (classId) => students.filter(s =>
        kind === 'product' ? s.class === classId : s.avatarClass === classId
    ).length;

    const addClass = async () => {
        const id = name.trim().toLowerCase();
        if (id.length < 2) return;
        const display = id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ');
        await setDoc(doc(db, collectionName, id), { name: display });
        await logEvent({
            type: 'class.created',
            message: `${kind === 'talent' ? 'Talent' : 'Product'} class "${id}" created.`,
            school,
        });
        setName(''); setAdding(false);
    };

    const renameClass = async (id) => {
        const newName = editingName.trim();
        if (newName.length < 1) return;
        await updateDoc(doc(db, collectionName, id), { name: newName });
        await logEvent({
            type: 'class.renamed',
            message: `${kind === 'talent' ? 'Talent' : 'Product'} class "${id}" renamed to "${newName}".`,
            school,
        });
        setEditingId(null);
    };

    const deleteClass = async (id) => {
        if (!window.confirm(`Delete class "${id}"? Existing students/content keep their class assignment, but this class won't appear in dropdowns.`)) return;
        await deleteDoc(doc(db, collectionName, id));
        await logEvent({
            type: 'class.deleted',
            message: `${kind === 'talent' ? 'Talent' : 'Product'} class "${id}" deleted.`,
            school,
        });
    };

    return (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    <Plus className="h-4 w-4" /> New class
                </button>
            </div>

            {adding && (
                <div className="flex gap-2 mb-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. morning-class" autoFocus
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={addClass} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer">Add</button>
                    <button onClick={() => { setAdding(false); setName(''); }} className="text-sm text-gray-500 hover:text-gray-700 px-2 cursor-pointer">Cancel</button>
                </div>
            )}

            <ul className="divide-y divide-gray-100">
                {classes.length === 0 && <li className="text-sm text-gray-500 py-4">No classes yet.</li>}
                {classes.map(c => (
                    <li key={c.id} className="flex items-center justify-between py-3">
                        {editingId === c.id ? (
                            <div className="flex gap-2 flex-1">
                                <input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus
                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm" />
                                <button onClick={() => renameClass(c.id)} className="text-sm text-blue-600 cursor-pointer">Save</button>
                                <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 cursor-pointer">Cancel</button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{c.name || c.id}</p>
                                    <p className="text-xs text-gray-400">{studentCount(c.id)} student{studentCount(c.id) !== 1 && 's'} &middot; id: <code>{c.id}</code></p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setEditingId(c.id); setEditingName(c.name || c.id); }}
                                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded cursor-pointer"><Edit2 className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => deleteClass(c.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default function ClassesPage() {
    const product = useClasses('product');
    const talent = useClasses('talent');
    const { students } = useStudents();
    const schoolConfig = useSchoolConfig();

    return (
        <div className="space-y-5 max-w-4xl">
            <ClassesSection kind="product" title="Product Classes" classes={product.classes} students={students} collectionName="classes" school={schoolConfig?.subdomain} />
            <ClassesSection kind="talent"  title="Talent Classes"  classes={talent.classes}  students={students} collectionName="avatar-classes" school={schoolConfig?.subdomain} />
        </div>
    );
}
