import React from 'react';
import { MapPin, CheckCircle, Hash, BarChart3 } from 'lucide-react';
import type { PitakStatsData } from '../../../../apis/pitak';
import { formatNumber } from '../../../../utils/formatters';

interface PitakStatsProps {
  stats: PitakStatsData | null;
}

const PitakStats: React.FC<PitakStatsProps> = ({ stats }) => {
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
            <MapPin className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
          {stats?.totalPitaks || 0}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Pitak</p>
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
              background: 'var(--accent-green-light)',
              color: 'var(--accent-green)'
            }}
          >
            Active
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {stats?.activePitaks || 0}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Pitak</p>
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
              background: 'var(--accent-purple-light)',
              color: 'var(--accent-purple)'
            }}
          >
            Capacity
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {formatNumber(stats?.totalLuWangCapacity || 0)}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Luwang Capacity</p>
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
              background: 'var(--accent-sky-light)',
              color: 'var(--accent-sky)'
            }}
          >
            Utilization
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {stats?.utilizationRate ? `${stats.utilizationRate.toFixed(1)}%` : '0%'}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Average Utilization Rate</p>
      </div>
    </div>
  );
};

export default PitakStats;