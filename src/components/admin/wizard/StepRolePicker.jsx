import { ShoppingBag, User } from 'lucide-react';

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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">What kind of student?</h3>
            <p className="text-sm text-gray-500 mb-5">Each student account is locked to one of these. You can&rsquo;t change it later, only convert.</p>
            <div className="flex gap-4">
                <Card
                    role="products"
                    icon={ShoppingBag}
                    title="Product Vendor"
                    description="Student creates product marketing campaigns."
                    accessLine="Access: Products"
                    accentKey="blue"
                />
                <Card
                    role="talent"
                    icon={User}
                    title="Talent Vendor"
                    description="Student creates hirable avatar profiles."
                    accessLine="Access: Talent"
                    accentKey="purple"
                />
            </div>
        </div>
    );
}
