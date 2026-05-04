"use client";
import { useState } from 'react';
import { Users, BookOpen, ShoppingBag, User } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { NeedsAttention } from '../../components/admin/NeedsAttention';
import { RecentStudentsTable } from '../../components/admin/RecentStudentsTable';
import { ClassBreakdown } from '../../components/admin/ClassBreakdown';
import { DualAccessDrawer } from '../../components/admin/cleanup/DualAccessDrawer';
import { ActivityFeed } from '../../components/admin/ActivityFeed';
import { useStudents } from '../../lib/admin/useStudents';
import { useClasses } from '../../lib/admin/useClasses';
import { useDualAccessStudents } from '../../lib/admin/useDualAccessStudents';
import { useSchoolConfig } from '../../lib/useSchoolConfig';

export default function DashboardOverview() {
    const { students } = useStudents();
    const productClasses = useClasses('product');
    const talentClasses = useClasses('talent');
    const dual = useDualAccessStudents();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { schoolConfig } = useSchoolConfig();

    const productCount = students.filter(s => s.class && !s.avatarClass).length;
    const talentCount = students.filter(s => s.avatarClass && !s.class).length;
    const totalStudents = students.length;
    const classCount = productClasses.classes.length + talentClasses.classes.length;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const studentsThisWeek = students.filter(s => {
        if (!s.creationTime) return false;
        return new Date(s.creationTime).getTime() >= oneWeekAgo;
    }).length;

    const attention = [];
    if (dual.users.length > 0) {
        attention.push({
            message: `${dual.users.length} student${dual.users.length !== 1 ? 's' : ''} have access to both Products and Talent.`,
            cta: 'Resolve',
            onResolve: () => setDrawerOpen(true),
        });
    }

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Students" value={totalStudents} subtext={studentsThisWeek > 0 ? `+${studentsThisWeek} this week` : undefined} color="bg-blue-100 text-blue-600" />
                <StatCard icon={BookOpen} label="Classes" value={classCount} color="bg-amber-100 text-amber-600" />
                <StatCard icon={ShoppingBag} label="Product students" value={productCount} color="bg-blue-100 text-blue-600" />
                <StatCard icon={User} label="Talent students" value={talentCount} color="bg-purple-100 text-purple-600" />
            </div>

            <NeedsAttention items={attention} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RecentStudentsTable students={students} />
                </div>
                <div>
                    <ClassBreakdown
                        students={students}
                        productClasses={productClasses.classes}
                        talentClasses={talentClasses.classes}
                    />
                </div>
            </div>

            <ActivityFeed school={schoolConfig?.subdomain} />

            <DualAccessDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onResolved={() => dual.refresh()}
            />
        </div>
    );
}
