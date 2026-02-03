// components/Payment/components/PaymentTableRow.tsx
import React from "react";
import {
  Calendar,
  Users,
  DollarSign,
  Banknote,
  FileText,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import PaymentActionsDropdown from "./PaymentActionsDropdown";
import { formatDate, formatCurrency } from "../../../../utils/formatters";
import type { PaymentData } from "../../../../apis/payment";

interface PaymentTableRowProps {
  payment: PaymentData;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onView: (id: number) => void;
  onUpdateStatus: (
    id: number,
    currentStatus: string,
    newStatus: string,
  ) => void;
  onProcessPayment: (id: number) => void;
  onCancelPayment: (id: number) => void;
  onGenerateSlip: (id: number) => void;
}

const PaymentTableRow: React.FC<PaymentTableRowProps> = ({
  payment,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onView,
  onUpdateStatus,
  onProcessPayment,
  onCancelPayment,
  onGenerateSlip,
}) => {
  const getStatusBadge = (status: string = "pending") => {
    const statusConfig: Record<string, any> = {
      pending: {
        text: "Pending",
        bg: "var(--status-growing-bg)",
        color: "var(--status-growing)",
        border: "rgba(214, 158, 46, 0.3)",
      },
      processing: {
        text: "Processing",
        bg: "var(--status-irrigation-bg)",
        color: "var(--status-irrigation)",
        border: "rgba(49, 130, 206, 0.3)",
      },
      completed: {
        text: "Completed",
        bg: "var(--status-planted-bg)",
        color: "var(--status-planted)",
        border: "rgba(56, 161, 105, 0.3)",
      },
      cancelled: {
        text: "Cancelled",
        bg: "var(--accent-rust-light)",
        color: "var(--accent-rust)",
        border: "rgba(197, 48, 48, 0.3)",
      },
      partially_paid: {
        text: "Partially Paid",
        bg: "rgba(168, 85, 247, 0.1)",
        color: "rgb(126, 34, 206)",
        border: "rgba(168, 85, 247, 0.2)",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
        }}
      >
        {config.text}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string | null) => {
    const methodConfig: Record<string, any> = {
      cash: {
        text: "Cash",
        bg: "rgba(34, 197, 94, 0.1)",
        color: "rgb(21, 128, 61)",
      },
      bank: {
        text: "Bank Transfer",
        bg: "rgba(59, 130, 246, 0.1)",
        color: "rgb(29, 78, 216)",
      },
      check: {
        text: "Check",
        bg: "rgba(245, 158, 11, 0.1)",
        color: "rgb(180, 83, 9)",
      },
      digital: {
        text: "Digital",
        bg: "rgba(139, 92, 246, 0.1)",
        color: "rgb(109, 40, 217)",
      },
    };

    const config =
      method && methodConfig[method]
        ? methodConfig[method]
        : {
            text: method || "Not Specified",
            bg: "var(--border-light)",
            color: "var(--text-tertiary)",
          };

    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{
          background: config.bg,
          color: config.color,
        }}
      >
        {config.text}
      </span>
    );
  };

  const ExpandedView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText
            className="w-4 h-4"
            style={{ color: "var(--accent-green)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Payment Details
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Created:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatDate(payment.createdAt, "MMM dd, yyyy HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Updated:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatDate(payment.updatedAt, "MMM dd, yyyy HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Reference:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {payment.referenceNumber || "N/A"}
            </span>
          </div>
          {payment.notes && (
            <div
              className="mt-2 pt-2 border-t"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Notes:
              </span>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-primary)" }}
              >
                {payment.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4" style={{ color: "var(--accent-sky)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Worker Information
          </span>
        </div>
        {payment.worker && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Name:
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {payment.worker.name}
              </span>
            </div>
            {payment.worker.contact && (
              <div className="flex justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Contact:
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {payment.worker.contact}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Total Debt:
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {formatCurrency(payment.worker.totalDebt || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Current Balance:
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {formatCurrency(payment.worker.currentBalance || 0)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3
            className="w-4 h-4"
            style={{ color: "var(--accent-gold)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Payment Breakdown
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Gross Pay:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(payment.grossPay)}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Manual Deduction:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(payment.manualDeduction)}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Debt Deduction:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(payment.totalDebtDeduction)}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Other Deductions:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(payment.otherDeductions || 0)}
            </span>
          </div>
          <div
            className="flex justify-between pt-2 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Net Pay:
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--accent-green)" }}
            >
              {formatCurrency(payment.netPay)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors border-b border-gray-200 pointer-events-auto cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <td className="p-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-gray-300"
          />
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Calendar
              className="w-4 h-4"
              style={{ color: "var(--text-tertiary)" }}
            />
            <div>
              <div
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {payment.paymentDate
                  ? formatDate(payment.paymentDate, "MMM dd, yyyy")
                  : "Not Paid"}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                ID: {payment.id}
              </div>
              {payment.periodStart && payment.periodEnd && (
                <div
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Period: {formatDate(payment.periodStart, "MMM dd")} -{" "}
                  {formatDate(payment.periodEnd, "MMM dd")}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="p-4">
          {payment.worker ? (
            <div className="flex items-center gap-2">
              <Users
                className="w-4 h-4"
                style={{ color: "var(--accent-sky)" }}
              />
              <div>
                <div
                  className="font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {payment.worker.name}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Worker ID: {payment.worker.id}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">No worker</span>
          )}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign
              className="w-4 h-4"
              style={{ color: "var(--accent-green)" }}
            />
            <span
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(payment.grossPay)}
            </span>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Banknote
              className="w-4 h-4"
              style={{ color: "var(--accent-green-dark)" }}
            />
            <span
              className="font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(payment.netPay)}
            </span>
          </div>
        </td>
        {/* <td className="p-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Debt: {formatCurrency(payment.totalDebtDeduction)}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Manual: {formatCurrency(payment.manualDeduction)}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Other: {formatCurrency(payment.otherDeductions || 0)}
            </div>
            <div
              className="text-xs font-semibold mt-1"
              style={{ color: "var(--accent-rust)" }}
            >
              Total:{" "}
              {formatCurrency(
                payment.totalDebtDeduction +
                  payment.manualDeduction +
                  (payment.otherDeductions || 0),
              )}
            </div>
          </div>
        </td> */}
        <td className="p-4">
          {getPaymentMethodBadge(payment.paymentMethod)}
          {payment.referenceNumber && (
            <div
              className="text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Ref: {payment.referenceNumber}
            </div>
          )}
        </td>
        <td className="p-4">{getStatusBadge(payment.status)}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <PaymentActionsDropdown
              payment={payment}
              onView={() => onView(payment.id)}
              onUpdateStatus={(newStatus) =>
                onUpdateStatus(payment.id, payment.status, newStatus)
              }
              onProcessPayment={() => onProcessPayment(payment.id)}
              onCancelPayment={() => onCancelPayment(payment.id)}
              onGenerateSlip={() => onGenerateSlip(payment.id)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="More Details"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform cursor-pointer ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Row */}
      {isExpanded && (
        <tr className={isExpanded ? "expanded-row" : "collapsed-row"}>
          <td
            colSpan={7}
            className="p-4"
            style={{ background: "var(--card-secondary-bg)" }}
          >
            <ExpandedView />
          </td>
        </tr>
      )}
    </>
  );
};

export default PaymentTableRow;
