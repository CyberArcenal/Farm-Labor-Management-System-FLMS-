// BukidFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, Save, Home, MapPin, FileText, AlertCircle, CheckCircle, XCircle,
    Loader, Users, Ruler, TreePalm, Info, LandPlot, BarChart3, Calendar,
    Hash, User, Search, Filter
} from 'lucide-react';
import { showError, showSuccess } from '../../../utils/notification';
import type { BukidData } from '../../../apis/bukid';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';
import bukidAPI from '../../../apis/bukid';
import KabisilyaSelect from '../../../components/Selects/Kabisilya';

interface BukidFormDialogProps {
    id?: number;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess?: (bukid: BukidData) => void;
}

interface FormData {
    name: string;
    location: string;
    kabisilyaId: number | null;
    status: 'active' | 'inactive' | 'pending';
    notes: string;
}

const BukidFormDialog: React.FC<BukidFormDialogProps> = ({
    id,
    mode,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        location: '',
        kabisilyaId: null,
        status: 'active',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [kabisilyas, setKabisilyas] = useState<KabisilyaData[]>([]);
    const [bukid, setBukid] = useState<BukidData | null>(null);
    const [stats, setStats] = useState<{
        pitakCount: number;
        workerCount: number;
        area: number;
    } | null>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch kabisilyas for dropdown
                const kabisilyaResponse = await kabisilyaAPI.getAll();
                if (kabisilyaResponse.status) {
                    setKabisilyas(kabisilyaResponse.data);
                }

                // Fetch bukid data if in edit mode
                if (mode === 'edit' && id) {
                    const bukidId = id;
                    const response = await bukidAPI.getById(bukidId);

                    if (response.status && response.data.bukid) {
                        const bukidData = response.data.bukid;
                        setBukid(bukidData);
                        setFormData({
                            name: bukidData.name || '',
                            location: bukidData.location || '',
                            kabisilyaId: bukidData.kabisilyaId || null,
                            status: (bukidData.status as 'active' | 'inactive' | 'pending') || 'active',
                            notes: bukidData.notes || ''
                        });

                        // Fetch stats if available
                        if (response.data.stats) {
                            setStats({
                                pitakCount: response.data.stats.totalPitaks || 0,
                                workerCount: response.data.stats.totalWorkers || 0,
                                area: response.data.stats.totalArea || 0
                            });
                        }
                    } else {
                        showError('Bukid not found');
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
    };

    // Handle kabisilya selection
    const handleKabisilyaSelect = (kabisilyaId: number | null) => {
        handleChange('kabisilyaId', kabisilyaId);
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Bukid name is required';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Name must be less than 100 characters';
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
            const bukidData: any = {
                name: formData.name.trim(),
                location: formData.location.trim(),
                kabisilyaId: formData.kabisilyaId,
                status: formData.status,
                notes: formData.notes.trim()
            };

            let response;

            if (mode === 'add') {
                // Create new bukid
                response = await bukidAPI.createWithValidation(bukidData);
            } else if (mode === 'edit' && id) {
                // Update existing bukid
                response = await bukidAPI.updateWithValidation(id, bukidData);
            }

            if (response?.status) {
                showSuccess(
                    mode === 'add'
                        ? 'Bukid created successfully!'
                        : 'Bukid updated successfully!'
                );

                if (onSuccess && response.data.bukid) {
                    onSuccess(response.data.bukid);
                }
                
                onClose();
            } else {
                throw new Error(response?.message || 'Failed to save bukid');
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);
            showError(error.message || 'Failed to save bukid');
        } finally {
            setSubmitting(false);
        }
    };

    // Get selected kabisilya name
    const selectedKabisilya = kabisilyas.find(k => k.id === formData.kabisilyaId);

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
                                {mode === 'add' ? 'Add New Bukid' : 'Edit Bukid'}
                            </h3>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                {mode === 'edit' && (
                                    <>
                                        <span>ID: #{id}</span>
                                        <span>•</span>
                                    </>
                                )}
                                <span>{mode === 'add' ? 'Create new farm land' : 'Edit existing farm land'}</span>
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
                            <p className="text-sm text-gray-600">Loading bukid data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Summary - Only in Edit Mode */}
                            {mode === 'edit' && stats && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                <TreePalm className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-600">Plots</div>
                                                <div className="text-sm font-semibold text-gray-900">{stats.pitakCount} Plots</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-600">Workers</div>
                                                <div className="text-sm font-semibold text-gray-900">{stats.workerCount} Workers</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                                <Ruler className="w-5 h-5 text-yellow-600" />
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
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-6">
                                        {/* Basic Information */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Home className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Basic Information</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="name">
                                                        Bukid Name <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        id="name"
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => handleChange('name', e.target.value)}
                                                        className={`w-full px-3 py-2 rounded text-sm border ${errors.name ? 'border-red-500' : 'border-gray-300'
                                                            } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                                                        placeholder="Enter bukid name (e.g., 'Santol Farm', 'Rice Field 1')"
                                                        required
                                                    />
                                                    {errors.name && (
                                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="location">
                                                        Location
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            id="location"
                                                            type="text"
                                                            value={formData.location}
                                                            onChange={(e) => handleChange('location', e.target.value)}
                                                            className={`w-full px-3 py-2 rounded text-sm border ${errors.location ? 'border-red-500' : 'border-gray-300'
                                                                } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none pl-9`}
                                                            placeholder="Enter location (e.g., 'Brgy. San Roque, Lipa City, Batangas')"
                                                        />
                                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    </div>
                                                    {errors.location && (
                                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            {errors.location}
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Enter the complete address for easy identification
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Kabisilya Assignment */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Users className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Kabisilya Assignment</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <KabisilyaSelect
                                                        value={formData.kabisilyaId}
                                                        onChange={handleKabisilyaSelect}
                                                        placeholder="Search or select a Kabisilya..."
                                                        disabled={submitting}
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Assign this bukid to a kabisilya for management and oversight
                                                    </p>
                                                </div>

                                                {selectedKabisilya && (
                                                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                                                    <h3 className="text-xs font-semibold text-gray-900">
                                                                        {selectedKabisilya.name}
                                                                    </h3>
                                                                </div>
                                                                <div className="text-xs text-gray-600 space-y-1">
                                                                    {selectedKabisilya.phone && (
                                                                        <div className="flex items-center gap-1">
                                                                            📱 {selectedKabisilya.phone}
                                                                        </div>
                                                                    )}
                                                                    {selectedKabisilya.email && (
                                                                        <div className="flex items-center gap-1">
                                                                            ✉️ {selectedKabisilya.email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleChange('kabisilyaId', null)}
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
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-6">
                                        {/* Status */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <BarChart3 className="w-4 h-4 text-gray-500" />
                                                <h4 className="text-sm font-semibold text-gray-900">Status & Management</h4>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-3">
                                                    {(['active', 'inactive', 'pending'] as const).map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleChange('status', status)}
                                                            className={`p-3 rounded border flex flex-col items-center justify-center gap-2 ${formData.status === status
                                                                ? 'ring-2 ring-green-500 ring-offset-1'
                                                                : 'border-gray-300 hover:border-green-500'
                                                                } transition-all`}
                                                        >
                                                            {status === 'active' && (
                                                                <CheckCircle className={`w-5 h-5 ${formData.status === status ? 'text-green-600' : 'text-gray-400'}`} />
                                                            )}
                                                            {status === 'inactive' && (
                                                                <XCircle className={`w-5 h-5 ${formData.status === status ? 'text-gray-600' : 'text-gray-400'}`} />
                                                            )}
                                                            {status === 'pending' && (
                                                                <AlertCircle className={`w-5 h-5 ${formData.status === status ? 'text-yellow-600' : 'text-gray-400'}`} />
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
                                                <div className="text-xs text-gray-600 space-y-2">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="p-2 rounded bg-green-50">
                                                            <div className="font-medium text-green-700 mb-0.5">Active</div>
                                                            <div>Farm is operational and accepting assignments</div>
                                                        </div>
                                                        <div className="p-2 rounded bg-gray-50">
                                                            <div className="font-medium text-gray-700 mb-0.5">Inactive</div>
                                                            <div>Farm is temporarily closed or under maintenance</div>
                                                        </div>
                                                        <div className="p-2 rounded bg-yellow-50">
                                                            <div className="font-medium text-yellow-700 mb-0.5">Pending</div>
                                                            <div>Farm is being prepared or under assessment</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
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
                                                        } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
                                                    placeholder="Enter any additional notes about this bukid... 
• Soil type and conditions
• Irrigation systems available
• Access roads and transportation
• Previous crop history
• Special equipment requirements
• Seasonal considerations
• Water sources and quality"
                                                    rows={5}
                                                />
                                                {errors.notes && (
                                                    <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors.notes}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex justify-between items-center">
                                                    <p className="text-xs text-gray-500">
                                                        Add comprehensive details to help manage the farm effectively
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
                                        {mode === 'add' ? 'Create Bukid' : 'Update Bukid'}
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

export default BukidFormDialog;