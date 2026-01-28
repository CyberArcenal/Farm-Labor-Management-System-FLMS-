// components/Bukid/components/BukidActionsDropdown.tsx
import React, { useRef, useEffect } from 'react';
import { Eye, Edit, CheckCircle, XCircle, Trash2, MoreVertical } from 'lucide-react';

interface BukidActionsDropdownProps {
  bukid: any;
  onView: () => void;
  onEdit: () => void;
  onUpdateStatus: () => void;
  onDelete: () => void;
}

const BukidActionsDropdown: React.FC<BukidActionsDropdownProps> = ({
  bukid,
  onView,
  onEdit,
  onUpdateStatus,
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

  // Calculate position for fixed dropdown
  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};

    const rect = buttonRef.current.getBoundingClientRect();
    return {
      position: 'fixed' as const,
      top: rect.bottom + window.scrollY,
      right: window.innerWidth - rect.right,
      left: 'auto' as const,
      zIndex: 1000
    };
  };

  return (
    <div className="bukid-actions-dropdown-container" ref={dropdownRef}>
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
          className="absolute bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] py-1 mt-1"
          style={getDropdownPosition()}
        >
          <div className="py-1">
            <button
              onClick={() => handleAction(onView)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
              <span>View Details</span>
            </button>
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => handleAction(onUpdateStatus)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {bukid.status === 'active' ? (
                <>
                  <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                  <span>Deactivate</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                  <span>Activate</span>
                </>
              )}
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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

export default BukidActionsDropdown;