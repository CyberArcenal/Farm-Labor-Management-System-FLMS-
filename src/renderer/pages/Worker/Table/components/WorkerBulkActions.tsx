// components/Worker/components/WorkerBulkActions.tsx
import React from 'react';
import { Trash2, X, UserPlus, UserMinus } from 'lucide-react';

interface WorkerBulkActionsProps {
    selectedCount: number;
    onBulkDelete: () => void;
    onClearSelection: () => void;
}

const WorkerBulkActions: React.FC<WorkerBulkActionsProps> = ({
    selectedCount,
    onBulkDelete,
    onClearSelection
}) => {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="font-bold text-blue-700">{selectedCount}</span>
                    </div>
                    <div>
                        <h4 className="font-medium text-blue-900">
                            {selectedCount} worker{selectedCount !== 1 ? 's' : ''} selected
                        </h4>
                        <p className="text-sm text-blue-700">
                            Perform bulk actions on selected workers
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => {
                            // Bulk activate action
                        }}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Activate All
                    </button>
                    <button
                        onClick={() => {
                            // Bulk deactivate action
                        }}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
                    >
                        <UserMinus className="w-4 h-4" />
                        Deactivate All
                    </button>
                    <button
                        onClick={onBulkDelete}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                    </button>
                    <button
                        onClick={onClearSelection}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Clear Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkerBulkActions;