// components/Payment/Dialogs/hooks/useDebtPaymentForm.tsx
import { useState, useEffect, useCallback } from 'react';
import workerAPI from '../../../../../apis/worker';
import debtAPI from '../../../../../apis/debt';
import paymentAPI from '../../../../../apis/payment';
import { showError, showSuccess } from '../../../../../utils/notification';
import { dialogs } from '../../../../../utils/dialogs';

interface PaymentAllocation {
    paymentId: number;
    allocatedAmount: number;
    originalNetPay: number;
    remainingNetPay: number;
    period?: string;
}

interface FormData {
    paymentAmount: string;
    paymentMethod: 'cash' | 'bank_transfer' | 'gcash' | 'others';
    referenceNumber: string;
    notes: string;
    allocationMethod: 'equal' | 'proportional' | 'manual' | 'largest_first' | 'oldest_first';
    manualAllocations: Record<number, string>;
    applyInterest: boolean;
    interestRate: string;
}

const useDebtPaymentForm = (workerId: number, onClose: () => void, onSuccess?: () => void) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [workerName, setWorkerName] = useState('');
    const [totalDebt, setTotalDebt] = useState(0);
    const [totalAvailablePayments, setTotalAvailablePayments] = useState(0);
    const [availablePayments, setAvailablePayments] = useState<any[]>([]);
    const [availableDebts, setAvailableDebts] = useState<any[]>([]);
    
    const [formData, setFormData] = useState<FormData>({
        paymentAmount: '0',
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: '',
        allocationMethod: 'proportional',
        manualAllocations: {},
        applyInterest: false,
        interestRate: '0'
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch worker info
                const workerRes = await workerAPI.getWorkerById(workerId);
                if (workerRes.status) {
                    setWorkerName(workerRes.data.worker.name);
                    setTotalDebt(workerRes.data.worker.totalDebt || 0);
                }
                
                // Fetch active debts
                const debtsRes = await debtAPI.getByWorker(workerId, { status: 'active' });
                if (debtsRes.status && debtsRes.data?.debts) {
                    setAvailableDebts(debtsRes.data.debts);
                }
                
                // Fetch available payments
                const paymentsRes = await paymentAPI.getPaymentsByWorker(workerId, {
                    status: 'pending,processing',
                    limit: 100
                });
                if (paymentsRes.status) {
                    setAvailablePayments(paymentsRes.data.payments);
                    const totalAvail = paymentsRes.data.payments.reduce((sum: number, p: any) => sum + p.netPay, 0);
                    setTotalAvailablePayments(totalAvail);
                    const initialPaymentAmount = Math.min(workerRes.data.worker.totalDebt || 0, totalAvail);
                    setFormData(prev => ({
                        ...prev,
                        paymentAmount: initialPaymentAmount.toString()
                    }));
                }
                
            } catch (error) {
                console.error('Error fetching data:', error);
                showError('Failed to load worker data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [workerId]);

    // Calculate allocations when payment amount or method changes
    useEffect(() => {
        calculateAllocations();
    }, [formData.paymentAmount, formData.allocationMethod, formData.manualAllocations]);

    const calculateAllocations = useCallback(() => {
        const paymentAmount = parseFloat(formData.paymentAmount) || 0;
        const eligiblePayments = availablePayments.filter(p => 
            p.status === 'pending' || p.status === 'processing'
        );

        if (paymentAmount <= 0 || eligiblePayments.length === 0) {
            setAllocations([]);
            return;
        }

        let newAllocations: PaymentAllocation[] = [];

        switch (formData.allocationMethod) {
            case 'equal': {
                const amountPerPayment = paymentAmount / eligiblePayments.length;
                newAllocations = eligiblePayments.map(payment => ({
                    paymentId: payment.id,
                    allocatedAmount: Math.min(amountPerPayment, payment.netPay),
                    originalNetPay: payment.netPay,
                    remainingNetPay: payment.netPay - Math.min(amountPerPayment, payment.netPay),
                    period: payment.periodStart ? 
                        `${payment.periodStart} - ${payment.periodEnd || 'Present'}` : 
                        'No period'
                }));
                break;
            }

            case 'proportional': {
                const totalNetPay = eligiblePayments.reduce((sum, p) => sum + p.netPay, 0);
                newAllocations = eligiblePayments.map(payment => {
                    const proportion = payment.netPay / totalNetPay;
                    const allocated = paymentAmount * proportion;
                    return {
                        paymentId: payment.id,
                        allocatedAmount: Math.min(allocated, payment.netPay),
                        originalNetPay: payment.netPay,
                        remainingNetPay: payment.netPay - Math.min(allocated, payment.netPay),
                        period: payment.periodStart ? 
                            `${payment.periodStart} - ${payment.periodEnd || 'Present'}` : 
                            'No period'
                    };
                });
                break;
            }

            case 'largest_first': {
                const sortedPayments = [...eligiblePayments].sort((a, b) => b.netPay - a.netPay);
                let remainingAmount = paymentAmount;
                
                for (const payment of sortedPayments) {
                    if (remainingAmount <= 0) break;
                    
                    const allocated = Math.min(remainingAmount, payment.netPay);
                    newAllocations.push({
                        paymentId: payment.id,
                        allocatedAmount: allocated,
                        originalNetPay: payment.netPay,
                        remainingNetPay: payment.netPay - allocated,
                        period: payment.periodStart ? 
                            `${payment.periodStart} - ${payment.periodEnd || 'Present'}` : 
                            'No period'
                    });
                    remainingAmount -= allocated;
                }
                break;
            }

            case 'oldest_first': {
                const sortedPayments = [...eligiblePayments].sort((a, b) => {
                    const dateA = a.periodStart ? new Date(a.periodStart) : new Date(0);
                    const dateB = b.periodStart ? new Date(b.periodStart) : new Date(0);
                    return dateA.getTime() - dateB.getTime();
                });
                
                let remainingAmount = paymentAmount;
                
                for (const payment of sortedPayments) {
                    if (remainingAmount <= 0) break;
                    
                    const allocated = Math.min(remainingAmount, payment.netPay);
                    newAllocations.push({
                        paymentId: payment.id,
                        allocatedAmount: allocated,
                        originalNetPay: payment.netPay,
                        remainingNetPay: payment.netPay - allocated,
                        period: payment.periodStart ? 
                            `${payment.periodStart} - ${payment.periodEnd || 'Present'}` : 
                            'No period'
                    });
                    remainingAmount -= allocated;
                }
                break;
            }

            case 'manual': {
                newAllocations = eligiblePayments.map(payment => {
                    const manualAmount = parseFloat(formData.manualAllocations[payment.id] || '0');
                    const allocated = Math.min(manualAmount, payment.netPay);
                    return {
                        paymentId: payment.id,
                        allocatedAmount: allocated,
                        originalNetPay: payment.netPay,
                        remainingNetPay: payment.netPay - allocated,
                        period: payment.periodStart ? 
                            `${payment.periodStart} - ${payment.periodEnd || 'Present'}` : 
                            'No period'
                    };
                });
                break;
            }
        }

        // Adjust if total allocated exceeds payment amount
        const totalAllocated = newAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
        if (totalAllocated > paymentAmount) {
            const adjustmentFactor = paymentAmount / totalAllocated;
            newAllocations = newAllocations.map(a => ({
                ...a,
                allocatedAmount: a.allocatedAmount * adjustmentFactor,
                remainingNetPay: a.originalNetPay - (a.allocatedAmount * adjustmentFactor)
            }));
        }

        setAllocations(newAllocations);
    }, [formData, availablePayments]);

    const handleChange = (field: keyof FormData, value: string | boolean | 'cash' | 'bank_transfer' | 'gcash' | 'others' | 'equal' | 'proportional' | 'manual' | 'largest_first' | 'oldest_first') => {
        if (field === 'paymentAmount') {
            const numValue = parseFloat(value as string);
            if (numValue > Math.min(totalDebt, totalAvailablePayments)) {
                setErrors(prev => ({ ...prev, paymentAmount: 'Amount cannot exceed available payments or total debt' }));
            } else {
                setErrors(prev => ({ ...prev, paymentAmount: '' }));
            }
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleManualAllocationChange = (paymentId: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            manualAllocations: {
                ...prev.manualAllocations,
                [paymentId]: value
            }
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        const paymentAmount = parseFloat(formData.paymentAmount);
        if (!paymentAmount || paymentAmount <= 0) {
            newErrors.paymentAmount = 'Payment amount must be greater than 0';
        }

        if (paymentAmount > Math.min(totalDebt, totalAvailablePayments)) {
            newErrors.paymentAmount = 'Payment amount cannot exceed available payments or total debt';
        }

        if (formData.allocationMethod === 'manual') {
            const totalManualAllocated = Object.values(formData.manualAllocations)
                .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            
            if (Math.abs(totalManualAllocated - paymentAmount) > 0.01) {
                newErrors.manualAllocations = `Manual allocations total (${totalManualAllocated.toFixed(2)}) must equal payment amount (${paymentAmount.toFixed(2)})`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            showError('Please fix the errors in the form');
            return;
        }

        if (!await dialogs.confirm({
            title: 'Process Debt Payment',
            message: `Are you sure you want to process this debt payment of ₱${parseFloat(formData.paymentAmount).toFixed(2)}?`
        })) return;

        try {
            setSubmitting(true);

            // Process debt payments first
            const paymentAmount = parseFloat(formData.paymentAmount);
            let remainingAmount = paymentAmount;

            for (const debt of availableDebts) {
                if (remainingAmount <= 0) break;
                
                const amountToPay = Math.min(remainingAmount, debt.balance);
                if (amountToPay > 0) {
                    await debtAPI.makePayment({
                        debt_id: debt.id,
                        amount: amountToPay,
                        paymentMethod: formData.paymentMethod,
                        referenceNumber: formData.referenceNumber || undefined,
                        notes: formData.notes || undefined
                    });
                    remainingAmount -= amountToPay;
                }
            }

            // Apply deductions to payments
            for (const allocation of allocations) {
                if (allocation.allocatedAmount > 0) {
                    await paymentAPI.applyDebtDeduction(allocation.paymentId, {
                        deductionAmount: allocation.allocatedAmount
                    });
                }
            }

            showSuccess('Debt payment processed successfully!');
            
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (error: any) {
            console.error('Error processing debt payment:', error);
            showError(error.message || 'Failed to process debt payment');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return {
        // Data
        loading,
        workerName,
        totalDebt,
        totalAvailablePayments,
        availablePayments,
        availableDebts,
        
        // Form state
        formData,
        errors,
        allocations,
        submitting,
        
        // Handlers
        handleChange,
        handleManualAllocationChange,
        calculateAllocations,
        validateForm,
        
        // Actions
        handleSubmit,
        formatCurrency
    };
};

export default useDebtPaymentForm;