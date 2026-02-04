import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, List } from "lucide-react";
import { type DebtData } from "../types/debt-payment.types";
import { formatCurrency } from "../../../../../../../utils/formatters";

interface ActiveDebtsSummaryProps {
  activeDebts: DebtData[];
}

const ActiveDebtsSummary: React.FC<ActiveDebtsSummaryProps> = ({ activeDebts }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort debts by balance (highest first) or status
  const sortedDebts = [...activeDebts].sort((a, b) => {
    // Overdue debts first
    if (a.status === "overdue" && b.status !== "overdue") return -1;
    if (a.status !== "overdue" && b.status === "overdue") return 1;
    
    // Then by balance (highest first)
    return b.balance - a.balance;
  });

  const displayedDebts = isExpanded ? sortedDebts : sortedDebts.slice(0, 3);
  const hasMoreDebts = activeDebts.length > 3;

  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <div className="bg-red-50 px-3 py-2 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <div>
            <span className="text-xs font-semibold text-red-900">
              Active Debts ({activeDebts.length})
            </span>
            <p className="text-xs text-red-700 mt-0.5">
              Total Balance: {formatCurrency(activeDebts.reduce((sum, debt) => sum + debt.balance, 0))}
            </p>
          </div>
        </div>
        
        {hasMoreDebts && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show All ({activeDebts.length})
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="p-2.5">
        {activeDebts.length === 0 ? (
          <div className="text-center py-4">
            <List className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No active debts found</p>
          </div>
        ) : (
          <>
            {/* Grid Layout for First 3 Debts */}
            {!isExpanded && (
              <div className="grid grid-cols-3 gap-2.5">
                {displayedDebts.map((debt) => (
                  <DebtCard key={debt.id} debt={debt} />
                ))}
                
                {hasMoreDebts && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="p-2 bg-gray-50 border border-gray-300 rounded flex flex-col items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-xs text-gray-600">
                      +{activeDebts.length - 3} more
                    </span>
                    <span className="text-xs text-gray-500 mt-0.5">Click to view all</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Table Layout for All Debts (When Expanded) */}
            {isExpanded && (
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="max-h-80 overflow-y-auto pitak-table-container">
                  <table className="w-full windows-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Debt ID</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Reason</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Original Amount</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Balance</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Status</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Date Incurred</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Due Date</th>
                        <th className="p-2 text-left text-xs font-medium text-gray-600">Total Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDebts.map((debt) => (
                        <tr key={debt.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2 text-xs font-medium">#{debt.id}</td>
                          <td className="p-2 text-xs text-gray-600 max-w-[150px] truncate" title={debt.reason || "No reason provided"}>
                            {debt.reason || "N/A"}
                          </td>
                          <td className="p-2 text-xs font-medium">
                            {formatCurrency(debt.originalAmount)}
                          </td>
                          <td className="p-2 text-xs font-bold text-red-600">
                            {formatCurrency(debt.balance)}
                          </td>
                          <td className="p-2">
                            <DebtStatusBadge status={debt.status} />
                          </td>
                          <td className="p-2 text-xs text-gray-600">
                            {new Date(debt.dateIncurred).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-xs text-gray-600">
                            {debt.dueDate 
                              ? new Date(debt.dueDate).toLocaleDateString() 
                              : "No due date"}
                          </td>
                          <td className="p-2 text-xs text-green-600">
                            {formatCurrency(debt.totalPaid)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="p-2 text-xs font-medium text-gray-700 text-right">
                          Total Balance:
                        </td>
                        <td className="p-2 text-xs font-bold text-red-700">
                          {formatCurrency(activeDebts.reduce((sum, debt) => sum + debt.balance, 0))}
                        </td>
                        <td colSpan={2} className="p-2 text-xs font-medium text-gray-700 text-right">
                          Total Paid:
                        </td>
                        <td className="p-2 text-xs font-bold text-green-700">
                          {formatCurrency(activeDebts.reduce((sum, debt) => sum + debt.totalPaid, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div className="p-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-xs text-gray-600">
                    Showing all {activeDebts.length} active debts
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <ChevronUp className="w-3 h-3" />
                    Collapse List
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Debt Card Component (for collapsed view)
const DebtCard: React.FC<{ debt: DebtData }> = ({ debt }) => {
  return (
    <div className="p-2 bg-white border border-gray-300 rounded hover:border-red-300 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">
          Debt #{debt.id}
        </span>
        <DebtStatusBadge status={debt.status} />
      </div>
      <div className="text-md font-bold text-gray-900 mb-1">
        {formatCurrency(debt.balance)}
      </div>
      <div className="text-xs text-gray-500 mb-0.5">
        Due: {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString() : "No due date"}
      </div>
      {debt.reason && (
        <div className="text-xs text-gray-600 truncate" title={debt.reason}>
          {debt.reason}
        </div>
      )}
    </div>
  );
};

// Debt Status Badge Component
const DebtStatusBadge: React.FC<{ status: DebtData["status"] }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case "overdue":
        return { bg: "bg-red-100", text: "text-red-800", label: "Overdue" };
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" };
      case "partially_paid":
        return { bg: "bg-blue-100", text: "text-blue-800", label: "Partially Paid" };
      case "paid":
        return { bg: "bg-green-100", text: "text-green-800", label: "Paid" };
      case "cancelled":
        return { bg: "bg-gray-100", text: "text-gray-800", label: "Cancelled" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: status };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default ActiveDebtsSummary;