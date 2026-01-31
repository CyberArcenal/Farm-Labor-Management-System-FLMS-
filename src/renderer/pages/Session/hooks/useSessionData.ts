// components/Session/hooks/useSessionData.ts
import { useState, useEffect, useCallback } from 'react';
import type { FilterParams, SessionListData, SessionStatsData } from '../../../apis/session';
import sessionAPI from '../../../apis/session';

export const useSessionData = () => {
    const [sessions, setSessions] = useState<SessionListData[]>([]);
    const [stats, setStats] = useState<SessionStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
    const [seasonTypeFilter, setSeasonTypeFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState<string>('startDate');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: FilterParams = {
                search: searchQuery.trim() || undefined,
                status: statusFilter !== 'all' ? statusFilter as any : undefined,
                year: yearFilter !== 'all' ? yearFilter : undefined,
                sortBy,
                sortOrder,
                limit,
                offset: (currentPage - 1) * limit
            };

            const response = await sessionAPI.getAll(filters);
            
            if (response.status) {
                const data = response.data || [];
                setSessions(data);
                setTotalPages(Math.ceil(data.length / limit));
                setTotalItems(data.length);
            } else {
                throw new Error(response.message || 'Failed to fetch sessions');
            }

            await fetchStats();
        } catch (err: any) {
            setError(err.message);
            console.error('Failed to fetch sessions:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchQuery, statusFilter, yearFilter, seasonTypeFilter, sortBy, sortOrder]);

    const fetchStats = async () => {
        try {
            const response = await sessionAPI.getStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch session stats:', err);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSessions();
    };

    return {
        sessions,
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
        yearFilter,
        setYearFilter,
        seasonTypeFilter,
        setSeasonTypeFilter,
        viewMode,
        setViewMode,
        selectedSessions,
        setSelectedSessions,
        fetchSessions,
        handleRefresh,
        setCurrentPage,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    };
};