// components/Payment/Dialogs/PaymentFormDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, Save, DollarSign, Calculator, AlertCircle,
    Loader, Calendar, FileText, User, MapPin
} from 'lucide-react';
import paymentAPI from '../../../../apis/payment';
import { showError, showSuccess } from '../../../../utils/notification';
import { dialogs } from '../../../../utils/dialogs';
import WorkerSelect from '../../../../components/Selects/Worker';
import PitakSelect from '../../../../components/Selects/Pitak';

interface PaymentFormDialogProps {
    id?: number;
    mode: 'add' | 'edit';
    onClose: () => void;
    onSuccess?: (payment: any) => void;
}

interface FormData {
    workerId: number | null;
    pitakId: number | null;
    grossPay: string;
    manualDeduction: string;
    otherDeductions: string;
    periodStart: string;
    periodEnd: string;
    notes: string;
}

const PaymentFormDialog: React.FC<PaymentFormDialogProps> = ({
    id,
    mode,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(mode === 'edit');
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        workerId: null,
        pitakId: null,
        grossPay: '',
        manualDeduction: '0',
        otherDeductions: '0',
        periodStart: '',
        periodEnd: '',
        notes: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [calculatedData, setCalculatedData] = useState<{
        netPay: number;
        totalDeductions: number;
    }>({ netPay: 0, totalDeductions: 0 });

    // Fetch initial data for edit mode
    useEffect(() => {
        const fetchData = async () => {
            if (mode === 'edit' && id) {
                try {
                    setLoading(true);
                    const response = await paymentAPI.getPaymentById(id);

                    if (response.status && response.data.payment) {
                        const payment = response.data.payment;
                        setFormData({
                            workerId: payment.worker?.id || null,
                            pitakId: payment.pitak?.id || null,
                            grossPay: payment.grossPay.toString(),
                            manualDeduction: payment.manualDeduction.toString(),
                            otherDeductions: payment.otherDeductions.toString(),
                            periodStart: payment.periodStart || '',
                            periodEnd: payment.periodEnd || '',
                            notes: payment.notes || ''
                        });
                        calculateNetPay(
                            payment.grossPay,
                            payment.manualDeduction,
                            payment.otherDeductions
                        );
                    } else {
                        showError('Payment not found');
                        onClose();
                    }
                } catch (error) {
                    console.error('Error fetching payment:', error);
                    showError('Failed to load payment data');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [id, mode, onClose]);

    // Calculate net pay whenever relevant fields change
    useEffect(() => {
        const grossPay = parseFloat(formData.grossPay) || 0;
        const manualDeduction = parseFloat(formData.manualDeduction) || 0;
        const otherDeductions = parseFloat(formData.otherDeductions) || 0;

        calculateNetPay(grossPay, manualDeduction, otherDeductions);
    }, [formData.grossPay, formData.manualDeduction, formData.otherDeductions]);

    const calculateNetPay = (grossPay: number, manualDeduction: number, otherDeductions: number) => {
        const totalDeductions = manualDeduction + otherDeductions;
        const netPay = grossPay - totalDeductions;

        setCalculatedData({
            netPay: netPay > 0 ? netPay : 0,
            totalDeductions
        });
    };

    const handleChange = (field: keyof FormData, value: string | number | null) => {
        if (field === 'workerId' || field === 'pitakId') {
            setFormData(prev => ({
                ...prev,
                [field]: value as number | null
            }));
        } else {
            // For numeric fields, validate input
            if (field === 'grossPay' || field === 'manualDeduction' || field === 'otherDeductions') {
                // Allow only numbers and decimal point
                const numericValue = value!.toString().replace(/[^0-9.]/g, '');
                // Ensure only one decimal point
                const parts = numericValue.split('.');
                const finalValue = parts.length > 2 
                    ? parts[0] + '.' + parts.slice(1).join('')
                    : numericValue;
                
                setFormData(prev => ({
                    ...prev,
                    [field]: finalValue
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [field]: value as string
                }));
            }
        }

        // Clear error for this field
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

        if (!formData.grossPay || parseFloat(formData.grossPay) <= 0) {
            newErrors.grossPay = 'Gross pay must be greater than 0';
        }

        const manualDeduction = parseFloat(formData.manualDeduction) || 0;
        const otherDeductions = parseFloat(formData.otherDeductions) || 0;
        const totalDeductions = manualDeduction + otherDeductions;

        if (totalDeductions > parseFloat(formData.grossPay)) {
            newErrors.grossPay = 'Total deductions cannot exceed gross pay';
        }

        if (formData.periodStart && formData.periodEnd) {
            const startDate = new Date(formData.periodStart);
            const endDate = new Date(formData.periodEnd);
            
            if (endDate < startDate) {
                newErrors.periodEnd = 'End date cannot be before start date';
            }
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
            title: mode === 'add' ? 'Create Payment' : 'Update Payment',
            message: `Are you sure you want to ${mode === 'add' ? 'create' : 'update'} this payment?`
        })) return;

        try {
            setSubmitting(true);

            const paymentData = {
                workerId: formData.workerId!,
                pitakId: formData.pitakId || undefined,
                grossPay: parseFloat(formData.grossPay),
                manualDeduction: parseFloat(formData.manualDeduction) || 0,
                otherDeductions: parseFloat(formData.otherDeductions) || 0,
                periodStart: formData.periodStart || undefined,
                periodEnd: formData.periodEnd || undefined,
                notes: formData.notes || undefined
            };

            let response;

            if (mode === 'add') {
                response = await paymentAPI.createPayment(paymentData);
            } else if (mode === 'edit' && id) {
                response = await paymentAPI.updatePayment(id, paymentData);
            }

            if (response?.status && response.data) {
                showSuccess(
                    mode === 'add' ?
                        'Payment created successfully!' :
                        'Payment updated successfully!'
                );

                if (onSuccess) {
                    onSuccess(response.data);
                }
                onClose();
            } else {
                throw new Error(response?.message || 'Failed to save payment');
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);
            showError(error.message || 'Failed to save payment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                {mode === 'add' ? 'Create New Payment' : 'Edit Payment'}
                            </h3>
                            <div className="text-xs text-gray-600">
                                {mode === 'add' ? 'Record a new payment transaction' : 'Update payment details'}
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
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Loading payment data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Worker Selection */}
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-gray-700">
                                    Worker <span className="text-red-500">*</span>
                                </label>
                                <WorkerSelect
                                    value={formData.workerId}
                                    onChange={(id) => handleChange('workerId', id)}
                                    disabled={submitting}
                                    placeholder="Select worker"
                                    inModal={true}
                                />
                                {errors.workerId && (
                                    <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.workerId}
                                    </p>
                                )}
                            </div>

                            {/* Plot Selection (Optional) */}
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-gray-700">
                                    Plot (Optional)
                                </label>
                                <PitakSelect
                                    value={formData.pitakId}
                                    onChange={(id) => handleChange('pitakId', id)}
                                    disabled={submitting}
                                    placeholder="Select plot (optional)"
                                />
                            </div>

                            {/* Gross Pay */}
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="grossPay">
                                    Gross Pay <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                    <input
                                        id="grossPay"
                                        type="text"
                                        value={formData.grossPay}
                                        onChange={(e) => handleChange('grossPay', e.target.value)}
                                        className={`w-full pl-8 pr-3 py-2 rounded text-sm border ${errors.grossPay ? 'border-red-500' : 'border-gray-300'
                                            } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                                        placeholder="0.00"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                {errors.grossPay && (
                                    <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.grossPay}
                                    </p>
                                )}
                            </div>

                            {/* Deductions */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="manualDeduction">
                                        Manual Deductions
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            id="manualDeduction"
                                            type="text"
                                            value={formData.manualDeduction}
                                            onChange={(e) => handleChange('manualDeduction', e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            placeholder="0.00"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="otherDeductions">
                                        Other Deductions
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            id="otherDeductions"
                                            type="text"
                                            value={formData.otherDeductions}
                                            onChange={(e) => handleChange('otherDeductions', e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            placeholder="0.00"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Period Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="periodStart">
                                        Period Start
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            id="periodStart"
                                            type="date"
                                            value={formData.periodStart}
                                            onChange={(e) => handleChange('periodStart', e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="periodEnd">
                                        Period End
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            id="periodEnd"
                                            type="date"
                                            value={formData.periodEnd}
                                            onChange={(e) => handleChange('periodEnd', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 rounded text-sm border ${errors.periodEnd ? 'border-red-500' : 'border-gray-300'
                                                } focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                                            disabled={submitting}
                                        />
                                    </div>
                                    {errors.periodEnd && (
                                        <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors.periodEnd}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Calculation Summary */}
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calculator className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Calculation Summary</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Gross Pay:</span>
                                        <span className="font-medium">₱{parseFloat(formData.grossPay || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Deductions:</span>
                                        <span className="font-medium text-red-600">-₱{calculatedData.totalDeductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pt-1 border-t border-blue-200">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-blue-700">Net Pay:</span>
                                            <span className="font-bold text-blue-700">₱{calculatedData.netPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium mb-1.5 text-gray-700" htmlFor="notes">
                                    Notes (Optional)
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                                    <textarea
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="Add any notes or remarks..."
                                        rows={3}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </form>
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
                                disabled={submitting || !formData.workerId || !formData.grossPay || parseFloat(formData.grossPay) <= 0}
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
                                        {mode === 'add' ? 'Create Payment' : 'Update Payment'}
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

export default PaymentFormDialog;