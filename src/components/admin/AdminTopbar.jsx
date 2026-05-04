"use client";
import { LogOut, ShieldCheck, UserCircle } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export function AdminTopbar({ user, claims, isSuperAdmin, title, action }) {
    const handleSignOut = () => signOut(auth);
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                        <ShieldCheck className="h-3 w-3" /> Super Admin
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                {action}
                <span className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <UserCircle className="h-5 w-5" />
                    {user?.displayName || user?.email || 'You'}
                </span>
                <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
}
