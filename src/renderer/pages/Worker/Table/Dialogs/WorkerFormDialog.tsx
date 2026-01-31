// components/Worker/Dialogs/WorkerFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, Save, User, Phone, Mail, MapPin, Calendar, AlertCircle,
    CheckCircle, Loader, Briefcase, CreditCard, FileText, Info, DollarSign
} from 'lucide-react';
import workerAPI from '../../../../apis/worker';
import { showError, showSuccess } from '../../../../utils/notification';
import { dialogs } from '../../../../utils/dialogs';

interface WorkerFormDialogProps {
    id?: number;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess?: (worker: any) => void;
}

interface FormData {
    name: string;
    contact: string;
    email: string;
    address: string;
    status: 'active' | 'inactive' | 'on-leave' | 'terminated';
    hireDate: string;
    initialBalance: number;
    notes: string;
}

interface ValidationState {
    isValid: boolean;
    isUnique: boolean;
    message: string;
}

const WorkerFormDialog: React.FC<WorkerFormDialogProps> = ({
    id,
    mode,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(mode === 'edit');
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        contact: '',
        email: '',
        address: '',
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
        initialBalance: 0,
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [validationState, setValidationState] = useState<ValidationState>({
        isValid: false,
        isUnique: false,
        message: ''
    });
    const [financialInfo, setFinancialInfo] = useState<{
        totalDebt: number;
        totalPaid: number;
        currentBalance: number;
    } | null>(null);

    // Fetch initial data for edit mode
    useEffect(() => {
        const fetchData = async () => {
            if (mode === 'edit' && id) {
                try {
                    setLoading(true);
                    const response = await workerAPI.getWorkerById(id);

                    if (response.status && response.data?.worker) {
                        const workerData = response.data.worker;
                        setFormData({
                            name: workerData.name || '',
                            contact: workerData.contact || '',
                            email: workerData.email || '',
                            address: workerData.address || '',
                            status: workerData.status || 'active',
                            hireDate: workerData.hireDate ? 
                                new Date(workerData.hireDate).toISOString().split('T')[0] : 
                                new Date().toISOString().split('T')[0],
                            initialBalance: workerData.currentBalance || 0,
                            notes: workerData.notes || ''
                        });

                        // Set financial info
                        setFinancialInfo({
                            totalDebt: workerData.totalDebt || 0,
                            totalPaid: workerData.totalPaid || 0,
                            currentBalance: workerData.currentBalance || 0
                        });
                    } else {
                        showError('Worker not found');
                        onClose();
                    }
                } catch (error) {
                    console.error('Error fetching worker:', error);
                    showError('Failed to load worker data');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [id, mode, onClose]);

    // Handle form input changes with validation
    const handleChange = (field: keyof FormData, value: string | number) => {
        const newFormData = {
            ...formData,
            [field]: value
        };
        setFormData(newFormData);

        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        // Validate name in real-time
        if (field === 'name' && typeof value === 'string' && value.trim().length > 0) {
            // Simple validation for now
            const isValid = value.trim().length >= 2;
            setValidationState({
                isValid,
                isUnique: true, // You can add API check here
                message: isValid ? 'Name is valid' : 'Name must be at least 2 characters'
            });
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Worker name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (formData.name.trim().length > 100) {
            newErrors.name = 'Name must be less than 100 characters';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (formData.contact && !/^[\d\s\-\+\(\)]{7,}$/.test(formData.contact)) {
            newErrors.contact = 'Invalid contact number';
        }

        if (formData.address.length > 255) {
            newErrors.address = 'Address must be less than 255 characters';
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

        if (!await dialogs.confirm({
            title: mode === 'add' ? 'Create Worker' : 'Update Worker',
            message: `Are you sure you want to ${mode === 'add' ? 'create' : 'update'} this worker?`
        })) return;

        try {
            setSubmitting(true);

            // Prepare data for API
            const workerData: any = {
                name: formData.name.trim(),
                status: formData.status
            };

            // Add optional fields if provided
            if (formData.contact.trim()) workerData.contact = formData.contact.trim();
            if (formData.email.trim()) workerData.email = formData.email.trim();
            if (formData.address.trim()) workerData.address = formData.address.trim();
            if (formData.hireDate) workerData.hireDate = formData.hireDate;
            if (formData.notes.trim()) workerData.notes = formData.notes.trim();
            if (formData.initialBalance !== 0) workerData.initialBalance = formData.initialBalance;

            let response;

            if (mode === 'add') {
                // Create new worker
                response = await workerAPI.createWorkerWithValidation(workerData);
            } else if (mode === 'edit' && id) {
                // Update existing worker
                workerData.id = id;
                response = await workerAPI.updateWorkerWithValidation(workerData);
            }

            if (response?.status) {
                showSuccess(
                    mode === 'add' ?
                        'Worker created successfully!' :
                        'Worker updated successfully!'
                );

                if (onSuccess) {
                    onSuccess(response.data?.worker || response.data);
                }
                onClose();
            } else {
                throw new Error(response?.message || 'Failed to save worker');
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);
            showError(error.message || 'Failed to save worker');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4 windows-fade-in">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl border border-gray-200 windows-modal">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 windows-title">
                                {mode === 'add' ? 'Create New Worker' : 'Edit Worker'}
                            </h3>
                            <div className="text-sm text-gray-600 windows-text">
                                {mode === 'add' ? 'Add a new worker to manage assignments and track performance' : 'Update worker details'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors windows-button-secondary"
                        title="Close"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-600 windows-text">Loading worker data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Personal Information */}
                                <div className="space-y-6">
                                    {/* Personal Information Card */}
                                    <div className="windows-card p-5">
                                        <h4 className="text-base font-semibold text-gray-900 mb-4 windows-title flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-600" />
                                            Personal Information
                                        </h4>
                                        <div className="space-y-4">
                                            {/* Name Field */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-700 windows-text" htmlFor="name">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => handleChange('name', e.target.value)}
                                                    className={`windows-input ${errors.name ? 'border-red-500' :
                                                        formData.name && validationState.isValid && validationState.isUnique ?
                                                            'border-green-500' : ''
                                                        }`}
                                                    placeholder="Enter full name (e.g., Juan Dela Cruz)"
                                                    required
                                                    disabled={submitting}
                                                    maxLength={100}
                                                />
                                                
                                                {/* Validation Feedback */}
                                                {formData.name && (
                                                    <div className="mt-2 flex items-center gap-1.5">
                                                        {validationState.isValid && validationState.isUnique ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                                <span className="text-xs text-green-600 windows-text">{validationState.message}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                                <span className="text-xs text-amber-600 windows-text">{validationState.message}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {errors.name && (
                                                    <p className="mt-2 text-xs flex items-center gap-1 text-red-600 windows-text">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Contact and Email Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700 windows-text" htmlFor="contact">
                                                        Contact Number
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            id="contact"
                                                            type="text"
                                                            value={formData.contact}
                                                            onChange={(e) => handleChange('contact', e.target.value)}
                                                            className={`windows-input pl-10! ${errors.contact ? 'border-red-500' : ''}`}
                                                            placeholder="09123456789"
                                                            disabled={submitting}
                                                            maxLength={20}
                                                        />
                                                    </div>
                                                    {errors.contact && (
                                                        <p className="mt-2 text-xs flex items-center gap-1 text-red-600 windows-text">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.contact}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700 windows-text" htmlFor="email">
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                            <Mail className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            id="email"
                                                            type="email"
                                                            value={formData.email}
                                                            onChange={(e) => handleChange('email', e.target.value)}
                                                            className={`windows-input pl-10! ${errors.email ? 'border-red-500' : ''}`}
                                                            placeholder="worker@example.com"
                                                            disabled={submitting}
                                                            maxLength={100}
                                                        />
                                                    </div>
                                                    {errors.email && (
                                                        <p className="mt-2 text-xs flex items-center gap-1 text-red-600 windows-text">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Address Field */}
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-gray-700 windows-text" htmlFor="address">
                                                    Address
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-3 top-3">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <textarea
                                                        id="address"
                                                        value={formData.address}
                                                        onChange={(e) => handleChange('address', e.target.value)}
                                                        className={`windows-input pl-10! min-h-[80px] resize-y ${errors.address ? 'border-red-500' : ''}`}
                                                        placeholder="Enter complete address"
                                                        disabled={submitting}
                                                        rows={3}
                                                        maxLength={255}
                                                    />
                                                </div>
                                                {errors.address && (
                                                    <p className="mt-2 text-xs flex items-center gap-1 text-red-600 windows-text">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.address}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Card */}
                                    <div className="windows-card p-5">
                                        <h4 className="text-base font-semibold text-gray-900 mb-4 windows-title flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            Additional Notes
                                        </h4>
                                        <div>
                                            <textarea
                                                id="notes"
                                                value={formData.notes}
                                                onChange={(e) => handleChange('notes', e.target.value)}
                                                className={`windows-input min-h-[120px] resize-y ${errors.notes ? 'border-red-500' : ''}`}
                                                placeholder="Enter any additional notes about this worker..."
                                                disabled={submitting}
                                                rows={4}
                                                maxLength={1000}
                                            />
                                            {errors.notes && (
                                                <p className="mt-2 text-xs flex items-center gap-1 text-red-600 windows-text">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.notes}
                                                </p>
                                            )}
                                            <div className="mt-3 flex justify-between items-center">
                                                <p className="text-xs text-gray-500 windows-text">
                                                    Add detailed information to help manage the worker effectively
                                                </p>
                                                <span className={`text-xs font-medium px-2 py-1 rounded ${formData.notes.length > 1000 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {formData.notes.length}/1000
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Employment Details */}
                                <div className="space-y-6">
                                    {/* Employment Details Card */}
                                    <div className="windows-card p-5">
                                        <h4 className="text-base font-semibold text-gray-900 mb-4 windows-title flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-amber-600" />
                                            Employment Details
                                        </h4>
                                        <div className="space-y-4">
                                            {/* Status Selection */}
                                            <div>
                                                <label className="block text-sm font-medium mb-3 text-gray-700 windows-text">
                                                    Employment Status <span className="text-red-500">*</span>
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {(['active', 'inactive', 'on-leave', 'terminated'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleChange('status', status)}
                                                            className={`p-3 rounded-lg transition-all flex flex-col items-center justify-center gap-2 ${formData.status === status
                                                                    ? 'ring-2 ring-blue-500 ring-offset-1'
                                                                    : 'opacity-90 hover:opacity-100 hover:scale-[1.02]'
                                                                } windows-button-secondary`}
                                                            style={{
                                                                backgroundColor: formData.status === status
                                                                    ? status === 'active' ? 'rgba(34, 197, 94, 0.1)'
                                                                        : status === 'inactive' ? 'rgba(239, 68, 68, 0.1)'
                                                                            : status === 'on-leave' ? 'rgba(245, 158, 11, 0.1)'
                                                                                : 'rgba(107, 114, 128, 0.1)'
                                                                    : 'white',
                                                            }}
                                                            disabled={submitting}
                                                        >
                                                            {status === 'active' && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                            {status === 'inactive' && <X className="w-5 h-5 text-red-600" />}
                                                            {status === 'on-leave' && <Calendar className="w-5 h-5 text-amber-600" />}
                                                            {status === 'terminated' && <Briefcase className="w-5 h-5 text-gray-600" />}
                                                            <span className="text-sm font-medium windows-text">
                                                                {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1)}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Hire Date and Initial Balance */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700 windows-text" htmlFor="hireDate">
                                                        Hire Date
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            id="hireDate"
                                                            type="date"
                                                            value={formData.hireDate}
                                                            onChange={(e) => handleChange('hireDate', e.target.value)}
                                                            className="windows-input pl-10!"
                                                            disabled={submitting}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-gray-700 windows-text" htmlFor="initialBalance">
                                                        Initial Balance
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            id="initialBalance"
                                                            type="number"
                                                            value={formData.initialBalance}
                                                            onChange={(e) => handleChange('initialBalance', parseFloat(e.target.value) || 0)}
                                                            className="windows-input pl-10!"
                                                            placeholder="0.00"
                                                            disabled={submitting}
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Financial Preview (Edit Mode Only) */}
                                            {mode === 'edit' && financialInfo && (
                                                <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-gray-50 border border-gray-200">
                                                    <h5 className="text-sm font-medium mb-3 text-gray-700 windows-text">
                                                        Financial Overview
                                                    </h5>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-green-600">
                                                                ₱{financialInfo.totalPaid.toLocaleString()}
                                                            </div>
                                                            <div className="text-xs mt-1 text-gray-600 windows-text">
                                                                Total Paid
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold text-amber-600">
                                                                ₱{financialInfo.totalDebt.toLocaleString()}
                                                            </div>
                                                            <div className="text-xs mt-1 text-gray-600 windows-text">
                                                                Total Debt
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-lg font-bold" style={{
                                                                color: financialInfo.currentBalance > 0
                                                                    ? '#ef4444'
                                                                    : '#16a34a'
                                                            }}>
                                                                ₱{financialInfo.currentBalance.toLocaleString()}
                                                            </div>
                                                            <div className="text-xs mt-1 text-gray-600 windows-text">
                                                                Current Balance
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Information Section */}
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-blue-700 windows-text">
                                                <p className="font-medium mb-2">Worker Information</p>
                                                <p>A worker represents an individual employee or laborer who can be:</p>
                                                <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                                    <li>Assigned to specific tasks and farm plots</li>
                                                    <li>Tracked for attendance and work hours</li>
                                                    <li>Managed for debts and payments</li>
                                                    <li>Assigned to Kabisilya groups for organization</li>
                                                    <li>Monitored for performance and productivity</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 windows-text">
                            <AlertCircle className="w-4 h-4" />
                            <span>Fields marked with <span className="text-red-500">*</span> are required</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="windows-button windows-button-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={submitting || !formData.name.trim()}
                                className="windows-button windows-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        {mode === 'add' ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {mode === 'add' ? 'Create Worker' : 'Update Worker'}
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

export default WorkerFormDialog;