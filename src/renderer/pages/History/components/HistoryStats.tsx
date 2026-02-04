import React from 'react';
import { FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { type HistoryStats as HistoryStatsType } from '../types/history.types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface HistoryStatsProps {
  stats: HistoryStatsType | null;
}

const HistoryStats: React.FC<HistoryStatsProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Average Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageAmount)}</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Most Recent</p>
            <p className="text-lg font-medium text-gray-900">
              {stats.mostRecent === 'No records' ? stats.mostRecent : formatDate(stats.mostRecent, 'MMM dd')}
            </p>
          </div>
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryStats;