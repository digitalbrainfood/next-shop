import { ShoppingBag, User, Eye } from 'lucide-react';

const ACCENTS = {
    blue: {
        ring: 'border-blue-500 ring-2 ring-blue-100',
        iconBg: 'bg-blue-50',
        iconFg: 'text-blue-600',
        accessText: 'text-blue-700',
    },
    purple: {
        ring: 'border-purple-500 ring-2 ring-purple-100',
        iconBg: 'bg-purple-50',
        iconFg: 'text-purple-600',
        accessText: 'text-purple-700',
    },
    slate: {
        ring: 'border-slate-500 ring-2 ring-slate-100',
        iconBg: 'bg-slate-50',
        iconFg: 'text-slate-600',
        accessText: 'text-slate-700',
    },
};

export function StepRolePicker({ value, onChange }) {
    const Card = ({ role, icon: Icon, title, description, accessLine, accentKey }) => {
        const accent = ACCENTS[accentKey];
        const selected = value === role;
        return (
            <button
                type="button"
                onClick={() => onChange(role)}
                className={`flex-1 text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    selected ? accent.ring : 'border-gray-200 hover:border-gray-300'
                }`}
            >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${accent.iconBg}`}>
                    <Icon className={`h-6 w-6 ${accent.iconFg}`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-500 mb-3">{description}</p>
                <p className={`text-xs font-medium ${accent.accessText}`}>{accessLine}</p>
            </button>
        );
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">What kind of account?</h3>
            <p className="text-sm text-gray-500 mb-5">Each account is locked to one of these. You can&rsquo;t change it later, only convert.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card
                    role="products"
                    icon={ShoppingBag}
                    title="Product Vendor"
                    description="Creates product marketing campaigns."
                    accessLine="Access: Products"
                    accentKey="blue"
                />
                <Card
                    role="talent"
                    icon={User}
                    title="Talent Vendor"
                    description="Creates hirable avatar profiles."
                    accessLine="Access: Talent"
                    accentKey="purple"
                />
                <Card
                    role="viewer"
                    icon={Eye}
                    title="Viewer Only"
                    description="Read-only access across all classes — no editing."
                    accessLine="Access: View everything"
                    accentKey="slate"
                />
            </div>
        </div>
    );
}
