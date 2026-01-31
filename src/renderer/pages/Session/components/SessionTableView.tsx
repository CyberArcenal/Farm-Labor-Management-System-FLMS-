// components/Session/components/SessionTableView.tsx
import React, { useState } from 'react';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import SessionTableRow from './SessionTableRow';
import type { SessionListData } from '../../../apis/session';

interface SessionTableViewProps {
    sessions: SessionListData[];
    selectedSessions: number[];
    toggleSelectAll: () => void;
    toggleSelectSession: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onClose?: (id: number) => void;
    onArchive?: (id: number) => void;
    onDuplicate?: (id: number) => void;
    onActivate?: (id: number) => void;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSort: (field: string) => void;
}

const SessionTableView: React.FC<SessionTableViewProps> = ({
    sessions,
    selectedSessions,
    toggleSelectAll,
    toggleSelectSession,
    onView,
    onEdit,
    onDelete,
    onClose,
    onArchive,
    onDuplicate,
    onActivate,
    sortBy,
    sortOrder,
    onSort
}) => {
    const [expandedSession, setExpandedSession] = useState<number | null>(null);

    const toggleExpandSession = (id: number) => {
        setExpandedSession(prev => prev === id ? null : id);
    };

    return (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: 'var(--table-header-bg)' }}>
                            <th className="p-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedSessions.length === sessions.length && sessions.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('name')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Name
                                    {sortBy === 'name' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('year')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Year
                                    {sortBy === 'year' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('seasonType')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Season Type
                                    {sortBy === 'seasonType' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('startDate')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Start Date
                                    {sortBy === 'startDate' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('endDate')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    End Date
                                    {sortBy === 'endDate' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Status
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session) => (
                            <SessionTableRow
                                key={session.id}
                                session={session}
                                isSelected={selectedSessions.includes(session.id)}
                                isExpanded={expandedSession === session.id}
                                onSelect={() => toggleSelectSession(session.id)}
                                onToggleExpand={() => toggleExpandSession(session.id)}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onClose={onClose}
                                onArchive={onArchive}
                                onDuplicate={onDuplicate}
                                onActivate={onActivate}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SessionTableView;