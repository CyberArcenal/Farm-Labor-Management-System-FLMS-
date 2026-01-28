// PitakFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, Save, MapPin, TreePalm, AlertCircle, CheckCircle, XCircle,
    Loader, Calendar, Hash, FileText, LandPlot, Ruler, Info, Grid3x3,
    Users, Search, Filter
} from 'lucide-react';
import type { PitakData } from '../../../apis/pitak';
import type { BukidData } from '../../../apis/bukid';
import bukidAPI from '../../../apis/bukid';
import pitakAPI from '../../../apis/pitak';
import { showError, showSuccess } from '../../../utils/notification';
import BukidSelect from '../../../components/Selects/Bukid';

interface PitakFormDialogProps {
    id?: number;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess?: (pitak: PitakData) => void;
}

interface FormData {
    bukidId: number | null;
    location: string;
    totalLuwang: number;
    status: 'active' | 'inactive' | 'harvested';
    notes: string;
}

const PitakFormDialog: React.FC<PitakFormDialogProps> = ({
    id,
    mode,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        bukidId: null,
        location: '',
        totalLuwang: 0,
        status: 'active',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [bukids, setBukids] = useState<BukidData[]>([]);
    const [pitak, setPitak] = useState<PitakData | null>(null);
    const [capacityInfo, setCapacityInfo] = useState<{
        remaining: number;
        utilization: number;
    } | null>(null);
    const [luwangExamples] = useState([
        { value: 1.33, label: "1.33 LuWang (Standard)" },
        { value: 0.97, label: "0.97 LuWang (Small)" },
        { value: 2.50, label: "2.50 LuWang (Large)" },
        { value: 0.25, label: "0.25 LuWang (Quarter)" }
    ]);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch bukids for dropdown
                const bukidResponse = await bukidAPI.getAll({ limit: 1000 });
                if (bukidResponse.status && bukidResponse.data?.bukids) {
                    setBukids(bukidResponse.data.bukids);
                }

                // Fetch pitak data if in edit mode
                if (mode === 'edit' && id) {
                    const pitakId = id;
                    const response = await pitakAPI.getPitakById(pitakId);

                    if (response.status) {
                        const pitakData = response.data;
                        setPitak(pitakData);
                        setFormData({
                            bukidId: pitakData.bukidId,
                            location: pitakData.location || '',
                            totalLuwang: pitakData.totalLuwang,
                            status: pitakData.status,
                            notes: pitakData.notes || ''
                        });

                        // Fetch capacity info
                        if (pitakData.stats) {
                            setCapacityInfo({
                                remaining: pitakData.totalLuwang - (pitakData.stats.assignments.totalLuWangAssigned || 0),
                                utilization: pitakData.stats.utilizationRate || 0
                            });
                        }
                    } else {
                        showError('Pitak not found');
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
    const handleChange = (field: keyof FormData, value: string | number | null) => {
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

        // Recalculate capacity if bukid changes
        if (field === 'bukidId' && value) {
            calculateCapacity(value as number);
        }
    };

    // Calculate capacity for selected bukid
    const calculateCapacity = async (bukidId: number) => {
        try {
            const bukid = bukids.find(b => b.id === bukidId);
            if (bukid) {
                setCapacityInfo({
                    remaining: 100,
                    utilization: 0
                });
            }
        } catch (error) {
            console.error('Error calculating capacity:', error);
        }
    };

    // Handle bukid selection
    const handleBukidSelect = (bukidId: number, bukidName: string, bukidData?: BukidData) => {
        handleChange('bukidId', bukidId);
    };

    // Handle LuWang example selection
    const handleLuWangExample = (value: number) => {
        handleChange('totalLuwang', value);
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.bukidId) {
            newErrors.bukidId = 'Please select a farm (bukid)';
        }

        if (!formData.totalLuwang || formData.totalLuwang <= 0) {
            newErrors.totalLuwang = 'Total LuWang must be greater than 0';
        } else if (formData.totalLuwang > 1000) {
            newErrors.totalLuwang = 'Total LuWang cannot exceed 1,000';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.totalLuwang.toString())) {
            newErrors.totalLuwang = 'Total LuWang must have up to 2 decimal places';
        }

        if (formData.location.length > 255) {
            newErrors.location = 'Location must be less than 255 characters';
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

            // Prepare data for API
            const pitakData: any = {
                bukidId: formData.bukidId!,
                location: formData.location.trim() || null,
                totalLuwang: parseFloat(formData.totalLuwang.toFixed(2)),
                status: formData.status
            };

            // Add notes if available
            if (formData.notes.trim()) {
                pitakData.notes = formData.notes.trim();
            }

            let response;

            if (mode === 'add') {
                // Create new pitak with validation
                response = await pitakAPI.validateAndCreate(pitakData);
            } else if (mode === 'edit' && id) {
                // Update existing pitak with validation
                response = await pitakAPI.validateAndUpdate(id, pitakData);
            }

            if (response?.status) {
                showSuccess(
                    mode === 'add'
                        ? 'Pitak created successfully!'
                        : 'Pitak updated successfully!'
                );

                if (onSuccess && response.data) {
                    onSuccess(response.data);
                }
                
                onClose();
            } else {
                throw new Error(response?.message || 'Failed to save pitak');
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);
            showError(error.message || 'Failed to save pitak');
        } finally {
            setSubmitting(false);
        }
    };

    // Get selected bukid details
    const selectedBukid = bukids.find(b => b.id === formData.bukidId);

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                            <LandPlot className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                {mode === 'add' ? 'Add New Pitak' : 'Edit Pitak'}
                            </h3>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                {mode === 'edit' && (
                                    <>
                                        <span>ID: #{id}</span>
                                        <span>•</span>
                                    </>
                                )}
                                <span>{mode === 'add' ? 'Create new plot' : 'Edit existing plot'}</span>
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">
                                {mode === 'add' ? 'Loading form...' : 'Loading pitak data...'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <TreePalm className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600">Farm</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {selectedBukid?.name || 'Not selected'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                            <Grid3x3 className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600">LuWang Size</div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formData.totalLuwang > 0 ? `${formData.totalLuwang.toFixed(2)} LuWang` : 'Not set'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <Ruler className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600">Status</div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${formData.status === 'active'
                                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                                        : formData.status === 'inactive'
                                                            ? 'bg-gray-100 text-gray-800 border border-gray-200'
                                                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    }`}>
                                                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Farm Selection */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <TreePalm className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Farm Selection</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700">
                                                        Select Farm (Bukid) <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <BukidSelect
                                                            value={formData.bukidId}
                                                            onChange={handleBukidSelect}
                                                            placeholder="Search or select a farm..."
                                                            showDetails={true}
                                                            className="w-full"
                                                        />
                                                        {errors.bukidId && (
                                                            <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.bukidId}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {selectedBukid && (
                                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <TreePalm className="w-3.5 h-3.5 text-blue-600" />
                                                                    <h3 className="text-xs font-semibold text-gray-900">
                                                                        {selectedBukid.name}
                                                                    </h3>
                                                                </div>
                                                                <div className="text-xs text-gray-600 space-y-1">
                                                                    {selectedBukid.location && (
                                                                        <div className="flex items-center gap-1">
                                                                            <MapPin className="w-3 h-3" />
                                                                            {selectedBukid.location}
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-2">
                                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${selectedBukid.status === 'active'
                                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                                            : selectedBukid.status === 'inactive'
                                                                                ? 'bg-gray-100 text-gray-800 border border-gray-200'
                                                                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                                            }`}>
                                                                            {selectedBukid.status.charAt(0).toUpperCase() + selectedBukid.status.slice(1)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleChange('bukidId', null)}
                                                                className="p-1 rounded hover:bg-white transition-colors text-gray-500"
                                                                title="Remove"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* LuWang Configuration */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Ruler className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">LuWang Configuration</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="totalLuwang">
                                                        Total LuWang Capacity <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                id="totalLuwang"
                                                                type="number"
                                                                min="0.01"
                                                                max="1000"
                                                                step="0.01"
                                                                value={formData.totalLuwang || ''}
                                                                onChange={(e) => handleChange('totalLuwang', parseFloat(e.target.value) || 0)}
                                                                className={`flex-1 px-3 py-2 rounded text-sm border ${errors.totalLuwang ? 'border-red-500' : 'border-gray-300'
                                                                    } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                                                                placeholder="Enter LuWang (e.g., 1.33 or 0.97)"
                                                                required
                                                            />
                                                            <div className="px-3 py-2 rounded bg-yellow-100 text-sm font-medium text-yellow-800 border border-yellow-300">
                                                                LuWang
                                                            </div>
                                                        </div>
                                                        {errors.totalLuwang && (
                                                            <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.totalLuwang}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Enter decimal values for precise measurements (max 2 decimal places)
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Quick Examples */}
                                                <div>
                                                    <h3 className="text-xs font-medium mb-2 text-gray-700">
                                                        Common LuWang Sizes
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {luwangExamples.map((example, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => handleLuWangExample(example.value)}
                                                                className={`p-2 rounded text-sm text-left transition-all ${formData.totalLuwang === example.value
                                                                        ? 'bg-green-100 border-2 border-green-500'
                                                                        : 'bg-gray-100 border border-gray-300 hover:border-green-500'
                                                                    }`}
                                                            >
                                                                <div className="font-medium text-gray-900">
                                                                    {example.value.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs mt-0.5 text-gray-600">
                                                                    {example.label.split('(')[1].replace(')', '')}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Capacity Preview */}
                                                {formData.totalLuwang > 0 && (
                                                    <div className="p-3 rounded bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                                                        <h3 className="text-xs font-medium mb-2 text-gray-700">
                                                            Capacity Preview
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="text-center">
                                                                <div className="text-xl font-bold text-green-700">
                                                                    {formData.totalLuwang.toFixed(2)}
                                                                </div>
                                                                <div className="text-xs mt-0.5 text-gray-600">
                                                                    Total LuWang
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="text-xl font-bold"
                                                                    style={{
                                                                        color: capacityInfo?.utilization && capacityInfo.utilization > 80
                                                                            ? '#c53030'
                                                                            : capacityInfo?.utilization && capacityInfo.utilization > 50
                                                                                ? '#d69e2e'
                                                                                : '#2a623d'
                                                                    }}>
                                                                    {capacityInfo?.utilization ? `${capacityInfo.utilization}%` : '0%'}
                                                                </div>
                                                                <div className="text-xs mt-0.5 text-gray-600">
                                                                    Capacity Utilization
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Location & Status */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <MapPin className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Location & Status</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="location">
                                                        Specific Location (Optional)
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="location"
                                                            type="text"
                                                            value={formData.location}
                                                            onChange={(e) => handleChange('location', e.target.value)}
                                                            className={`w-full px-3 py-2 rounded text-sm border ${errors.location ? 'border-red-500' : 'border-gray-300'
                                                                } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                                                            placeholder="E.g., 'Northwest corner', 'Section A-3', 'Near the irrigation pump'"
                                                        />
                                                        {errors.location && (
                                                            <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                                <AlertCircle className="w-3 h-3" />
                                                                {errors.location}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Use descriptive location names to help workers find the plot easily
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status Selection */}
                                                <div>
                                                    <label className="block text-xs font-medium mb-2 text-gray-700">
                                                        Plot Status <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {(['active', 'inactive', 'harvested'] as const).map((status) => (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                onClick={() => handleChange('status', status)}
                                                                className={`p-3 rounded border flex flex-col items-center justify-center gap-1 ${formData.status === status
                                                                        ? 'ring-2 ring-green-500 ring-offset-1'
                                                                        : 'border-gray-300 hover:border-green-500'
                                                                    } transition-all`}
                                                            >
                                                                {status === 'active' && (
                                                                    <CheckCircle className={`w-4 h-4 ${formData.status === status ? 'text-green-600' : 'text-gray-400'}`} />
                                                                )}
                                                                {status === 'inactive' && (
                                                                    <XCircle className={`w-4 h-4 ${formData.status === status ? 'text-gray-600' : 'text-gray-400'}`} />
                                                                )}
                                                                {status === 'harvested' && (
                                                                    <Calendar className={`w-4 h-4 ${formData.status === status ? 'text-yellow-600' : 'text-gray-400'}`} />
                                                                )}
                                                                <span className={`text-xs font-medium ${formData.status === status
                                                                        ? status === 'active' ? 'text-green-700'
                                                                            : status === 'inactive' ? 'text-gray-700'
                                                                                : 'text-yellow-700'
                                                                        : 'text-gray-600'
                                                                    }`}>
                                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 text-xs text-gray-600 space-y-2">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="p-2 rounded bg-green-50">
                                                                <div className="font-medium text-green-700 mb-0.5">Active</div>
                                                                <div>Available for new assignments</div>
                                                            </div>
                                                            <div className="p-2 rounded bg-gray-50">
                                                                <div className="font-medium text-gray-700 mb-0.5">Inactive</div>
                                                                <div>Not available for assignments</div>
                                                            </div>
                                                            <div className="p-2 rounded bg-yellow-50">
                                                                <div className="font-medium text-yellow-700 mb-0.5">Harvested</div>
                                                                <div>Completed harvesting cycle</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Additional Notes</h4>
                                            </div>
                                            <div>
                                                <textarea
                                                    id="notes"
                                                    value={formData.notes}
                                                    onChange={(e) => handleChange('notes', e.target.value)}
                                                    className={`w-full px-3 py-2 rounded text-sm border ${errors.notes ? 'border-red-500' : 'border-gray-300'
                                                        } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                                                    placeholder="Enter any additional notes about this pitak... 
• Soil type and quality
• Special conditions or requirements
• Landmarks for easy identification
• Previous crop history
• Any equipment requirements"
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
                                                        Add detailed information to help manage the plot effectively
                                                    </p>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${formData.notes.length > 1000 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {formData.notes.length}/1000
                                                    </span>
                                                </div>
                                            </div>
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
                                className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-3.5 h-3.5 animate-spin" />
                                        {mode === 'add' ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        {mode === 'add' ? 'Create Pitak' : 'Update Pitak'}
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

export default PitakFormDialog;