// components/Kabisilya/hooks/useKabisilyaData.ts
import { useState, useEffect, useCallback } from 'react';
import kabisilyaAPI from '../../../../apis/kabisilya';
import type { KabisilyaListData, KabisilyaStatsData } from '../../../../apis/kabisilya';

export const useKabisilyaData = () => {
    const [kabisilyas, setKabisilyas] = useState<KabisilyaListData[]>([]);
    const [stats, setStats] = useState<KabisilyaStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedKabisilyas, setSelectedKabisilyas] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    const fetchKabisilyas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters = {
                search: searchQuery.trim() || undefined,
                withInactive: statusFilter === 'inactive' ? true : undefined,
                sortBy,
                sortOrder,
                limit,
                offset: (currentPage - 1) * limit
            };

            const response = await kabisilyaAPI.getAll(filters);
            
            if (response.status) {
                const data = response.data || [];
                setKabisilyas(data);
                setTotalPages(Math.ceil(data.length / limit));
                setTotalItems(data.length);
            } else {
                throw new Error(response.message || 'Failed to fetch kabisilyas');
            }

            await fetchStats();
        } catch (err: any) {
            setError(err.message);
            console.error('Failed to fetch kabisilyas:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, searchQuery, statusFilter, sortBy, sortOrder]);

    const fetchStats = async () => {
        try {
            const response = await kabisilyaAPI.getStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch kabisilya stats:', err);
        }
    };

    useEffect(() => {
        fetchKabisilyas();
    }, [fetchKabisilyas]);

    // Remove the old debounce effect - search is now handled in SearchInput component

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchKabisilyas();
    };

    return {
        kabisilyas,
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
        viewMode,
        setViewMode,
        selectedKabisilyas,
        setSelectedKabisilyas,
        fetchKabisilyas,
        handleRefresh,
        setCurrentPage,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    };
};