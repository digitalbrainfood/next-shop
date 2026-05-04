import { AlertTriangle, ChevronRight } from 'lucide-react';

export function NeedsAttention({ items }) {
    const visible = (items || []).filter(Boolean);
    if (visible.length === 0) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="font-semibold text-amber-900 text-sm">Needs attention</h3>
            </div>
            <ul className="space-y-2">
                {visible.map((item, i) => (
                    <li key={i}>
                        <button
                            onClick={item.onResolve}
                            className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg bg-white border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer"
                        >
                            <span className="text-sm text-amber-900">{item.message}</span>
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-700">
                                {item.cta || 'Resolve'} <ChevronRight className="h-3 w-3" />
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
