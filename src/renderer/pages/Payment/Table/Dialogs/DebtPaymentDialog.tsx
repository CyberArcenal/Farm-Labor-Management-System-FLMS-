// components/Payment/Dialogs/DebtPaymentDialog.tsx
import React, { useState, useEffect } from "react";
import {
    X,
    DollarSign,
    AlertCircle,
    Loader,
    Calculator,
    Calendar,
    CreditCard,
    FileText,
    Check,
    Percent,
    DivideIcon,
    Zap,
    Clock,
    Receipt,
    TrendingDown,
} from "lucide-react";
import paymentAPI from "../../../../apis/payment";
import workerAPI from "../../../../apis/worker";
import { showSuccess, showError } from "../../../../utils/notification";

interface PaymentData {
  id: number;
  grossPay: number;
  manualDeduction: number;
  netPay: number;
  status: "pending" | "processing" | "completed" | "cancelled" | "partially_paid";
  paymentDate: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  totalDebtDeduction: number;
  otherDeductions: number;
  deductionBreakdown: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  worker?: any;
}

interface DebtData {
  id: number;
  originalAmount: number;
  amount: number;
  balance: number;
  reason: string | null;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue';
  dateIncurred: string;
  dueDate: string | null;
  paymentTerm: string | null;
  interestRate: number;
  totalInterest: number;
  totalPaid: number;
}

interface Allocation {
  paymentId: number;
  period?: string;
  originalNetPay: number;
  allocatedAmount: number;
  remainingNetPay: number;
  paymentStatus: string;
}

interface DebtPaymentDialogProps {
  workerId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  paymentAmount: string;
  paymentMethod: string;
  allocationMethod: 'proportional' | 'equal' | 'largest_first' | 'oldest_first' | 'manual';
  referenceNumber: string;
  notes: string;
  manualAllocations: Record<number, string>;
}

const DebtPaymentDialog: React.FC<DebtPaymentDialogProps> = ({
  workerId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [totalDebt, setTotalDebt] = useState(0);
  const [availablePayments, setAvailablePayments] = useState<PaymentData[]>([]);
  const [activeDebts, setActiveDebts] = useState<DebtData[]>([]);
  const [formData, setFormData] = useState<FormData>({
    paymentAmount: "",
    paymentMethod: "cash",
    allocationMethod: "proportional",
    referenceNumber: "",
    notes: "",
    manualAllocations: {},
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allocations, setAllocations] = useState<Allocation[]>([]);

  // Calculate total available payments (pending + processing)
  const totalAvailablePayments = availablePayments.reduce(
    (sum, payment) => sum + payment.netPay,
    0
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Fetch worker and payment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch worker details
        const workerResponse = await workerAPI.getWorkerById(workerId);
        if (workerResponse.status) {
          setWorkerName(workerResponse.data.worker.name);
          setTotalDebt(workerResponse.data.worker.currentBalance || 0);
        }

        // Fetch pending/processing payments for this worker
        const [pendingRes, processingRes] = await Promise.all([
          paymentAPI.getPaymentsByWorker(workerId, { 
            status: 'pending',
            limit: 100
          }),
          paymentAPI.getPaymentsByWorker(workerId, { 
            status: 'processing',
            limit: 100
          })
        ]);

        const pendingPayments = pendingRes.status ? pendingRes.data.payments || [] : [];
        const processingPayments = processingRes.status ? processingRes.data.payments || [] : [];
        
        const allPayments = [...pendingPayments, ...processingPayments];
        setAvailablePayments(allPayments);

        // Calculate initial allocations
        if (allPayments.length > 0) {
          calculateAllocations(allPayments, parseFloat(formData.paymentAmount) || 0);
        }

        // Fetch active debts
        const debtRes = await workerAPI.getWorkerDebtSummary(workerId, false);
        if (debtRes.status) {
          setActiveDebts(debtRes.data.debts || []);
        }

      } catch (err: any) {
        console.error("Error fetching data:", err);
        showError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workerId]);

  // Calculate allocations based on method
  const calculateAllocations = (payments: PaymentData[], paymentAmount: number) => {
    if (!paymentAmount || paymentAmount <= 0 || payments.length === 0) {
      setAllocations([]);
      return;
    }

    let newAllocations: Allocation[] = [];
    let remainingAmount = paymentAmount;

    // Create base allocations
    const baseAllocations = payments.map(payment => ({
      paymentId: payment.id,
      period: payment.periodStart 
        ? `${new Date(payment.periodStart).toLocaleDateString()} - ${new Date(payment.periodEnd || payment.periodStart).toLocaleDateString()}`
        : undefined,
      originalNetPay: payment.netPay,
      allocatedAmount: 0,
      remainingNetPay: payment.netPay,
      paymentStatus: payment.status,
    }));

    switch (formData.allocationMethod) {
      case "proportional":
        // Allocate proportionally based on net pay
        const totalNetPay = baseAllocations.reduce((sum, a) => sum + a.originalNetPay, 0);
        baseAllocations.forEach(allocation => {
          const proportion = allocation.originalNetPay / totalNetPay;
          const allocated = Math.min(remainingAmount * proportion, allocation.originalNetPay);
          allocation.allocatedAmount = allocated;
          allocation.remainingNetPay = allocation.originalNetPay - allocated;
        });
        break;

      case "equal":
        // Allocate equal amounts to each payment
        const equalAmount = Math.min(remainingAmount / baseAllocations.length, Math.min(...baseAllocations.map(a => a.originalNetPay)));
        baseAllocations.forEach(allocation => {
          allocation.allocatedAmount = equalAmount;
          allocation.remainingNetPay = allocation.originalNetPay - equalAmount;
        });
        break;

      case "largest_first":
        // Allocate to largest payments first
        const sortedLargest = [...baseAllocations].sort((a, b) => b.originalNetPay - a.originalNetPay);
        for (const allocation of sortedLargest) {
          const allocatable = Math.min(remainingAmount, allocation.originalNetPay);
          allocation.allocatedAmount = allocatable;
          allocation.remainingNetPay = allocation.originalNetPay - allocatable;
          remainingAmount -= allocatable;
          if (remainingAmount <= 0) break;
        }
        break;

      case "oldest_first":
        // Allocate to oldest payments first (assuming payments are already sorted by date)
        for (const allocation of baseAllocations) {
          const allocatable = Math.min(remainingAmount, allocation.originalNetPay);
          allocation.allocatedAmount = allocatable;
          allocation.remainingNetPay = allocation.originalNetPay - allocatable;
          remainingAmount -= allocatable;
          if (remainingAmount <= 0) break;
        }
        break;

      case "manual":
        // Use manual allocations from form
        baseAllocations.forEach(allocation => {
          const manualAmount = parseFloat(formData.manualAllocations[allocation.paymentId] || "0");
          allocation.allocatedAmount = Math.min(manualAmount, allocation.originalNetPay);
          allocation.remainingNetPay = allocation.originalNetPay - allocation.allocatedAmount;
        });
        break;
    }

    setAllocations(baseAllocations);
  };

  // Handle form field changes
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Recalculate allocations if payment amount changes
      if (field === "paymentAmount" || field === "allocationMethod") {
        const paymentAmount = parseFloat(
          field === "paymentAmount" ? value : prev.paymentAmount
        ) || 0;
        calculateAllocations(availablePayments, paymentAmount);
      }

      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle manual allocation changes
  const handleManualAllocationChange = (paymentId: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      manualAllocations: {
        ...prev.manualAllocations,
        [paymentId]: value
      }
    }));

    // Recalculate allocations for manual method
    if (formData.allocationMethod === "manual") {
      setTimeout(() => {
        const paymentAmount = parseFloat(formData.paymentAmount) || 0;
        calculateAllocations(availablePayments, paymentAmount);
      }, 100);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const paymentAmount = parseFloat(formData.paymentAmount) || 0;

    if (!paymentAmount || paymentAmount <= 0) {
      newErrors.paymentAmount = "Please enter a valid payment amount";
    } else if (paymentAmount > Math.min(totalDebt, totalAvailablePayments)) {
      newErrors.paymentAmount = `Payment amount cannot exceed ${formatCurrency(Math.min(totalDebt, totalAvailablePayments))}`;
    }

    if (formData.allocationMethod === "manual") {
      const totalManualAllocated = Object.values(formData.manualAllocations)
        .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      
      if (Math.abs(totalManualAllocated - paymentAmount) > 0.01) {
        newErrors.manualAllocations = `Manual allocations (${formatCurrency(totalManualAllocated)}) must equal payment amount (${formatCurrency(paymentAmount)})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const paymentAmount = parseFloat(formData.paymentAmount);
      
      // Create payment records for each allocation
      const paymentPromises = allocations
        .filter(a => a.allocatedAmount > 0)
        .map(allocation => 
          paymentAPI.applyDebtDeduction(allocation.paymentId, {
            deductionAmount: allocation.allocatedAmount
          })
        );

      await Promise.all(paymentPromises);

      // Apply remaining debt payment if any
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      if (paymentAmount > totalAllocated) {
        // Direct debt payment for remaining amount
        const remainingPayment = paymentAmount - totalAllocated;
        // You might want to call a debt payment API here
      }

      showSuccess(`Successfully processed ${formatCurrency(paymentAmount)} debt payment for ${workerName}`);
      
      if (onSuccess) onSuccess();
      onClose();

    } catch (err: any) {
      console.error("Error processing debt payment:", err);
      showError(err.message || "Failed to process debt payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate summary values
  const paymentAmount = parseFloat(formData.paymentAmount) || 0;
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  const remainingDebt = totalDebt - paymentAmount;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded w-full max-w-5xl shadow-lg border border-gray-300 max-h-[90vh] overflow-hidden windows-fade-in">
        {/* Header */}
        <div className="p-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900">
                Debt Payment
              </h3>
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <span className="font-medium">{workerName}</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-600 font-semibold">
                  Total Debt: {formatCurrency(totalDebt)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-gray-200 transition-colors windows-button-secondary"
            title="Close"
            disabled={submitting}
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-xs text-gray-600">
                Loading debt information...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Financial Overview */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-gradient-to-br from-red-50 to-red-100 rounded border border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                      <TrendingDown className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-red-800">Total Debt</span>
                  </div>
                  <div className="text-lg font-bold text-red-900">
                    {formatCurrency(totalDebt)}
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <Receipt className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-800">Available Payments</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatCurrency(totalAvailablePayments)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {availablePayments.length} pending payment{availablePayments.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                      <DollarSign className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-800">Payment Amount</span>
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {formatCurrency(paymentAmount)}
                  </div>
                  {paymentAmount > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      {((paymentAmount / Math.min(totalDebt, totalAvailablePayments)) * 100).toFixed(1)}% of available
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-orange-800">Remaining Debt</span>
                  </div>
                  <div className="text-lg font-bold text-orange-900">
                    {formatCurrency(remainingDebt)}
                  </div>
                  {remainingDebt <= 0 && (
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-2 h-2" /> Debt Cleared!
                    </div>
                  )}
                </div>
              </div>

              {/* Available Payments Section */}
              {availablePayments.length > 0 && (
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-3 h-3 text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">
                          Available Payments for Debt Settlement
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 bg-white px-1.5 py-0.5 rounded">
                        {availablePayments.length} payment{availablePayments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      These pending and processing payments can be used to settle the worker's debt
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto pitak-table-container">
                    <table className="w-full windows-table">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-300">
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Payment ID</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Period</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Status</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Net Pay</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Deductions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availablePayments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-2 text-xs font-medium">
                              #{payment.id}
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {payment.periodStart ? (
                                <>
                                  {new Date(payment.periodStart).toLocaleDateString()}
                                  {payment.periodEnd && ` to ${new Date(payment.periodEnd).toLocaleDateString()}`}
                                </>
                              ) : (
                                "N/A"
                              )}
                            </td>
                            <td className="p-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                payment.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : payment.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </span>
                            </td>
                            <td className="p-2 text-xs font-semibold text-gray-900">
                              {formatCurrency(payment.netPay)}
                            </td>
                            <td className="p-2 text-xs text-gray-500">
                              {formatCurrency(payment.totalDebtDeduction + payment.manualDeduction + payment.otherDeductions)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Amount & Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Payment Amount <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-1">
                      Max: {formatCurrency(Math.min(totalDebt, totalAvailablePayments))}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.paymentAmount}
                      onChange={(e) => handleChange("paymentAmount", e.target.value)}
                      className={`w-full pl-7! pr-2! py-1.5! rounded text-sm border windows-input ${
                        errors.paymentAmount ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="0.00"
                      required
                      disabled={submitting}
                      max={Math.min(totalDebt, totalAvailablePayments)}
                      min="0"
                    />
                    {errors.paymentAmount && (
                      <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        {errors.paymentAmount}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[10, 25, 50, 75, 100].map((percent) => {
                      const amount = Math.min(totalDebt, totalAvailablePayments) * (percent / 100);
                      return (
                        <button
                          key={percent}
                          type="button"
                          onClick={() => handleChange("paymentAmount", amount.toFixed(2))}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors windows-button-secondary"
                        >
                          {percent}% ({formatCurrency(amount)})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "cash", label: "Cash", color: "bg-green-100 text-green-800" },
                        { value: "bank_transfer", label: "Bank Transfer", color: "bg-blue-100 text-blue-800" },
                        { value: "gcash", label: "GCash", color: "bg-purple-100 text-purple-800" },
                        { value: "others", label: "Others", color: "bg-gray-100 text-gray-800" },
                      ] as const
                    ).map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange("paymentMethod", value)}
                        className={`p-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all windows-button ${
                          formData.paymentMethod === value
                            ? `${color} border border-gray-400`
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Allocation Method */}
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-700">
                  Allocation Method
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    [
                      {
                        value: "proportional",
                        label: "Proportional",
                        icon: Percent,
                        description: "Deduct proportionally",
                      },
                      {
                        value: "equal",
                        label: "Equal",
                        icon: DivideIcon,
                        description: "Equal amounts",
                      },
                      {
                        value: "largest_first",
                        label: "Largest First",
                        icon: Zap,
                        description: "Largest payments first",
                      },
                      {
                        value: "oldest_first",
                        label: "Oldest First",
                        icon: Calendar,
                        description: "Oldest payments first",
                      },
                      {
                        value: "manual",
                        label: "Manual",
                        icon: Calculator,
                        description: "Manually specify",
                      },
                    ] as const
                  ).map(({ value, label, icon: Icon, description }) => (
                    <div key={value} className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleChange("allocationMethod", value)}
                        className={`p-2 rounded text-xs font-medium flex flex-col items-center gap-1 transition-all windows-button ${
                          formData.allocationMethod === value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
                {errors.manualAllocations && (
                  <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    {errors.manualAllocations}
                  </p>
                )}
              </div>

              {/* Allocation Table */}
              {allocations.length > 0 && paymentAmount > 0 && (
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-blue-50 px-3 py-2 border-b border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-900">
                          Payment Allocation Breakdown
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-blue-800">
                          Total Allocated: <strong>{formatCurrency(totalAllocated)}</strong>
                        </span>
                        <span className={`text-xs ${Math.abs(totalAllocated - paymentAmount) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(totalAllocated - paymentAmount) < 0.01 ? '✓ Balanced' : 'Imbalanced'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto pitak-table-container">
                    <table className="w-full windows-table">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-300">
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Payment</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Period</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Status</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Original</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Allocation</th>
                          <th className="p-2 text-left text-xs font-medium text-gray-600">Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((allocation, index) => (
                          <tr
                            key={allocation.paymentId}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-2 text-xs font-medium">
                              Payment #{allocation.paymentId}
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {allocation.period || "N/A"}
                            </td>
                            <td className="p-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                allocation.paymentStatus === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {allocation.paymentStatus}
                              </span>
                            </td>
                            <td className="p-2 text-xs font-medium text-gray-900">
                              {formatCurrency(allocation.originalNetPay)}
                            </td>
                            <td className="p-2">
                              {formData.allocationMethod === "manual" ? (
                                <div className="relative">
                                  <span className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                                    ₱
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={formData.manualAllocations[allocation.paymentId] || "0"}
                                    onChange={(e) =>
                                      handleManualAllocationChange(allocation.paymentId, e.target.value)
                                    }
                                    className="w-full pl-5! pr-1.5! py-1! rounded text-xs border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none windows-input"
                                    placeholder="0.00"
                                    max={allocation.originalNetPay}
                                    min="0"
                                    disabled={submitting}
                                  />
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-blue-600">
                                  {formatCurrency(allocation.allocatedAmount)}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <div className={`text-xs font-medium ${
                                allocation.remainingNetPay > 0 
                                  ? "text-green-600" 
                                  : "text-gray-400"
                              }`}>
                                {formatCurrency(allocation.remainingNetPay)}
                              </div>
                              {allocation.allocatedAmount > 0 && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {(allocation.allocatedAmount / allocation.originalNetPay * 100).toFixed(1)}% deducted
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Reference Number
                    <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) => handleChange("referenceNumber", e.target.value)}
                    className="w-full px-2.5! py-1.5! rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none windows-input"
                    placeholder="Check #1234, Transaction ID, etc."
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Notes
                    <span className="text-xs text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleChange("notes", e.target.value)}
                      className="w-full pl-8! pr-2.5! py-1.5! rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none windows-input"
                      placeholder="Add any notes about this debt payment..."
                      rows={2}
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Active Debts Summary */}
              {activeDebts.length > 0 && (
                <div className="border border-gray-300 rounded overflow-hidden">
                  <div className="bg-red-50 px-3 py-2 border-b border-gray-300">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span className="text-xs font-semibold text-red-900">
                        Active Debts Summary
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-0.5">
                      This payment will be applied to {activeDebts.length} active debt{activeDebts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="p-2.5">
                    <div className="grid grid-cols-3 gap-2.5">
                      {activeDebts.slice(0, 3).map((debt) => (
                        <div key={debt.id} className="p-2 bg-white border border-gray-300 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
                              Debt #{debt.id}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              debt.status === 'overdue' 
                                ? 'bg-red-100 text-red-800'
                                : debt.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {debt.status}
                            </span>
                          </div>
                          <div className="text-md font-bold text-gray-900">
                            {formatCurrency(debt.balance)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Due: {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : "No due date"}
                          </div>
                        </div>
                      ))}
                      {activeDebts.length > 3 && (
                        <div className="p-2 bg-gray-50 border border-gray-300 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            +{activeDebts.length - 3} more debt{activeDebts.length - 3 !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-300 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                Debt payments will be deducted from pending/processing payments. 
                Any remaining amount will be recorded as direct debt payment.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded text-xs font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 windows-button-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !formData.paymentAmount ||
                  parseFloat(formData.paymentAmount) <= 0 ||
                  Math.abs(totalAllocated - parseFloat(formData.paymentAmount)) > 0.01
                }
                className="px-3 py-1.5 rounded text-xs font-medium bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white flex items-center gap-1.5 windows-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-3.5 h-3.5" />
                    Process Debt Payment
                    <span className="ml-0.5 font-normal">
                      ({formatCurrency(parseFloat(formData.paymentAmount) || 0)})
                    </span>
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

export default DebtPaymentDialog;