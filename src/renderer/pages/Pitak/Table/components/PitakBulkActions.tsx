import React from 'react';
import { User, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface PitakBulkActionsProps {
  selectedCount: number;
  onBulkAssign: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

const PitakBulkActions: React.FC<PitakBulkActionsProps> = ({
  selectedCount,
  onBulkAssign,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onClearSelection
}) => {
  return (
    <div className="p-4 rounded-xl flex items-center justify-between"
      style={{
        background: 'var(--card-hover-bg)',
        border: '1px solid var(--border-color)'
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {selectedCount} pitak(s) selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onBulkAssign}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
          style={{
            background: 'var(--accent-sky)',
            color: 'white'
          }}
        >
          <User className="w-4 h-4 mr-2" />
          Assign Workers
        </button>
        <button
          onClick={onBulkActivate}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
          style={{
            background: 'var(--accent-green)',
            color: 'white'
          }}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Activate Selected
        </button>
        <button
          onClick={onBulkDeactivate}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
          style={{
            background: 'var(--accent-gold)',
            color: 'white'
          }}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Deactivate Selected
        </button>
        <button
          onClick={onBulkDelete}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
          style={{
            background: 'var(--accent-rust)',
            color: 'white'
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Selected
        </button>
        <button
          onClick={onClearSelection}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
          style={{
            background: 'var(--card-secondary-bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};

export default PitakBulkActions;