import React, { useState, useEffect } from 'react';
import {
    X,
    User, Phone, AlertCircle,
    Clock,
    CheckCircle,
    XCircle, DollarSign,
    TrendingUp,
    Briefcase,
    FileText,
    CreditCard,
    Download
} from 'lucide-react';
import type { WorkerData } from '../../../../apis/worker';
import workerAPI from '../../../../apis/worker';

interface ViewSingleWorkerDialogProps {
  workerId: number;
  onClose: () => void;
  onEdit?: (id: number) => void;
  onDelete?: () => void;
  onViewHistory?: () => void;
  onGenerateReport?: () => void;
}

const ViewSingleWorkerDialog: React.FC<ViewSingleWorkerDialogProps> = ({
  workerId,
  onClose,
  onEdit,
  onDelete,
  onGenerateReport
}) => {
  const [worker, setWorker] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'financial'>('details');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);

  useEffect(() => {
    const fetchWorker = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await workerAPI.getWorkerById(workerId);
        
        if (response.status) {
          setWorker(response.data.worker);
          
          // Fetch additional data
          try {
            const [summaryRes, financialRes] = await Promise.all([
              workerAPI.getWorkerSummary(workerId),
              workerAPI.getWorkerFinancialSummary(workerId)
            ]);
            
            if (summaryRes.status) {
              setSummaryData(summaryRes.data.summary);
            }
            
            if (financialRes) {
              setFinancialData(financialRes);
            }
          } catch (secondaryError) {
            console.log('Secondary data fetch error:', secondaryError);
          }
        } else {
          setError(response.message || 'Failed to load worker');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load worker');
        console.error('Error fetching worker:', err);
      } finally {
        setLoading(false);
      }
    };

    if (workerId) {
      fetchWorker();
    }
  }, [workerId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { 
        bg: '#d1fae5', 
        text: '#065f46', 
        icon: <CheckCircle className="w-3.5 h-3.5" /> 
      };
      case 'inactive': return { 
        bg: '#f3f4f6', 
        text: '#6b7280', 
        icon: <XCircle className="w-3.5 h-3.5" /> 
      };
      case 'on-leave': return { 
        bg: '#fef3c7', 
        text: '#92400e', 
        icon: <Clock className="w-3.5 h-3.5" /> 
      };
      case 'terminated': return { 
        bg: '#fee2e2', 
        text: '#991b1b', 
        icon: <XCircle className="w-3.5 h-3.5" /> 
      };
      default: return { 
        bg: '#f3f4f6', 
        text: '#6b7280', 
        icon: <Clock className="w-3.5 h-3.5" /> 
      };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-lg w-full max-w-lg shadow-lg border border-gray-200">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading worker details...</p>
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
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Worker Details</h3>
              <p className="text-xs text-gray-600">Worker ID: #{workerId}</p>
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
            <p className="text-sm font-medium text-gray-900 mb-1">Error Loading Worker</p>
            <p className="text-xs text-gray-600">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Close
            </button>
          </div>
        ) : worker ? (
          <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Status Banner */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const statusColor = getStatusColor(worker.status);
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
                            {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Hired: {formatDate(worker.hireDate)}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {financialData ? formatCurrency(financialData.currentBalance || 0) : '₱0.00'}
                  </div>
                  <div className="text-xs text-gray-500">Current Balance</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'details' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'financial' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Financial
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                    activeTab === 'history' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {activeTab === 'details' ? (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Basic Information
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Name:</span>
                        <span className="text-sm font-medium text-gray-900">{worker.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Worker ID:</span>
                        <span className="text-sm text-gray-900">#{worker.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Status:</span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(worker.status).bg,
                            color: getStatusColor(worker.status).text
                          }}
                        >
                          {worker.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      Contact Information
                    </h4>
                    <div className="space-y-1">
                      {worker.contact && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Contact Number:</span>
                          <span className="text-sm text-gray-900">{worker.contact}</span>
                        </div>
                      )}
                      {worker.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Email:</span>
                          <span className="text-sm text-gray-900">{worker.email}</span>
                        </div>
                      )}
                      {worker.address && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Address:</span>
                          <span className="text-sm text-gray-900">{worker.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      Employment Details
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Hire Date:</span>
                        <span className="text-sm text-gray-900">{formatDate(worker.hireDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Days Employed:</span>
                        <span className="text-sm text-gray-900">
                          {worker.hireDate 
                            ? Math.floor((new Date().getTime() - new Date(worker.hireDate).getTime()) / (1000 * 60 * 60 * 24))
                            : 'N/A'} days
                        </span>
                      </div>
                      {summaryData?.basicInfo?.daysEmployed && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Years of Service:</span>
                          <span className="text-sm text-gray-900">
                            {(summaryData.basicInfo.daysEmployed / 365).toFixed(1)} years
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Summary */}
                  {summaryData && (
                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Performance Summary
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Total Assignments:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {summaryData.counts?.totalAssignments || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Active Assignments:</span>
                          <span className="text-sm text-gray-900">
                            {summaryData.counts?.activeAssignments || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Completion Rate:</span>
                          <span className="text-sm text-gray-900">
                            {summaryData.counts?.totalAssignments 
                              ? Math.round(((summaryData.counts.totalAssignments - (summaryData.counts.activeAssignments || 0)) / summaryData.counts.totalAssignments) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {worker.notes && (
                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Notes
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{worker.notes}</p>
                    </div>
                  )}

                  {/* System Information */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">System Information</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Created:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(worker.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Last Updated:</span>
                        <span className="text-sm text-gray-900">
                          {new Date(worker.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'financial' ? (
                <div className="space-y-4">
                  {/* Financial Overview */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      Financial Overview
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Total Debt:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(worker.totalDebt || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Total Paid:</span>
                        <span className="text-sm text-gray-900">
                          {formatCurrency(worker.totalPaid || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Current Balance:</span>
                        <span className={`text-sm font-semibold ${
                          (worker.currentBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatCurrency(worker.currentBalance || 0)}
                        </span>
                      </div>
                      {financialData && (
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200 mt-1">
                          <span className="text-xs text-gray-600">Balance Status:</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            (worker.currentBalance || 0) > 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {(worker.currentBalance || 0) > 0 ? 'Has Debt' : 'Clear'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-gray-50 rounded border border-gray-200 p-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 border border-gray-200 rounded bg-white">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-3 h-3 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-900">Worker account created</div>
                          <div className="text-xs text-gray-500">
                            {new Date(worker.createdAt).toLocaleDateString()} • Initial setup
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2 p-2 border border-gray-200 rounded bg-white">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-3 h-3 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-900">Last financial update</div>
                          <div className="text-xs text-gray-500">
                            {new Date(worker.updatedAt).toLocaleDateString()} • Balance recalculated
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Report Generation */}
                  {onGenerateReport && (
                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Reports</h4>
                      <button
                        onClick={onGenerateReport}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Generate Financial Report
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Generate detailed financial report for this worker
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Worker history will appear here</p>
                    <p className="text-xs text-gray-500 mt-1">Track status changes, assignments, and modifications</p>
                  </div>
                  
                  {/* Example history items */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 border border-gray-200 rounded">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900">Worker account created</div>
                        <div className="text-xs text-gray-500">
                          {new Date(worker.createdAt).toLocaleDateString()} • By System
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 p-2 border border-gray-200 rounded">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-900">Status updated to {worker.status}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(worker.hireDate)} • Hired as new worker
                        </div>
                      </div>
                    </div>

                    {worker.notes && (
                      <div className="flex items-start gap-2 p-2 border border-gray-200 rounded">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3 h-3 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-900">Notes updated</div>
                          <div className="text-xs text-gray-500">
                            {new Date(worker.updatedAt).toLocaleDateString()} • Additional information added
                          </div>
                        </div>
                      </div>
                    )}
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
              Last updated: {worker ? new Date(worker.updatedAt).toLocaleDateString() : 'N/A'}
            </div>
            <div className="flex items-center gap-2">
              {onGenerateReport && (
                <button
                  onClick={onGenerateReport}
                  className="px-3 py-1.5 rounded text-sm font-medium border border-green-300 hover:bg-green-50 text-green-600"
                >
                  Report
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(workerId)}
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

export default ViewSingleWorkerDialog;