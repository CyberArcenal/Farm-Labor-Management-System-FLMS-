// pages/KabisilyaFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, X, Home, Users, FileText, AlertCircle,
    CheckCircle, XCircle, Loader, ChevronDown
} from 'lucide-react';
import { showError, showSuccess } from '../../../utils/notification';
import { dialogs } from '../../../utils/dialogs';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';

interface KabisilyaFormPageProps { }

interface FormData {
    name: string;
    notes: string;
}

const KabisilyaFormPage: React.FC<KabisilyaFormPageProps> = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [kabisilya, setKabisilya] = useState<KabisilyaData | null>(null);
    const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
    const [checkingName, setCheckingName] = useState(false);

    const mode = id ? 'edit' : 'add';

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch kabisilya data if in edit mode
                if (mode === 'edit' && id) {
                    const kabisilyaId = parseInt(id);
                    const response = await kabisilyaAPI.getById(kabisilyaId);

                    if (response.status && response.data) {
                        const kabisilyaData = response.data;
                        setKabisilya(kabisilyaData);
                        setFormData({
                            name: kabisilyaData.name || '',
                            notes: kabisilyaData.notes || ''
                        });
                    } else {
                        showError('Kabisilya not found');
                        navigate('/kabisilyas');
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

    // Check if name is available (for edit mode, exclude current ID)
    useEffect(() => {
        const checkNameAvailability = async () => {
            if (formData.name.trim().length >= 2) {
                setCheckingName(true);
                try {
                    const response = await kabisilyaAPI.checkNameExists(
                        formData.name.trim(),
                        mode === 'edit' && id ? parseInt(id) : undefined
                    );
                    setNameAvailable(response.data); // true if available, false if exists
                } catch (error) {
                    console.error('Error checking name:', error);
                    setNameAvailable(null);
                } finally {
                    setCheckingName(false);
                }
            } else {
                setNameAvailable(null);
            }
        };

        const timeoutId = setTimeout(() => {
            if (formData.name.trim() !== kabisilya?.name) {
                checkNameAvailability();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData.name, id, kabisilya?.name, mode]);

    // Handle form input changes
    const handleChange = (field: keyof FormData, value: string) => {
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

        if (!formData.name.trim()) {
            newErrors.name = 'Kabisilya name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Name must be less than 100 characters';
        } else if (nameAvailable === false) {
            newErrors.name = 'Kabisilya name already exists';
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
                // Create new kabisilya
                response = await kabisilyaAPI.create(formData.name.trim());
            } else if (mode === 'edit' && id) {
                // Update existing kabisilya
                response = await kabisilyaAPI.update(parseInt(id), formData.name.trim());
            }

            if (response?.status) {
                showSuccess(
                    mode === 'add'
                        ? 'Kabisilya created successfully!'
                        : 'Kabisilya updated successfully!'
                );

                const view = await dialogs.confirm({
                    title: 'Success',
                    message: mode === 'add'
                        ? 'Kabisilya created successfully!'
                        : 'Kabisilya updated successfully!',
                    cancelText: 'Return',
                    confirmText: 'View Kabisilya',
                    icon: 'success'
                });

                if (view) {
                    navigate(`/kabisilyas/${response.data.id}`);
                } else {
                    window.history.back();
                }
            } else {
                throw new Error(response?.message || 'Failed to save kabisilya');
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);
            showError(error.message || 'Failed to save kabisilya');
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
            navigate('/kabisilyas');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
                            style={{ borderColor: 'var(--accent-green)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Loading kabisilya data...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--card-bg)' }}>
            <div className="max-w-4xl mx-auto p-4 lg:p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={handleCancel}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ border: '1px solid var(--border-color)' }}
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {mode === 'add' ? 'Add New Kabisilya' : 'Edit Kabisilya'}
                        </h1>
                    </div>

                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {mode === 'add'
                            ? 'Add a new kabisilya to manage workers and farm assignments'
                            : `Editing: ${kabisilya?.name || 'Kabisilya'}`}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Basic Information Card */}
                            <div className="p-5 rounded-xl"
                                style={{
                                    backgroundColor: 'var(--card-secondary-bg)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <Users className="w-5 h-5" />
                                    Basic Information
                                </h2>

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="name">
                                            Kabisilya Name *
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                className={`w-full p-3 rounded-lg text-sm transition-all pr-10 ${errors.name ? 'border-red-500' :
                                                    nameAvailable === true && formData.name.length >= 2 ? 'border-green-500' : ''
                                                    }`}
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: `1px solid ${errors.name ? '#ef4444' :
                                                        nameAvailable === true && formData.name.length >= 2 ? '#10b981' :
                                                            'var(--input-border)'
                                                        }`,
                                                    color: 'var(--text-primary)'
                                                }}
                                                placeholder="Enter kabisilya name"
                                                required
                                            />
                                            {checkingName && (
                                                <div className="absolute right-3 top-3">
                                                    <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--text-secondary)' }} />
                                                </div>
                                            )}
                                            {nameAvailable === true && formData.name.length >= 2 && !checkingName && (
                                                <div className="absolute right-3 top-3">
                                                    <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                                                </div>
                                            )}
                                            {nameAvailable === false && !checkingName && (
                                                <div className="absolute right-3 top-3">
                                                    <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                                                </div>
                                            )}
                                        </div>
                                        {errors.name && (
                                            <p className="mt-1 text-xs flex items-center gap-1"
                                                style={{ color: 'var(--accent-rust)' }}>
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.name}
                                            </p>
                                        )}
                                        {!errors.name && formData.name.length > 0 && (
                                            <div className="mt-2 flex justify-between">
                                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    {nameAvailable === true ? '✓ Name is available' :
                                                        nameAvailable === false ? '✗ Name already exists' :
                                                            'Enter at least 2 characters'}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {formData.name.length}/100
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Information */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2"
                                            style={{ color: 'var(--text-secondary)' }}>
                                            Status
                                        </label>
                                        <div className="p-3 rounded-lg" style={{
                                            backgroundColor: 'var(--card-hover-bg)',
                                            border: '1px solid var(--border-light)'
                                        }}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                    {mode === 'edit' && kabisilya ? 'Existing Record' : 'New Record'}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${mode === 'edit' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {mode === 'edit' ? 'Active' : 'To be created'}
                                                </span>
                                            </div>
                                            {mode === 'edit' && kabisilya && (
                                                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                    Created on {new Date(kabisilya.createdAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Notes */}
                        <div className="space-y-6">
                            <div className="p-5 rounded-xl h-full"
                                style={{
                                    backgroundColor: 'var(--card-secondary-bg)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"
                                    style={{ color: 'var(--text-primary)' }}>
                                    <FileText className="w-5 h-5" />
                                    Additional Information
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2"
                                            style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="notes">
                                            Notes
                                        </label>
                                        <textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => handleChange('notes', e.target.value)}
                                            className={`w-full p-3 rounded-lg text-sm min-h-[200px] resize-y ${errors.notes ? 'border-red-500' : ''
                                                }`}
                                            style={{
                                                backgroundColor: 'var(--input-bg)',
                                                border: `1px solid ${errors.notes ? '#ef4444' : 'var(--input-border)'}`,
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder="Enter any additional notes about this kabisilya..."
                                            rows={8}
                                        />
                                        {errors.notes && (
                                            <p className="mt-1 text-xs flex items-center gap-1"
                                                style={{ color: 'var(--accent-rust)' }}>
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.notes}
                                            </p>
                                        )}
                                        <div className="mt-2 flex justify-between">
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                Add details about responsibilities, special instructions, etc.
                                            </p>
                                            <span className={`text-xs ${formData.notes.length > 1000 ? 'text-red-500' : 'text-gray-500'
                                                }`}>
                                                {formData.notes.length}/1000
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t"
                        style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:shadow-md"
                            style={{
                                backgroundColor: 'var(--card-secondary-bg)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || checkingName}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            {submitting ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    {mode === 'add' ? 'Creating...' : 'Updating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {mode === 'add' ? 'Create Kabisilya' : 'Update Kabisilya'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KabisilyaFormPage;