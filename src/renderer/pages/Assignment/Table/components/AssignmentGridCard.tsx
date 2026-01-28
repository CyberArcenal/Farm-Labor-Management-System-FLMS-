// components/Assignment/components/AssignmentGridCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, MapPin, Hash, Clock, Eye, Edit, CheckCircle, XCircle, Trash2, MoreVertical, UserPlus, History, BarChart3, Download } from 'lucide-react';
import { formatDate, formatNumber } from '../../../../utils/formatters';
import type { Assignment } from '../../../../apis/assignment';

interface AssignmentGridCardProps {
    assignment: Assignment;
    isSelected: boolean;
    onSelect: () => void;
    onView: () => void;
    onEdit: () => void;
    onUpdateStatus: () => void;
    onCancel: () => void;
    onDelete: () => void;
}

const AssignmentGridCard: React.FC<AssignmentGridCardProps> = ({
    assignment,
    isSelected,
    onSelect,
    onView,
    onEdit,
    onUpdateStatus,
    onCancel,
    onDelete
}) => {
    const [showActionsDropdown, setShowActionsDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const getStatusBadge = (status: string = 'active') => {
        const statusConfig = {
            active: {
                text: 'Active',
                bg: 'var(--status-planted-bg)',
                color: 'var(--status-planted)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: XCircle
            },
            completed: {
                text: 'Completed',
                bg: 'var(--accent-sky-light)',
                color: 'var(--accent-sky)',
                border: 'rgba(49, 130, 206, 0.3)',
                icon: CheckCircle
            },
            cancelled: {
                text: 'Cancelled',
                bg: 'var(--accent-rust-light)',
                color: 'var(--accent-rust)',
                border: 'rgba(197, 48, 48, 0.3)',
                icon: XCircle
            }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
        const Icon = config.icon;

        return (
            <span
                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{
                    background: config.bg,
                    color: config.color,
                    border: `1px solid ${config.border}`
                }}
            >
                <Icon className="w-3 h-3" />
                {config.text}
            </span>
        );
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setShowActionsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleActionClick = (action: () => void) => {
        action();
        setShowActionsDropdown(false);
    };

    // Get dropdown position for grid card
    const getDropdownPosition = () => {
        if (!buttonRef.current) return {};
        
        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 224; // w-56 = 224px
        const dropdownHeight = 320;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let left = rect.right;
        let top = rect.bottom;
        
        // Check if dropdown would overflow right of window
        if (rect.right + dropdownWidth > windowWidth) {
            left = rect.left - dropdownWidth;
        }
        
        // Check if dropdown would overflow bottom of window
        if (rect.bottom + dropdownHeight > windowHeight) {
            top = rect.top - dropdownHeight;
        }
        
        return {
            position: 'fixed' as const,
            top: `${top + 5}px`,
            left: `${left}px`,
            zIndex: 50
        };
    };

    return (
        <div
            className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative"
            style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)'
            }}
        >
            {/* Selection checkbox */}
            <div className="absolute top-3 right-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onSelect}
                    className="rounded"
                    style={{ borderColor: 'var(--border-color)' }}
                />
            </div>

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                    <Calendar className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Assignment #{assignment.id}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {formatDate(assignment.assignmentDate, 'MMM dd, yyyy')}
                        </span>
                    </div>
                    {getStatusBadge(assignment.status)}
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {assignment.worker?.name || 'No worker assigned'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {assignment.pitak?.name || 'No pitak assigned'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(assignment.luwangCount)} LuWang
                    </span>
                </div>
            </div>

            {/* Notes preview */}
            {assignment.notes && (
                <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {assignment.notes.length > 100 ? `${assignment.notes.substring(0, 100)}...` : assignment.notes}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Created {formatDate(assignment.createdAt, 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onView}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="View"
                    >
                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                    </button>
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                    </button>
                    
                    {/* Actions Dropdown for Grid View */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            ref={buttonRef}
                            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors relative"
                            title="More Actions"
                        >
                            <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        
                        {showActionsDropdown && (
                            <div 
                                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-56 z-50 max-h-72 overflow-y-auto"
                                style={getDropdownPosition()}
                            >
                                <div className="py-2">
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </div>
                                    
                                    <button
                                        onClick={() => handleActionClick(onView)}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleActionClick(onEdit)}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                        Edit
                                    </button>
                                    
                                    {assignment.status === 'active' && (
                                        <>
                                            <button
                                                onClick={() => handleActionClick(onUpdateStatus)}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                Mark as Completed
                                            </button>
                                            <button
                                                onClick={() => handleActionClick(onCancel)}
                                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                Cancel Assignment
                                            </button>
                                        </>
                                    )}
                                    
                                    <div className="border-t border-gray-200 my-1"></div>
                                    
                                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Future Features
                                    </div>
                                    
                                    <button
                                        onClick={() => handleActionClick(() => {/* Reassign Worker */})}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                                        disabled
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Reassign Worker
                                    </button>
                                    <button
                                        onClick={() => handleActionClick(() => {/* Update Luwang */})}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                                        disabled
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Update Luwang Count
                                    </button>
                                    <button
                                        onClick={() => handleActionClick(() => {/* Download Report */})}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                                        disabled
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Report
                                    </button>
                                    <button
                                        onClick={() => handleActionClick(() => {/* View History */})}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                                        disabled
                                    >
                                        <History className="w-4 h-4" />
                                        View History
                                    </button>
                                    
                                    <div className="border-t border-gray-200 my-1"></div>
                                    
                                    <button
                                        onClick={() => handleActionClick(onDelete)}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentGridCard;