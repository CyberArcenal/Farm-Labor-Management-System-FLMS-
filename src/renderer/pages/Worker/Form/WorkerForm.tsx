
// pages/WorkerFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, X, User, Phone, Mail, MapPin, Calendar,
    AlertCircle, CheckCircle, XCircle, Loader, Hash, FileText,
    Users, Briefcase, CreditCard, TrendingUp, Info
} from 'lucide-react';
import type { WorkerData } from '../../../apis/worker';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';
import workerAPI from '../../../apis/worker';
import { showError, showSuccess } from '../../../utils/notification';
import { dialogs } from '../../../utils/dialogs';
import KabisilyaSelect from '../../../components/Selects/Kabisilya';

interface WorkerFormPageProps { }

interface FormData {
    name: string;
    contact: string;
    email: string;
    address: string;
    status: 'active' | 'inactive' | 'on-leave' | 'terminated';
    hireDate: string;
    kabisilyaId: number | null;
    notes: string;
}

const WorkerFormPage: React.FC<WorkerFormPageProps> = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        contact: '',
        email: '',
        address: '',
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
        kabisilyaId: null,
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [kabisilyas, setKabisilyas] = useState<KabisilyaData[]>([]);
    const [worker, setWorker] = useState<WorkerData | null>(null);
    const [financialInfo, setFinancialInfo] = useState<{
        totalDebt: number;
        totalPaid: number;
        currentBalance: number;
    } | null>(null);

    const mode = id ? 'edit' : 'add';

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch kabisilyas for dropdown
                const kabisilyaResponse = await kabisilyaAPI.getAll();
                if (kabisilyaResponse.status && kabisilyaResponse.data) {
                    setKabisilyas(kabisilyaResponse.data);
                }

                // Fetch worker data if in edit mode
                if (mode === 'edit' && id) {
                    const workerId = parseInt(id);
                    const response = await workerAPI.getWorkerById(workerId);

                    if (response.status) {
                        const workerData = response.data.worker;
                        setWorker(workerData);
                        setFormData({
                            name: workerData.name || '',
                            contact: workerData.contact || '',
                            email: workerData.email || '',
                            address: workerData.address || '',
                            status: workerData.status,
                            hireDate: workerData.hireDate ? new Date(workerData.hireDate).toISOString().split('T')[0] : '',
                            kabisilyaId: workerData.kabisilya?.id || null,
                            notes: ''
                        });

                        // Set financial info
                        setFinancialInfo({
                            totalDebt: workerData.totalDebt || 0,
                            totalPaid: workerData.totalPaid || 0,
                            currentBalance: workerData.currentBalance || 0
                        });
                    } else {
                        showError('Worker not found');
                        navigate('/workers');
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
            newErrors.name = 'Worker name is required';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (formData.contact && !/^[\d\s\-\+\(\)]{7,}$/.test(formData.contact)) {
            newErrors.contact = 'Invalid contact number';
        }

        if (formData.name.length > 100) {
            newErrors.name = 'Name must be less than 100 characters';
        }

        if (formData.contact.length > 20) {
            newErrors.contact = 'Contact must be less than 20 characters';
        }

        if (formData.email.length > 100) {
            newErrors.email = 'Email must be less than 100 characters';
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
            if (formData.kabisilyaId) workerData.kabisilyaId = formData.kabisilyaId;
            if (formData.notes.trim()) workerData.notes = formData.notes.trim();

            let response;

            if (mode === 'add') {
                // Create new worker with validation
                response = await workerAPI.createWorkerWithValidation(workerData);
            } else if (mode === 'edit' && id) {
                // Update existing worker with validation
                workerData.id = parseInt(id);
                response = await workerAPI.updateWorkerWithValidation(workerData);
            }

            if (response?.status) {
                const view = await dialogs.confirm({
                    title: 'Success',
                    message: mode === 'add'
                        ? 'Worker created successfully!'
                        : 'Worker updated successfully!',
                    cancelText: 'Return',
                    confirmText: 'View Worker',
                    icon: 'success'
                });

                if (view) {
                    navigate(`/workers/${response.data.worker.id}`);
                } else {
                    window.history.back();
                }
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
            navigate('/workers');
        }
    };

    // Get selected kabisilya details
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
                            {mode === 'add' ? 'Loading form...' : 'Loading worker data...'}
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
                    <div className="bg-gradient-to-r from-[var(--accent-sky-light)] to-[var(--accent-green-light)] rounded-2xl p-6 mb-6 border border-[var(--border-color)] shadow-sm">
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
                                    <User className="w-6 h-6" />
                                    {mode === 'add' ? 'Add New Worker' : 'Edit Worker'}
                                </h1>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {mode === 'add'
                                        ? 'Add a new worker to manage assignments and track performance'
                                        : `Editing Worker #${worker?.id || ''} - ${worker?.name || 'Worker'}`}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Name</span>
                                </div>
                                <p className="text-sm font-medium mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                                    {formData.name || 'Not set'}
                                </p>
                            </div>
                            <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Status</span>
                                </div>
                                <div className="mt-1">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${formData.status === 'active' ? 'status-badge-active' :
                                        formData.status === 'inactive' ? 'status-badge-inactive' :
                                            formData.status === 'on-leave' ? 'status-badge-pending' :
                                                'status-badge-cancelled'
                                        }`}>
                                        {formData.status.replace('-', ' ').charAt(0).toUpperCase() + formData.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Balance</span>
                                </div>
                                <p className="text-sm font-medium mt-1" style={{
                                    color: financialInfo?.currentBalance && financialInfo.currentBalance > 0
                                        ? 'var(--accent-rust)'
                                        : 'var(--text-primary)'
                                }}>
                                    ₱{financialInfo?.currentBalance.toLocaleString() || '0.00'}
                                </p>
                            </div>
                            <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Kabisilya</span>
                                </div>
                                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                    {selectedKabisilya?.name || 'Not assigned'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-8">
                            {/* Personal Information Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-sky-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <User className="w-5 h-5" style={{ color: 'var(--accent-sky)' }} />
                                        Personal Information
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Enter the worker's personal details
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="name">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className={`w-full p-3 rounded-lg text-sm ${errors.name ? 'border-red-500' : ''}`}
                                            style={{
                                                backgroundColor: 'var(--input-bg)',
                                                border: `1px solid ${errors.name ? '#ef4444' : 'var(--input-border)'}`,
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder="Enter full name"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                                htmlFor="contact">
                                                Contact Number
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                    <Phone className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                </div>
                                                <input
                                                    id="contact"
                                                    type="text"
                                                    value={formData.contact}
                                                    onChange={(e) => handleChange('contact', e.target.value)}
                                                    className={`w-full pl-10 p-3 rounded-lg text-sm ${errors.contact ? 'border-red-500' : ''}`}
                                                    style={{
                                                        backgroundColor: 'var(--input-bg)',
                                                        border: `1px solid ${errors.contact ? '#ef4444' : 'var(--input-border)'}`,
                                                        color: 'var(--text-primary)'
                                                    }}
                                                    placeholder="e.g., 09123456789"
                                                />
                                            </div>
                                            {errors.contact && (
                                                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.contact}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                                htmlFor="email">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                    <Mail className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                </div>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    className={`w-full pl-10 p-3 rounded-lg text-sm ${errors.email ? 'border-red-500' : ''}`}
                                                    style={{
                                                        backgroundColor: 'var(--input-bg)',
                                                        border: `1px solid ${errors.email ? '#ef4444' : 'var(--input-border)'}`,
                                                        color: 'var(--text-primary)'
                                                    }}
                                                    placeholder="e.g., worker@example.com"
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="address">
                                            Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3">
                                                <MapPin className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                            <textarea
                                                id="address"
                                                value={formData.address}
                                                onChange={(e) => handleChange('address', e.target.value)}
                                                className={`w-full pl-10 p-3 rounded-lg text-sm min-h-[80px] resize-y ${errors.address ? 'border-red-500' : ''}`}
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: `1px solid ${errors.address ? '#ef4444' : 'var(--input-border)'}`,
                                                    color: 'var(--text-primary)'
                                                }}
                                                placeholder="Enter complete address"
                                                rows={3}
                                            />
                                        </div>
                                        {errors.address && (
                                            <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                                                <AlertCircle className="w-3 h-3" />
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Kabisilya Assignment Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-earth-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Users className="w-5 h-5" style={{ color: 'var(--accent-earth)' }} />
                                        Kabisilya Assignment
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Assign this worker to a kabisilya (optional)
                                    </p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                            Select Kabisilya
                                        </label>
                                        <KabisilyaSelect
                                            value={formData.kabisilyaId}
                                            onChange={handleKabisilyaSelect}
                                            placeholder="Select a kabisilya..."
                                        />
                                        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Assigning to a kabisilya helps organize workers into groups
                                        </p>
                                    </div>

                                    {selectedKabisilya && (
                                        <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                        <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            {selectedKabisilya.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs flex items-center gap-1 mt-2" style={{ color: 'var(--text-secondary)' }}>
                                                        <Hash className="w-3 h-3" />
                                                        Kabisilya #{selectedKabisilya.id}
                                                    </p>
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
                            {/* Employment Details Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-gold-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <Briefcase className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                                        Employment Details
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Set employment status and hire date
                                    </p>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Status Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                            Employment Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {(['active', 'inactive', 'on-leave', 'terminated'] as const).map((status) => (
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
                                                                    : status === 'on-leave' ? 'var(--accent-gold-light)'
                                                                        : 'var(--accent-earth-light)'
                                                            : 'var(--card-bg)',
                                                        color: formData.status === status
                                                            ? status === 'active' ? 'var(--accent-green)'
                                                                : status === 'inactive' ? 'var(--accent-rust)'
                                                                    : status === 'on-leave' ? 'var(--accent-gold)'
                                                                        : 'var(--accent-earth)'
                                                            : 'var(--text-secondary)',
                                                        border: `1px solid ${formData.status === status
                                                            ? status === 'active' ? 'var(--accent-green)'
                                                                : status === 'inactive' ? 'var(--accent-rust)'
                                                                    : status === 'on-leave' ? 'var(--accent-gold)'
                                                                        : 'var(--accent-earth)'
                                                            : 'var(--border-color)'}`,
                                                        boxShadow: formData.status === status ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                                    }}
                                                >
                                                    {status === 'active' && <CheckCircle className="w-6 h-6" />}
                                                    {status === 'inactive' && <XCircle className="w-6 h-6" />}
                                                    {status === 'on-leave' && <Calendar className="w-6 h-6" />}
                                                    {status === 'terminated' && <X className="w-6 h-6" />}
                                                    <span className="text-sm font-medium">
                                                        {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1)}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-green)' }}>Active</div>
                                                    <div>Available for work assignments</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-rust)' }}>Inactive</div>
                                                    <div>Temporarily unavailable</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-gold)' }}>On Leave</div>
                                                    <div>On approved leave/vacation</div>
                                                </div>
                                                <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                                                    <div className="font-medium mb-1" style={{ color: 'var(--accent-earth)' }}>Terminated</div>
                                                    <div>No longer employed</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hire Date */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                                            htmlFor="hireDate">
                                            Hire Date
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                                <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                            <input
                                                id="hireDate"
                                                type="date"
                                                value={formData.hireDate}
                                                onChange={(e) => handleChange('hireDate', e.target.value)}
                                                className="w-full pl-10 p-3 rounded-lg text-sm"
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: '1px solid var(--input-border)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Date when worker started employment
                                        </p>
                                    </div>

                                    {/* Financial Preview */}
                                    {financialInfo && (
                                        <div className="p-4 rounded-lg bg-gradient-to-r from-[var(--accent-green-light)] to-[var(--accent-sky-light)] border border-[var(--border-color)]">
                                            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                                                Financial Overview
                                            </h3>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>
                                                        ₱{financialInfo.totalPaid.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                        Total Paid
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
                                                        ₱{financialInfo.totalDebt.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                        Total Debt
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold" style={{
                                                        color: financialInfo.currentBalance > 0
                                                            ? 'var(--accent-rust)'
                                                            : 'var(--accent-green)'
                                                    }}>
                                                        ₱{financialInfo.currentBalance.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                        Current Balance
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes Card */}
                            <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-green-light)] to-transparent">
                                    <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                        <FileText className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                                        Additional Notes
                                    </h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                        Add any relevant information about the worker
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <textarea
                                                id="notes"
                                                value={formData.notes}
                                                onChange={(e) => handleChange('notes', e.target.value)}
                                                className={`w-full p-4 rounded-lg text-sm min-h-[180px] resize-y ${errors.notes ? 'border-red-500' : ''}`}
                                                style={{
                                                    backgroundColor: 'var(--input-bg)',
                                                    border: `1px solid ${errors.notes ? '#ef4444' : 'var(--input-border)'}`,
                                                    color: 'var(--text-primary)'
                                                }}
                                                placeholder="Enter any additional notes about this worker... 
• Special skills or training
• Emergency contact information
• Health or medical conditions
• Work preferences
• Previous experience
• Performance notes
• Any other relevant information"
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
                                                    Add detailed information to help manage the worker effectively
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
                                        {mode === 'add' ? 'Creating Worker...' : 'Updating Worker...'}
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
                </form>
            </div>
        </div>
    );
};

export default WorkerFormPage;