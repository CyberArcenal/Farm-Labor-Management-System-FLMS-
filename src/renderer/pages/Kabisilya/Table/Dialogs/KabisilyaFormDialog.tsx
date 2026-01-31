// // src/components/Dialogs/KabisilyaFormDialog.tsx
// import React, { useState, useEffect } from 'react';
// import {
//     X, Save, User, LandPlot, AlertCircle, Loader,
//     CheckCircle, Users, MapPin, Info, Hash
// } from 'lucide-react';
// import kabisilyaAPI from '../../../../apis/kabisilya';
// import { showError, showSuccess } from '../../../../utils/notification';
// import { dialogs } from '../../../../utils/dialogs';

// interface KabisilyaFormDialogProps {
//     id?: number;
//     mode: 'add' | 'edit';
//     onClose: () => void;
//     onSuccess?: (kabisilya: any) => void;
// }

// interface FormData {
//     name: string;
// }

// const KabisilyaFormDialog: React.FC<KabisilyaFormDialogProps> = ({
//     id,
//     mode,
//     onClose,
//     onSuccess
// }) => {
//     const [loading, setLoading] = useState(mode === 'edit');
//     const [submitting, setSubmitting] = useState(false);
//     const [formData, setFormData] = useState<FormData>({
//         name: ''
//     });
//     const [errors, setErrors] = useState<Record<string, string>>({});
//     const [validationState, setValidationState] = useState<{
//         isValid: boolean;
//         isUnique: boolean;
//         message: string;
//     }>({
//         isValid: false,
//         isUnique: false,
//         message: ''
//     });

//     // Fetch initial data for edit mode
//     useEffect(() => {
//         const fetchData = async () => {
//             if (mode === 'edit' && id) {
//                 try {
//                     setLoading(true);
//                     const response = await kabisilyaAPI.getById(id);

//                     if (response.status && response.data) {
//                         setFormData({
//                             name: response.data.name
//                         });
//                     } else {
//                         showError('Kabisilya not found');
//                         onClose();
//                     }
//                 } catch (error) {
//                     console.error('Error fetching kabisilya:', error);
//                     showError('Failed to load kabisilya data');
//                 } finally {
//                     setLoading(false);
//                 }
//             }
//         };

//         fetchData();
//     }, [id, mode, onClose]);

//     // Handle form input changes with validation
//     const handleChange = async (field: keyof FormData, value: string) => {
//         const newFormData = {
//             ...formData,
//             [field]: value
//         };
//         setFormData(newFormData);

//         // Clear error for this field
//         if (errors[field]) {
//             setErrors(prev => ({
//                 ...prev,
//                 [field]: ''
//             }));
//         }

//         // Validate name in real-time
//         if (field === 'name' && value.trim().length > 0) {
//             try {
//                 // Validate format
//                 const formatValidation = await kabisilyaAPI.validateName(value);
//                 const uniqueValidation = await kabisilyaAPI.checkNameExists(value, mode === 'edit' ? id : undefined);

//                 setValidationState({
//                     isValid: formatValidation.data,
//                     isUnique: uniqueValidation.data,
//                     message: formatValidation.data ?
//                         (uniqueValidation.data ? 'Name is available' : 'Name already exists') :
//                         formatValidation.message
//                 });
//             } catch (error) {
//                 console.error('Validation error:', error);
//             }
//         } else {
//             setValidationState({
//                 isValid: false,
//                 isUnique: false,
//                 message: ''
//             });
//         }
//     };

//     // Validate form
//     const validateForm = (): boolean => {
//         const newErrors: Record<string, string> = {};

//         if (!formData.name.trim()) {
//             newErrors.name = 'Kabisilya name is required';
//         } else if (formData.name.trim().length < 2) {
//             newErrors.name = 'Name must be at least 2 characters';
//         } else if (formData.name.trim().length > 100) {
//             newErrors.name = 'Name must be less than 100 characters';
//         }

//         setErrors(newErrors);
//         return Object.keys(newErrors).length === 0;
//     };

