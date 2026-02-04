// components/Payment/Dialogs/ProcessAllPaymentsDialog.tsx
import React, { useState, useEffect } from 'react';
import {
    X, CheckCircle, Clock, DollarSign, FileText,
    Printer, Download, Copy, Calendar, User,
    Loader, AlertCircle, ChevronRight, Receipt,
    CreditCard, CheckCheck
} from 'lucide-react';
import paymentAPI from '../../../../../apis/payment';
import { showError, showSuccess } from '../../../../../utils/notification';
import { dialogs } from '../../../../../utils/dialogs';
import { formatCurrency, formatDate } from '../../../../../utils/formatters';

interface ProcessAllPaymentsDialogProps {
    workerId: number;
    workerName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

interface PendingPayment {
    id: number;
    periodStart: string | null;
    periodEnd: string | null;
    grossPay: number;
    netPay: number;
    deductions: number;
    notes: string | null;
    createdAt: string;
}

interface PaymentReceipt {
    referenceNumber: string;
    transactionDate: string;
    workerName: string;
    totalAmount: number;
    paymentMethod: string;
    processedCount: number;
    individualPayments: Array<{
        id: number;
        period: string;
        netPay: number;
    }>;
}

const ProcessAllPaymentsDialog: React.FC<ProcessAllPaymentsDialogProps> = ({
    workerId,
    workerName,
    onClose,
    onSuccess
}) => {
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState<'review' | 'confirm' | 'success'>('review');
    const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
    const [totalPendingAmount, setTotalPendingAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Generate reference number
    const generateReferenceNumber = () => {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `PAY-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}-${random}`;
    };

    // Fetch pending payments
    useEffect(() => {
        const fetchPendingPayments = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await paymentAPI.getPaymentsByWorker(workerId, {
                    status: 'pending',
                    limit: 50,
                    page: 1,
                });

                if (response.status && response.data.payments.length > 0) {
                    const payments = response.data.payments.map((p: any) => ({
                        id: p.id,
                        periodStart: p.periodStart,
                        periodEnd: p.periodEnd,
                        grossPay: p.grossPay,
                        netPay: p.netPay,
                        deductions: p.grossPay - p.netPay,
                        notes: p.notes,
                        createdAt: p.createdAt
                    }));

                    setPendingPayments(payments);
                    
                    const total = payments.reduce((sum: number, payment: PendingPayment) => 
                        sum + payment.netPay, 0);
                    setTotalPendingAmount(total);
                    
                    // Auto-generate reference number
                    setReferenceNumber(generateReferenceNumber());
                } else {
                    setError(`No pending payments found for ${workerName}`);
                }
            } catch (err: any) {
                console.error('Error fetching pending payments:', err);
                setError(err.message || 'Failed to load pending payments');
            } finally {
                setLoading(false);
            }
        };

        fetchPendingPayments();
    }, [workerId, workerName]);

    // Handle process all payments
    const handleProcessAll = async () => {
        try {
            setProcessing(true);
            setError(null);

            if (pendingPayments.length === 0) {
                throw new Error('No payments to process');
            }

            // Show confirmation dialog
            const confirmed = await dialogs.confirm({
                title: 'Process All Payments',
                message: `Are you sure you want to process ${pendingPayments.length} payment(s) totaling ${formatCurrency(totalPendingAmount)} for ${workerName}?`,
                confirmText: 'Process Payments',
                cancelText: 'Cancel'
            });

            if (!confirmed) {
                setProcessing(false);
                return;
            }

            // Prepare payment data
            const paymentIds = pendingPayments.map(p => p.id);
            
            const processResponse = await paymentAPI.bulkProcessPayments(paymentIds, {
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: paymentMethod,
                referenceNumber: referenceNumber || generateReferenceNumber()
            });

            if (processResponse.status) {
                // Create receipt data
                const receiptData: PaymentReceipt = {
                    referenceNumber: referenceNumber || generateReferenceNumber(),
                    transactionDate: new Date().toISOString(),
                    workerName,
                    totalAmount: totalPendingAmount,
                    paymentMethod,
                    processedCount: processResponse.data.success,
                    individualPayments: pendingPayments.map(p => ({
                        id: p.id,
                        period: p.periodStart && p.periodEnd 
                            ? `${formatDate(p.periodStart)} - ${formatDate(p.periodEnd)}`
                            : 'No period specified',
                        netPay: p.netPay
                    }))
                };

                setReceipt(receiptData);
                setStep('success');
                
                showSuccess(`Successfully processed ${processResponse.data.success} payment(s)`);
                
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                throw new Error(processResponse.message || 'Failed to process payments');
            }
        } catch (err: any) {
            console.error('Error processing payments:', err);
            setError(err.message || 'Failed to process payments');
            showError('Processing Failed', err.message);
        } finally {
            setProcessing(false);
        }
    };

    // Handle print receipt
    const handlePrintReceipt = () => {
        const printContent = document.getElementById('receipt-content');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            const printContents = printContent.innerHTML;
            
            document.body.innerHTML = `
                <html>
                    <head>
                        <title>Payment Receipt - ${receipt?.referenceNumber}</title>
                        <style>
                            @media print {
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .receipt-header { text-align: center; margin-bottom: 20px; }
                                .receipt-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                                .receipt-info { margin: 15px 0; }
                                .receipt-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                .receipt-table th, .receipt-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                .receipt-total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
                                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
                                .signature { margin-top: 60px; border-top: 1px solid #000; width: 300px; text-align: center; padding-top: 10px; }
                            }
                        </style>
                    </head>
                    <body>
                        ${printContents}
                    </body>
                </html>
            `;
            
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };

    // Handle copy reference number
    const handleCopyReference = () => {
        if (receipt?.referenceNumber) {
            navigator.clipboard.writeText(receipt.referenceNumber);
            showSuccess('Reference number copied to clipboard');
        }
    };

    // Handle download receipt
    const handleDownloadReceipt = async () => {
        try {
            if (!receipt) return;
            
            const receiptText = `
                PAYMENT RECEIPT
                =======================
                Reference: ${receipt.referenceNumber}
                Date: ${formatDate(receipt.transactionDate)}
                Worker: ${receipt.workerName}
                Payment Method: ${receipt.paymentMethod}
                
                Payments Processed (${receipt.processedCount}):
                ${receipt.individualPayments.map(p => `  - #${p.id}: ${p.period} (${formatCurrency(p.netPay)})`).join('\n')}
                
                TOTAL AMOUNT: ${formatCurrency(receipt.totalAmount)}
                
                =======================
                Thank you for your payment!
                This is a computer-generated receipt.
            `;
            
            const blob = new Blob([receiptText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payment-receipt-${receipt.referenceNumber}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccess('Receipt downloaded successfully');
        } catch (err) {
            console.error('Error downloading receipt:', err);
            showError('Failed to download receipt');
        }
    };

    // Payment method options
    const paymentMethods = [
        { value: 'cash', label: 'Cash', icon: <DollarSign className="w-4 h-4" /> },
        { value: 'bank', label: 'Bank Transfer', icon: <CreditCard className="w-4 h-4" /> },
        { value: 'check', label: 'Check', icon: <FileText className="w-4 h-4" /> },
        { value: 'digital', label: 'Digital Payment', icon: <CheckCheck className="w-4 h-4" /> }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl border border-gray-300 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-300 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Process All Pending Payments</h3>
                            <div className="text-sm opacity-90 flex items-center gap-2">
                                <User className="w-3 h-3" />
                                <span>{workerName}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>Worker ID: {workerId}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                        title="Close"
                        disabled={processing}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading pending payments...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">No Pending Payments</h4>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : step === 'review' ? (
                        <>
                            {/* Summary Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-5 h-5 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">PENDING PAYMENTS SUMMARY</span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Review and process all pending payments for this worker
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-700">
                                            {formatCurrency(totalPendingAmount)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Total ({pendingPayments.length} payments)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment List */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Pending Payments List
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {pendingPayments.map((payment, index) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-blue-700">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800">
                                                        Payment #{payment.id}
                                                    </div>
                                                    {payment.periodStart && payment.periodEnd ? (
                                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-500">No period specified</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-gray-800">
                                                    {formatCurrency(payment.netPay)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Net Pay
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment Method</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {paymentMethods.map((method) => (
                                        <button
                                            key={method.value}
                                            onClick={() => setPaymentMethod(method.value)}
                                            className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === method.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentMethod === method.value ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                                {method.icon}
                                            </div>
                                            <span className="text-sm font-medium">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference Number */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Reference Number</h4>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        className="w-full p-3 pr-24 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                                        placeholder="Enter or generate reference number"
                                    />
                                    <button
                                        onClick={() => setReferenceNumber(generateReferenceNumber())}
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    This reference number will be used to track the payment transaction.
                                </p>
                            </div>
                        </>
                    ) : step === 'success' && receipt ? (
                        <div id="receipt-content">
                            {/* Success Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Payments Processed Successfully!</h3>
                                <p className="text-gray-600">
                                    All pending payments have been processed and marked as completed.
                                </p>
                            </div>

                            {/* Receipt Card */}
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-sm">
                                <div className="text-center mb-6">
                                    <h4 className="text-lg font-bold text-gray-800 mb-2">PAYMENT RECEIPT</h4>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {receipt.referenceNumber}
                                        </div>
                                        <button
                                            onClick={handleCopyReference}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            title="Copy reference number"
                                        >
                                            <Copy className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Receipt Details */}
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-500">Date & Time</div>
                                            <div className="font-medium">{formatDate(receipt.transactionDate)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">Payment Method</div>
                                            <div className="font-medium capitalize">{receipt.paymentMethod}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Worker</div>
                                        <div className="font-medium">{receipt.workerName}</div>
                                    </div>
                                </div>

                                {/* Payments Table */}
                                <div className="mb-6">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Processed Payments ({receipt.processedCount})</h5>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-3 text-left text-xs font-medium text-gray-500">Payment ID</th>
                                                    <th className="p-3 text-left text-xs font-medium text-gray-500">Period</th>
                                                    <th className="p-3 text-left text-xs font-medium text-gray-500">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {receipt.individualPayments.map((payment) => (
                                                    <tr key={payment.id}>
                                                        <td className="p-3 text-sm">#{payment.id}</td>
                                                        <td className="p-3 text-sm text-gray-600">{payment.period}</td>
                                                        <td className="p-3 text-sm font-medium">{formatCurrency(payment.netPay)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Total Amount */}
                                <div className="border-t border-gray-300 pt-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-lg font-semibold text-gray-800">TOTAL AMOUNT</div>
                                        <div className="text-2xl font-bold text-green-600">{formatCurrency(receipt.totalAmount)}</div>
                                    </div>
                                    <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                                        This is a computer-generated receipt. No signature required.
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={onClose}
                                    className="p-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm font-medium">Exit</span>
                                </button>
                                <button
                                    onClick={handlePrintReceipt}
                                    className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <Printer className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">Print Receipt</span>
                                </button>
                                <button
                                    onClick={handleDownloadReceipt}
                                    className="p-3 rounded-lg border-2 border-green-500 bg-green-50 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-2"
                                >
                                    <Download className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Save PDF</span>
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                {step === 'review' && !loading && !error && (
                    <div className="p-6 border-t border-gray-300 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Total {pendingPayments.length} payment(s) to process</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors disabled:opacity-50"
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProcessAll}
                                    disabled={processing || pendingPayments.length === 0}
                                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Process All Payments ({formatCurrency(totalPendingAmount)})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessAllPaymentsDialog;