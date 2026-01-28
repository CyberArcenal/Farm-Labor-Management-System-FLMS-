// AssignmentFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, Save, Users, Calendar, FileText, AlertCircle, CheckCircle, XCircle,
    Loader, MapPin, Ruler, TreePalm, Info, LandPlot, BarChart3,
    Hash, User, Search, Filter, Target, CheckSquare, Clock, Wrench
} from 'lucide-react';
import { showError, showSuccess } from '../../../utils/notification';
import type { Assignment, Worker, Pitak } from '../../../apis/assignment';
import assignmentAPI from '../../../apis/assignment';
import WorkerSelect from '../../../components/Selects/Worker';
import PitakSelect from '../../../components/Selects/Pitak';

interface AssignmentFormDialogProps {
    id?: number;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess?: (assignment: Assignment) => void;
}

interface FormData {
    workerId: number | null;
    pitakId: number | null;
    luwangCount: number | null;
    assignmentDate: string;
    status: 'active' | 'completed' | 'cancelled';
    notes: string;
}

const AssignmentFormDialog: React.FC<AssignmentFormDialogProps> = ({
    id,
    mode,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        workerId: null,
        pitakId: null,
        luwangCount: null,
        assignmentDate: new Date().toISOString().split('T')[0], // Today's date
        status: 'active',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [workerStats, setWorkerStats] = useState<{
        totalAssignments: number;
        activeAssignments: number;
        averageLuWang: string;
    } | null>(null);
    const [pitakStats, setPitakStats] = useState<{
        totalAssignments: number;
        activeAssignments: number;
        totalLuWang: string;
    } | null>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch assignment data if in edit mode
                if (mode === 'edit' && id) {
                    const response = await assignmentAPI.getAssignmentById(id);

                    if (response.status && response.data) {
                        const assignmentData = response.data;
                        setAssignment(assignmentData);
                        
                        setFormData({
                            workerId: assignmentData.worker?.id || null,
                            pitakId: assignmentData.pitak?.id || null,
                            luwangCount: assignmentData.luwangCount || null,
                            assignmentDate: assignmentData.assignmentDate || new Date().toISOString().split('T')[0],
                            status: assignmentData.status || 'active',
                            notes: assignmentData.notes || ''
                        });

                        // Fetch additional stats if available
                        if (assignmentData.worker?.id) {
                            try {
                                const workerReport = await assignmentAPI.getWorkerPerformanceReport(
                                    assignmentData.worker.id,
                                    {
                                        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
                                        endDate: new Date().toISOString().split('T')[0] // Today
                                    }
                                );
                                
                                if (workerReport.status && workerReport.data?.report?.[0]) {
                                    const workerData = workerReport.data.report[0];
                                    setWorkerStats({
                                        totalAssignments: workerData.totalAssignments || 0,
                                        activeAssignments: 0, // Would need additional API call
                                        averageLuWang: workerData.averageLuWang || '0.00'
                                    });
                                }
                            } catch (error) {
                                console.error('Error fetching worker stats:', error);
                            }
                        }

                        if (assignmentData.pitak?.id) {
                            try {
                                const pitakReport = await assignmentAPI.getPitakSummaryReport(
                                    assignmentData.pitak.id,
                                    {
                                        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
                                        endDate: new Date().toISOString().split('T')[0]
                                    }
                                );
                                
                                if (pitakReport.status && pitakReport.data?.report?.[0]) {
                                    const pitakData = pitakReport.data.report[0];
                                    setPitakStats({
                                        totalAssignments: pitakData.totalAssignments || 0,
                                        activeAssignments: 0, // Would need additional API call
                                        totalLuWang: pitakData.totalLuWang || '0.00'
                                    });
                                }
                            } catch (error) {
                                console.error('Error fetching pitak stats:', error);
                            }
                        }
                    } else {
                        showError('Assignment not found');
                        onClose();
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                showError('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, mode, onClose]);

    // Handle form input changes
    const handleChange = (field: keyof FormData, value: string | number | null | 'active' | 'completed' | 'cancelled') => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.workerId) {
            newErrors.workerId = 'Worker selection is required';
        }

        if (!formData.pitakId) {
            newErrors.pitakId = 'Plot selection is required';
        }

        if (!formData.assignmentDate) {
            newErrors.assignmentDate = 'Assignment date is required';
        } else {
            const selectedDate = new Date(formData.assignmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today && mode === 'add') {
                newErrors.assignmentDate = 'Assignment date cannot be in the past';
            }
        }

        if (formData.luwangCount !== null && formData.luwangCount < 0) {
            newErrors.luwangCount = 'LuWang count cannot be negative';
        }

        if (formData.notes.length > 1000) {
            newErrors.notes = 'Notes must be less than 1000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showError('Please fix the errors in the form');
            return;
        }

        try {
            setSubmitting(true);

            let response;

            if (mode === 'add') {
                // Create new assignment
                response = await assignmentAPI.createAssignmentWithValidation({
                    workerIds: formData.workerId ? [formData.workerId] : [],
                    pitakId: formData.pitakId!,
                    luwangCount: formData.luwangCount || undefined,
                    assignmentDate: formData.assignmentDate,
                    notes: formData.notes.trim() || undefined
                });

                if (response.status && response.data?.assignments?.[0]) {
                    showSuccess('Assignment created successfully!');
                    if (onSuccess) {
                        onSuccess(response.data.assignments[0]);
                    }
                    onClose();
                } else {
                    throw new Error(response.message || 'Failed to create assignment');
                }
            } else if (mode === 'edit' && id) {
                // Update existing assignment
                const updateData: any = {
                    assignmentId: id,
                    assignmentDate: formData.assignmentDate,
                    status: formData.status,
                    notes: formData.notes.trim() || undefined
                };

                // Only include these if they have changed
                if (formData.workerId) updateData.workerId = formData.workerId;
                if (formData.pitakId) updateData.pitakId = formData.pitakId;
                if (formData.luwangCount !== null) updateData.luwangCount = formData.luwangCount;

                response = await assignmentAPI.updateAssignmentWithValidation(updateData);

                if (response.status && response.data) {
                    showSuccess('Assignment updated successfully!');
                    if (onSuccess) {
                        onSuccess(response.data);
                    }
                    onClose();
                } else {
                    throw new Error(response.message || 'Failed to update assignment');
                }
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);
            showError(error.message || 'Failed to save assignment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                {mode === 'add' ? 'Create New Assignment' : 'Edit Assignment'}
                            </h3>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                {mode === 'edit' && (
                                    <>
                                        <span>ID: #{id}</span>
                                        <span>•</span>
                                    </>
                                )}
                                <span>{mode === 'add' ? 'Assign worker to plot' : 'Edit existing assignment'}</span>
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

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-130px)] p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Loading assignment data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Summary - Only in Edit Mode */}
                            {mode === 'edit' && (workerStats || pitakStats) && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {workerStats && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Worker Statistics</div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {workerStats.totalAssignments} Total Assignments
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Avg. LuWang: {workerStats.averageLuWang}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {pitakStats && (
                                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded border border-green-200">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                    <LandPlot className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-600">Plot Statistics</div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {pitakStats.totalAssignments} Total Assignments
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Total LuWang: {pitakStats.totalLuWang}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Worker Assignment */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <User className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Worker Assignment</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="workerId">
                                                        Select Worker <span className="text-red-500">*</span>
                                                    </label>
                                                    <WorkerSelect
                                                        value={formData.workerId}
                                                        onChange={(workerId) => handleChange('workerId', workerId)}
                                                        placeholder="Search or select a worker..."
                                                        disabled={submitting}
                                                        inModal={true}
                                                    />
                                                    {errors.workerId && (
                                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.workerId}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Choose an active worker to assign to this plot
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Plot Assignment */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <LandPlot className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Plot Assignment</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="pitakId">
                                                        Select Plot <span className="text-red-500">*</span>
                                                    </label>
                                                    <PitakSelect
                                                        value={formData.pitakId}
                                                        onChange={(pitakId) => handleChange('pitakId', pitakId)}
                                                        placeholder="Search or select a plot..."
                                                        disabled={submitting}
                                                    />
                                                    {errors.pitakId && (
                                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.pitakId}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Choose the plot where the worker will be assigned
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Assignment Details */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Assignment Details</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="assignmentDate">
                                                        Assignment Date <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        id="assignmentDate"
                                                        type="date"
                                                        value={formData.assignmentDate}
                                                        onChange={(e) => handleChange('assignmentDate', e.target.value)}
                                                        className={`w-full px-3 py-2 rounded text-sm border ${errors.assignmentDate ? 'border-red-500' : 'border-gray-300'
                                                            } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                                                        required
                                                        min={mode === 'add' ? new Date().toISOString().split('T')[0] : undefined}
                                                    />
                                                    {errors.assignmentDate && (
                                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.assignmentDate}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="luwangCount">
                                                        LuWang Count
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="luwangCount"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={formData.luwangCount || ''}
                                                            onChange={(e) => handleChange('luwangCount', e.target.value ? parseFloat(e.target.value) : null)}
                                                            className={`w-full px-3 py-2 rounded text-sm border ${errors.luwangCount ? 'border-red-500' : 'border-gray-300'
                                                                } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none pl-9`}
                                                            placeholder="Enter LuWang count (e.g., 2.5)"
                                                        />
                                                        <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    </div>
                                                    {errors.luwangCount && (
                                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.luwangCount}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Enter the amount of LuWang (work units) for this assignment
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <BarChart3 className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Status</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-3">
                                                    {(['active', 'completed', 'cancelled'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleChange('status', status)}
                                                            className={`p-3 rounded border flex flex-col items-center justify-center gap-2 ${formData.status === status
                                                                ? 'ring-2 ring-blue-500 ring-offset-1'
                                                                : 'border-gray-300 hover:border-blue-500'
                                                                } transition-all`}
                                                            disabled={mode === 'add' && status !== 'active'}
                                                        >
                                                            {status === 'active' && (
                                                                <Clock className={`w-5 h-5 ${formData.status === status ? 'text-blue-600' : 'text-gray-400'}`} />
                                                            )}
                                                            {status === 'completed' && (
                                                                <CheckCircle className={`w-5 h-5 ${formData.status === status ? 'text-green-600' : 'text-gray-400'}`} />
                                                            )}
                                                            {status === 'cancelled' && (
                                                                <XCircle className={`w-5 h-5 ${formData.status === status ? 'text-red-600' : 'text-gray-400'}`} />
                                                            )}
                                                            <span className={`text-xs font-medium ${formData.status === status
                                                                ? status === 'active' ? 'text-blue-700'
                                                                    : status === 'completed' ? 'text-green-700'
                                                                        : 'text-red-700'
                                                                : 'text-gray-600'
                                                                }`}>
                                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="text-xs text-gray-600 space-y-2">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="p-2 rounded bg-blue-50">
                                                            <div className="font-medium text-blue-700 mb-0.5">Active</div>
                                                            <div>Assignment is ongoing and work is in progress</div>
                                                        </div>
                                                        <div className="p-2 rounded bg-green-50">
                                                            <div className="font-medium text-green-700 mb-0.5">Completed</div>
                                                            <div>Work has been finished and assignment is complete</div>
                                                        </div>
                                                        <div className="p-2 rounded bg-red-50">
                                                            <div className="font-medium text-red-700 mb-0.5">Cancelled</div>
                                                            <div>Assignment has been cancelled or terminated</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes - Full width */}
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <h4 className="text-sm font-semibold text-gray-900">Additional Information</h4>
                                    </div>
                                    <div>
                                        <textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => handleChange('notes', e.target.value)}
                                            className={`w-full px-3 py-2 rounded text-sm border ${errors.notes ? 'border-red-500' : 'border-gray-300'
                                                } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                                            placeholder="Enter any additional notes about this assignment... 
• Specific tasks to be performed
• Tools or equipment needed
• Special instructions or precautions
• Expected work duration
• Quality requirements
• Communication protocols"
                                            rows={4}
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.notes}
                                            </p>
                                        )}
                                        <div className="mt-2 flex justify-between items-center">
                                            <p className="text-xs text-gray-500">
                                                Add detailed instructions and information for the worker
                                            </p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${formData.notes.length > 1000 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {formData.notes.length}/1000
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Fields marked with <span className="text-red-500">*</span> are required</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-3 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-3.5 h-3.5 animate-spin" />
                                        {mode === 'add' ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        {mode === 'add' ? 'Create Assignment' : 'Update Assignment'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentFormDialog;