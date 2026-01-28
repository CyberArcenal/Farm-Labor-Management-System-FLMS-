// components/Worker/components/WorkerGridCard.tsx
import React from 'react';
import { User, Phone, Mail, MapPin, Calendar, Users } from 'lucide-react';
import { formatDate, formatCurrency } from '../../../../utils/formatters';
import WorkerActionsDropdown from './WorkerActionsDropdown';

interface WorkerGridCardProps {
    worker: any;
    isSelected: boolean;
    onSelect: () => void;
    onView: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onUpdateStatus: (id: number, currentStatus: string, newStatus: string) => void;
    onGenerateReport: (id: number) => void;
}

const WorkerGridCard: React.FC<WorkerGridCardProps> = ({
    worker,
    isSelected,
    onSelect,
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onGenerateReport
}) => {
    const getStatusBadge = (status: string) => {
        const config: any = {
            active: { bg: 'bg-green-50', text: 'text-green-700', label: 'Active' },
            inactive: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Inactive' },
            'on-leave': { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'On Leave' },
            terminated: { bg: 'bg-red-50', text: 'text-red-700', label: 'Terminated' }
        };

        const cfg = config[status] || config.active;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
            </span>
        );
    };

    const getDebtIndicator = (balance: number) => {
        if (balance === 0) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    No Debt
                </span>
            );
        } else if (balance > 0) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                    Owes: {formatCurrency(balance)}
                </span>
            );
        } else {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    Credit: {formatCurrency(Math.abs(balance))}
                </span>
            );
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-300 relative group">
            {/* Selection checkbox */}
            <div className="absolute top-3 right-3 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded border-gray-300"
                />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="p-3 rounded-lg bg-blue-50">
                    <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {worker.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">
                            ID: {worker.id}
                        </span>
                        {worker.hireDate && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                    {formatDate(worker.hireDate, 'MM/dd/yyyy')}
                                </span>
                            </div>
                        )}
                    </div>
                    {getStatusBadge(worker.status)}
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                    {worker.contact ? (
                        <>
                            <Phone className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700">
                                {worker.contact}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">No contact</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {worker.email ? (
                        <>
                            <Mail className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-700">
                                {worker.email}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">No email</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {worker.kabisilya ? (
                        <>
                            <Users className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700">
                                {worker.kabisilya.name}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">No kabisilya</span>
                    )}
                </div>
                <div className="pt-2 border-t border-gray-200">
                    {getDebtIndicator(worker.currentBalance || 0)}
                </div>
            </div>

            {/* Address preview */}
            {worker.address && (
                <div className="mb-4 p-3 rounded bg-gray-50">
                    <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                        <div className="text-xs text-gray-600">
                            {worker.address.length > 80 ? `${worker.address.substring(0, 80)}...` : worker.address}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                    Created {formatDate(worker.createdAt, 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                    <WorkerActionsDropdown
                        worker={worker}
                        onView={() => onView(worker.id)}
                        onEdit={() => onEdit(worker.id)}
                        onDelete={() => onDelete(worker.id)}
                        onUpdateStatus={(newStatus: string) => onUpdateStatus(worker.id, worker.status, newStatus)}
                        onGenerateReport={() => onGenerateReport(worker.id)}
                    />
                </div>
            </div>
        </div>
    );
};

export default WorkerGridCard;