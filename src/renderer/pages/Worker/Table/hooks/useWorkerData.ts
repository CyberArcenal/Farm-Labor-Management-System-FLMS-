// components/Worker/hooks/useWorkerData.ts
import { useState, useEffect, useCallback } from 'react';
import workerAPI from '../../../../apis/worker';
import { showError } from '../../../../utils/notification';

export const useWorkerData = () => {
    const [workers, setWorkers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [kabisilyaFilter, setKabisilyaFilter] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
    
    // Sorting
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    const fetchWorkers = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);

            const params: any = {
                page: currentPage,
                limit,
                sortBy,
                sortOrder,
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(kabisilyaFilter && { kabisilyaId: kabisilyaFilter }),
                ...(searchQuery && { query: searchQuery })
            };

            const response = searchQuery.trim() 
                ? await workerAPI.searchWorkers(params)
                : await workerAPI.getAllWorkers(params);

            if (response.status) {
                setWorkers(response.data.workers || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
                setTotalItems(response.data.pagination?.total || 0);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            setError(err.message);
            showError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchQuery, statusFilter, kabisilyaFilter, sortBy, sortOrder]);

    const fetchStats = async () => {
        try {
            const response = await workerAPI.getWorkerStats();
            if (response.status) {
                setStats(response.data.stats);
            }
        } catch (err) {
            console.error('Failed to fetch worker stats:', err);
        }
    };

    useEffect(() => {
        fetchWorkers();
        fetchStats();
    }, [fetchWorkers]);

    const handleRefresh = () => {
        fetchWorkers();
    };

    return {
        workers,
        stats,
        loading,
        refreshing,
        error,
        currentPage,
        totalPages,
        totalItems,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        kabisilyaFilter,
        setKabisilyaFilter,
        viewMode,
        setViewMode,
        selectedWorkers,
        setSelectedWorkers,
        fetchWorkers,
        handleRefresh,
        setCurrentPage,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    };
};