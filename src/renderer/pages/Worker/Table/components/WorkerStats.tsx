// components/Worker/components/WorkerStats.tsx
import React from 'react';
import { Users, UserPlus, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';

interface WorkerStatsProps {
    stats: any;
}

const WorkerStats: React.FC<WorkerStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-green-50">
                        <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                        Total
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1 text-gray-800">
                    {stats?.totals?.all || 0}
                </h3>
                <p className="text-sm text-gray-600">Total Workers</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-blue-50">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        Active
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1 text-gray-800">
                    {stats?.totals?.active || 0}
                </h3>
                <p className="text-sm text-gray-600">Active Workers</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-yellow-50">
                        <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                        Debt
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1 text-gray-800">
                    {formatCurrency(stats?.financial?.totalDebt || 0)}
                </h3>
                <p className="text-sm text-gray-600">Total Worker Debt</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-purple-50">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
                        Average
                    </span>
                </div>
                <h3 className="text-3xl font-bold mb-1 text-gray-800">
                    {formatCurrency(stats?.financial?.averageBalance || 0)}
                </h3>
                <p className="text-sm text-gray-600">Average Balance</p>
            </div>
        </div>
    );
};

export default WorkerStats;