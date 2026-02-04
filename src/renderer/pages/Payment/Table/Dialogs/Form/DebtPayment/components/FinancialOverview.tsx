import React from "react";
import { TrendingDown, Receipt, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { formatCurrency } from "../../../../../../../utils/formatters";

interface FinancialOverviewProps {
  totalDebt: number;
  totalPendingPayments: number;
  paymentAmount: number;
  remainingDebt: number;
}

const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  totalDebt,
  totalPendingPayments,
  paymentAmount,
  remainingDebt,
}) => {
  const exceedsPendingPayments = paymentAmount > totalPendingPayments;

  return (
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

      <div className={`p-3 rounded border ${exceedsPendingPayments ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-6 h-6 rounded-full ${exceedsPendingPayments ? 'bg-yellow-600' : 'bg-blue-600'} flex items-center justify-center`}>
            <Receipt className="w-3 h-3 text-white" />
          </div>
          <span className={`text-xs font-medium ${exceedsPendingPayments ? 'text-yellow-800' : 'text-blue-800'}`}>
            Pending Payments
          </span>
        </div>
        <div className={`text-lg font-bold ${exceedsPendingPayments ? 'text-yellow-900' : 'text-blue-900'}`}>
          {formatCurrency(totalPendingPayments)}
        </div>
        {exceedsPendingPayments && (
          <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-2 h-2" />
            Will require cash
          </div>
        )}
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
            {((paymentAmount / totalDebt) * 100).toFixed(1)}% of total debt
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
          <div className="text-xs text-green-600 mt-1">
            Debt will be fully paid!
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialOverview;