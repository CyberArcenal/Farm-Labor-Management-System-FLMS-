// components/Session/Dialogs/SessionViewDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, Edit, Calendar, MapPin, Users, Home,
    TrendingUp, DollarSign, FileText, Clock, Info
} from 'lucide-react';
import sessionAPI from '../../../apis/session';
import { showError } from '../../../utils/notification';
import { formatDate } from '../../../utils/formatters';

interface SessionViewDialogProps {
    id: number;
    onClose: () => void;
    onEdit: (id: number) => void;
}

const SessionViewDialog: React.FC<SessionViewDialogProps> = ({
    id,
    onClose,
    onEdit
}) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                setLoading(true);
                const response = await sessionAPI.getById(id);

                if (response.status && response.data) {
                    setSession(response.data);
                } else {
                    throw new Error(response.message || 'Session not found');
                }
            } catch (error: any) {
                console.error('Error fetching session:', error);
                showError(error.message || 'Failed to load session data');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [id, onClose]);

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { color: string; bgColor: string }> = {
            active: { color: 'text-green-700', bgColor: 'bg-green-100' },
            closed: { color: 'text-blue-700', bgColor: 'bg-blue-100' },
            archived: { color: 'text-gray-700', bgColor: 'bg-gray-100' }
        };

        const config = statusConfig[status] || { color: 'text-gray-700', bgColor: 'bg-gray-100' };
        
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl shadow-lg border border-gray-200">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600">Loading session details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {session.name}
                            </h3>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                                <span>Year: {session.year}</span>
                                <span>•</span>
                                <span>{getStatusBadge(session.status)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(id)}
                            className="px-3 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                        </button>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Session Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-medium text-gray-900">Time Period</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Start Date:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatDate(session.startDate, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">End Date:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.endDate ? formatDate(session.endDate, 'MMM dd, yyyy') : 'Ongoing'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Season Type:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.seasonType || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Home className="w-4 h-4 text-green-600" />
                                    <h4 className="font-medium text-gray-900">Farm Plots</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Bukids:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.bukids?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Active Bukids:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.bukids?.filter((b: any) => b.status === 'active').length || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-purple-600" />
                                    <h4 className="font-medium text-gray-900">Assignments</h4>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total Assignments:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {session.assignments?.length || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Active Workers:</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Set(session.assignments?.map((a: any) => a.worker.id)).size || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Info className="w-4 h-4 text-gray-600" />
                                <h4 className="font-medium text-gray-900">Session Metadata</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Created</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(session.createdAt, 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Last Updated</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(session.updatedAt, 'MMM dd, yyyy HH:mm')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">ID</p>
                                    <p className="text-sm font-medium text-gray-900">#{session.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {session.endDate 
                                            ? `${Math.ceil((new Date(session.endDate).getTime() - new Date(session.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                                            : 'Ongoing'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bukids Section */}
                        {session.bukids && session.bukids.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Home className="w-4 h-4 text-green-600" />
                                    <h4 className="font-medium text-gray-900">Bukids in this Session</h4>
                                    <span className="text-sm text-gray-500">({session.bukids.length})</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {session.bukids.slice(0, 4).map((bukid: any) => (
                                        <div key={bukid.id} className="p-3 rounded border border-gray-200 bg-white">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">{bukid.name}</p>
                                                    <p className="text-xs text-gray-500">{bukid.location || 'No location'}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${bukid.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {bukid.status}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-gray-600">
                                                Pitaks: {bukid.pitaks?.length || 0}
                                            </div>
                                        </div>
                                    ))}
                                    {session.bukids.length > 4 && (
                                        <div className="p-3 rounded border border-gray-200 bg-gray-50 text-center">
                                            <p className="text-sm text-gray-600">
                                                +{session.bukids.length - 4} more bukids
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes (if any) */}
                        {session.notes && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                    <h4 className="font-medium text-gray-900">Notes</h4>
                                </div>
                                <div className="p-3 rounded border border-gray-200 bg-amber-50">
                                    <p className="text-sm text-gray-800">{session.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="text-xs text-gray-600">
                        <p>Session details are read-only. Click "Edit" to make changes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionViewDialog;