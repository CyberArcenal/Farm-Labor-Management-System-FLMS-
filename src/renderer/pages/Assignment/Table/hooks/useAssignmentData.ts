// components/Assignment/hooks/useAssignmentData.ts
import { useState, useEffect, useCallback } from 'react';
import assignmentAPI from '../../../../apis/assignment';
import type { Assignment, AssignmentFilters, AssignmentStats } from '../../../../apis/assignment';

export const useAssignmentData = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<AssignmentStats | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [workerFilter, setWorkerFilter] = useState<number | null>(null);
    const [pitakFilter, setPitakFilter] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('assignmentDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: AssignmentFilters = {
                status: statusFilter !== 'all' ? statusFilter as any : undefined,
                workerId: workerFilter || undefined,
                pitakId: pitakFilter || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined
            };

            let response;
            if (searchQuery.trim()) {
                response = await assignmentAPI.searchAssignments(searchQuery);
            } else {
                response = await assignmentAPI.getAllAssignments(filters);
            }

            if (response.status) {
                const data = response.data as Assignment[] || [];
                
                // Simple pagination
                const startIdx = (currentPage - 1) * limit;
                const endIdx = startIdx + limit;
                const paginatedData = data.slice(startIdx, endIdx);
                setAssignments(paginatedData);
                setTotalPages(Math.ceil(data.length / limit));
                setTotalItems(data.length);

                // Update stats
                await fetchStats();
            } else {
                throw new Error(response.message || 'Failed to fetch assignments');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, workerFilter, pitakFilter, dateFrom, dateTo]);

    const fetchStats = async () => {
        try {
            const response = await assignmentAPI.getAssignmentStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch assignment stats:', err);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchAssignments();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAssignments();
    };

    const clearFilters = () => {
        setStatusFilter('all');
        setWorkerFilter(null);
        setPitakFilter(null);
        setDateFrom('');
        setDateTo('');
        setSearchQuery('');
        setCurrentPage(1);
    };

    return {
        assignments,
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
        workerFilter,
        setWorkerFilter,
        pitakFilter,
        setPitakFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        viewMode,
        setViewMode,
        selectedAssignments,
        setSelectedAssignments,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        fetchAssignments,
        handleRefresh,
        setCurrentPage,
        clearFilters,
    };
};