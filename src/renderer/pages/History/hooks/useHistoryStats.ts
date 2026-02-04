import { useMemo } from 'react';
import { type PaymentHistoryData, type PaymentHistoryItem } from '../../../apis/payment';
import { type DebtHistoryData } from '../../../apis/debt';
import { type HistoryStats } from '../types/history.types';
import { calculatePaymentStats, calculateDebtStats } from '../utils/historyFormatters';

export const useHistoryStats = (
  viewType: 'payment' | 'debt',
  paymentHistory: PaymentHistoryItem[],
  debtHistory: DebtHistoryData[]
) => {
  const stats = useMemo<HistoryStats | null>(() => {
    if (viewType === 'payment' && paymentHistory.length > 0) {
      return calculatePaymentStats(paymentHistory);
    } else if (viewType === 'debt' && debtHistory.length > 0) {
      return calculateDebtStats(debtHistory);
    }
    return null;
  }, [viewType, paymentHistory, debtHistory]);

  return stats;
};