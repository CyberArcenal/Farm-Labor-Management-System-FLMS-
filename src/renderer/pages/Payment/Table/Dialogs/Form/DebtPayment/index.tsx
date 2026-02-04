import React, { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  Loader,
  AlertCircle,
  Receipt,
  CreditCard,
} from "lucide-react";
import type { DebtPaymentDialogProps } from "./types/debt-payment.types";
import type { DebtData } from "../../../../../../apis/debt";
import type { FormData } from "./types/debt-payment.types";
import workerAPI from "../../../../../../apis/worker";
import paymentAPI from "../../../../../../apis/payment";
import { showApiError, showError, showSuccess } from "../../../../../../utils/notification";
import { formatCurrency } from "../../../../../../utils/formatters";
import debtAPI from "../../../../../../apis/debt";
import PaymentInputSection from "./components/PaymentInputSection";
import PaymentDetailsSection from "./components/PaymentDetailsSection";
import ActiveDebtsSummary from "./components/ActiveDebtsSummary";
import { dialogs } from "../../../../../../utils/dialogs";

const DebtPaymentDialog: React.FC<DebtPaymentDialogProps> = ({
  workerId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [workerName, setWorkerName] = useState("");
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalPendingPayments, setTotalPendingPayments] = useState(0);
  const [activeDebts, setActiveDebts] = useState<DebtData[]>([]);
  const [formData, setFormData] = useState<FormData>({
    paymentAmount: "",
    paymentMethod: "cash",
    referenceNumber: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate breakdown
  const paymentAmount = parseFloat(formData.paymentAmount) || 0;
  const fromPendingPayments = Math.min(paymentAmount, totalPendingPayments);
  const cashRequired = Math.max(0, paymentAmount - totalPendingPayments);
  const remainingDebt = totalDebt - paymentAmount;

  // Fetch worker, debt, and pending payments data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch worker info
        const workerResponse = await workerAPI.getWorkerById(workerId);
        if (workerResponse.status) {
          setWorkerName(workerResponse.data.worker.name);
        }

        // Fetch debt summary
        const debtRes = await workerAPI.getWorkerDebtSummary(workerId, false);
        if (debtRes.status) {
          setActiveDebts(debtRes.data.debts || []);
          setTotalDebt(debtRes.data.summary.totalBalance);

          // Set default payment amount as total debt if available
          if (debtRes.data.summary.totalBalance > 0) {
            setFormData((prev) => ({
              ...prev,
              paymentAmount: debtRes.data.summary.totalBalance.toString(),
            }));
          }
        }

        // Fetch pending payments total
        const [pendingRes, partialyPaidRes] = await Promise.all([
          paymentAPI.getPaymentsByWorker(workerId, {
            status: "pending",
            limit: 100,
          }),
          paymentAPI.getPaymentsByWorker(workerId, {
            status: "partially_paid",
            limit: 100,
          }),
        ]);

        const pendingPayments = pendingRes.status
          ? pendingRes.data.payments || []
          : [];
        const processingPayments = partialyPaidRes.status
          ? partialyPaidRes.data.payments || []
          : [];

        const allPayments = [...pendingPayments, ...processingPayments];
        const totalPending = allPayments.reduce(
          (sum, payment) => sum + payment.netPay,
          0,
        );
        setTotalPendingPayments(totalPending);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        showError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workerId]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const paymentAmount = parseFloat(formData.paymentAmount) || 0;

    if (!paymentAmount || paymentAmount <= 0) {
      newErrors.paymentAmount = "Please enter a valid payment amount";
    } else if (paymentAmount > totalDebt) {
      newErrors.paymentAmount = `Payment amount cannot exceed total debt of ${formatCurrency(totalDebt)}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(!await dialogs.confirm({title: "Debt Payment", message: "are you sure do you want to paid this debt?", icon: "warning"}))return;

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const debtPaymentData = {
        workerId,
        paymentAmount,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
      };

      // Validate first
      try {
        const validation = await debtAPI.validateDebtPayment(
          workerId,
          paymentAmount,
        );
        if (!validation.data.isValid) {
          showError(`Validation failed: ${validation.data.errors.join(", ")}`);
          return;
        }
      } catch (validationError) {
        showApiError(validationError);
        console.error("Validation error:", validationError);
        return;
      }

      // Process payment
      const result = await debtAPI.processDebtPayment(debtPaymentData);

      if (result.status) {
        showSuccess(
          `Successfully processed ${formatCurrency(paymentAmount)} debt payment for ${workerName}`,
        );

        if (onSuccess) onSuccess();
        onClose();
      } else {
        throw new Error(result.message || "Payment processing failed");
      }
    } catch (err: any) {
      console.error("Error processing debt payment:", err);
      showError(err.message || "Failed to process debt payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded w-full max-w-4xl shadow-lg border border-gray-300 max-h-[90vh] overflow-hidden windows-fade-in">
        {/* Header */}
        <div className="p-3 border-b border-gray-300 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900">Debt Payment</h3>
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
            onClick={async() => {if(!await dialogs.confirm({title: "Exit", message: "Are you sure do you want to exit?"}))return; onClose()}}
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
              {/* Payment Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                {/* Pending Payments Box */}
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Receipt className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-blue-800">
                        Available from Pending Payments
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-900 mb-1">
                    {formatCurrency(totalPendingPayments)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {paymentAmount > 0 && (
                      <>
                        Will use:{" "}
                        <span className="font-semibold">
                          {formatCurrency(fromPendingPayments)}
                        </span>
                        {fromPendingPayments < totalPendingPayments && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {totalPendingPayments - fromPendingPayments > 0 &&
                              `${formatCurrency(totalPendingPayments - fromPendingPayments)} remaining`}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Amount Box */}
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                        <DollarSign className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-green-800">
                        Total Payment
                      </span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-900 mb-1">
                    {formatCurrency(paymentAmount)}
                  </div>
                  <div className="text-xs text-green-600">
                    {totalDebt > 0 && (
                      <>
                        {((paymentAmount / totalDebt) * 100).toFixed(1)}% of
                        total debt
                      </>
                    )}
                  </div>
                </div>

                {/* Cash Required Box */}
                <div
                  className={`p-3 rounded border ${cashRequired > 0 ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200" : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full ${cashRequired > 0 ? "bg-red-600" : "bg-gray-600"} flex items-center justify-center`}
                      >
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <span
                        className={`text-xs font-medium ${cashRequired > 0 ? "text-red-800" : "text-gray-800"}`}
                      >
                        Cash Required
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold ${cashRequired > 0 ? "text-red-900" : "text-gray-900"}`}
                  >
                    {formatCurrency(cashRequired)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {cashRequired > 0 ? (
                      <span className="text-red-600">
                        Additional cash payment needed
                      </span>
                    ) : (
                      <span className="text-green-600">
                        Fully covered by pending payments
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Summary Alert */}
              {paymentAmount > 0 && (
                <div
                  className={`p-3 rounded border ${cashRequired > 0 ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`w-4 h-4 mt-0.5 ${cashRequired > 0 ? "text-yellow-600" : "text-green-600"}`}
                    />
                    <div className="text-xs">
                      <span
                        className={`font-medium ${cashRequired > 0 ? "text-yellow-800" : "text-green-800"}`}
                      >
                        Payment Summary:
                      </span>
                      <div className="mt-1">
                        {cashRequired > 0 ? (
                          <>
                            This payment of{" "}
                            <strong>{formatCurrency(paymentAmount)}</strong>{" "}
                            will be split as:
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="text-blue-700">
                                •{" "}
                                <strong>
                                  {formatCurrency(fromPendingPayments)}
                                </strong>{" "}
                                from pending payments
                              </div>
                              <div className="text-red-700">
                                •{" "}
                                <strong>{formatCurrency(cashRequired)}</strong>{" "}
                                as cash payment
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            This payment of{" "}
                            <strong>{formatCurrency(paymentAmount)}</strong>{" "}
                            will be fully deducted from pending payments.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <PaymentInputSection
                formData={formData}
                errors={errors}
                totalDebt={totalDebt}
                totalPendingPayments={totalPendingPayments}
                onChange={handleChange}
                disabled={submitting}
              />

              <PaymentDetailsSection
                formData={formData}
                onChange={handleChange}
                disabled={submitting}
              />

              {activeDebts.length > 0 && (
                <div className="space-y-3">
                  <ActiveDebtsSummary activeDebts={activeDebts} />

                  {/* Additional Summary Info */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="font-medium text-gray-700">
                        Total Active Debts
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        {activeDebts.length}
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="font-medium text-gray-700">
                        Total Balance
                      </div>
                      <div className="text-sm font-bold text-red-600">
                        {formatCurrency(
                          activeDebts.reduce(
                            (sum, debt) => sum + debt.balance,
                            0,
                          ),
                        )}
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="font-medium text-gray-700">
                        Total Paid
                      </div>
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(
                          activeDebts.reduce(
                            (sum, debt) => sum + debt.totalPaid,
                            0,
                          ),
                        )}
                      </div>
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
                {cashRequired > 0
                  ? `This payment includes ${formatCurrency(cashRequired)} cash payment.`
                  : `Payment will be fully deducted from pending payments.`}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                 onClick={async() => {if(!await dialogs.confirm({title: "Exit", message: "Are you sure do you want to exit?"}))return; onClose()}}
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
                  parseFloat(formData.paymentAmount) > totalDebt
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
                    {cashRequired > 0
                      ? "Process Payment (Cash + Pending)"
                      : "Process Payment (Pending Only)"}
                    <span className="ml-0.5 font-normal">
                      ({formatCurrency(parseFloat(formData.paymentAmount) || 0)}
                      )
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
