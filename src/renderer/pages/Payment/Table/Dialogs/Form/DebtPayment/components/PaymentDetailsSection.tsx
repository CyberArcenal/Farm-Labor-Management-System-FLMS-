import React from "react";
import { FileText } from "lucide-react";
import { type FormData } from "../types/debt-payment.types";

interface PaymentDetailsSectionProps {
  formData: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  disabled: boolean;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({
  formData,
  onChange,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-700">
          Reference Number
          <span className="text-xs text-gray-500 ml-1">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.referenceNumber}
          onChange={(e) => onChange("referenceNumber", e.target.value)}
          className="w-full px-2.5! py-1.5! rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none windows-input"
          placeholder="Check #1234, Transaction ID, etc."
          disabled={disabled}
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
            onChange={(e) => onChange("notes", e.target.value)}
            className="w-full pl-8! pr-2.5! py-1.5! rounded text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none windows-input"
            placeholder="Add any notes about this debt payment..."
            rows={2}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsSection;