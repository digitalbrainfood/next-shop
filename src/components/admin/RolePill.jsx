import { ShoppingBag, User } from 'lucide-react';

export function RolePill({ role, size = 'sm' }) {
    const isProducts = role === 'products' || role === 'class';
    const isTalent = role === 'talent' || role === 'avatarClass';
    const isDual = role === 'dual';

    const cls = size === 'xs'
        ? 'px-1.5 py-0.5 text-[10px]'
        : 'px-2 py-0.5 text-xs';

    if (isDual) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-200 ${cls}`}>
                Both (needs cleanup)
            </span>
        );
    }
    if (isProducts) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-100 ${cls}`}>
                <ShoppingBag className="h-3 w-3" /> Products
            </span>
        );
    }
    if (isTalent) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-100 ${cls}`}>
                <User className="h-3 w-3" /> Talent
            </span>
        );
    }
    return <span className={`inline-flex rounded-md bg-gray-100 text-gray-500 ${cls}`}>—</span>;
}
