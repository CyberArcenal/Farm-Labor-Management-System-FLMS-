import React from "react";
import { AlertCircle, CreditCard, Calculator } from "lucide-react";
import { formatCurrency } from "../../../../../../../utils/formatters";
import { type FormData } from "../types/debt-payment.types";

interface PaymentInputSectionProps {
  formData: FormData;
  errors: Record<string, string>;
  totalDebt: number;
  totalPendingPayments: number;
  onChange: (field: keyof FormData, value: string) => void;
  disabled: boolean;
}

const PaymentInputSection: React.FC<PaymentInputSectionProps> = ({
  formData,
  errors,
  totalDebt,
  totalPendingPayments,
  onChange,
  disabled,
}) => {
  const paymentAmount = parseFloat(formData.paymentAmount) || 0;
  const cashRequired = Math.max(0, paymentAmount - totalPendingPayments);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-700">
          Payment Amount <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-1">
            Max: {formatCurrency(totalDebt)}
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-2.5 top-1/3 transform -translate-y-1/2 text-gray-500">₱</span>
          <input
            type="number"
            step="0.01"
            value={formData.paymentAmount}
            onChange={(e) => onChange("paymentAmount", e.target.value)}
            className={`w-full pl-7! pr-2! py-1.5! rounded text-sm border windows-input ${
              errors.paymentAmount ? "border-red-500" : 
              cashRequired > 0 ? "border-yellow-500" : "border-gray-300"
            }`}
            placeholder="0.00"
            required
            disabled={disabled}
            max={totalDebt}
            min="0"
          />
          {cashRequired > 0 && (
            <div className="mt-1 text-xs flex items-center gap-1 text-yellow-600">
              <AlertCircle className="w-3 h-3" />
              Requires {formatCurrency(cashRequired)} cash
            </div>
          )}
          {errors.paymentAmount && (
            <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
              <AlertCircle className="w-3 h-3" />
              {errors.paymentAmount}
            </p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {/* Quick Percentage Buttons */}
          {[10, 25, 50, 75, 100].map((percent) => {
            const amount = totalDebt * (percent / 100);
            return (
              <button
                key={percent}
                type="button"
                onClick={() => onChange("paymentAmount", amount.toFixed(2))}
                className="px-2 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors windows-button-secondary"
              >
                {percent}% ({formatCurrency(amount)})
              </button>
            );
          })}
          
          {/* Smart Calculation Buttons */}
          <button
            type="button"
            onClick={() => onChange("paymentAmount", Math.min(totalDebt, totalPendingPayments).toFixed(2))}
            className="px-2 py-1 text-xs font-medium bg-blue-100 hover:bg-blue-200 rounded text-blue-700 transition-colors windows-button-secondary flex items-center gap-1"
          >
            <Calculator className="w-3 h-3" />
            Use Only Pending ({formatCurrency(Math.min(totalDebt, totalPendingPayments))})
          </button>
          
          <button
            type="button"
            onClick={() => onChange("paymentAmount", totalDebt.toFixed(2))}
            className="px-2 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 rounded text-red-700 transition-colors windows-button-secondary"
          >
            Pay Full Debt ({formatCurrency(totalDebt)})
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-700">
          Payment Method <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-1">
            {cashRequired > 0 ? "For cash portion" : "For payment recording"}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "cash", label: "Cash", color: "bg-green-100 text-green-800" },
            // { value: "bank_transfer", label: "Bank Transfer", color: "bg-blue-100 text-blue-800" },
            // { value: "gcash", label: "GCash", color: "bg-purple-100 text-purple-800" },
            // { value: "others", label: "Others", color: "bg-gray-100 text-gray-800" },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange("paymentMethod", value)}
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
        {errors.paymentMethod && (
          <p className="mt-1 text-xs flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            {errors.paymentMethod}
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentInputSection;