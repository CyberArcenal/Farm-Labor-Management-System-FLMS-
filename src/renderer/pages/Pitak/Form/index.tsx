// pages/PitakFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, X, MapPin, TreePalm, AlertCircle, CheckCircle, XCircle,
  Loader, BarChart3, Calendar, ChevronDown, Hash, FileText, LandPlot,
  Ruler, Info, Grid3x3
} from 'lucide-react';
import type { PitakData } from '../../../apis/pitak';
import type { BukidData } from '../../../apis/bukid';
import bukidAPI from '../../../apis/bukid';
import pitakAPI from '../../../apis/pitak';
import { showError, showSuccess } from '../../../utils/notification';
import { dialogs } from '../../../utils/dialogs';
import BukidSelect from '../../../components/Selects/Bukid';

interface PitakFormPageProps { }

interface FormData {
  bukidId: number | null;
  location: string;
  totalLuwang: number;
  status: 'active' | 'inactive' | 'harvested';
  notes: string;
}

const PitakFormPage: React.FC<PitakFormPageProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const mode = id ? 'edit' : 'add';

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
          const pitakId = parseInt(id);
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
            navigate('/farms/pitak');
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
        // Here you could add logic to check existing pitaks in the bukid
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
        response = await pitakAPI.validateAndUpdate(parseInt(id), pitakData);
      }

      if (response?.status) {
        showSuccess(
          mode === 'add'
            ? 'Pitak created successfully!'
            : 'Pitak updated successfully!'
        );

        const view = await dialogs.confirm({
          title: 'Success',
          message: mode === 'add'
            ? 'Pitak created successfully!'
            : 'Pitak updated successfully!',
          cancelText: 'Return',
          confirmText: 'View Pitak',
          icon: 'success'
        });

        if (view) {
          navigate(`/farms/pitak/${response.data.id}`);
        } else {
          window.history.back();
        }
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
      navigate('/farms/pitak');
    }
  };

  // Get selected bukid details
  const selectedBukid = bukids.find(b => b.id === formData.bukidId);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-field-pattern">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: 'var(--accent-green)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'add' ? 'Loading form...' : 'Loading pitak data...'}
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
                  {mode === 'add' ? 'Add New Pitak' : 'Edit Pitak'}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {mode === 'add'
                    ? 'Add a new plot to track assignments and LuWang capacity'
                    : `Editing Pitak #${pitak?.id || ''} - ${pitak?.location || 'Pitak'}`}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <TreePalm className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Farm</span>
                </div>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedBukid?.name || 'Not selected'}
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Grid3x3 className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>LuWang Size</span>
                </div>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                  {formData.totalLuwang > 0 ? `${formData.totalLuwang.toFixed(2)} LuWang` : 'Not set'}
                </p>
              </div>
              <div className="bg-white/80 p-3 rounded-lg border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
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
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Farm Selection Card */}
              <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-green-light)] to-transparent">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <TreePalm className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                    Farm Selection
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Select the farm where this plot is located
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
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
                        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                          <AlertCircle className="w-3 h-3" />
                          {errors.bukidId}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedBukid && (
                    <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg border border-[var(--border-color)]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <TreePalm className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                            <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {selectedBukid.name}
                            </h3>
                          </div>
                          {selectedBukid.location && (
                            <p className="text-xs flex items-center gap-1 mt-2" style={{ color: 'var(--text-secondary)' }}>
                              <MapPin className="w-3 h-3" />
                              {selectedBukid.location}
                            </p>
                          )}
                          <div className="mt-3">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${selectedBukid.status === 'active'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : selectedBukid.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-800 border border-gray-200'
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              }`}>
                              {selectedBukid.status.charAt(0).toUpperCase() + selectedBukid.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleChange('bukidId', null)}
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

              {/* LuWang Configuration Card */}
              <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-gold-light)] to-transparent">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Ruler className="w-5 h-5" style={{ color: 'var(--accent-gold)' }} />
                    LuWang Configuration
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Set the plot size in LuWang units (supports decimal values like 1.33 or 0.97)
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                      htmlFor="totalLuwang">
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
                          className={`flex-1 p-3 rounded-lg text-sm ${errors.totalLuwang ? 'border-red-500' : ''
                            }`}
                          style={{
                            backgroundColor: 'var(--input-bg)',
                            border: `1px solid ${errors.totalLuwang ? '#ef4444' : 'var(--input-border)'}`,
                            color: 'var(--text-primary)'
                          }}
                          placeholder="Enter LuWang (e.g., 1.33 or 0.97)"
                          required
                        />
                        <div className="px-3 py-3 rounded-lg bg-[var(--accent-gold-light)] text-sm font-medium"
                          style={{ color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)' }}>
                          LuWang
                        </div>
                      </div>
                      {errors.totalLuwang && (
                        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                          <AlertCircle className="w-3 h-3" />
                          {errors.totalLuwang}
                        </p>
                      )}
                      <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                        <Info className="w-3 h-3" />
                        Enter decimal values for precise measurements (max 2 decimal places)
                      </p>
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div>
                    <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Common LuWang Sizes
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {luwangExamples.map((example, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleLuWangExample(example.value)}
                          className={`p-3 rounded-lg text-sm text-left transition-all ${formData.totalLuwang === example.value
                              ? 'bg-[var(--accent-green-light)] border-2 border-[var(--accent-green)]'
                              : 'bg-[var(--card-secondary-bg)] border border-[var(--border-color)] hover:border-[var(--accent-green)]'
                            }`}
                        >
                          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            {example.value.toFixed(2)}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {example.label.split('(')[1].replace(')', '')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Preview */}
                  {formData.totalLuwang > 0 && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-[var(--accent-green-light)] to-[var(--accent-sky-light)] border border-[var(--border-color)]">
                      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Capacity Preview
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
                            {formData.totalLuwang.toFixed(2)}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Total LuWang
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold"
                            style={{
                              color: capacityInfo?.utilization && capacityInfo.utilization > 80
                                ? 'var(--accent-rust)'
                                : capacityInfo?.utilization && capacityInfo.utilization > 50
                                  ? 'var(--accent-gold)'
                                  : 'var(--accent-green)'
                            }}>
                            {capacityInfo?.utilization ? `${capacityInfo.utilization}%` : '0%'}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
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
            <div className="space-y-8">
              {/* Location & Status Card */}
              <div className="bg-white rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--accent-sky-light)] to-transparent">
                  <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <MapPin className="w-5 h-5" style={{ color: 'var(--accent-sky)' }} />
                    Location & Status
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Specify plot location within the farm and set its current status
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}
                      htmlFor="location">
                      Specific Location (Optional)
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
                        placeholder="E.g., 'Northwest corner', 'Section A-3', 'Near the irrigation pump'"
                      />
                      {errors.location && (
                        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--accent-rust)' }}>
                          <AlertCircle className="w-3 h-3" />
                          {errors.location}
                        </p>
                      )}
                      <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Use descriptive location names to help workers find the plot easily
                      </p>
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                      Plot Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['active', 'inactive', 'harvested'] as const).map((status) => (
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
                          {status === 'harvested' && <Calendar className="w-6 h-6" />}
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
                          <div>Available for new assignments</div>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                          <div className="font-medium mb-1" style={{ color: 'var(--accent-rust)' }}>Inactive</div>
                          <div>Not available for assignments</div>
                        </div>
                        <div className="p-3 rounded-lg bg-[var(--card-secondary-bg)]">
                          <div className="font-medium mb-1" style={{ color: 'var(--accent-gold)' }}>Harvested</div>
                          <div>Completed harvesting cycle</div>
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
                    Additional Notes
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Add any relevant information about soil, conditions, or special instructions
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
                        placeholder="Enter any additional notes about this pitak... 
• Soil type and quality
• Special conditions or requirements
• Landmarks for easy identification
• Previous crop history
• Any equipment requirements"
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
                          Add detailed information to help manage the plot effectively
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
                    {mode === 'add' ? 'Creating Pitak...' : 'Updating Pitak...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {mode === 'add' ? 'Create Pitak' : 'Update Pitak'}
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

export default PitakFormPage;