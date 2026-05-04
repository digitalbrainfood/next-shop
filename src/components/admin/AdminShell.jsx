"use client";
import { Loader2, ShieldCheck } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

export function AdminShell({
    requirement,
    auth: authState,
    sidebarItems,
    schoolName,
    schoolColor,
    logoIcon,
    title,
    action,
    children,
}) {
    const { user, claims, loading, allowed, isSuperAdmin } = authState;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="text-center">
                    <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-4">
                        {requirement === 'superAdmin'
                            ? 'You must be a super admin to view this page.'
                            : 'You must be a teacher or super admin to view this page.'}
                    </p>
                    <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">Go to main site</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar
                items={sidebarItems}
                schoolName={schoolName}
                schoolColor={schoolColor}
                logoIcon={logoIcon}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopbar user={user} claims={claims} isSuperAdmin={isSuperAdmin} title={title} action={action} />
                <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
