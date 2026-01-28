// components/Bukid/components/BukidStats.tsx
import React from 'react';
import { Home, CheckCircle, MapPin, Package } from 'lucide-react';
import type { BukidStatsData, BukidSummaryData } from '../../../../apis/bukid';

interface BukidStatsProps {
  stats: BukidStatsData | null;
  summary: BukidSummaryData[];
}

const BukidStats: React.FC<BukidStatsProps> = ({ stats, summary }) => {
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
            <Home className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
          {stats?.total || 0}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Bukid</p>
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
          {stats?.active || 0}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Bukid</p>
      </div>

      <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
            <MapPin className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'var(--accent-purple-light)',
              color: 'var(--accent-purple)'
            }}
          >
            Locations
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {summary.filter(b => b.location).length || 0}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>With Location</p>
      </div>

      <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
            <Package className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'var(--accent-sky-light)',
              color: 'var(--accent-sky)'
            }}
          >
            Assignments
          </span>
        </div>
        <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {summary.reduce((acc, curr) => acc + curr.assignmentCount, 0) || 0}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Assignments</p>
      </div>
    </div>
  );
};

export default BukidStats;