// components/History/components/PaymentHistoryItem.tsx
import React, { type JSX } from "react";
import {
  ChevronUp,
  ChevronDown,
  Clock,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Edit,
  Trash2,
  DollarSign,
  User,
  FileText,
  CreditCard,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "../../../utils/formatters";
import { getActionTypeConfig } from "../utils/historyFormatters";
import type { PaymentHistoryItem as PaymentHistoryData } from "../../../apis/payment";
import {
  formatActionDescription,
  getFieldLabel,
} from "../utils/historyFormatters";

interface PaymentHistoryItemProps {
  record: PaymentHistoryData;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const PaymentHistoryItem: React.FC<PaymentHistoryItemProps> = ({
  record,
  isExpanded,
  onToggleExpand,
}) => {
  const config = getActionTypeConfig(record.action);

  const getActionIcon = () => {
    const icons: Record<string, JSX.Element> = {
      create: <PlusCircle className="w-5 h-5 text-green-600" />,
      deduction: <MinusCircle className="w-5 h-5 text-red-600" />,
      status_change: <RefreshCw className="w-5 h-5 text-blue-600" />,
      update: <Edit className="w-5 h-5 text-yellow-600" />,
      delete: <Trash2 className="w-5 h-5 text-gray-600" />,
      payment: <CreditCard className="w-5 h-5 text-blue-600" />,
    };
    return icons[record.action] || <Clock className="w-5 h-5 text-gray-600" />;
  };

  const formatValue = (value: string | null, field: string) => {
    if (value === null || value === undefined) return "N/A";

    // Format based on field type
    switch (field) {
      case "grossPay":
      case "netPay":
      case "oldAmount":
      case "newAmount":
        return formatCurrency(parseFloat(value));
      case "status":
        return value.charAt(0).toUpperCase() + value.slice(1);
      default:
        return value;
    }
  };

  const getAmountChange = () => {
    const { oldAmount, newAmount } = record.changes;
    if (oldAmount === null || newAmount === null) return null;

    const change = newAmount - oldAmount;
    return {
      amount: Math.abs(change),
      isIncrease: change > 0,
      isDecrease: change < 0,
      isSame: change === 0,
    };
  };

  const amountChange = getAmountChange();
  const workerName = record.worker 
    ? `${record.worker.name}`
    : 'Unknown Worker';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              {getActionIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{config.label}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{workerName}</span>
                      {record.worker?.contact && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">
                          Contact: {record.worker.contact}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatActionDescription(
                        record.action,
                        record.field,
                        record.notes,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      {getFieldLabel(record.field)}
                    </span>
                    {record.performedBy && (
                      <span className="text-xs px-2 py-1 bg-blue-50 rounded text-blue-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Performed By: {record.performedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {amountChange && (
                <div
                  className={`text-sm font-medium ${
                    amountChange.isIncrease
                      ? "text-green-600"
                      : amountChange.isDecrease
                        ? "text-red-600"
                        : "text-gray-900"
                  }`}
                >
                  {amountChange.isIncrease
                    ? "+"
                    : amountChange.isDecrease
                      ? "-"
                      : ""}
                  {formatCurrency(amountChange.amount)}
                </div>
              )}
              {record.paymentInfo?.netPay && (
                <div className="text-xs text-gray-600">
                  Net: {formatCurrency(record.paymentInfo.netPay)}
                </div>
              )}
              <div className="text-xs text-gray-500">
                {formatDateTime(record.timestamp)}
              </div>
            </div>
            <div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Change Details
              </h5>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Previous Value
                    </div>
                    <div className="text-sm font-medium">
                      {formatValue(record.changes.oldValue, record.field)}
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">New Value</div>
                    <div className="text-sm font-medium">
                      {formatValue(record.changes.newValue, record.field)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Previous Amount
                    </div>
                    <div className="text-sm font-medium">
                      {record.changes.oldAmount !== null
                        ? formatCurrency(record.changes.oldAmount)
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">New Amount</div>
                    <div className="text-sm font-medium">
                      {record.changes.newAmount !== null
                        ? formatCurrency(record.changes.newAmount)
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {amountChange && !amountChange.isSame && (
                  <div
                    className={`p-2 rounded ${
                      amountChange.isIncrease
                        ? "bg-green-50 border border-green-200"
                        : amountChange.isDecrease
                          ? "bg-red-50 border border-red-200"
                          : "bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {amountChange.isIncrease ? "Increase" : "Decrease"}:
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          amountChange.isIncrease
                            ? "text-green-700"
                            : amountChange.isDecrease
                              ? "text-red-700"
                              : "text-gray-700"
                        }`}
                      >
                        {amountChange.isIncrease ? "+" : "-"}
                        {formatCurrency(amountChange.amount)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Metadata
              </h5>
              <div className="space-y-3">
                <div className="bg-gray-100 rounded p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Worker:</span>
                    <span className="text-sm font-medium">
                      {workerName}
                      {record.worker?.id && ` (${record.worker.id})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Performed By:</span>
                    <span className="text-sm font-medium">
                      {record.performedBy
                        ? `User ${record.performedBy}`
                        : "System"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Timestamp:</span>
                    <span className="text-sm font-medium">
                      {formatDateTime(record.timestamp)}
                    </span>
                  </div>
                </div>

                {record.paymentInfo && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Payment Info
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-blue-600">Reference:</div>
                        <div className="text-sm font-medium">
                          {record.paymentInfo.referenceNumber || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600">Status:</div>
                        <div className="text-sm font-medium">
                          {record.paymentInfo.status}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-blue-600">Net Pay:</div>
                        <div className="text-sm font-medium">
                          {formatCurrency(record.paymentInfo.netPay)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        Notes
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">{record.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Action Type
                    </div>
                    <div className="text-sm font-medium capitalize">
                      {record.action.replace("_", " ")}
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-xs text-gray-500 mb-1">Field</div>
                    <div className="text-sm font-medium">
                      {getFieldLabel(record.field)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryItem;