// pages/BukidFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, X, Home, MapPin, FileText, AlertCircle, CheckCircle, XCircle,
  Loader, Users, ChevronDown
} from 'lucide-react';
import { showError, showSuccess } from '../../../utils/notification';
import { dialogs } from '../../../utils/dialogs';
import type { BukidData } from '../../../apis/bukid';
import type { KabisilyaData } from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';
import bukidAPI from '../../../apis/bukid';

interface BukidFormPageProps {}

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
  const [showKabisilyaDropdown, setShowKabisilyaDropdown] = useState(false);
  const [bukid, setBukid] = useState<BukidData | null>(null);

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
  const handleKabisilyaSelect = (kabisilya: KabisilyaData) => {
    setFormData(prev => ({
      ...prev,
      kabisilyaId: kabisilya.id
    }));
    setShowKabisilyaDropdown(false);
  };

  // Remove kabisilya assignment
  const handleRemoveKabisilya = () => {
    setFormData(prev => ({
      ...prev,
      kabisilyaId: null
    }));
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
      const bukidData: Omit<BukidData, 'id'> = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        kabisilyaId: formData.kabisilyaId,
        status: formData.status,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
  const handleCancel = async() => {
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--card-bg)' }}>
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
              {mode === 'add' ? 'Add New Bukid' : 'Edit Bukid'}
            </h1>
          </div>
          
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'add'
              ? 'Add a new farm land to manage assignments and track productivity'
              : `Editing: ${bukid?.name || 'Bukid'}`}
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
                  <Home className="w-5 h-5" />
                  Basic Information
                </h2>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: 'var(--text-secondary)' }}
                           htmlFor="name">
                      Bukid Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={`w-full p-3 rounded-lg text-sm transition-all ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: `1px solid ${errors.name ? '#ef4444' : 'var(--input-border)'}`,
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Enter bukid name"
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs flex items-center gap-1"
                         style={{ color: 'var(--accent-rust)' }}>
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: 'var(--text-secondary)' }}
                           htmlFor="location">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      className={`w-full p-3 rounded-lg text-sm ${
                        errors.location ? 'border-red-500' : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: `1px solid ${errors.location ? '#ef4444' : 'var(--input-border)'}`,
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Enter location (e.g., Barangay, Municipality)"
                    />
                    {errors.location && (
                      <p className="mt-1 text-xs flex items-center gap-1"
                         style={{ color: 'var(--accent-rust)' }}>
                        <AlertCircle className="w-3 h-3" />
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: 'var(--text-secondary)' }}>
                      Status
                    </label>
                    <div className="flex gap-2">
                      {(['active', 'inactive', 'pending'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleChange('status', status)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            formData.status === status ? '' : 'opacity-70 hover:opacity-100'
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
                            border: `1px solid ${
                              formData.status === status 
                                ? status === 'active' ? 'var(--accent-green)' 
                                  : status === 'inactive' ? 'var(--accent-rust)' 
                                  : 'var(--accent-gold)'
                                : 'var(--border-color)'
                            }`
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {status === 'active' && <CheckCircle className="w-4 h-4" />}
                            {status === 'inactive' && <XCircle className="w-4 h-4" />}
                            {status === 'pending' && <AlertCircle className="w-4 h-4" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Kabisilya Assignment Card */}
              <div className="p-5 rounded-xl"
                   style={{ 
                     backgroundColor: 'var(--card-secondary-bg)',
                     border: '1px solid var(--border-color)'
                   }}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}>
                  <Users className="w-5 h-5" />
                  Kabisilya Assignment
                </h2>
                
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2"
                           style={{ color: 'var(--text-secondary)' }}>
                      Assign to Kabisilya
                    </label>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowKabisilyaDropdown(!showKabisilyaDropdown)}
                        className="w-full p-3 rounded-lg text-left flex justify-between items-center"
                        style={{
                          backgroundColor: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">
                            {selectedKabisilya 
                              ? selectedKabisilya.name
                              : 'Select a kabisilya...'
                            }
                          </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          showKabisilyaDropdown ? 'rotate-180' : ''
                        }`} />
                      </button>

                      {/* Selected kabisilya display */}
                      {selectedKabisilya && (
                        <div className="mt-2 p-3 rounded-lg flex justify-between items-center"
                             style={{ backgroundColor: 'var(--card-hover-bg)' }}>
                          <div>
                            <span className="text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}>
                              {selectedKabisilya.name}
                            </span>
                            <p className="text-xs mt-1"
                               style={{ color: 'var(--text-secondary)' }}>
                              Kabisilya #{selectedKabisilya.id}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveKabisilya}
                            className="p-1 rounded hover:bg-gray-100"
                            style={{ color: 'var(--accent-rust)' }}
                            aria-label="Remove kabisilya"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Kabisilya dropdown */}
                      {showKabisilyaDropdown && (
                        <div className="absolute z-10 w-full mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                             style={{
                               backgroundColor: 'var(--card-bg)',
                               border: '1px solid var(--border-color)'
                             }}>
                          {kabisilyas.length === 0 ? (
                            <div className="p-3 text-center text-sm"
                                 style={{ color: 'var(--text-secondary)' }}>
                              No kabisilyas available
                            </div>
                          ) : (
                            kabisilyas.map((kabisilya) => (
                              <button
                                key={kabisilya.id}
                                type="button"
                                onClick={() => handleKabisilyaSelect(kabisilya)}
                                className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                                style={{
                                  borderColor: 'var(--border-light)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <Users className="w-4 h-4" 
                                         style={{ color: 'var(--accent-green)' }} />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">
                                      {kabisilya.name}
                                    </span>
                                    <p className="text-xs mt-1"
                                       style={{ color: 'var(--text-secondary)' }}>
                                      Kabisilya #{kabisilya.id}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Assign this bukid to a kabisilya for management
                    </p>
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
                      className={`w-full p-3 rounded-lg text-sm min-h-[200px] resize-y ${
                        errors.notes ? 'border-red-500' : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: `1px solid ${errors.notes ? '#ef4444' : 'var(--input-border)'}`,
                        color: 'var(--text-primary)'
                      }}
                      placeholder="Enter any additional notes about this bukid..."
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
                        Add details about soil conditions, landmarks, access routes, etc.
                      </p>
                      <span className={`text-xs ${
                        formData.notes.length > 1000 ? 'text-red-500' : 'text-gray-500'
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
              disabled={submitting}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 hover:shadow-md flex items-center gap-2 disabled:opacity-50"
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
                  {mode === 'add' ? 'Create Bukid' : 'Update Bukid'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Click outside to close dropdown */}
        {showKabisilyaDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowKabisilyaDropdown(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BukidFormPage;