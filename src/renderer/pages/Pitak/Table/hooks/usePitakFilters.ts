import { useState, useCallback } from 'react';

export const usePitakFilters = () => {
  const [filters, setFilters] = useState({
    searchQuery: '',
    statusFilter: 'all',
    bukidFilter: null as number | null,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    viewMode: 'table' as 'grid' | 'table'
  });

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      statusFilter: 'all',
      bukidFilter: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      viewMode: 'table'
    });
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters
  };
};