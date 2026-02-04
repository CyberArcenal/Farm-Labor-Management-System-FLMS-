// components/History/utils/historyFormatters.ts

import type { DebtHistoryData } from "../../../apis/debt";
import type { PaymentHistoryData, PaymentHistoryItem } from "../../../apis/payment";
import type { HistoryStats } from "../types/history.types";

export const calculatePaymentStats = (
  data: PaymentHistoryItem[],
): HistoryStats => {
  const stats: HistoryStats = {
    totalRecords: data.length,
    totalAmount: data.reduce((sum, record) => {
      const amountChange = Math.abs(
        (record.changes.newAmount || 0) - (record.changes.oldAmount || 0),
      );
      return sum + amountChange;
    }, 0),
    averageAmount: 0,
    mostActiveWorker: "",
    mostRecent: data[0]?.timestamp || "No records",
    byMonth: [],
    byStatus: {},
  };

  if (data.length > 0) {
    stats.averageAmount = stats.totalAmount / data.length;

    // Group by performedBy (worker)
    const workerCount: Record<string, number> = {};
    data.forEach((record) => {
      if (record.performedBy) {
        workerCount[record.performedBy] =
          (workerCount[record.performedBy] || 0) + 1;
      }
    });

    const mostActive = Object.entries(workerCount).reduce(
      (a, b) => (a[1] > b[1] ? a : b),
      ["", 0],
    );
    stats.mostActiveWorker = mostActive[0] || "N/A";

    // Group by month
    const monthData: Record<string, { count: number; amount: number }> = {};
    data.forEach((record) => {
      const date = new Date(record.timestamp);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = Math.abs(
        (record.changes.newAmount || 0) - (record.changes.oldAmount || 0),
      );

      if (!monthData[monthYear]) {
        monthData[monthYear] = { count: 0, amount: 0 };
      }
      monthData[monthYear].count++;
      monthData[monthYear].amount += amount;
    });

    stats.byMonth = Object.entries(monthData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by action type
    stats.byStatus = data.reduce(
      (acc, record) => {
        acc[record.action] = (acc[record.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  return stats;
};

export const calculateDebtStats = (data: DebtHistoryData[]): HistoryStats => {
  const stats: HistoryStats = {
    totalRecords: data.length,
    totalAmount: data.reduce((sum, record) => sum + record.amountPaid, 0),
    averageAmount: 0,
    mostActiveWorker: "",
    mostRecent: data[0]?.transactionDate || "No records",
    byMonth: [],
    byStatus: {},
  };

  if (data.length > 0) {
    stats.averageAmount = stats.totalAmount / data.length;

    // Group by month
    const monthData: Record<string, { count: number; amount: number }> = {};
    data.forEach((record) => {
      const date = new Date(record.transactionDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!monthData[monthYear]) {
        monthData[monthYear] = { count: 0, amount: 0 };
      }
      monthData[monthYear].count++;
      monthData[monthYear].amount += record.amountPaid;
    });

    stats.byMonth = Object.entries(monthData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by transaction type
    stats.byStatus = data.reduce(
      (acc, record) => {
        acc[record.transactionType] = (acc[record.transactionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  return stats;
};

export const getActionTypeConfig = (actionType: string) => {
  const configs: Record<
    string,
    { icon: string; bg: string; text: string; label: string }
  > = {
    create: {
      icon: "PlusCircle",
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Created",
    },
    deduction: {
      icon: "MinusCircle",
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Deduction",
    },
    status_change: {
      icon: "RefreshCw",
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Status Changed",
    },
    update: {
      icon: "Edit",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Updated",
    },
    delete: {
      icon: "Trash2",
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: "Deleted",
    },
  };

  return (
    configs[actionType] || {
      icon: "Clock",
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: actionType.charAt(0).toUpperCase() + actionType.slice(1),
    }
  );
};

export const getTransactionTypeConfig = (transactionType: string) => {
  const configs: Record<
    string,
    { icon: string; bg: string; text: string; label: string }
  > = {
    payment: {
      icon: "CreditCard",
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Payment",
    },
    adjustment: {
      icon: "TrendingUp",
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Adjustment",
    },
    interest: {
      icon: "Percent",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Interest",
    },
    refund: {
      icon: "RefreshCw",
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "Refund",
    },
  };

  return (
    configs[transactionType] || {
      icon: "Clock",
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: transactionType.charAt(0).toUpperCase() + transactionType.slice(1),
    }
  );
};

export const getFieldLabel = (field: string) => {
  const fieldLabels: Record<string, string> = {
    status: "Status",
    grossPay: "Gross Pay",
    netPay: "Net Pay",
    debt_payment: "Debt Payment",
    amount: "Amount",
    paymentMethod: "Payment Method",
    referenceNumber: "Reference Number",
    notes: "Notes",
    periodStart: "Period Start",
    periodEnd: "Period End",
  };

  return (
    fieldLabels[field] ||
    field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
  );
};

export const formatActionDescription = (
  action: string,
  field: string,
  notes?: string | null,
) => {
  const fieldLabel = getFieldLabel(field);

  switch (action) {
    case "create":
      return notes || `${fieldLabel} created`;
    case "update":
      return notes || `${fieldLabel} updated`;
    case "deduction":
      return notes || `${fieldLabel} deduction applied`;
    case "status_change":
      return notes || `${fieldLabel} status changed`;
    default:
      return notes || `${action} on ${fieldLabel}`;
  }
};
