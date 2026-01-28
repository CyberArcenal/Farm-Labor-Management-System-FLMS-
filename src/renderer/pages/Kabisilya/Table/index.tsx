// components/Kabisilya/KabisilyaTablePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Download,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Calendar,
    Users,
    MapPin,
    Hash,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    BarChart3,
    TrendingUp,
    Filter,
    List,
    Grid,
    UserPlus,
    Layers,
    Building,
    Users as UsersIcon,
    TreePine,
    Shield,
    Network,
    Link,
    Unlink,
    UserCheck,
    Home
} from 'lucide-react';
import type { 
    KabisilyaListData, 
    KabisilyaStatsData,
    FilterParams,
    SearchResultData 
} from '../../../apis/kabisilya';
import kabisilyaAPI from '../../../apis/kabisilya';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate, formatNumber } from '../../../utils/formatters';

interface KabisilyaFilters {
    search?: string;
    withInactive?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

const KabisilyaTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [kabisilyas, setKabisilyas] = useState<KabisilyaListData[]>([]);
    const [stats, setStats] = useState<KabisilyaStatsData | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedKabisilyas, setSelectedKabisilyas] = useState<number[]>([]);
    const [expandedKabisilya, setExpandedKabisilya] = useState<number | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Fetch kabisilyas data
    const fetchKabisilyas = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: FilterParams = {
                search: searchQuery.trim() || undefined,
                withInactive: statusFilter === 'inactive' ? true : undefined,
                sortBy,
                sortOrder,
                limit,
                offset: (currentPage - 1) * limit
            };

            let response;
            if (searchQuery.trim()) {
                response = await kabisilyaAPI.search(searchQuery);
                if (response.status) {
                    setSearchResults(response.data);
                    const data = response.data;
                    setKabisilyas(data);
                    setTotalPages(Math.ceil(data.length / limit));
                    setTotalItems(data.length);
                }
            } else {
                response = await kabisilyaAPI.getAll(filters);
                if (response.status) {
                    const data = response.data || [];
                    setKabisilyas(data);
                    setTotalPages(Math.ceil(data.length / limit));
                    setTotalItems(data.length);
                }
            }

            if (response && !response.status) {
                throw new Error(response.message || 'Failed to fetch kabisilyas');
            }

            // Update stats
            await fetchStats();

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch kabisilyas:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, sortBy, sortOrder]);

    // Fetch stats
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

    // Initial load
    useEffect(() => {
        fetchKabisilyas();
    }, [fetchKabisilyas]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchKabisilyas();
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchKabisilyas();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchKabisilyas]);

    // Handle status filter change
    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setCurrentPage(1);
    };

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedKabisilyas.length === kabisilyas.length) {
            setSelectedKabisilyas([]);
        } else {
            setSelectedKabisilyas(kabisilyas.map(k => k.id));
        }
    };

    const toggleSelectKabisilya = (id: number) => {
        setSelectedKabisilyas(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewKabisilya = (id: number) => {
        navigate(`/kabisilya/view/${id}`);
    };

    const handleEditKabisilya = (id: number) => {
        navigate(`/workers/kabisilya/form/${id}`);
    };

    const handleCreateKabisilya = () => {
        navigate('/workers/kabisilya/form');
    };

    const handleDeleteKabisilya = async (id: number) => {
        const kabisilya = kabisilyas.find(k => k.id === id);
        const confirmed = await showConfirm({
            title: 'Delete Kabisilya',
            message: `Are you sure you want to delete "${kabisilya?.name}"? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting kabisilya...', 'info');
            const response = await kabisilyaAPI.delete(id);

            if (response.status) {
                showSuccess('Kabisilya deleted successfully');
                fetchKabisilyas();
                setSelectedKabisilyas(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete kabisilya');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedKabisilyas.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedKabisilyas.length} selected kabisilya(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected kabisilyas...', 'info');
            const results = await Promise.allSettled(
                selectedKabisilyas.map(id => kabisilyaAPI.delete(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} kabisilya(s)`);
            } else {
                showError(`Deleted ${successful.length} kabisilya(s), failed to delete ${failed.length} kabisilya(s)`);
            }

            fetchKabisilyas();
            setSelectedKabisilyas([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete kabisilyas');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');
            // Note: You might need to add export functionality to your API
            showSuccess('Export functionality to be implemented');
        } catch (err: any) {
            showError(err.message || 'Failed to export CSV');
        }
    };

    const handleAssignWorkers = (id: number) => {
        navigate(`/kabisilya/${id}/assign-workers`);
    };

    const handleAssignBukids = (id: number) => {
        navigate(`/kabisilya/${id}/assign-bukids`);
    };

    // Toggle kabisilya expansion
    const toggleExpandKabisilya = (id: number) => {
        setExpandedKabisilya(prev => prev === id ? null : id);
    };

    // Get status badge
    const getStatusBadge = (kabisilya: KabisilyaListData) => {
        const isActive = true; // Assuming all are active for now
        const config = {
            active: {
                text: 'Active',
                bg: 'var(--accent-green-light)',
                color: 'var(--accent-green)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: CheckCircle
            },
            inactive: {
                text: 'Inactive',
                bg: 'var(--accent-rust-light)',
                color: 'var(--accent-rust)',
                border: 'rgba(197, 48, 48, 0.3)',
                icon: XCircle
            }
        };

        const statusConfig = isActive ? config.active : config.inactive;
        const Icon = statusConfig.icon;

        return (
            <span
                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{
                    background: statusConfig.bg,
                    color: statusConfig.color,
                    border: `1px solid ${statusConfig.border}`
                }}
            >
                <Icon className="w-3 h-3" />
                {statusConfig.text}
            </span>
        );
    };

    // Clear filters
    const clearFilters = () => {
        setStatusFilter('all');
        setSearchQuery('');
        setSortBy('name');
        setSortOrder('ASC');
        setCurrentPage(1);
        setShowAdvancedFilters(false);
    };

    // Loading state
    if (loading && !refreshing) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div
                        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-3 transition-colors duration-300"
                        style={{ borderColor: 'var(--primary-color)' }}
                    ></div>
                    <p className="text-sm transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                        Loading kabisilyas...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !kabisilyas.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Kabisilya Data
                </p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center mx-auto"
                    style={{
                        background: 'var(--primary-color)',
                        color: 'var(--sidebar-text)'
                    }}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Network className="w-6 h-6" />
                        Kabisilya Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage kabisilya groups, assign workers and bukids, and organize farm operations
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>

                    <button
                        onClick={handleCreateKabisilya}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Kabisilya
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-purple-light)' }}>
                            <Network className="w-6 h-6" style={{ color: 'var(--accent-purple)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-purple-light)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            Total
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totalKabisilyas || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Kabisilyas</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <UserCheck className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Workers
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totalWorkers || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Workers</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <Home className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-earth-light)',
                                color: 'var(--accent-earth)'
                            }}
                        >
                            Bukids
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totalBukids || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Bukids</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
                            <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-gold-light)',
                                color: 'var(--accent-gold)'
                            }}
                        >
                            Average
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totalKabisilyas ? Math.round((stats.totalWorkers + stats.totalBukids) / stats.totalKabisilyas) : 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Avg Resources per Kabisilya</p>
                </div>
            </div>

            {/* Controls */}
            <div className="p-5 rounded-xl space-y-4"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search kabisilyas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'active', 'inactive'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusFilterChange(status)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === status ? '' : 'opacity-70 hover:opacity-100'}`}
                                    style={{
                                        background: statusFilter === status ? 'var(--primary-color)' : 'var(--card-secondary-bg)',
                                        color: statusFilter === status ? 'var(--sidebar-text)' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 ${viewMode === 'table' ? 'bg-gray-100' : 'bg-white'}`}
                                style={{ color: viewMode === 'table' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                                style={{ color: viewMode === 'grid' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Advanced Filters Toggle */}
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                            style={{
                                background: showAdvancedFilters ? 'var(--primary-color)' : 'var(--card-secondary-bg)',
                                color: showAdvancedFilters ? 'var(--sidebar-text)' : 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <Filter className="w-4 h-4" />
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                            style={{
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Clear Filters */}
                        <button
                            onClick={clearFilters}
                            className="p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                            style={{
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                {showAdvancedFilters && (
                    <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Sort By
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="name">Name</option>
                                    <option value="workerCount">Worker Count</option>
                                    <option value="bukidCount">Bukid Count</option>
                                    <option value="createdAt">Created Date</option>
                                    <option value="updatedAt">Updated Date</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Sort Order
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as 'ASC' | 'DESC');
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="ASC">Ascending</option>
                                    <option value="DESC">Descending</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Show Inactive
                                </label>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={statusFilter === 'inactive'}
                                        onChange={(e) => handleStatusFilterChange(e.target.checked ? 'inactive' : 'all')}
                                        className="rounded mr-2"
                                        style={{ borderColor: 'var(--border-color)' }}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Include inactive kabisilyas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedKabisilyas.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedKabisilyas.length} kabisilya(s) selected
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                            style={{
                                background: 'var(--accent-rust)',
                                color: 'white'
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedKabisilyas([])}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                            style={{
                                background: 'var(--card-secondary-bg)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Table View */}
            {viewMode === 'table' ? (
                <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ background: 'var(--table-header-bg)' }}>
                                    <th className="p-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedKabisilyas.length === kabisilyas.length && kabisilyas.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Name
                                            {sortBy === 'name' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('workerCount')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Workers
                                            {sortBy === 'workerCount' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('bukidCount')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Bukids
                                            {sortBy === 'bukidCount' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Created
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {kabisilyas.map((kabisilya) => (
                                    <React.Fragment key={kabisilya.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedKabisilyas.includes(kabisilya.id)}
                                                    onChange={() => toggleSelectKabisilya(kabisilya.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Network className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {kabisilya.name}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {kabisilya.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <UsersIcon className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {kabisilya.workerCount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {kabisilya.bukidCount}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        {formatDate(kabisilya.createdAt, 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(kabisilya)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewKabisilya(kabisilya.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditKabisilya(kabisilya.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAssignWorkers(kabisilya.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Assign Workers"
                                                    >
                                                        <UserPlus className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAssignBukids(kabisilya.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Assign Bukids"
                                                    >
                                                        <Layers className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteKabisilya(kabisilya.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandKabisilya(kabisilya.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedKabisilya === kabisilya.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedKabisilya === kabisilya.id && (
                                            <tr>
                                                <td colSpan={7} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Kabisilya Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(kabisilya.createdAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(kabisilya.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Summary:</span>
                                                                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                                                                        {kabisilya.workerCount} workers • {kabisilya.bukidCount} bukids
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <UsersIcon className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Worker Assignment
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Workers:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {kabisilya.workerCount}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <button
                                                                        onClick={() => handleAssignWorkers(kabisilya.id)}
                                                                        className="w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
                                                                        style={{
                                                                            background: 'var(--accent-sky-light)',
                                                                            color: 'var(--accent-sky)',
                                                                            border: '1px solid rgba(49, 130, 206, 0.3)'
                                                                        }}
                                                                    >
                                                                        <UserPlus className="w-3 h-3" />
                                                                        Manage Workers
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Bukid Assignment
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Bukids:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {kabisilya.bukidCount}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <button
                                                                        onClick={() => handleAssignBukids(kabisilya.id)}
                                                                        className="w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
                                                                        style={{
                                                                            background: 'var(--accent-earth-light)',
                                                                            color: 'var(--accent-earth)',
                                                                            border: '1px solid rgba(139, 87, 42, 0.3)'
                                                                        }}
                                                                    >
                                                                        <Layers className="w-3 h-3" />
                                                                        Manage Bukids
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kabisilyas.map((kabisilya) => (
                        <div
                            key={kabisilya.id}
                            className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            {/* Selection checkbox */}
                            <div className="absolute top-3 right-3">
                                <input
                                    type="checkbox"
                                    checked={selectedKabisilyas.includes(kabisilya.id)}
                                    onChange={() => toggleSelectKabisilya(kabisilya.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-purple-light)' }}>
                                    <Network className="w-6 h-6" style={{ color: 'var(--accent-purple)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {kabisilya.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Created {formatDate(kabisilya.createdAt, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    {getStatusBadge(kabisilya)}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <UsersIcon className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {kabisilya.workerCount} workers assigned
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {kabisilya.bukidCount} bukids assigned
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Updated {formatDate(kabisilya.updatedAt, 'MMM dd, yyyy')}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button
                                    onClick={() => handleAssignWorkers(kabisilya.id)}
                                    className="px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
                                    style={{
                                        background: 'var(--accent-sky-light)',
                                        color: 'var(--accent-sky)',
                                        border: '1px solid rgba(49, 130, 206, 0.3)'
                                    }}
                                >
                                    <UserPlus className="w-3 h-3" />
                                    Workers
                                </button>
                                <button
                                    onClick={() => handleAssignBukids(kabisilya.id)}
                                    className="px-3 py-2 rounded text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2"
                                    style={{
                                        background: 'var(--accent-earth-light)',
                                        color: 'var(--accent-earth)',
                                        border: '1px solid rgba(139, 87, 42, 0.3)'
                                    }}
                                >
                                    <Layers className="w-3 h-3" />
                                    Bukids
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    ID: {kabisilya.id}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewKabisilya(kabisilya.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditKabisilya(kabisilya.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteKabisilya(kabisilya.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {kabisilyas.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Network className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Kabisilyas Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No kabisilyas have been created yet. Get started by creating your first kabisilya group.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreateKabisilya}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Kabisilya
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {kabisilyas.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} kabisilyas
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                            style={{
                                background: currentPage === 1 ? 'var(--card-secondary-bg)' : 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === pageNum ? '' : 'hover:shadow-md'}`}
                                    style={{
                                        background: currentPage === pageNum ? 'var(--primary-color)' : 'var(--card-bg)',
                                        color: currentPage === pageNum ? 'var(--sidebar-text)' : 'var(--text-primary)',
                                        border: `1px solid ${currentPage === pageNum ? 'var(--primary-color)' : 'var(--border-color)'}`
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                            style={{
                                background: currentPage === totalPages ? 'var(--card-secondary-bg)' : 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KabisilyaTablePage;