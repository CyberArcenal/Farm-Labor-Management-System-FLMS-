// components/Bukid/components/BukidGridCard.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Home, MapPin, Package, Hash, Sprout, Eye, Edit, CheckCircle, XCircle, MoreVertical, UserPlus, Users, FileText, History, Trash2 } from 'lucide-react';
import { formatDate } from '../../../../utils/formatters';
import type { BukidData, BukidSummaryData } from '../../../../apis/bukid';

interface BukidGridCardProps {
  bukid: BukidData;
  bukidSummary: BukidSummaryData | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onUpdateStatus: (id: number, currentStatus: string) => void;
  onDelete: (id: number, name: string) => void;
}

const BukidGridCard: React.FC<BukidGridCardProps> = ({
  bukid,
  bukidSummary,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onUpdateStatus,
  onDelete
}) => {
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const getStatusBadge = (status: string = 'active') => {
    const statusConfig = {
      active: {
        text: 'Active',
        bg: 'var(--status-planted-bg)',
        color: 'var(--status-planted)',
        border: 'rgba(56, 161, 105, 0.3)',
        icon: CheckCircle
      },
      inactive: {
        text: 'Inactive',
        bg: 'var(--status-fallow-bg)',
        color: 'var(--status-fallow)',
        border: 'rgba(113, 128, 150, 0.3)',
        icon: XCircle
      },
      pending: {
        text: 'Pending',
        bg: 'var(--status-growing-bg)',
        color: 'var(--status-growing)',
        border: 'rgba(214, 158, 46, 0.3)',
        icon: XCircle
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
        style={{
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`
        }}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowActionsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleActionClick = (action: () => void) => {
    action();
    setShowActionsDropdown(false);
  };

  return (
    <div
      className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 right-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded"
          style={{ borderColor: 'var(--border-color)' }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
          <Home className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {bukid.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {bukid.location || 'No location'}
            </span>
          </div>
          {getStatusBadge(bukid.status)}
        </div>
      </div>

      {/* Stats */}
      {bukidSummary && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
            <Package className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-sky)' }} />
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {bukidSummary.assignmentCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assignments</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
            <MapPin className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-earth)' }} />
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {bukidSummary.pitakCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pitaks</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
            <Hash className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-gold)' }} />
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {bukidSummary.totalLuwang}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Luwang</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
            <Sprout className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-green)' }} />
            <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              {bukidSummary.kabisilya || 'None'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kabisilya</div>
          </div>
        </div>
      )}

      {/* Notes Preview */}
      {bukid.notes && (
        <div className="mb-4">
          <p className="text-xs text-gray-600 line-clamp-2">{bukid.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Created {formatDate(bukid.createdAt, 'MMM dd, yyyy')}
        </div>
        <div className="flex items-center gap-1 relative" ref={dropdownRef}>
          {/* Quick action buttons */}
          <button
            onClick={() => onView(bukid.id!)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
          </button>
          <button
            onClick={() => onEdit(bukid.id!)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
          </button>
          
          {/* Actions Dropdown */}
          <button
            ref={buttonRef}
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="More Actions"
          >
            <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          
          {showActionsDropdown && (
            <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => handleActionClick(() => onView(bukid.id!))}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                  View Details
                </button>
                <button
                  onClick={() => handleActionClick(() => onEdit(bukid.id!))}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  Edit
                </button>
                
                {/* Future Options - Can be enabled later */}
                <button
                  onClick={() => handleActionClick(() => {/* Assign Worker */})}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled
                >
                  <UserPlus className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                  Assign Worker
                </button>
                <button
                  onClick={() => handleActionClick(() => {/* View Workers */})}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled
                >
                  <Users className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                  View Workers
                </button>
                <button
                  onClick={() => handleActionClick(() => {/* Generate Report */})}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled
                >
                  <FileText className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                  Generate Report
                </button>
                <button
                  onClick={() => handleActionClick(() => {/* View History */})}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled
                >
                  <History className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  View History
                </button>
                
                <div className="border-t border-gray-200 my-1"></div>
                
                <button
                  onClick={() => handleActionClick(() => onUpdateStatus(bukid.id!, bukid.status || 'active'))}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {bukid.status === 'active' ? (
                    <>
                      <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleActionClick(() => onDelete(bukid.id!, bukid.name))}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BukidGridCard;