//     // Handle form submission
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         if (!validateForm()) {
//             showError('Please fix the errors in the form');
//             return;
//         }

//         if(!await dialogs.confirm({title: mode === 'add' ? 'Create Kabisilya' : 'Update Kabisilya', message: `Are you sure you want to ${mode === 'add' ? 'create' : 'update'} this kabisilya?`}))return;

//         try {
//             setSubmitting(true);
//             let response;

//             if (mode === 'add') {
//                 // Create new kabisilya
//                 response = await kabisilyaAPI.create(formData.name.trim());
//             } else if (mode === 'edit' && id) {
//                 // Update existing kabisilya
//                 response = await kabisilyaAPI.update(id, formData.name.trim());
//             }

//             if (response?.status && response.data) {
//                 showSuccess(
//                     mode === 'add' ?
//                         'Kabisilya created successfully!' :
//                         'Kabisilya updated successfully!'
//                 );

//                 if (onSuccess) {
//                     onSuccess(response.data);
//                 }
//                 onClose();
//             } else {
//                 throw new Error(response?.message || 'Failed to save kabisilya');
//             }
//         } catch (error: any) {
//             console.error('Error submitting form:', error);
//             showError(error.message || 'Failed to save kabisilya');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
//             <div className="bg-white rounded-lg w-full max-w-md shadow-lg border border-gray-200">
//                 {/* Header */}
//                 <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
//                     <div className="flex items-center gap-3">
//                         <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
//                             <Users className="w-4 h-4 text-white" />
//                         </div>
//                         <div>
//                             <h3 className="text-base font-semibold text-gray-900">
//                                 {mode === 'add' ? 'Create New Kabisilya' : 'Edit Kabisilya'}
//                             </h3>
//                             <div className="text-xs text-gray-600">
//                                 {mode === 'add' ? 'Add a new kabisilya group' : 'Update kabisilya details'}
//                             </div>
//                         </div>
//                     </div>
//                     <button
//                         onClick={onClose}
//                         className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors"
//                         title="Close"
//                     >
//                         <X className="w-3 h-3 text-gray-500" />
//                     </button>
//                 </div>

//                 {/* Content */}
//                 <div className="p-6">
//                     {loading ? (
//                         <div className="text-center py-8">
//                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
//                             <p className="text-sm text-gray-600">Loading kabisilya data...</p>
//                         </div>
//                     ) : (
//                         <form onSubmit={handleSubmit} className="space-y-4">
//                             {/* Name Field */}
//                             <div>
//                                 <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="name">
//                                     Kabisilya Name <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                     id="name"
//                                     type="text"
//                                     value={formData.name}
//                                     onChange={(e) => handleChange('name', e.target.value)}
//                                     className={`w-full px-3 py-2 rounded text-sm border ${errors.name ? 'border-red-500' :
//                                             formData.name && validationState.isValid && validationState.isUnique ?
//                                                 'border-green-500' : 'border-gray-300'
//                                         } focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none`}
//                                     placeholder="Enter kabisilya name (e.g., Group A)"
//                                     required
//                                     disabled={submitting}
//                                     maxLength={100}
//                                 />

//                                 {/* Validation Feedback */}
//                                 {formData.name && (
//                                     <div className="mt-2 flex items-center gap-1.5">
//                                         {validationState.isValid && validationState.isUnique ? (
//                                             <>
//                                                 <CheckCircle className="w-3.5 h-3.5 text-green-500" />
//                                                 <span className="text-xs text-green-600">{validationState.message}</span>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
//                                                 <span className="text-xs text-amber-600">{validationState.message}</span>
//                                             </>
//                                         )}
//                                     </div>
//                                 )}

//                                 {errors.name && (
//                                     <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
//                                         <AlertCircle className="w-3 h-3" />
//                                         {errors.name}
//                                     </p>
//                                 )}

//                                 <div className="mt-2 text-xs text-gray-500 space-y-1">
//                                     <p>• Kabisilya is a group for organizing workers and farm plots</p>
//                                     <p>• Use descriptive names (e.g., "North Field Team", "Harvest Group B")</p>
//                                     <p>• Name must be 2-100 characters</p>
//                                 </div>
//                             </div>

//                             {/* Information Section */}
//                             <div className="p-3 bg-blue-50 rounded border border-blue-200">
//                                 <div className="flex items-start gap-2">
//                                     <Info className="w-4 h-4 text-blue-600 mt-0.5" />
//                                     <div className="text-xs text-blue-700">
//                                         <p className="font-medium mb-1">What is a Kabisilya?</p>
//                                         <p>A kabisilya is a working group that organizes:</p>
//                                         <ul className="list-disc list-inside mt-1 ml-1">
//                                             <li>Workers assigned to specific tasks</li>
//                                             <li>Farm plots (bukids) managed by the group</li>
//                                             <li>Daily assignments and work schedules</li>
//                                             <li>Productivity tracking and reporting</li>
//                                         </ul>
//                                     </div>
//                                 </div>
//                             </div>
//                         </form>
//                     )}
//                 </div>

//                 {/* Footer */}
//                 <div className="p-4 border-t border-gray-200 bg-gray-50">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2 text-xs text-gray-600">
//                             <AlertCircle className="w-3.5 h-3.5" />
//                             <span>Fields marked with <span className="text-red-500">*</span> are required</span>
//                         </div>
//                         <div className="flex gap-2">
//                             <button
//                                 type="button"
//                                 onClick={onClose}
//                                 className="px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
//                                 disabled={submitting}
//                             >
//                                 Cancel
//                             </button>
//                             <button
//                                 type="submit"
//                                 onClick={handleSubmit}
//                                 disabled={submitting || (formData.name === "" && (!validationState.isValid || !validationState.isUnique))}
//                                 className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
//                             >
//                                 {submitting ? (
//                                     <>
//                                         <Loader className="w-3.5 h-3.5 animate-spin" />
//                                         {mode === 'add' ? 'Creating...' : 'Updating...'}
//                                     </>
//                                 ) : (
//                                     <>
//                                         <Save className="w-3.5 h-3.5" />
//                                         {mode === 'add' ? 'Create Kabisilya' : 'Update Kabisilya'}
//                                     </>
//                                 )}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default KabisilyaFormDialog;