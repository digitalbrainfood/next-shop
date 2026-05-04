"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BookOpen, ShoppingBag, Settings, ExternalLink, GraduationCap, ShieldCheck } from 'lucide-react';

const ICONS = { Home, Users, BookOpen, ShoppingBag, Settings, ExternalLink, GraduationCap, ShieldCheck };

export function AdminSidebar({ items, schoolName, schoolColor = '#2563eb', logoIcon = 'GraduationCap' }) {
    const pathname = usePathname();
    const Logo = ICONS[logoIcon] || GraduationCap;

    return (
        <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: schoolColor }}>
                    <Logo className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{schoolName}</p>
                    <p className="text-xs text-gray-400">Admin</p>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const Icon = ICONS[item.icon] || Home;
                    const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    if (item.external) {
                        return (
                            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                <Icon className="h-4 w-4" /> {item.label}
                            </a>
                        );
                    }
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}>
                            <Icon className="h-4 w-4" /> {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
