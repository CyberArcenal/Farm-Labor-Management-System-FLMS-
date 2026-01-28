// components/Worker/components/WorkerTableView.tsx
import React, { useState } from 'react';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import WorkerTableRow from './WorkerTableRow';

interface WorkerTableViewProps {
    workers: any[];
    selectedWorkers: number[];
    toggleSelectAll: () => void;
    toggleSelectWorker: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, currentStatus: string, newStatus: string) => void;
    onGenerateReport: (id: number) => void;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSort: (field: string) => void;
}

const WorkerTableView: React.FC<WorkerTableViewProps> = ({
    workers,
    selectedWorkers,
    toggleSelectAll,
    toggleSelectWorker,
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onGenerateReport,
    sortBy,
    sortOrder,
    onSort
}) => {
    const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

    const toggleExpandWorker = (id: number) => {
        setExpandedWorker(prev => prev === id ? null : id);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 text-left">
                            <input
                                type="checkbox"
                                checked={selectedWorkers.length === workers.length && workers.length > 0}
                                onChange={toggleSelectAll}
                                className="rounded border-gray-300"
                            />
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button
                                onClick={() => onSort('name')}
                                className="flex items-center gap-1 hover:text-blue-600"
                            >
                                Worker Name
                                {sortBy === 'name' && (
                                    <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                )}
                            </button>
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Info
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button
                                onClick={() => onSort('hireDate')}
                                className="flex items-center gap-1 hover:text-blue-600"
                            >
                                Hire Date
                                {sortBy === 'hireDate' && (
                                    <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                )}
                            </button>
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button
                                onClick={() => onSort('currentBalance')}
                                className="flex items-center gap-1 hover:text-blue-600"
                            >
                                Financial
                                {sortBy === 'currentBalance' && (
                                    <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                )}
                            </button>
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kabisilya
                        </th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {workers.map((worker) => (
                        <WorkerTableRow
                            key={worker.id}
                            worker={worker}
                            isSelected={selectedWorkers.includes(worker.id)}
                            isExpanded={expandedWorker === worker.id}
                            onSelect={() => toggleSelectWorker(worker.id)}
                            onToggleExpand={() => toggleExpandWorker(worker.id)}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onUpdateStatus={onUpdateStatus}
                            onGenerateReport={onGenerateReport}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WorkerTableView;