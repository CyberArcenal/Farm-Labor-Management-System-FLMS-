// components/Session/components/SessionGridView.tsx
import React from 'react';
import { Calendar, MapPin, Users, Home, CheckSquare } from 'lucide-react';
import type { SessionListData } from '../../../apis/session';
import { formatDate } from '../../../utils/formatters';

interface SessionGridViewProps {
    sessions: SessionListData[];
    selectedSessions: number[];
    toggleSelectSession: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onClose?: (id: number) => void;
    onArchive?: (id: number) => void;
    onDuplicate?: (id: number) => void;
    onActivate?: (id: number) => void;
}

const SessionGridView: React.FC<SessionGridViewProps> = ({
    sessions,
    selectedSessions,
    toggleSelectSession,
    onView,
    onEdit,
    onDelete,
    onClose,
    onArchive,
    onDuplicate,
    onActivate
}) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-blue-100 text-blue-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
                <div
                    key={session.id}
                    className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow ${selectedSessions.includes(session.id) ? 'ring-2 ring-blue-500' : ''}`}
                >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{session.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">Year: {session.year}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(session.status)}`}>
                                        {session.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleSelectSession(session.id)}
                            className={`p-1 rounded ${selectedSessions.includes(session.id) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <CheckSquare className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Session Details */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                                {formatDate(session.startDate, 'MMM dd, yyyy')}
                                {session.endDate && ` - ${formatDate(session.endDate, 'MMM dd, yyyy')}`}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Home className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{session.seasonType || 'No season type'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-lg font-bold text-gray-900">{session.bukidCount}</div>
                                <div className="text-xs text-gray-500">Bukids</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-lg font-bold text-gray-900">{session.assignmentCount}</div>
                                <div className="text-xs text-gray-500">Assignments</div>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            Created: {formatDate(session.createdAt, 'MMM dd, yyyy')}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onView(session.id)}
                                className="p-1.5 rounded hover:bg-gray-100"
                                title="View Details"
                            >
                                <Calendar className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                                onClick={() => onEdit(session.id)}
                                className="p-1.5 rounded hover:bg-gray-100"
                                title="Edit"
                            >
                                <span className="text-gray-600">✏️</span>
                            </button>
                            <button
                                onClick={() => onDelete(session.id)}
                                className="p-1.5 rounded hover:bg-red-50"
                                title="Delete"
                            >
                                <span className="text-red-600">🗑️</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SessionGridView;