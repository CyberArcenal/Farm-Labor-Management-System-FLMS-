import { useState, useEffect, useCallback } from 'react';
import type { PitakFilters, PitakStatsData, PitakWithDetails } from '../../../../apis/pitak';
import pitakAPI from '../../../../apis/pitak';
import workerAPI from '../../../../apis/worker';

export const usePitakData = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pitaks, setPitaks] = useState<PitakWithDetails[]>([]);
  const [stats, setStats] = useState<PitakStatsData | null>(null);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(20);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bukidFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedPitaks, setSelectedPitaks] = useState<number[]>([]);

  const fetchPitaks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: PitakFilters = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        bukidId: bukidFilter || undefined
      };

      let response;
      if (searchQuery.trim()) {
        response = await pitakAPI.searchPitaks(searchQuery);
      } else {
        response = await pitakAPI.getAllPitaks(filters);
      }

      if (response.status) {
        setPitaks(response.data || []);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalItems(response.meta?.total || 0);

        if (response.meta?.stats) {
          setStats(response.meta.stats);
        }
      } else {
        throw new Error(response.message || 'Failed to fetch pitak data');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch pitak data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, limit, searchQuery, statusFilter, bukidFilter, sortBy, sortOrder]);

  const fetchStats = async () => {
    try {
      const response = await pitakAPI.getPitakStats();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch pitak stats:', err);
    }
  };

  const fetchAvailableWorkers = async () => {
    try {
      const response = await workerAPI.getActiveWorkers({ limit: 1000 });
      if (response.status && response.data.workers) {
        setAvailableWorkers(response.data.workers);
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPitaks(), fetchStats(), fetchAvailableWorkers()]);
  };

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchPitaks();
    fetchStats();
    fetchAvailableWorkers();
  }, [fetchPitaks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchPitaks();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPitaks, currentPage]);

  return {
    pitaks,
    stats,
    availableWorkers,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalItems,
    limit,
    searchQuery,
    statusFilter,
    viewMode,
    selectedPitaks,
    setSearchQuery,
    setStatusFilter: handleStatusFilterChange,
    setViewMode,
    setSelectedPitaks,
    setCurrentPage,
    setSortBy,
    setSortOrder,
    fetchPitaks,
    handleRefresh,
    handleSort
  };
};