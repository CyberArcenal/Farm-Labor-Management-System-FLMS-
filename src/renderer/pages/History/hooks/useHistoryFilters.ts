import { useState, useCallback } from 'react';
import { type HistoryFilters } from '../types/history.types';

export const useHistoryFilters = (initialFilters: Partial<HistoryFilters> = {}) => {
  const [filters, setFilters] = useState<HistoryFilters>({
    dateFrom: initialFilters.dateFrom || '',
    dateTo: initialFilters.dateTo || '',
    transactionType: initialFilters.transactionType || 'all',
    status: initialFilters.status || 'all',
    workerId: initialFilters.workerId,
    paymentMethod: initialFilters.paymentMethod || 'all',
    minAmount: initialFilters.minAmount,
    maxAmount: initialFilters.maxAmount,
    searchQuery: initialFilters.searchQuery || '',
  });

  const updateFilter = useCallback((key: keyof HistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      transactionType: 'all',
      status: 'all',
      workerId: undefined,
      paymentMethod: 'all',
      minAmount: undefined,
      maxAmount: undefined,
      searchQuery: '',
    });
  }, []);

  return {
    filters,
    updateFilter,
    clearFilters,
  };
};