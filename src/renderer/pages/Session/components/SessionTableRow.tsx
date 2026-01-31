// components/Session/components/SessionTableRow.tsx
import React, { useState } from 'react';
import { Calendar, ChevronRight, MapPin, Users, Home, TrendingUp } from 'lucide-react';
import SessionActionsDropdown from './SessionActionsDropdown';
import type { SessionListData } from '../../../apis/session';
import { formatDate } from '../../../utils/formatters';

interface SessionTableRowProps {
    session: SessionListData;
    isSelected: boolean;
    isExpanded: boolean;
    onSelect: () => void;
    onToggleExpand: () => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onClose?: (id: number) => void;
    onArchive?: (id: number) => void;
    onDuplicate?: (id: number) => void;
    onActivate?: (id: number) => void;
}

const SessionTableRow: React.FC<SessionTableRowProps> = ({
    session,
    isSelected,
    isExpanded,
    onSelect,
    onToggleExpand,
    onView,
    onEdit,
    onDelete,
    onClose,
    onArchive,
    onDuplicate,
    onActivate
}) => {
    const ExpandedView = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Session Details
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Season Type:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {session.seasonType || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(session.createdAt, 'MMM dd, yyyy HH:mm')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(session.updatedAt, 'MMM dd, yyyy HH:mm')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Bukids & Assignments
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Bukids:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {session.bukidCount}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Assignments:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {session.assignmentCount}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Time Period
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Start Date:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatDate(session.startDate, 'MMM dd, yyyy')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>End Date:</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {session.endDate ? formatDate(session.endDate, 'MMM dd, yyyy') : 'Ongoing'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; bgColor: string }> = {
            active: { color: 'text-green-700', bgColor: 'bg-green-100' },
            closed: { color: 'text-blue-700', bgColor: 'bg-blue-100' },
            archived: { color: 'text-gray-700', bgColor: 'bg-gray-100' }
        };

        const config = statusConfig[status] || { color: 'text-gray-700', bgColor: 'bg-gray-100' };
        
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

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
                        <Calendar className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                        <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {session.name}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                ID: {session.id} • Year: {session.year}
                            </div>
                        </div>
                    </div>
                </td>
                <td className="p-4">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {session.year}
                    </span>
                </td>
                <td className="p-4">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {session.seasonType || 'N/A'}
                    </span>
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(session.startDate, 'MMM dd, yyyy')}
                        </span>
                    </div>
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {session.endDate ? formatDate(session.endDate, 'MMM dd, yyyy') : 'Ongoing'}
                        </span>
                    </div>
                </td>
                <td className="p-4">
                    {getStatusBadge(session.status)}
                </td>
                <td className="p-4">
                    <div className="flex items-center gap-2">
                        <SessionActionsDropdown
                            session={session}
                            onView={() => onView(session.id)}
                            onEdit={() => onEdit(session.id)}
                            onDelete={() => onDelete(session.id)}
                            onClose={onClose ? () => onClose(session.id) : undefined}
                            onArchive={onArchive ? () => onArchive(session.id) : undefined}
                            onDuplicate={onDuplicate ? () => onDuplicate(session.id) : undefined}
                            onActivate={onActivate ? () => onActivate(session.id) : undefined}
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
                    <td colSpan={8} className="p-4 bg-gray-50">
                        <ExpandedView />
                    </td>
                </tr>
            )}
        </>
    );
};

export default SessionTableRow;