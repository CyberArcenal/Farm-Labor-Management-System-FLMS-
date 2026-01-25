// components/AssignmentSelect.tsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, Calendar, User, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Assignment } from '../../../apis/assignment';
import assignmentAPI from '../../../apis/assignment';

interface AssignmentSelectProps {
  value: number | null;
  onChange: (assignmentId: number, assignmentData?: Assignment) => void;
  disabled?: boolean;
  showDetails?: boolean;
  placeholder?: string;
  statusFilter?: 'active' | 'completed' | 'cancelled' | 'all';
  workerFilter?: number;
  pitakFilter?: number;
  dateFilter?: string;
}

const AssignmentSelect: React.FC<AssignmentSelectProps> = ({
  value,
  onChange,
  disabled = false,
  showDetails = true,
  placeholder = 'Select an assignment',
  statusFilter = 'all',
  workerFilter,
  pitakFilter,
  dateFilter
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (workerFilter) filters.workerId = workerFilter;
      if (pitakFilter) filters.pitakId = pitakFilter;
      if (dateFilter) filters.dateFrom = dateFilter;

      const response = await assignmentAPI.getAllAssignments(filters);
      
      if (response.status && response.data) {
        setAssignments(response.data);
        setFilteredAssignments(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch assignments');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter, workerFilter, pitakFilter, dateFilter]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAssignments(assignments);
    } else {
      const filtered = assignments.filter(assignment =>
        assignment.worker?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.pitak?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.assignmentDate.includes(searchTerm)
      );
      setFilteredAssignments(filtered);
    }
  }, [searchTerm, assignments]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAssignmentSelect = (assignment: Assignment) => {
    onChange(assignment.id, assignment);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge-active';
      case 'completed': return 'status-badge-completed';
      case 'cancelled': return 'status-badge-cancelled';
      default: return 'status-badge-inactive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="icon-xs" />;
      case 'completed': return <CheckCircle className="icon-xs" />;
      case 'cancelled': return <XCircle className="icon-xs" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const selectedAssignment = assignments.find(a => a.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`compact-input w-full rounded-md text-left flex justify-between items-center transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'text-gray-900 dark:text-[#9ED9EC] hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: isOpen ? 'var(--accent-green)' : 'var(--border-color)',
          borderWidth: '1px',
          minHeight: '42px'
        }}
      >
        <div className="flex items-center truncate">
          {selectedAssignment ? (
            <div className="flex items-center space-x-2">
              <Calendar className="icon-sm" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
                {new Date(selectedAssignment.assignmentDate).toLocaleDateString()} • {selectedAssignment.worker?.name}
                {showDetails && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                    • {selectedAssignment.luwangCount} luwang
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`icon-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-xs rounded-md shadow-lg max-h-80 overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: 'var(--card-secondary-bg)',
            borderColor: 'var(--border-color)',
            borderWidth: '1px',
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          <div className="compact-card border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 icon-sm" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search assignments by worker, pitak, or date..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="compact-input w-full pl-8 rounded-md focus:ring-1 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--sidebar-text)'
                }}
                autoFocus
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader className="icon-sm animate-spin" style={{ color: 'var(--accent-green)' }} />
              <span className="ml-xs text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading assignments...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="compact-card text-center">
              <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
              <button
                onClick={fetchAssignments}
                className="text-sm compact-button"
                style={{
                  backgroundColor: 'var(--accent-green)',
                  color: 'var(--sidebar-text)',
                  padding: 'var(--size-xs) var(--size-sm)'
                }}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-60 overflow-y-auto kabisilya-scrollbar">
              {filteredAssignments.length === 0 ? (
                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No assignments found
                </div>
              ) : (
                filteredAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    onClick={() => handleAssignmentSelect(assignment)}
                    className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${
                      assignment.id === value
                        ? 'border-l-2 border-green-600'
                        : ''
                    }`}
                    style={{
                      backgroundColor: assignment.id === value ? 'var(--card-hover-bg)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                          <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                            {new Date(assignment.assignmentDate).toLocaleDateString()}
                          </div>
                          <div className={`px-xs py-xs rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(assignment.status)}`}>
                            {getStatusIcon(assignment.status)}
                            {getStatusText(assignment.status)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-xs">
                          {assignment.worker && (
                            <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <User className="icon-xs mr-1" />
                              {assignment.worker.name}
                            </div>
                          )}
                          
                          {assignment.pitak && (
                            <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                              <MapPin className="icon-xs mr-1" />
                              {assignment.pitak.name}
                              {assignment.pitak.code && ` (${assignment.pitak.code})`}
                            </div>
                          )}
                        </div>
                        
                        {assignment.luwangCount > 0 && (
                          <div className="mt-xs text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
                            {assignment.luwangCount} luwang
                          </div>
                        )}
                      </div>
                    </div>

                    {assignment.notes && (
                      <div className="mt-xs text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {assignment.notes.length > 80 ? `${assignment.notes.substring(0, 80)}...` : assignment.notes}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default AssignmentSelect;