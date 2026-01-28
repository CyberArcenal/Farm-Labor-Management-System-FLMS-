// components/Kabisilya/components/KabisilyaTableRow.tsx
import React, { useState } from 'react';
import { Network, Users, Home, Calendar, ChevronRight } from 'lucide-react';
import KabisilyaActionsDropdown from './KabisilyaActionsDropdown';
import { formatDate } from '../../../../utils/formatters';
import type { KabisilyaListData } from '../../../../apis/kabisilya';

interface KabisilyaTableRowProps {
    kabisilya: KabisilyaListData;
    isSelected: boolean;
    isExpanded: boolean;
    onSelect: () => void;
    onToggleExpand: () => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onAssignWorkers: (id: number) => void;
    onAssignBukids: (id: number) => void;
}

const KabisilyaTableRow: React.FC<KabisilyaTableRowProps> = ({
    kabisilya,
    isSelected,
    isExpanded,
    onSelect,
    onToggleExpand,
    onView,
    onEdit,
    onDelete,
    onAssignWorkers,
    onAssignBukids
}) => {
    const ExpandedView = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Network className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Kabisilya Details
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(kabisilya.createdAt, 'MMM dd, yyyy HH:mm')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(kabisilya.updatedAt, 'MMM dd, yyyy HH:mm')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Worker Assignment
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Workers:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kabisilya.workerCount}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Bukid Assignment
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Bukids:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kabisilya.bukidCount}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <tr className="hover:bg-gray-50 transition-colors"
                style={{ borderBottom: '1px solid var(--border-color)' }}
            >
                <td className="p-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        className="rounded border-gray-300"
                    />
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Network className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                        <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {kabisilya.name}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                ID: {kabisilya.id}
                            </div>
                        </div>
                    </div>
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kabisilya.workerCount}
                        </span>
                    </div>
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {kabisilya.bukidCount}
                        </span>
                    </div>
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(kabisilya.createdAt, 'MMM dd, yyyy')}
                        </span>
                    </div>
                </td>
                <td className="p-4">
                    {/* Status badge can be added here */}
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <KabisilyaActionsDropdown
                            kabisilya={kabisilya}
                            onView={() => onView(kabisilya.id)}
                            onEdit={() => onEdit(kabisilya.id)}
                            onDelete={() => onDelete(kabisilya.id)}
                            onAssignWorkers={() => onAssignWorkers(kabisilya.id)}
                            onAssignBukids={() => onAssignBukids(kabisilya.id)}
                        />
                        <button
                            onClick={onToggleExpand}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="More Details"
                        >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded Row */}
            {isExpanded && (
                <tr>
                    <td colSpan={7} className="p-4 bg-gray-50">
                        <ExpandedView />
                    </td>
                </tr>
            )}
        </>
    );
};

export default KabisilyaTableRow;