// components/Payment/Dialogs/PaymentViewDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, DollarSign, Calendar, Users, FileText, CheckCircle,
    AlertCircle, Clock, TrendingUp, CreditCard, Download,
    Banknote, Percent, Calculator, Receipt, User, MapPin
} from 'lucide-react';
import paymentAPI from '../../../../../apis/payment';
import type { PaymentData, WorkerData, PitakData } from '../../../../../apis/payment';

interface PaymentViewDialogProps {
    paymentId: number;
    onClose: () => void;
    // onEdit: (id: number) => void;
    onGenerateSlip?: () => void;
    onViewHistory?: () => void;
}

const PaymentViewDialog: React.FC<PaymentViewDialogProps> = ({
    paymentId,
    onClose,
    // onEdit,
    onGenerateSlip
}) => {
    const [payment, setPayment] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'financial' | 'breakdown'>('details');
    const [detailsData, setDetailsData] = useState<any>(null);

    useEffect(() => {
        const fetchPayment = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await paymentAPI.getPaymentById(paymentId);

                if (response.status) {
                    setPayment(response.data.payment);

                    // Fetch additional details if needed
                    try {
                        const detailsRes = await paymentAPI.getPaymentWithDetails(paymentId);
                        if (detailsRes.status) {
                            setDetailsData(detailsRes.data);
                        }
                    } catch (secondaryError) {
                        console.log('Secondary data fetch error:', secondaryError);
                    }finally{
                        setLoading(false);
                    }
                } else {
                    setError(response.message || 'Failed to load payment');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load payment');
                console.error('Error fetching payment:', err);
            } finally {
                setLoading(false);
            }
        };

        if (paymentId) {
            fetchPayment();
        }
    }, [paymentId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return {
                bg: '#d1fae5',
                text: '#065f46',
                icon: <CheckCircle className="w-3.5 h-3.5" />
            };
            case 'pending': return {
                bg: '#fef3c7',
                text: '#92400e',
                icon: <Clock className="w-3.5 h-3.5" />
            };
            case 'processing': return {
                bg: '#dbeafe',
                text: '#1e40af',
                icon: <Clock className="w-3.5 h-3.5" />
            };
            case 'cancelled': return {
                bg: '#fee2e2',
                text: '#991b1b',
                icon: <AlertCircle className="w-3.5 h-3.5" />
            };
            case 'partially_paid': return {
                bg: '#f0f9ff',
                text: '#0369a1',
                icon: <DollarSign className="w-3.5 h-3.5" />
            };
            default: return {
                bg: '#f3f4f6',
                text: '#6b7280',
                icon: <Clock className="w-3.5 h-3.5" />
            };
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const calculateDeductions = (payment: PaymentData) => {
        return payment.manualDeduction + payment.totalDebtDeduction + payment.otherDeductions;
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                <div className="bg-white rounded-lg w-full max-w-lg shadow-lg border border-gray-200">
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Loading payment details...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Payment Details</h3>
                            <p className="text-xs text-gray-600">Payment ID: #{paymentId}</p>
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

                {error ? (
                    <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">Error Loading Payment</p>
                        <p className="text-xs text-gray-600">{error}</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-3 py-1.5 rounded text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                ) : payment ? (
                    <div className="overflow-y-auto max-h-[calc(90vh-130px)]">
                        {/* Status Banner */}
                        <div className="p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const statusColor = getStatusColor(payment.status);
                                        return (
                                            <>
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{ backgroundColor: statusColor.bg }}
                                                >
                                                    {statusColor.icon}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium" style={{ color: statusColor.text }}>
                                                        {payment.status.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {payment.paymentDate ? `Paid: ${formatDate(payment.paymentDate)}` : 'Not paid yet'}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">
                                        {formatCurrency(payment.netPay)}
                                    </div>
                                    <div className="text-xs text-gray-500">Net Pay</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('financial')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'financial' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Financial
                                </button>
                                <button
                                    onClick={() => setActiveTab('breakdown')}
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'breakdown' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Breakdown
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {activeTab === 'details' ? (
                                <div className="space-y-4">
                                    {/* Payment Information */}
                                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            Payment Information
                                        </h4>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Payment ID:</span>
                                                <span className="text-sm font-medium text-gray-900">#{payment.id}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Status:</span>
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: getStatusColor(payment.status).bg,
                                                        color: getStatusColor(payment.status).text
                                                    }}
                                                >
                                                    {payment.status.toUpperCase().replace('_', ' ')}
                                                </span>
                                            </div>
                                            {payment.paymentDate && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Payment Date:</span>
                                                    <span className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</span>
                                                </div>
                                            )}
                                            {payment.paymentMethod && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Payment Method:</span>
                                                    <span className="text-sm text-gray-900">{payment.paymentMethod}</span>
                                                </div>
                                            )}
                                            {payment.referenceNumber && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Reference No:</span>
                                                    <span className="text-sm text-gray-900">{payment.referenceNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Worker Information */}
                                    {payment.worker && (
                                        <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" />
                                                Worker Information
                                            </h4>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Worker Name:</span>
                                                    <span className="text-sm font-medium text-gray-900">{payment.worker.name}</span>
                                                </div>
                                                {payment.worker.contact && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-600">Contact:</span>
                                                        <span className="text-sm text-gray-900">{payment.worker.contact}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Worker ID:</span>
                                                    <span className="text-sm text-gray-900">#{payment.worker.id}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Status:</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                                        {payment.worker.status?.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Plot Information */}
                                    {payment.pitak && (
                                        <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Plot Information
                                            </h4>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Plot Location:</span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {payment.pitak.location || `Plot #${payment.pitak.id}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Plot ID:</span>
                                                    <span className="text-sm text-gray-900">#{payment.pitak.id}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Total Luwang:</span>
                                                    <span className="text-sm text-gray-900">{payment.pitak.totalLuwang}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Period Information */}
                                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Period Information
                                        </h4>
                                        <div className="space-y-1">
                                            {payment.periodStart && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Period Start:</span>
                                                    <span className="text-sm text-gray-900">{formatDate(payment.periodStart)}</span>
                                                </div>
                                            )}
                                            {payment.periodEnd && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Period End:</span>
                                                    <span className="text-sm text-gray-900">{formatDate(payment.periodEnd)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* System Information */}
                                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">System Information</h4>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Created:</span>
                                                <span className="text-sm text-gray-900">
                                                    {new Date(payment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Last Updated:</span>
                                                <span className="text-sm text-gray-900">
                                                    {new Date(payment.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'financial' ? (
                                <div className="space-y-4">
                                    {/* Financial Summary */}
                                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                            <Banknote className="w-3.5 h-3.5" />
                                            Financial Summary
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Gross Pay:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(payment.grossPay)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Total Deductions:</span>
                                                <span className="text-sm font-medium text-red-600">
                                                    -{formatCurrency(calculateDeductions(payment))}
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-700">Net Pay:</span>
                                                    <span className="text-lg font-bold text-blue-600">
                                                        {formatCurrency(payment.netPay)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deductions Breakdown */}
                                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                            <Percent className="w-3.5 h-3.5" />
                                            Deductions Breakdown
                                        </h4>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Manual Deductions:</span>
                                                <span className="text-sm text-gray-900">
                                                    {formatCurrency(payment.manualDeduction)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Debt Deductions:</span>
                                                <span className="text-sm text-gray-900">
                                                    {formatCurrency(payment.totalDebtDeduction)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Other Deductions:</span>
                                                <span className="text-sm text-gray-900">
                                                    {formatCurrency(payment.otherDeductions)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Details */}
                                    {payment.paymentMethod && (
                                        <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                <CreditCard className="w-3.5 h-3.5" />
                                                Payment Details
                                            </h4>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">Method:</span>
                                                    <span className="text-sm text-gray-900">{payment.paymentMethod}</span>
                                                </div>
                                                {payment.referenceNumber && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-600">Reference:</span>
                                                        <span className="text-sm text-gray-900">{payment.referenceNumber}</span>
                                                    </div>
                                                )}
                                                {payment.paymentDate && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-600">Payment Date:</span>
                                                        <span className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {payment.notes && (
                                        <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                                <FileText className="w-3.5 h-3.5" />
                                                Notes
                                            </h4>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{payment.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Calculation Breakdown */}
                                    <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                                            <Calculator className="w-3.5 h-3.5" />
                                            Calculation Breakdown
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600">Gross Pay:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(payment.grossPay)}
                                                </span>
                                            </div>
                                            <div className="pl-4 border-l-2 border-gray-300 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">• Manual Deductions:</span>
                                                    <span className="text-sm text-red-600">
                                                        -{formatCurrency(payment.manualDeduction)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">• Debt Deductions:</span>
                                                    <span className="text-sm text-red-600">
                                                        -{formatCurrency(payment.totalDebtDeduction)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">• Other Deductions:</span>
                                                    <span className="text-sm text-red-600">
                                                        -{formatCurrency(payment.otherDeductions)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-gray-300">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-700">Total Deductions:</span>
                                                    <span className="text-sm font-semibold text-red-600">
                                                        -{formatCurrency(calculateDeductions(payment))}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-blue-200 bg-blue-50 rounded p-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-bold text-blue-700">NET PAY:</span>
                                                    <span className="text-lg font-bold text-blue-700">
                                                        {formatCurrency(payment.netPay)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Report Generation */}
                                    {onGenerateSlip && (
                                        <div className="bg-gray-50 rounded border border-gray-200 p-3">
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents</h4>
                                            <button
                                                onClick={onGenerateSlip}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Generate Payment Slip
                                            </button>
                                            <p className="text-xs text-gray-500 mt-2 text-center">
                                                Generate official payment slip for this transaction
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                            Last updated: {payment ? new Date(payment.updatedAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                            {onGenerateSlip && (
                                <button
                                    onClick={onGenerateSlip}
                                    className="px-3 py-1.5 rounded text-sm font-medium border border-blue-300 hover:bg-blue-50 text-blue-600"
                                >
                                    Slip
                                </button>
                            )}
                            {/* <button
                                onClick={() => onEdit(paymentId)}
                                className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 hover:bg-gray-100 text-gray-700"
                            >
                                Edit
                            </button> */}
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 rounded text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentViewDialog;