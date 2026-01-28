import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MapPin, Hash, FileText, AlertCircle, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import type { Assignment } from '../../../../apis/assignment';
import assignmentAPI from '../../../../apis/assignment';


interface ViewSingleAssignmentDialogProps {
  assignmentId: number;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewHistory?: () => void; // Make this optional
}

const ViewSingleAssignmentDialog: React.FC<ViewSingleAssignmentDialogProps> = ({
  assignmentId,
  onClose,
  onEdit,
  onDelete
}) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await assignmentAPI.getAssignmentById(assignmentId);
        
        if (response.status) {
          setAssignment(response.data);
        } else {
          setError(response.message || 'Failed to load assignment');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment');
        console.error('Error fetching assignment:', err);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', text: '#065f46', icon: <Clock className="w-3.5 h-3.5" /> };
      case 'completed': return { bg: '#dbeafe', text: '#1e40af', icon: <CheckCircle className="w-3.5 h-3.5" /> };
      case 'cancelled': return { bg: '#fee2e2', text: '#991b1b', icon: <XCircle className="w-3.5 h-3.5" /> };
      default: return { bg: '#f3f4f6', text: '#6b7280', icon: <Clock className="w-3.5 h-3.5" /> };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-lg w-full max-w-lg shadow-lg border border-gray-200">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading assignment details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Assignment Details</h3>
              <p className="text-xs text-gray-600">Assignment ID: #{assignmentId}</p>
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

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 mb-1">Error Loading Assignment</p>
            <p className="text-xs text-gray-600">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Close
            </button>
          </div>
        ) : assignment ? (
          <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Status Banner */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const statusColor = getStatusColor(assignment.status);
                    return (
                      <>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: statusColor.bg }}
                        >
                          {statusColor.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: statusColor.text }}>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Assignment Date: {formatDate(assignment.assignmentDate)}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {assignment.luwangCount} LuWang
                  </div>
                  <div className="text-xs text-gray-500">Assigned</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {activeTab === 'details' ? (
                <div className="space-y-4">
                  {/* Worker Information */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Worker Information
                    </h4>
                    {assignment.worker ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Name:</span>
                          <span className="text-sm font-medium text-gray-900">{assignment.worker.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Code:</span>
                          <span className="text-sm text-gray-900">{assignment.worker.code}</span>
                        </div>
                        {assignment.worker.contactNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Contact:</span>
                            <span className="text-sm text-gray-900">{assignment.worker.contactNumber}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No worker information available</p>
                    )}
                  </div>

                  {/* Pitak Information */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Pitak Information
                    </h4>
                    {assignment.pitak ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Name:</span>
                          <span className="text-sm font-medium text-gray-900">{assignment.pitak.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Code:</span>
                          <span className="text-sm text-gray-900">{assignment.pitak.code}</span>
                        </div>
                        {assignment.pitak.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Location:</span>
                            <span className="text-sm text-gray-900">{assignment.pitak.location}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No pitak information available</p>
                    )}
                  </div>

                  {/* LuWang Information */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />
                      LuWang Details
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Count:</span>
                        <span className="text-sm font-medium text-gray-900">{assignment.luwangCount} LuWang</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Status:</span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(assignment.status).bg,
                            color: getStatusColor(assignment.status).text
                          }}
                        >
                          {assignment.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Assignment Date:</span>
                        <span className="text-sm text-gray-900">{formatDate(assignment.assignmentDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Created:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Last Updated:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(assignment.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {assignment.notes && (
                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Notes
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Assignment history will appear here</p>
                    <p className="text-xs text-gray-500 mt-1">Track changes, status updates, and modifications</p>
                  </div>
                  
                  {/* Example history items */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 border border-gray-200 rounded">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900">Assignment created</div>
                        <div className="text-xs text-gray-500">
                          {new Date(assignment.createdAt).toLocaleDateString()} • By System
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 p-2 border border-gray-200 rounded">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900">Worker assigned</div>
                        <div className="text-xs text-gray-500">
                          {assignment.worker?.name || 'Unknown worker'} • {formatDate(assignment.assignmentDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Last updated: {assignment ? new Date(assignment.updatedAt).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 hover:bg-gray-100 text-gray-700"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1.5 rounded text-sm font-medium border border-red-300 hover:bg-red-50 text-red-600"
                >
                  Delete
                </button>
              )}
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

export default ViewSingleAssignmentDialog;