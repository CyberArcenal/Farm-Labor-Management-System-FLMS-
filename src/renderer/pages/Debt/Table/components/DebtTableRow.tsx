// components/Debt/components/DebtTableRow.tsx
import React from "react";
import {
  Calendar,
  Users,
  DollarSign,
  Banknote,
  ChevronRight,
} from "lucide-react";
import DebtActionsDropdown from "./DebtActionsDropdown";
import { formatDate, formatCurrency } from "../../../../utils/formatters";
import type { DebtData } from "../../../../apis/debt";

interface DebtTableRowProps {
  debt: DebtData;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onMakePayment: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onViewHistory: (id: number) => void;
}

const DebtTableRow: React.FC<DebtTableRowProps> = ({
  debt,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onView,
  onEdit,
  onDelete,
  onMakePayment,
  onUpdateStatus,
  onViewHistory,
}) => {
  const getStatusBadge = (status: string = "pending", compact = false) => {
    const statusConfig: Record<string, any> = {
      pending: {
        text: "Pending",
        icon: "⏳",
        bg: "var(--status-growing-bg)",
        color: "var(--status-growing)",
        border: "rgba(214, 158, 46, 0.3)",
      },
      partially_paid: {
        text: "Partially Paid",
        icon: "💸",
        bg: "rgba(168, 85, 247, 0.1)",
        color: "rgb(126, 34, 206)",
        border: "rgba(168, 85, 247, 0.2)",
      },
      paid: {
        text: "Paid",
        icon: "✔️",
        bg: "var(--status-planted-bg)",
        color: "var(--status-planted)",
        border: "rgba(56, 161, 105, 0.3)",
      },
      settled: {
        text: "Paid",
        icon: "✔️",
        bg: "var(--status-planted-bg)",
        color: "var(--status-planted)",
        border: "rgba(56, 161, 105, 0.3)",
      },
      cancelled: {
        text: "Cancelled",
        icon: "✖️",
        bg: "var(--accent-rust-light)",
        color: "var(--accent-rust)",
        border: "rgba(197, 48, 48, 0.3)",
      },
      overdue: {
        text: "Overdue",
        icon: "⚠️",
        bg: "rgba(239, 68, 68, 0.1)",
        color: "rgb(220, 38, 38)",
        border: "rgba(239, 68, 68, 0.2)",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
        style={{
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
        }}
      >
        {compact ? config.icon : config.text}
      </span>
    );
  };

  const ExpandedView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign
            className="w-4 h-4"
            style={{ color: "var(--accent-green)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Debt Details
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
              {formatDate(debt.createdAt, "MMM dd, yyyy HH:mm")}
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
              {formatDate(debt.updatedAt, "MMM dd, yyyy HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Payment Term:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {debt.paymentTerm || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Interest Rate:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {debt.interestRate}%
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Total Interest:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(debt.totalInterest)}
            </span>
          </div>
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
        {debt.worker && (
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
                {debt.worker.name}
              </span>
            </div>
            {debt.worker.contact && (
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
                  {debt.worker.contact}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Total Paid:
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {formatCurrency(debt.totalPaid)}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Last Payment:
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {debt.lastPaymentDate
                  ? formatDate(debt.lastPaymentDate, "MMM dd, yyyy")
                  : "No payments yet"}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg" style={{ background: "var(--card-bg)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Banknote
            className="w-4 h-4"
            style={{ color: "var(--accent-gold)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Payment Summary
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Original Amount:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(debt.originalAmount || debt.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Amount Paid:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(debt.totalPaid)}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Interest Accrued:
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(debt.totalInterest)}
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
              Current Balance:
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                color:
                  debt.balance > 0
                    ? "var(--accent-rust)"
                    : "var(--accent-green)",
              }}
            >
              {formatCurrency(debt.balance)}
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
                {formatDate(debt.dateIncurred, "MMM dd, yyyy")}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                ID: {debt.id}
              </div>
            </div>
          </div>
        </td>
        <td className="p-4">
          {debt.worker ? (
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
                  {debt.worker?.name || ""}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Worker ID: {debt.worker.id}
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
              {formatCurrency(debt.originalAmount || debt.amount)}
            </span>
          </div>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Banknote
              className="w-4 h-4"
              style={{
                color:
                  debt.balance > 0
                    ? "var(--accent-rust)"
                    : "var(--accent-green-dark)",
              }}
            />
            <span
              className="font-medium"
              style={{
                color:
                  debt.balance > 0
                    ? "var(--accent-rust)"
                    : "var(--text-primary)",
              }}
            >
              {formatCurrency(debt.balance)}
            </span>
          </div>
        </td>
        <td className="p-4">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {debt.reason || "No reason provided"}
          </span>
        </td>
        <td className="p-4">
          {debt.dueDate ? (
            <div className="flex items-center gap-2">
              <Calendar
                className="w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
              />
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {formatDate(debt.dueDate, "MMM dd, yyyy")}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">No due date</span>
          )}
        </td>
        <td className="p-4">{getStatusBadge(debt.status)}</td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <DebtActionsDropdown
              debt={debt}
              onView={() => onView(debt.id)}
              onEdit={() => onEdit(debt.id)}
              onDelete={() => onDelete(debt.id)}
              onMakePayment={() => onMakePayment(debt.worker.id)}
              onUpdateStatus={(status) => onUpdateStatus(debt.id, status)}
              onViewHistory={() => onViewHistory(debt.id)}
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

export default DebtTableRow;
