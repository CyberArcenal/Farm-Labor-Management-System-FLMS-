// components/History/hooks/useHistoryData.ts
import { useState, useEffect, useCallback } from 'react';
import type { HistoryType, HistoryFilters } from '../types/history.types';
import paymentAPI, { 
  type PaymentResponse,
  type PaymentHistoryItem,
  type PaymentHistoryResponseData
} from '../../../apis/payment';
import debtAPI, { 
  type DebtHistoryData,
  type DebtHistoryItem,
  type DebtHistoryResponseData,
  type DebtResponse
} from '../../../apis/debt';

interface UseHistoryDataReturn {
  paymentHistory: PaymentHistoryItem[];
  debtHistory: DebtHistoryItem[];
  paymentHistorySummary: PaymentHistoryResponseData['summary'] | null;
  debtHistorySummary: DebtHistoryResponseData['summary'] | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  refresh: () => Promise<void>;
}

export const useHistoryData = (
  viewType: HistoryType,
  filters: HistoryFilters,
  currentPage: number,
  limit: number
): UseHistoryDataReturn => {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [debtHistory, setDebtHistory] = useState<DebtHistoryItem[]>([]);
  const [paymentHistorySummary, setPaymentHistorySummary] = useState<PaymentHistoryResponseData['summary'] | null>(null);
  const [debtHistorySummary, setDebtHistorySummary] = useState<DebtHistoryResponseData['summary'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit,
        startDate: filters.dateFrom || undefined,
        endDate: filters.dateTo || undefined,
        actionType: filters.transactionType !== 'all' ? filters.transactionType : undefined,
      };

      if (viewType === 'payment') {
        // Note: Using paymentId = 0 to get all payment history
        // You might want to adjust this based on your API design
        const response: PaymentResponse<PaymentHistoryResponseData> = await paymentAPI.getPaymentHistory(0, params);
        
        if (response.status && response.data) {
          let filteredHistory = response.data.history || [];
          
          // Apply worker filter if specified
          if (filters.workerId) {
            filteredHistory = filteredHistory.filter(
              (              record) => record.worker?.id === filters.workerId
            );
          }
          
          // Apply search filter if specified
          if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filteredHistory = filteredHistory.filter((record) => 
              record.worker?.firstName?.toLowerCase().includes(searchLower) ||
              record.worker?.lastName?.toLowerCase().includes(searchLower) ||
              record.worker?.code?.toLowerCase().includes(searchLower) ||
              record.notes?.toLowerCase().includes(searchLower) ||
              record.paymentInfo?.referenceNumber?.toLowerCase().includes(searchLower) ||
              record.performedBy?.toLowerCase().includes(searchLower)
            );
          }
          
          setPaymentHistory(filteredHistory);
          setPaymentHistorySummary(response.data.summary);
          setTotalItems(response.data.pagination?.total || 0);
          setTotalPages(response.data.pagination?.totalPages || 1);
        } else {
          throw new Error(response.message || 'Failed to fetch payment history');
        }
      } else {
        // For debt history, we need to fetch all debts first
        const debtsResponse = await debtAPI.getAll({ 
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
        });
        
        if (debtsResponse.status && debtsResponse.data) {
          const allDebtHistories: DebtHistoryItem[] = [];
          
          // Fetch history for each debt that matches filters
          for (const debt of debtsResponse.data) {
            // Filter by worker if specified
            if (filters.workerId && debt.worker?.id !== filters.workerId) {
              continue;
            }
            
            const historyResponse: DebtResponse<DebtHistoryResponseData> = await debtAPI.getHistory(debt.id);
            if (historyResponse.status && historyResponse.data) {
              allDebtHistories.push(...(historyResponse.data.history || []));
            }
          }
          
          // Apply additional filters
          let filteredDebtHistory = allDebtHistories;
          
          if (filters.transactionType !== 'all') {
            filteredDebtHistory = filteredDebtHistory.filter(
              record => record.transactionType === filters.transactionType
            );
          }
          
          if (filters.searchQuery) {
            const searchLower = filters.searchQuery.toLowerCase();
            filteredDebtHistory = filteredDebtHistory.filter(record => 
              record.worker?.firstName?.toLowerCase().includes(searchLower) ||
              record.worker?.lastName?.toLowerCase().includes(searchLower) ||
              record.worker?.code?.toLowerCase().includes(searchLower) ||
              record.notes?.toLowerCase().includes(searchLower) ||
              record.referenceNumber?.toLowerCase().includes(searchLower) ||
              record.paymentMethod?.toLowerCase().includes(searchLower)
            );
          }
          
          // Sort by transaction date (newest first)
          filteredDebtHistory.sort((a, b) => {
            const dateA = new Date(a.transactionDate).getTime();
            const dateB = new Date(b.transactionDate).getTime();
            return dateB - dateA;
          });
          
          // Paginate locally (since backend doesn't support pagination for consolidated debt history)
          const startIndex = (currentPage - 1) * limit;
          const paginatedHistory = filteredDebtHistory.slice(startIndex, startIndex + limit);
          
          const totalPaid = filteredDebtHistory.reduce((sum, item) => sum + item.amountPaid, 0);
          const transactionTypes = [...new Set(filteredDebtHistory.map(item => item.transactionType))];
          
          setDebtHistory(paginatedHistory);
          setDebtHistorySummary({
            totalRecords: filteredDebtHistory.length,
            totalPaid,
            transactionTypes,
          });
          setTotalItems(filteredDebtHistory.length);
          setTotalPages(Math.ceil(filteredDebtHistory.length / limit));
        } else {
          throw new Error(debtsResponse.message || 'Failed to fetch debts');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history data');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  }, [viewType, filters, currentPage, limit]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  return {
    paymentHistory,
    debtHistory,
    paymentHistorySummary,
    debtHistorySummary,
    loading,
    error,
    totalPages,
    totalItems,
    refresh: fetchHistoryData,
  };
};