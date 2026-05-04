"use client";
import { useState, useMemo } from 'react';
import { AdminShell } from '../../components/admin/AdminShell';
import { useAdminAuth } from '../../lib/auth/useAdminAuth';
import { useSchoolConfig } from '../../lib/useSchoolConfig';
import { AddStudentWizard } from '../../components/admin/wizard/AddStudentWizard';
import { Plus } from 'lucide-react';

const DASHBOARD_ITEMS = [
    { href: '/dashboard',          label: 'Overview',  icon: 'Home' },
    { href: '/dashboard/students', label: 'Students',  icon: 'Users' },
    { href: '/dashboard/classes',  label: 'Classes',   icon: 'BookOpen' },
    { href: '/dashboard/content',  label: 'Content',   icon: 'ShoppingBag' },
    { href: '/settings',           label: 'Settings',  icon: 'Settings' },
    { href: '/',                   label: 'View storefront', icon: 'ExternalLink', external: true },
];

export default function DashboardLayout({ children }) {
    const auth = useAdminAuth('superAdmin');
    const { schoolConfig } = useSchoolConfig();
    const [wizardOpen, setWizardOpen] = useState(false);

    const action = useMemo(() => (
        <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 cursor-pointer"
        >
            <Plus className="h-4 w-4" /> Add Student
        </button>
    ), []);

    return (
        <>
            <AdminShell
                requirement="superAdmin"
                auth={auth}
                sidebarItems={DASHBOARD_ITEMS}
                schoolName={schoolConfig?.displayName || 'My School'}
                schoolColor={schoolConfig?.primaryColor || '#2563eb'}
                logoIcon="GraduationCap"
                title="Dashboard"
                action={action}
            >
                {children}
            </AdminShell>
            <AddStudentWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                schoolName={schoolConfig?.displayName || 'My School'}
                schoolSubdomain={schoolConfig?.subdomain}
            />
        </>
    );
}
