// components/Worker/components/WorkerTableActionsDropdown.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
    Eye, Edit, Trash2, UserPlus, UserMinus, Printer,
    MoreVertical, CreditCard, Clock, XCircle, CheckCircle,
    FileText, History, Users, DollarSign
} from 'lucide-react';

interface WorkerTableActionsDropdownProps {
    worker: any;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onUpdateStatus: (newStatus: string) => void;
    onGenerateReport: () => void;
}

const WorkerTableActionsDropdown: React.FC<WorkerTableActionsDropdownProps> = ({
    worker,
    onView,
    onEdit,
    onDelete,
    onUpdateStatus,
    onGenerateReport
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDropdownPosition = () => {
        if (!buttonRef.current) return {};

        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownHeight = 350;
        const windowHeight = window.innerHeight;

        if (rect.bottom + dropdownHeight > windowHeight) {
            return {
                bottom: `${windowHeight - rect.top + 5}px`,
                right: `${window.innerWidth - rect.right}px`,
            };
        }

        return {
            top: `${rect.bottom + 5}px`,
            right: `${window.innerWidth - rect.right}px`,
        };
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors relative"
                title="More Actions"
            >
                <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>

            {isOpen && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50 max-h-80 overflow-y-auto"
                    style={getDropdownPosition()}
                >
                    <div className="py-2">
                        {/* Header with worker info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">{worker.name}</h4>
                                    <p className="text-xs text-gray-500">ID: {worker.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                        </div>

                        <button
                            onClick={() => handleAction(onView)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                            <span>View Details</span>
                        </button>
                        <button
                            onClick={() => handleAction(onEdit)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                            <span>Edit</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status Management
                        </div>

                        {worker.status !== 'active' && (
                            <button
                                onClick={() => handleAction(() => onUpdateStatus('active'))}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                <span>Activate</span>
                            </button>
                        )}
                        {worker.status !== 'inactive' && (
                            <button
                                onClick={() => handleAction(() => onUpdateStatus('inactive'))}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <UserMinus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                <span>Deactivate</span>
                            </button>
                        )}
                        {worker.status !== 'on-leave' && (
                            <button
                                onClick={() => handleAction(() => onUpdateStatus('on-leave'))}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Clock className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                <span>Mark as On Leave</span>
                            </button>
                        )}
                        {worker.status !== 'terminated' && (
                            <button
                                onClick={() => handleAction(() => onUpdateStatus('terminated'))}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                <span>Terminate</span>
                            </button>
                        )}

                        <div className="border-t border-gray-100 my-1"></div>

                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Financial
                        </div>

                        <button
                            onClick={() => handleAction(() => {
                                // Record payment
                            })}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <CreditCard className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                            <span>Record Payment</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Reports
                        </div>

                        <button
                            onClick={() => handleAction(onGenerateReport)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Printer className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                            <span>Generate Report</span>
                        </button>
                        <button
                            onClick={() => handleAction(() => {
                                // Financial statement
                            })}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <FileText className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                            <span>Financial Statement</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Future Features
                        </div>

                        <button
                            onClick={() => handleAction(() => {})}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                            disabled
                        >
                            <History className="w-4 h-4" />
                            <span>View Activity Log</span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        <button
                            onClick={() => handleAction(onDelete)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerTableActionsDropdown;