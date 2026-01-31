// components/Session/components/SessionStats.tsx
import React from 'react';
import { Calendar, CheckCircle, XCircle, Archive, TrendingUp } from 'lucide-react';
import type { SessionStatsData } from '../../../apis/session';

interface SessionStatsProps {
    stats: SessionStatsData | null;
}

const SessionStats: React.FC<SessionStatsProps> = ({ stats }) => {
    const statCards = [
        {
            title: 'Total Sessions',
            value: stats?.totalSessions || 0,
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Active',
            value: stats?.activeSessions || 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            title: 'Closed',
            value: stats?.closedSessions || 0,
            icon: XCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            title: 'Archived',
            value: stats?.archivedSessions || 0,
            icon: Archive,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100'
        },
        {
            title: 'Total Bukids',
            value: stats?.totalBukids || 0,
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                                {card.value.toLocaleString()}
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${card.bgColor}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SessionStats;