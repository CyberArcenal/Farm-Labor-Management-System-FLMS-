// components/Assignment/components/AssignmentGridView.tsx
import React from 'react';
import type { Assignment } from '../../../../apis/assignment';
import AssignmentGridCard from './AssignmentGridCard';

interface AssignmentGridViewProps {
    assignments: Assignment[];
    selectedAssignments: number[];
    toggleSelectAssignment: (id: number) => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onUpdateStatus: (id: number, currentStatus: string) => void;
    onCancel: (id: number) => void;
    onDelete: (id: number) => void;
}

const AssignmentGridView: React.FC<AssignmentGridViewProps> = ({
    assignments,
    selectedAssignments,
    toggleSelectAssignment,
    onView,
    onEdit,
    onUpdateStatus,
    onCancel,
    onDelete
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((assignment) => (
                <AssignmentGridCard
                    key={assignment.id}
                    assignment={assignment}
                    isSelected={selectedAssignments.includes(assignment.id)}
                    onSelect={() => toggleSelectAssignment(assignment.id)}
                    onView={() => onView(assignment.id)}
                    onEdit={() => onEdit(assignment.id)}
                    onUpdateStatus={() => onUpdateStatus(assignment.id, assignment.status)}
                    onCancel={() => onCancel(assignment.id)}
                    onDelete={() => onDelete(assignment.id)}
                />
            ))}
        </div>
    );
};

export default AssignmentGridView;