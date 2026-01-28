import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, MapPin, Hash, Filter, Download, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Assignment, AssignmentFilters } from '../../../../apis/assignment';
import assignmentAPI from '../../../../apis/assignment';
// import assignmentAPI, { Assignment, AssignmentFilters } from '../../../apis/assignment';

interface ViewMultipleAssignmentsDialogProps {
  initialFilters?: AssignmentFilters;
  pitakId?: number;
  workerId?: number;
  date?: string;
  onClose: () => void;
  onViewAssignment?: (assignmentId: number) => void;
}

const ViewMultipleAssignmentsDialog: React.FC<ViewMultipleAssignmentsDialogProps> = ({
  initialFilters,
  pitakId,
  workerId,
  date,
  onClose,
  onViewAssignment
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AssignmentFilters>({
    status: initialFilters?.status,
    dateFrom: date || initialFilters?.dateFrom,
    dateTo: date || initialFilters?.dateTo,
    workerId: workerId || initialFilters?.workerId,
    pitakId: pitakId || initialFilters?.pitakId
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await assignmentAPI.getAllAssignments(filters);
        
        if (response.status) {
          setAssignments(response.data);
        } else {
          setError(response.message || 'Failed to load assignments');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assignments');
        console.error('Error fetching assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', text: '#065f46' };
      case 'completed': return { bg: '#dbeafe', text: '#1e40af' };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.worker?.name.toLowerCase().includes(searchLower) ||
      assignment.pitak?.name.toLowerCase().includes(searchLower) ||
      assignment.worker?.code.toLowerCase().includes(searchLower) ||
      assignment.pitak?.code.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = async () => {
    try {
      const response = await assignmentAPI.exportAssignmentsToCSV(filters);
      if (response.status) {
        alert('Export successful!');
      } else {
        alert('Export failed: ' + response.message);
      }
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  const totalLuWang = filteredAssignments.reduce((sum, assignment) => sum + assignment.luwangCount, 0);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Multiple Assignments</h3>
              <div className="text-xs text-gray-600">
                {filters.dateFrom ? `Date: ${formatDate(filters.dateFrom)}` : 'All dates'} • 
                {filters.workerId ? ' Specific Worker' : filters.pitakId ? ' Specific Pitak' : ' All Workers'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by worker or pitak..."
                className="w-full px-3 py-2 rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                className="px-3 py-2 rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <button
                onClick={handleExport}
                className="px-3 py-2 rounded text-sm font-medium border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-160px)]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Loading assignments...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Error Loading Assignments</p>
              <p className="text-xs text-gray-600 mb-3">{error}</p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Close
              </button>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No Assignments Found</p>
              <p className="text-xs text-gray-600">
                {searchTerm ? `No results for "${searchTerm}"` : 'No assignments match the current filters'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Total Assignments</div>
                    <div className="font-semibold text-gray-900">{filteredAssignments.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Active</div>
                    <div className="font-semibold text-green-600">
                      {filteredAssignments.filter(a => a.status === 'active').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Completed</div>
                    <div className="font-semibold text-blue-600">
                      {filteredAssignments.filter(a => a.status === 'completed').length}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Total LuWang</div>
                    <div className="font-semibold text-gray-900">{totalLuWang}</div>
                  </div>
                </div>
              </div>

              {/* Assignments List */}
              <div className="divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => {
                  const statusColor = getStatusColor(assignment.status);
                  return (
                    <div
                      key={assignment.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => onViewAssignment?.(assignment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: statusColor.bg }}
                          >
                            <Calendar className="w-4 h-4" style={{ color: statusColor.text }} />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {assignment.worker?.name || 'Unknown Worker'}
                              </span>
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full truncate"
                                style={{
                                  backgroundColor: statusColor.bg,
                                  color: statusColor.text
                                }}
                              >
                                {assignment.status.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="text-xs text-gray-600 flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {assignment.pitak?.name || 'Unknown Pitak'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {assignment.luwangCount} LuWang
                              </span>
                              <span>
                                {formatDate(assignment.assignmentDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-gray-600">ID: #{assignment.id}</div>
                            {assignment.worker?.code && (
                              <div className="text-xs text-gray-500">{assignment.worker.code}</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      
                      {assignment.notes && (
                        <div className="mt-2 ml-11 pl-3 border-l-2 border-gray-200">
                          <p className="text-xs text-gray-600 line-clamp-2">{assignment.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMultipleAssignmentsDialog;