"use client";
import { AdminShell } from '../../components/admin/AdminShell';
import { useAdminAuth } from '../../lib/auth/useAdminAuth';

const ADMIN_ITEMS = [
    { href: '/admin',     label: 'Customers',     icon: 'Users' },
    { href: '/dashboard', label: 'Manage school', icon: 'GraduationCap' },
    { href: '/register',  label: 'Registration',  icon: 'BookOpen' },
    { href: '/',          label: 'Storefront',    icon: 'ExternalLink', external: true },
];

export default function AdminLayout({ children }) {
    const auth = useAdminAuth('superAdmin');
    return (
        <AdminShell
            requirement="superAdmin"
            auth={auth}
            sidebarItems={ADMIN_ITEMS}
            schoolName="ShopNext Admin"
            schoolColor="#7c3aed"
            logoIcon="ShieldCheck"
            title="Platform"
        >
            {children}
        </AdminShell>
    );
}
