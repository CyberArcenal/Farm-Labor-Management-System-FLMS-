// components/Session/components/SessionBulkActions.tsx
import React from 'react';
import { CheckSquare, Trash2, X } from 'lucide-react';

interface SessionBulkActionsProps {
    selectedCount: number;
    onBulkDelete: () => void;
    onClearSelection: () => void;
}

const SessionBulkActions: React.FC<SessionBulkActionsProps> = ({
    selectedCount,
    onBulkDelete,
    onClearSelection
}) => {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-blue-900">
                            {selectedCount} session{selectedCount !== 1 ? 's' : ''} selected
                        </p>
                        <p className="text-xs text-blue-700">
                            Perform actions on all selected sessions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onBulkDelete}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Selected
                    </button>
                    <button
                        onClick={onClearSelection}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center gap-1.5"
                    >
                        <X className="w-3.5 h-3.5" />
                        Clear Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionBulkActions;