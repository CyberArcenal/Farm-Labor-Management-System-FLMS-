import React from 'react';
import { MapPin, Home, Package, Hash, BarChart3, TrendingUp, Eye, Edit, User } from 'lucide-react';
import type { PitakWithDetails } from '../../../../apis/pitak';
import { formatDate, formatNumber } from '../../../../utils/formatters';

interface PitakGridViewProps {
  pitaks: PitakWithDetails[];
  selectedPitaks: number[];
  toggleSelectPitak: (id: number) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onAssign: (id: number) => void;
}

const PitakGridView: React.FC<PitakGridViewProps> = ({
  pitaks,
  selectedPitaks,
  toggleSelectPitak,
  onView,
  onEdit,
  onAssign
}) => {
  const getStatusBadge = (status: string = 'active') => {
    const statusConfig = {
      active: { bg: 'var(--status-planted-bg)', color: 'var(--status-planted)' },
      inactive: { bg: 'var(--status-fallow-bg)', color: 'var(--status-fallow)' },
      harvested: { bg: 'var(--accent-gold-light)', color: 'var(--accent-gold)' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium"
        style={{ background: config.bg, color: config.color }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pitaks.map((pitak) => (
        <div
          key={pitak.id}
          className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)'
          }}
        >
          {/* Selection checkbox */}
          <div className="absolute top-3 right-3">
            <input
              type="checkbox"
              checked={selectedPitaks.includes(pitak.id)}
              onChange={() => toggleSelectPitak(pitak.id)}
              className="rounded"
              style={{ borderColor: 'var(--border-color)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
              <MapPin className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {pitak.location || 'No location'}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {pitak.bukid?.name || `Bukid #${pitak.bukidId}`}
                </span>
              </div>
              {getStatusBadge(pitak.status)}
            </div>
          </div>

          {/* Stats */}
          {pitak.stats && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                <Package className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-sky)' }} />
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {pitak.stats.assignments.total}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assignments</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                <Hash className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-gold)' }} />
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatNumber(pitak.totalLuwang)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Capacity</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                <BarChart3 className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-purple)' }} />
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {pitak.stats.utilizationRate.toFixed(1)}%
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Utilization</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-earth)' }} />
                <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  ₱{formatNumber(pitak.stats.payments.totalNetPay)}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Net Pay</div>
              </div>
            </div>
          )}

          {/* Bukid Info */}
          <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Bukid: {pitak.bukid?.name}
              </div>
              {pitak.bukid?.kabisilya && (
                <div className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
                  Kab: {pitak.bukid.kabisilya.name}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Created {formatDate(pitak.createdAt, 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onView(pitak.id)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="View"
              >
                <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
              </button>
              <button
                onClick={() => onEdit(pitak.id)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              </button>
              <button
                onClick={() => onAssign(pitak.id)}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                title="Assign Worker"
              >
                <User className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PitakGridView;