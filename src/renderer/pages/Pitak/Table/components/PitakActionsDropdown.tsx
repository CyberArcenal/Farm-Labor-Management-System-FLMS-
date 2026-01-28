import React, { useRef, useEffect } from 'react';
import {
  User, BookOpen, Layers, FileText,
  CheckCircle, XCircle, Crop, Trash2, MoreVertical, Users,
  History
} from 'lucide-react';

interface PitakActionsDropdownProps {
  pitak: any;
  onAssign: () => void;
  onViewAssignments: () => void;
  onViewAssignmentHistory: () => void;
  onViewAssignedWorkers: () => void;
  onUpdateLuWang: () => void;
  onViewReport: () => void;
  onUpdateStatus: () => void;
  onMarkAsHarvested: () => void;
  onDelete: () => void;
}

const PitakActionsDropdown: React.FC<PitakActionsDropdownProps> = ({
  pitak,
  onAssign,
  onViewAssignments,
  onViewAssignmentHistory,
  onViewAssignedWorkers,
  onUpdateLuWang,
  onViewReport,
  onUpdateStatus,
  onMarkAsHarvested,
  onDelete
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
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

  // Calculate adaptive position for dropdown
  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 350; // Estimated height of dropdown
    const windowHeight = window.innerHeight;
    
    // Check if dropdown would overflow bottom of window
    if (rect.bottom + dropdownHeight > windowHeight) {
      // Show above the button
      return {
        bottom: `${windowHeight - rect.top + 5}px`,
        right: `${window.innerWidth - rect.right}px`,
      };
    }
    
    // Show below the button
    return {
      top: `${rect.bottom + 5}px`,
      right: `${window.innerWidth - rect.right}px`,
    };
  };

  return (
    <div className="pitak-actions-dropdown-container relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors relative z-50"
        title="More Actions"
      >
        <MoreVertical className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
      </button>

      {isOpen && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] z-50 max-h-80 overflow-y-auto"
          style={getDropdownPosition()}
        >
          <div className="py-2">
            {/* Header */}
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Pitak Actions
            </div>
            
            {/* Assignments Section */}
            <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Assignments
            </div>
            
            <button
              onClick={() => handleAction(onAssign)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
              style={{ color: 'var(--text-primary)' }}
            >
              <User className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
              <span>Assign Worker</span>
            </button>
            
            <button
              onClick={() => handleAction(onViewAssignments)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
              style={{ color: 'var(--text-primary)' }}
            >
              <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <span>View Assignments</span>
            </button>
            
            <button
              onClick={() => handleAction(onViewAssignmentHistory)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
              style={{ color: 'var(--text-primary)' }}
            >
              <History className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
              <span>Assignment History</span>
            </button>
            
            <button
              onClick={() => handleAction(onViewAssignedWorkers)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
              style={{ color: 'var(--text-primary)' }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
              <span>Assigned Workers</span>
            </button>

            {/* Pitak Management Section */}
            <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Management
            </div>
            
            <button
              onClick={() => handleAction(onUpdateLuWang)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
              style={{ color: 'var(--text-primary)' }}
            >
              <Layers className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>Update LuWang</span>
            </button>
            
            <button
              onClick={() => handleAction(onViewReport)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
              style={{ color: 'var(--text-primary)' }}
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              <span>Generate Report</span>
            </button>

            {/* Status Management Section */}
            <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Status
            </div>
            
            {pitak.status !== 'harvested' && (
              <>
                <button
                  onClick={() => handleAction(onUpdateStatus)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {pitak.status === 'active' ? (
                    <>
                      <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                      <span>Deactivate Pitak</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                      <span>Activate Pitak</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleAction(onMarkAsHarvested)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-gray-50"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Crop className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  <span>Mark as Harvested</span>
                </button>
              </>
            )}

            {/* Danger Zone Section */}
            <div className="border-t border-gray-200 my-1"></div>
            
            <div className="px-4 py-1 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--accent-rust)' }}>
              Danger Zone
            </div>
            
            <button
              onClick={() => handleAction(onDelete)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-red-50"
              style={{ color: 'var(--accent-rust)' }}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Pitak</span>
            </button>

            {/* Footer */}
            <div className="px-4 py-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              ID: {pitak.id} • Status: {pitak.status}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitakActionsDropdown;