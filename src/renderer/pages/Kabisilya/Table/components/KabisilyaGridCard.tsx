// components/Kabisilya/components/KabisilyaGridCard.tsx
import React from 'react';
import { Network, Users, Home, Calendar, Eye, Edit, Trash2, UserPlus, Layers } from 'lucide-react';
import { formatDate } from '../../../../utils/formatters';
import type { KabisilyaListData } from '../../../../apis/kabisilya';

interface KabisilyaGridCardProps {
    kabisilya: KabisilyaListData;
    isSelected: boolean;
    onSelect: () => void;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAssignWorkers: () => void;
    onAssignBukids: () => void;
}

const KabisilyaGridCard: React.FC<KabisilyaGridCardProps> = ({
    kabisilya,
    isSelected,
    onSelect,
    onView,
    onEdit,
    onDelete,
    onAssignWorkers,
    onAssignBukids
}) => {
    return (
        <div
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
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded"
                    style={{ borderColor: 'var(--border-color)' }}
                />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-purple-light)' }}>
                    <Network className="w-6 h-6" style={{ color: 'var(--accent-purple)' }} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {kabisilya.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Created {formatDate(kabisilya.createdAt, 'MMM dd, yyyy')}
                        </span>
                    </div>
                    {/* Status badge can be added here */}
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {kabisilya.workerCount} workers assigned
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {kabisilya.bukidCount} bukids assigned
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Updated {formatDate(kabisilya.updatedAt, 'MMM dd, yyyy')}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={onAssignWorkers}
                    className="px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
                    style={{
                        background: 'var(--accent-sky-light)',
                        color: 'var(--accent-sky)',
                        border: '1px solid rgba(49, 130, 206, 0.3)'
                    }}
                >
                    <UserPlus className="w-3 h-3" />
                    Workers
                </button>
                <button
                    onClick={onAssignBukids}
                    className="px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
                    style={{
                        background: 'var(--accent-earth-light)',
                        color: 'var(--accent-earth)',
                        border: '1px solid rgba(139, 87, 42, 0.3)'
                    }}
                >
                    <Layers className="w-3 h-3" />
                    Bukids
                </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    ID: {kabisilya.id}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onView}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="View"
                    >
                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KabisilyaGridCard;