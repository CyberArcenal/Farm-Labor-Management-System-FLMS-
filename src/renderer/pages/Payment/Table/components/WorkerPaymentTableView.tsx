// components/Payment/components/WorkerPaymentTableView.tsx
import React, { useState, useMemo } from "react";
import {
  Users,
  DollarSign,
  Banknote,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  Wallet,
  ChevronDown,
  Calendar,
  BarChart3,
  Download,
  Percent,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import type { WorkerPaymentSummary } from "../hooks/useWorkerPaymentData";
import WorkerPaymentActionsDropdown from "./WorkerPaymentActionsDropdown";

interface WorkerPaymentTableViewProps {
  workerSummaries: WorkerPaymentSummary[];
  onProcessAllPayments: (workerId: number) => void;
  onPayWorkerDebt: (workerId: number) => void;
  onViewWorkerDetails: (workerId: number) => void;
  onExportWorkerReport: (workerId: number) => void;
  onGenerateWorkerSlips: (workerId: number) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
}

const WorkerPaymentTableView: React.FC<WorkerPaymentTableViewProps> = ({
  workerSummaries,
  onProcessAllPayments,
  onPayWorkerDebt,
  onViewWorkerDetails,
  onExportWorkerReport,
  onGenerateWorkerSlips,
  sortBy,
  sortOrder,
  onSort,
}) => {
  console.log(workerSummaries);
  const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

  const toggleExpandWorker = (workerId: number) => {
    setExpandedWorker((prev) => (prev === workerId ? null : workerId));
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <DollarSign className="w-3 h-3 text-green-600" />;
      case "bank":
        return <Banknote className="w-3 h-3 text-blue-600" />;
      case "check":
        return <FileText className="w-3 h-3 text-amber-600" />;
      case "digital":
        return <Banknote className="w-3 h-3 text-purple-600" />;
      default:
        return <DollarSign className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusBadge = (summary: WorkerPaymentSummary) => {
    if (summary.pendingPayments > 0) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <span className="text-xs font-medium text-yellow-700">
            {summary.pendingPayments} Pending
          </span>
        </div>
      );
    } else if (summary.processingPayments > 0) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-medium text-blue-700">
            {summary.processingPayments} Processing
          </span>
        </div>
      );
    } else if (
      summary.completedPayments === summary.totalPayments &&
      summary.totalPayments > 0
    ) {
      return (
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-xs font-medium text-green-700">
            All Completed
          </span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span className="text-xs font-medium text-gray-600">
            Mixed Status
          </span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-3">
      {workerSummaries.map((summary) => (
        <div
          key={summary.worker.id}
          className="rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
          }}
          onClick={() => toggleExpandWorker(summary.worker.id)}
        >
          {/* Main Row */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              {/* Left Section - Worker Info */}
              <div className="flex items-start gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--accent-sky-light)" }}
                >
                  <Users
                    className="w-6 h-6"
                    style={{ color: "var(--accent-sky)" }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {summary.worker.name}
                    </h3>
                    {getStatusBadge(summary)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <User
                        className="w-3 h-3"
                        style={{ color: "var(--text-tertiary)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        ID: {summary.worker.id}
                      </span>
                    </div>

                    {summary.worker.contact && (
                      <div className="flex items-center gap-2">
                        <Phone
                          className="w-3 h-3"
                          style={{ color: "var(--text-tertiary)" }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {summary.worker.contact}
                        </span>
                      </div>
                    )}

                    {summary.totalDebt > 0 && (
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-red-600">
                          Debt: {formatCurrency(summary.totalDebt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Section - Payment Summary */}
              <div className="flex items-center gap-6">
                {/* Payment Stats */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <FileText
                      className="w-4 h-4"
                      style={{ color: "var(--text-tertiary)" }}
                    />
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {summary.totalPayments} Payments
                    </span>
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {summary.completedPayments} completed
                  </div>
                </div>

                {/* Amount Stats */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Banknote
                      className="w-4 h-4"
                      style={{ color: "var(--accent-green)" }}
                    />
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatCurrency(summary.totalNetPay)}
                    </span>
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Net Pay
                  </div>
                </div>

                {/* Pending Amount - ADD THIS */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Clock
                      className="w-4 h-4"
                      style={{ color: "var(--accent-rust)" }}
                    />
                    <span
                      className="font-medium"
                      style={{
                        color:
                          summary.totalPendingAmount > 0
                            ? "var(--accent-rust)"
                            : "var(--text-primary)",
                      }}
                    >
                      {formatCurrency(summary.totalPendingAmount)}
                    </span>
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Pending ({summary.pendingPayments})
                    Partially Paid ({summary.partiallyPaidPayments})
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <WorkerPaymentActionsDropdown
                    summary={summary}
                    onViewWorkerDetails={onViewWorkerDetails}
                    onProcessAllPayments={onProcessAllPayments}
                    onPayWorkerDebt={onPayWorkerDebt}
                    onExportWorkerReport={onExportWorkerReport}
                    onGenerateWorkerSlips={onGenerateWorkerSlips}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpandWorker(summary.worker.id);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="More Details"
                    style={{ background: "var(--card-secondary-bg)" }}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expandedWorker === summary.worker.id ? "rotate-180" : ""}`}
                      style={{ color: "var(--text-secondary)" }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Section */}
          {expandedWorker === summary.worker.id && (
            <div
              className="border-t p-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Statistics */}
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "var(--card-secondary-bg)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3
                      className="w-4 h-4"
                      style={{ color: "var(--accent-green)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Payment Statistics
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Total Payments:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {summary.totalPayments}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Completed:
                      </span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          {summary.completedPayments}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Pending:
                      </span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                          {summary.pendingPayments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "var(--card-secondary-bg)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign
                      className="w-4 h-4"
                      style={{ color: "var(--accent-gold)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Financial Summary
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Gross Pay:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatCurrency(summary.totalGrossPay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Net Pay:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatCurrency(summary.totalNetPay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Deductions:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--accent-rust)" }}
                      >
                        {formatCurrency(summary.totalDeductions)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Pending Amount:
                      </span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                          {formatCurrency(summary.totalPendingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Payments */}
                <div
                  className="p-3 rounded-lg"
                  style={{ background: "var(--card-secondary-bg)" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar
                      className="w-4 h-4"
                      style={{ color: "var(--accent-sky)" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Recent Payments
                    </span>
                  </div>
                  <div className="space-y-2">
                    {summary.recentPayments.length > 0 ? (
                      summary.recentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(payment.paymentMethod || "")}
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              #{payment.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {formatCurrency(payment.netPay)}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-xs"
                              style={{
                                background:
                                  payment.status === "completed"
                                    ? "var(--status-planted-bg)"
                                    : payment.status === "pending"
                                      ? "var(--status-growing-bg)"
                                      : payment.status === "processing"
                                        ? "var(--status-irrigation-bg)"
                                        : payment.status === "partially_paid"
                                          ? "rgba(168, 85, 247, 0.1)" // violet background
                                          : "var(--accent-rust-light)",
                                color:
                                  payment.status === "completed"
                                    ? "var(--status-planted)"
                                    : payment.status === "pending"
                                      ? "var(--status-growing)"
                                      : payment.status === "processing"
                                        ? "var(--status-irrigation)"
                                        : payment.status === "partially_paid"
                                          ? "rgb(126, 34, 206)" // violet text
                                          : "var(--accent-rust)",
                              }}
                            >
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          No recent payments
                        </span>
                      </div>
                    )}
                    {summary.totalPayments > 3 && (
                      <div
                        className="text-center pt-2 border-t"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewWorkerDetails(summary.worker.id);
                          }}
                          className="text-xs flex items-center gap-1 mx-auto text-blue-600 hover:text-blue-800"
                        >
                          View all {summary.totalPayments} payments
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex flex-wrap gap-2">
                  {summary.pendingPayments > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProcessAllPayments(summary.worker.id);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                      style={{
                        background: "var(--accent-green-light)",
                        color: "var(--accent-green)",
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Process All Payments ({summary.pendingPayments})
                    </button>
                  )}

                  {summary.totalDebt > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPayWorkerDebt(summary.worker.id);
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                      style={{
                        background: "var(--accent-rust-light)",
                        color: "var(--accent-rust)",
                      }}
                    >
                      <Wallet className="w-4 h-4" />
                      Pay Debt ({formatCurrency(summary.totalDebt)})
                    </button>
                  )}

                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewWorkerDetails(summary.worker.id);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                    style={{
                      background: "var(--accent-sky-light)",
                      color: "var(--accent-sky)",
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </button> */}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportWorkerReport(summary.worker.id);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                    style={{
                      background: "var(--accent-purple-light)",
                      color: "var(--accent-purple)",
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default WorkerPaymentTableView;
