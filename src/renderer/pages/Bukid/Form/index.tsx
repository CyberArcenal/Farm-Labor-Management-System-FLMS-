// pages/BukidFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, X, Home, MapPin, FileText, AlertCircle, CheckCircle, XCircle,
    Loader, Users, Calendar, Ruler, TreePalm, Info, ChevronDown, LandPlot, BarChart3
} from 'lucide-react';
import { showError, showSuccess } from '../../../utils/notification';
import { dialogs } from '../../../utils/dialogs';
import type { BukidData } from '../../../apis/bukid';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';
import bukidAPI from '../../../apis/bukid';
import KabisilyaSelect from '../../../components/Selects/Kabisilya';

interface BukidFormPageProps { }

interface FormData {
    name: string;
    location: string;
    kabisilyaId: number | null;
    status: 'active' | 'inactive' | 'pending';
    notes: string;
}

const BukidFormPage: React.FC<BukidFormPageProps> = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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

    const mode = id ? 'edit' : 'add';

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
                    const bukidId = parseInt(id);
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
                        navigate('/farms/bukid');
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
    }, [id, mode, navigate]);

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
                response = await bukidAPI.updateWithValidation(parseInt(id), bukidData);
            }

            if (response?.status) {
                showSuccess(
                    mode === 'add'
                        ? 'Bukid created successfully!'
                        : 'Bukid updated successfully!'
                );

                const view = await dialogs.confirm({
                    title: 'Success',
                    message: mode === 'add'
                        ? 'Bukid created successfully!'
                        : 'Bukid updated successfully!',
                    cancelText: 'Return',
                    confirmText: 'View Bukid',
                    icon: 'success'
                });

                if (view) {
                    navigate('/farms/bukid');
                } else {
                    window.history.back();
                }
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

    // Handle cancel
    const handleCancel = async () => {
        const confirm = await dialogs.confirm({
            title: 'Cancel Form',
            message: 'Are you sure you want to cancel? All changes will be lost.',
            cancelText: 'No',
            confirmText: 'Yes',
            icon: 'warning'
        });

        if (confirm) {
            navigate('/farms/bukid');
        }
    };

    // Get selected kabisilya name
    const selectedKabisilya = kabisilyas.find(k => k.id === formData.kabisilyaId);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-field-pattern">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                            style={{ borderColor: 'var(--accent-green)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Loading bukid data...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-field-pattern">
            <div className="max-w-6xl mx-auto p-4 lg:p-8">
                {/* Header Card */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-[var(--accent-green-light)] to-[var(--accent-earth-light)] rounded-2xl p-6 mb-6 border border-[var(--border-color)] shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg hover:bg-white/50 transition-colors bg-white/80"
                                style={{ border: '1px solid var(--border-color)' }}
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <LandPlot className="w-6 h-6" />
                                    {mode === 'add' ? 'Add New Bukid' : 'Edit Bukid'}
                                </h1>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {mode === 'add'
                                        ? 'Add a new farm land to manage assignments and track productivity'
                                        : `Editing: ${bukid?.name || 'Bukid'}`}
                                </p>
                            </div>
                        </div>

                        {mode === 'edit' && stats && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-center gap-2">
                                        <TreePalm className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Plots</span>
                                    </div>
                                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                        {stats.pitakCount} Plots
                                    </p>
                                </div>
                                <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Workers</span>
                                    </div>
                                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                        {stats.workerCount} Workers
                                    </p>
                                </div>
                                <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                    <div className="flex items-center gap-2">
                                        <Ruler className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Status</span>
                                    </div>
                                    <div className="mt-1">
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
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-8">
                            {/* Basic Information Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-green-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Home className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                                        Basic Information
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Enter the basic details of the farm land
                                    </p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="name">
                                            Bukid Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                className={`w-full p-3 rounded-lg text-sm transition-all ${errors.name ? 'border-red-500' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: `1px solid ${errors.name ? '#ef4444' : 'var(--input-border)'}`,
                                                    color: 'var(--text-primary)'
                                                }}
                                                placeholder="Enter bukid name (e.g., 'Santol Farm', 'Rice Field 1')"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="location">
                                            Location
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="location"
                                                type="text"
                                                value={formData.location}
                                                onChange={(e) => handleChange('location', e.target.value)}
                                                className={`w-full p-3 rounded-lg text-sm ${errors.location ? 'border-red-500' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: `1px solid ${errors.location ? '#ef4444' : 'var(--input-border)'}`,
                                                    color: 'var(--text-primary)'
                                                }}
                                                placeholder="Enter location (e.g., 'Brgy. San Roque, Lipa City, Batangas')"
                                            />
                                            {errors.location && (
                                                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.location}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                                <MapPin className="w-3 h-3" />
                                                Enter the complete address for easy identification
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kabisilya Assignment Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-sky-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Users className="w-5 h-5" style={{ color: 'var(--accent-sky)' }} />
                                        Kabisilya Assignment
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Assign this farm to a Kabisilya manager
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Assign to Kabisilya
                                        </label>

                                        <KabisilyaSelect
                                            value={formData.kabisilyaId}
                                            onChange={handleKabisilyaSelect}
                                            placeholder="Search or select a Kabisilya..."
                                            className="w-full"
                                        />

                                        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                            <Info className="w-3 h-3" />
                                            Assign this bukid to a kabisilya for management and oversight
                                        </p>
                                    </div>

                                    {selectedKabisilya && (
                                        <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            {selectedKabisilya.name}
                                                        </h3>
                                                    </div>
                                                    {selectedKabisilya.phone && (
                                                        <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                                                            📱 {selectedKabisilya.phone}
                                                        </p>
                                                    )}
                                                    {selectedKabisilya.email && (
                                                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                            ✉️ {selectedKabisilya.email}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleChange('kabisilyaId', null)}
                                                    className="p-1.5 rounded-lg hover:bg-white transition-colors"
                                                    style={{ color: 'var(--text-secondary)' }}
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Status Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-gold-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                                        Status & Management
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Set the current status of the farm land
                                    </p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                            Farm Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {(['active', 'inactive', 'pending'] as const).map((status) => (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => handleChange('status', status)}
                                                    className={`p-4 rounded-xl transition-all flex flex-col items-center justify-center gap-2 ${formData.status === status
                                                        ? 'ring-2 ring-offset-2'
                                                        : 'opacity-90 hover:opacity-100 hover:scale-[1.02]'
                                                        }`}
                                                    style={{
                                                        backgroundColor: formData.status === status
                                                            ? status === 'active' ? 'var(--accent-green-light)'
                                                                : status === 'inactive' ? 'var(--accent-rust-light)'
                                                                    : 'var(--accent-gold-light)'
                                                            : 'var(--card-bg)',
                                                        color: formData.status === status
                                                            ? status === 'active' ? 'var(--accent-green)'
                                                                : status === 'inactive' ? 'var(--accent-rust)'
                                                                    : 'var(--accent-gold)'
                                                            : 'var(--text-secondary)',
                                                        border: `1px solid ${formData.status === status
                                                            ? status === 'active' ? 'var(--accent-green)'
                                                                : status === 'inactive' ? 'var(--accent-rust)'
                                                                    : 'var(--accent-gold)'
                                                            : 'var(--border-color)'
                                                            }`,
                                                        boxShadow: formData.status === status ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                                    }}
                                                >
                                                    {status === 'active' && <CheckCircle className="w-6 h-6" />}
                                                    {status === 'inactive' && <XCircle className="w-6 h-6" />}
                                                    {status === 'pending' && <AlertCircle className="w-6 h-6" />}
                                                    <span className="text-sm font-medium">
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-green)' }}>Active</div>
                                                    <div>Farm is operational and accepting assignments</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-rust)' }}>Inactive</div>
                                                    <div>Farm is temporarily closed or under maintenance</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-gold)' }}>Pending</div>
                                                    <div>Farm is being prepared or under assessment</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-earth-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <FileText className="w-5 h-5" style={{ color: 'var(--accent-earth)' }} />
                                        Additional Information
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Add detailed notes about the farm for better management
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <textarea
                                                id="notes"
                                                value={formData.notes}
                                                onChange={(e) => handleChange('notes', e.target.value)}
                                                className={`w-full p-4 rounded-lg text-sm min-h-[180px] resize-y ${errors.notes ? 'border-red-500' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: `1px solid ${errors.notes ? '#ef4444' : 'var(--input-border)'}`,
                                                    color: 'var(--text-primary)'
                                                }}
                                                placeholder="Enter any additional notes about this bukid... 
• Soil type and conditions
• Irrigation systems available
• Access roads and transportation
• Previous crop history
• Special equipment requirements
• Seasonal considerations
• Water sources and quality"
                                                rows={6}
                                            />
                                            {errors.notes && (
                                                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.notes}
                                                </p>
                                            )}
                                            <div className="mt-3 flex justify-between items-center">
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    Add comprehensive details to help manage the farm effectively
                                                </p>
                                                <span className={`text-xs font-medium px-2 py-1 rounded ${formData.notes.length > 1000 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {formData.notes.length}/1000
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-8 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            <AlertCircle className="w-4 h-4" />
                            <span>Fields marked with <span className="text-red-500">*</span> are required</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:shadow-md hover:bg-gray-50 flex items-center gap-2"
                                style={{
                                    backgroundColor: 'white',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                                disabled={submitting}
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-hover) 100%)',
                                    color: 'var(--sidebar-text)',
                                    boxShadow: '0 4px 12px rgba(42, 98, 61, 0.2)'
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        {mode === 'add' ? 'Creating Bukid...' : 'Updating Bukid...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {mode === 'add' ? 'Create Bukid' : 'Update Bukid'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BukidFormPage;