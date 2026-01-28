// components/Assignment/components/AssignmentStats.tsx
import React from 'react';
import { FileText, CheckCircle, Hash, BarChart3 } from 'lucide-react';
import type { AssignmentStats as AssignmentStats1 } from '../../../../apis/assignment';

interface AssignmentStatsProps {
    stats: AssignmentStats1 | null;
}

const AssignmentStats: React.FC<AssignmentStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                        <FileText className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: 'var(--accent-green-light)',
                            color: 'var(--accent-green)'
                        }}
                    >
                        Total
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {stats?.totalAssignments || 0}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Assignments</p>
            </div>

            <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                        <CheckCircle className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: 'var(--accent-sky-light)',
                            color: 'var(--accent-sky)'
                        }}
                    >
                        Active
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {stats?.byStatus?.active?.count || 0}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Assignments</p>
            </div>

            <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                        <Hash className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: 'var(--accent-gold-light)',
                            color: 'var(--accent-gold)'
                        }}
                    >
                        LuWang
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {stats?.totalLuWang || '0'}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total LuWang Assigned</p>
            </div>

            <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
                        <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                            background: 'var(--accent-purple-light)',
                            color: 'var(--accent-purple)'
                        }}
                    >
                        Average
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {stats?.averages?.luwangPerAssignment || '0'}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>LuWang per Assignment</p>
            </div>
        </div>
    );
};

export default AssignmentStats;