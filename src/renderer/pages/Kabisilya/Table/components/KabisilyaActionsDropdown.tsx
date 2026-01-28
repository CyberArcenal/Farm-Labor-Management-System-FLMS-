// components/Kabisilya/components/KabisilyaActionsDropdown.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
    Eye, Edit, Trash2, UserPlus, Layers,
    Network, Users, Home, MoreVertical,
    Link, Unlink, FileText, History
} from 'lucide-react';

interface KabisilyaActionsDropdownProps {
    kabisilya: any;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAssignWorkers: () => void;
    onAssignBukids: () => void;
}

const KabisilyaActionsDropdown: React.FC<KabisilyaActionsDropdownProps> = ({
    kabisilya,
    onView,
    onEdit,
    onDelete,
    onAssignWorkers,
    onAssignBukids
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
                            Assignments
                        </div>

                        <button
                            onClick={() => handleAction(onAssignWorkers)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <UserPlus className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                            <span>Assign Workers</span>
                        </button>
                        <button
                            onClick={() => handleAction(onAssignBukids)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            <Layers className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                            <span>Assign Bukids</span>
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
                            <Link className="w-4 h-4" />
                            <span>Link to Project</span>
                        </button>
                        <button
                            onClick={() => handleAction(() => {})}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-not-allowed"
                            disabled
                        >
                            <FileText className="w-4 h-4" />
                            <span>Generate Report</span>
                        </button>
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

export default KabisilyaActionsDropdown;