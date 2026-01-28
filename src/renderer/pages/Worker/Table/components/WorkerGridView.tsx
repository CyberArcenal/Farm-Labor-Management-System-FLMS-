// components/Worker/components/WorkerGridView.tsx
import React from 'react';
import WorkerGridCard from './WorkerGridCard';

interface WorkerGridViewProps {
    workers: any[];
    selectedWorkers: number[];
    toggleSelectWorker: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, currentStatus: string, newStatus: string) => void;
    onGenerateReport: (id: number) => void;
}

const WorkerGridView: React.FC<WorkerGridViewProps> = ({
    workers,
    selectedWorkers,
    toggleSelectWorker,
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onGenerateReport
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
                <WorkerGridCard
                    key={worker.id}
                    worker={worker}
                    isSelected={selectedWorkers.includes(worker.id)}
                    onSelect={() => toggleSelectWorker(worker.id)}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                    onGenerateReport={onGenerateReport}
                />
            ))}
        </div>
    );
};

export default WorkerGridView;