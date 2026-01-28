import React, { useState, useEffect } from 'react';
import type { WorkerData } from '../../../../apis/worker';
import workerAPI from '../../../../apis/worker';
import { Calendar, Check, ChevronDown, FileText, Plus, Search, User, Users, X } from 'lucide-react';


interface AssignmentDialogProps {
  data: any;
  onChange: (data: any) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({ data, onChange, onSubmit, onClose }) => {
  const [selectedWorkers, setSelectedWorkers] = useState<any[]>(data.workers || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkerList, setShowWorkerList] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available workers
  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await workerAPI.getActiveWorkers({
          limit: 100,
          sortBy: 'name',
          sortOrder: 'ASC'
        });
        
        if (response.status) {
          setAvailableWorkers(response.data.workers.filter(worker => 
            worker.status === 'active' || worker.status === 'on-leave'
          ));
        } else {
          setError(response.message || 'Failed to load workers');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load workers');
        console.error('Error fetching workers:', err);
      } finally {
        setLoading(false);
      }
    };

    if (showWorkerList) {
      fetchWorkers();
    }
  }, [showWorkerList]);

  const filteredWorkers = availableWorkers.filter(worker =>
    (worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     worker.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     worker.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleWorkerSelection = (worker: WorkerData) => {
    const isSelected = selectedWorkers.some(w => w.id === worker.id);
    let updatedWorkers;
    
    if (isSelected) {
      updatedWorkers = selectedWorkers.filter(w => w.id !== worker.id);
    } else {
      updatedWorkers = [...selectedWorkers, {
        id: worker.id,
        name: worker.name,
        contact: worker.contact,
        email: worker.email,
        status: worker.status
      }];
    }
    
    setSelectedWorkers(updatedWorkers);
    onChange({ ...data, workers: updatedWorkers });
  };

  const removeWorker = (workerId: number) => {
    const updatedWorkers = selectedWorkers.filter(w => w.id !== workerId);
    setSelectedWorkers(updatedWorkers);
    onChange({ ...data, workers: updatedWorkers });
  };

  const clearAllWorkers = () => {
    setSelectedWorkers([]);
    onChange({ ...data, workers: [] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
      case 'on-leave': return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'inactive': return { bg: '#f3f4f6', text: '#6b7280', border: '#9ca3af' };
      case 'terminated': return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
      default: return { bg: '#f3f4f6', text: '#6b7280', border: '#9ca3af' };
    }
  };

  const isSubmitDisabled = selectedWorkers.length === 0 || !data.assignmentDate;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        className="bg-white rounded-lg w-full max-w-2xl shadow-lg border border-gray-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Assign Multiple Workers</h3>
              <p className="text-xs text-gray-600">Select workers to assign to this pitak</p>
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

        {/* Form */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Selected Workers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900">
                Selected Workers ({selectedWorkers.length})
                <span className="text-red-500 ml-1">*</span>
              </label>
              {selectedWorkers.length > 0 && (
                <button
                  onClick={clearAllWorkers}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {/* Selected Workers List */}
            {selectedWorkers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedWorkers.map(worker => {
                  const statusColor = getStatusColor(worker.status);
                  return (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-2 rounded border border-green-200 bg-green-50"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{worker.name}</div>
                          <div className="text-xs text-gray-500 truncate">{worker.contact || worker.email || 'No contact'}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeWorker(worker.id)}
                        className="w-5 h-5 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                      >
                        <X className="w-2.5 h-2.5 text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded border border-dashed border-gray-300 text-center">
                <Users className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-600">No workers selected</p>
                <p className="text-xs text-gray-500 mt-1">Select workers from the list below</p>
              </div>
            )}

            {/* Worker Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-900">
                  Available Workers
                </label>
                <button
                  type="button"
                  onClick={() => setShowWorkerList(!showWorkerList)}
                  className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                >
                  {showWorkerList ? 'Hide List' : 'Show List'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${showWorkerList ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {showWorkerList && (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search workers..."
                      className="w-full px-3 py-2 rounded text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto rounded border border-gray-300 divide-y divide-gray-200">
                    {loading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-xs text-gray-600 mt-1">Loading workers...</p>
                      </div>
                    ) : error ? (
                      <div className="p-3 text-center">
                        <p className="text-xs text-red-600">{error}</p>
                      </div>
                    ) : filteredWorkers.length === 0 ? (
                      <div className="p-3 text-center">
                        <p className="text-xs text-gray-600">No workers found</p>
                      </div>
                    ) : (
                      filteredWorkers.map(worker => {
                        const isSelected = selectedWorkers.some(w => w.id === worker.id);
                        const statusColor = getStatusColor(worker.status);
                        return (
                          <div
                            key={worker.id}
                            className={`p-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-green-50' : ''}`}
                            onClick={() => toggleWorkerSelection(worker)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">{worker.name}</div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span 
                                    className="text-xs px-1.5 py-0.5 rounded-full truncate"
                                    style={{
                                      backgroundColor: statusColor.bg,
                                      color: statusColor.text,
                                      border: `1px solid ${statusColor.border}`
                                    }}
                                  >
                                    {worker.status}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate">
                                    {worker.contact || worker.email || 'No contact'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {!isSelected && (
                              <Plus className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Date */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Assignment Date
                <span className="text-red-500 ml-1">*</span>
              </div>
            </label>
            <input
              type="date"
              value={data.assignmentDate}
              onChange={(e) => handleInputChange('assignmentDate', e.target.value)}
              className="w-full px-3 py-2 rounded text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">
              <div className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-500" />
                Notes (Optional)
              </div>
            </label>
            <textarea
              value={data.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 rounded text-sm border border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
              rows={3}
              placeholder="Add any special instructions or notes about this assignment..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              Max 500 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Required fields</span> are marked with *
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitDisabled}
                className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign {selectedWorkers.length} Worker{selectedWorkers.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDialog;