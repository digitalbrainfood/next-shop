export function ClassBreakdown({ students, productClasses, talentClasses }) {
    const counts = new Map();
    const ensure = (key) => {
        if (!counts.has(key)) counts.set(key, { product: 0, talent: 0 });
        return counts.get(key);
    };

    productClasses?.forEach(c => ensure(c.id));
    talentClasses?.forEach(c => ensure(c.id));
    students?.forEach(s => {
        if (s.class) ensure(s.class).product += 1;
        if (s.avatarClass) ensure(s.avatarClass).talent += 1;
    });

    const rows = Array.from(counts.entries())
        .map(([name, c]) => ({ name, ...c, total: c.product + c.talent }))
        .filter(r => r.total > 0)
        .sort((a, b) => b.total - a.total);

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Classes</h3>
                <p className="text-sm text-gray-500">No classes yet.</p>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Classes</h3>
            <ul className="space-y-3">
                {rows.map(r => (
                    <li key={r.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{r.name}</span>
                            <span className="text-xs text-gray-400">{r.total} student{r.total !== 1 && 's'}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                            {r.product > 0 && (
                                <div className="bg-blue-500" style={{ width: `${(r.product / r.total) * 100}%` }} title={`${r.product} product`} />
                            )}
                            {r.talent > 0 && (
                                <div className="bg-purple-500" style={{ width: `${(r.talent / r.total) * 100}%` }} title={`${r.talent} talent`} />
                            )}
                        </div>
                    </li>
                ))}
            </ul>
            <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Products</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-purple-500 rounded-full" /> Talent</span>
            </div>
        </div>
    );
}
