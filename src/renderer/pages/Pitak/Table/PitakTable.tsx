// PitakTable.tsx placeholder
// components/Pitak/PitakTablePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus,
    Edit,
    Trash2,
    Eye,
    Download, RefreshCw,
    ChevronRight,
    MapPin,
    Grid,
    List,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Hash,
    Clock,
    Package,
    CheckCircle,
    XCircle,
    AlertCircle,
    Home,
    BarChart3, Users,
    TrendingUp,
    Crop
} from 'lucide-react';
import type { PitakFilters, PitakStatsData, PitakWithDetails } from '../../../apis/pitak';
import pitakAPI from '../../../apis/pitak';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate, formatNumber } from '../../../utils/formatters';

const PitakTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [pitaks, setPitaks] = useState<PitakWithDetails[]>([]);
    const [stats, setStats] = useState<PitakStatsData | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [bukidFilter, setBukidFilter] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedPitaks, setSelectedPitaks] = useState<number[]>([]);
    const [expandedPitak, setExpandedPitak] = useState<number | null>(null);

    // Fetch pitak data
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

            // If search query exists, use search endpoint
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

                // Update stats if available
                if (response.meta?.stats) {
                    setStats(response.meta.stats);
                }
            } else {
                throw new Error(response.message || 'Failed to fetch pitak data');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch pitak data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, bukidFilter, sortBy, sortOrder]);

    // Fetch stats separately
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

    // Initial load
    useEffect(() => {
        fetchPitaks();
        fetchStats();
    }, [fetchPitaks]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchPitaks(), fetchStats()]);
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchPitaks();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchPitaks]);

    // Handle status filter change
    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Handle sort
    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    };

    // Selection handlers
    const toggleSelectAll = () => {
        if (selectedPitaks.length === pitaks.length) {
            setSelectedPitaks([]);
        } else {
            setSelectedPitaks(pitaks.map(p => p.id));
        }
    };

    const toggleSelectPitak = (id: number) => {
        setSelectedPitaks(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewPitak = (id: number) => {
        navigate(`/pitak/view/${id}`);
    };

    const handleEditPitak = (id: number) => {
        navigate(`/pitak/edit/${id}`);
    };

    const handleCreatePitak = () => {
        navigate('/pitak/create');
    };

    const handleDeletePitak = async (id: number, location?: string) => {
        const confirmed = await showConfirm({
            title: 'Delete Pitak',
            message: `Are you sure you want to delete this pitak ${location ? `at ${location}` : ''}?`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting pitak...', 'info');
            const response = await pitakAPI.deletePitak(id);

            if (response.status) {
                showSuccess(`Pitak deleted successfully`);
                fetchPitaks();
                fetchStats();
                // Remove from selected
                setSelectedPitaks(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete pitak');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPitaks.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedPitaks.length} selected pitak(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected pitak...', 'info');
            const results = await Promise.allSettled(
                selectedPitaks.map(id => pitakAPI.deletePitak(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} pitak(s)`);
            } else {
                showError(`Deleted ${successful.length} pitak(s), failed to delete ${failed.length} pitak(s)`);
            }

            fetchPitaks();
            fetchStats();
            setSelectedPitaks([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete pitak');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');
            const response = await pitakAPI.exportPitaksToCSV({
                status: statusFilter !== 'all' ? statusFilter : undefined,
                bukidId: bukidFilter || undefined
            });

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                const blob = new Blob([response.data.csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess(`Exported ${response.data.count} records to CSV`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export CSV');
        }
    };

    const handleUpdateStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'deactivate';

        const confirmed = await showConfirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Pitak`,
            message: `Are you sure you want to ${action} this pitak?`,
            icon: 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing pitak...`, 'info');
            const response = await pitakAPI.updatePitakStatus(id, newStatus);

            if (response.status) {
                showSuccess(`Pitak ${action}d successfully`);
                fetchPitaks();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || `Failed to ${action} pitak`);
        }
    };

    const handleMarkAsHarvested = async (id: number) => {
        const confirmed = await showConfirm({
            title: 'Mark as Harvested',
            message: 'Are you sure you want to mark this pitak as harvested? This will change its status.',
            icon: 'warning',
            confirmText: 'Mark as Harvested',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Marking pitak as harvested...', 'info');
            const response = await pitakAPI.markPitakAsHarvested(id);

            if (response.status) {
                showSuccess('Pitak marked as harvested successfully');
                fetchPitaks();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to mark pitak as harvested');
        }
    };

    // Toggle pitak expansion
    const toggleExpandPitak = (id: number) => {
        setExpandedPitak(prev => prev === id ? null : id);
    };

    // Get status badge
    const getStatusBadge = (status: string = 'active') => {
        const statusConfig = {
            active: {
                text: 'Active',
                bg: 'var(--status-planted-bg)',
                color: 'var(--status-planted)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: CheckCircle
            },
            inactive: {
                text: 'Inactive',
                bg: 'var(--status-fallow-bg)',
                color: 'var(--status-fallow)',
                border: 'rgba(113, 128, 150, 0.3)',
                icon: XCircle
            },
            harvested: {
                text: 'Harvested',
                bg: 'var(--accent-gold-light)',
                color: 'var(--accent-gold)',
                border: 'rgba(214, 158, 46, 0.3)',
                icon: Crop
            }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
        const Icon = config.icon;

        return (
            <span
                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{
                    background: config.bg,
                    color: config.color,
                    border: `1px solid ${config.border}`
                }}
            >
                <Icon className="w-3 h-3" />
                {config.text}
            </span>
        );
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
                        Loading pitak data...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !pitaks.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Pitak Data
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
                        <MapPin className="w-6 h-6" />
                        Pitak Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage planting areas, track luwang capacity, and monitor utilization
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
                        onClick={handleCreatePitak}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Pitak
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
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                            <MapPin className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-green-light)',
                                color: 'var(--accent-green)'
                            }}
                        >
                            Total
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totalPitaks || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Pitak</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <CheckCircle className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-green-light)',
                                color: 'var(--accent-green)'
                            }}
                        >
                            Active
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.activePitaks || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Pitak</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <Hash className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-purple-light)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            Capacity
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(stats?.totalLuWangCapacity || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Luwang Capacity</p>
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
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Utilization
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.utilizationRate ? `${stats.utilizationRate.toFixed(1)}%` : '0%'}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Average Utilization Rate</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center p-5 rounded-xl"
                style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)'
                }}
            >
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search pitak by location, bukid..."
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
                        {['all', 'active', 'inactive', 'harvested'].map((status) => (
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
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedPitaks.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedPitaks.length} pitak(s) selected
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
                            onClick={() => setSelectedPitaks([])}
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
                                            checked={selectedPitaks.length === pitaks.length && pitaks.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('location')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Location
                                            {sortBy === 'location' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Bukid
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('totalLuwang')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Luwang Capacity
                                            {sortBy === 'totalLuwang' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('createdAt')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Created
                                            {sortBy === 'createdAt' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pitaks.map((pitak) => (
                                    <React.Fragment key={pitak.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPitaks.includes(pitak.id)}
                                                    onChange={() => toggleSelectPitak(pitak.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                                        <MapPin className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {pitak.location || 'No location'}
                                                        </div>
                                                        {pitak.stats && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                                                    <Package className="w-3 h-3 inline mr-1" />
                                                                    {pitak.stats.assignments.total} assignments
                                                                </span>
                                                                <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                                                    <Users className="w-3 h-3 inline mr-1" />
                                                                    {pitak.stats.assignments.active} active
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Home className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        {pitak.bukid?.name || `Bukid #${pitak.bukidId}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {formatNumber(pitak.totalLuwang)}
                                                    </span>
                                                </div>
                                                {pitak.stats && (
                                                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                        Used: {formatNumber(pitak.stats.assignments.totalLuWangAssigned)} ({pitak.stats.utilizationRate.toFixed(1)}%)
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(pitak.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {formatDate(pitak.createdAt, 'MMM dd, yyyy')}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewPitak(pitak.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditPitak(pitak.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    {pitak.status !== 'harvested' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(pitak.id, pitak.status)}
                                                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                                title={pitak.status === 'active' ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {pitak.status === 'active' ? (
                                                                    <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleMarkAsHarvested(pitak.id)}
                                                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                                title="Mark as Harvested"
                                                            >
                                                                <Crop className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                            </button>
                                                        </>
                                                    ) : null}
                                                    <button
                                                        onClick={() => handleDeletePitak(pitak.id, pitak.location || undefined)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandPitak(pitak.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedPitak === pitak.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedPitak === pitak.id && pitak.stats && (
                                            <tr>
                                                <td colSpan={7} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Package className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Assignments
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {pitak.stats.assignments.total}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {pitak.stats.assignments.active}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {pitak.stats.assignments.completed}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Luwang
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Capacity:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {formatNumber(pitak.totalLuwang)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Assigned:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {formatNumber(pitak.stats.assignments.totalLuWangAssigned)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Utilization:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {pitak.stats.utilizationRate.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Payments
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    {pitak.stats.payments.total}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gross Pay:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    ₱{formatNumber(pitak.stats.payments.totalGrossPay)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Net Pay:</span>
                                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                    ₱{formatNumber(pitak.stats.payments.totalNetPay)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Last Updated
                                                                </span>
                                                            </div>
                                                            <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                                                                {formatDate(pitak.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                            </div>
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                ID: {pitak.id}
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
                    {pitaks.map((pitak) => (
                        <div
                            key={pitak.id}
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
                                    checked={selectedPitaks.includes(pitak.id)}
                                    onChange={() => toggleSelectPitak(pitak.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                    <MapPin className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {pitak.location || 'No location'}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {pitak.bukid?.name || `Bukid #${pitak.bukidId}`}
                                        </span>
                                    </div>
                                    {getStatusBadge(pitak.status)}
                                </div>
                            </div>

                            {/* Stats */}
                            {pitak.stats && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                        <Package className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-sky)' }} />
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {pitak.stats.assignments.total}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assignments</div>
                                    </div>
                                    <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                        <Hash className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-gold)' }} />
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {formatNumber(pitak.totalLuwang)}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Capacity</div>
                                    </div>
                                    <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                        <BarChart3 className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-purple)' }} />
                                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                            {pitak.stats.utilizationRate.toFixed(1)}%
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Utilization</div>
                                    </div>
                                    <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                        <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-earth)' }} />
                                        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            ₱{formatNumber(pitak.stats.payments.totalNetPay)}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Net Pay</div>
                                    </div>
                                </div>
                            )}

                            {/* Bukid Info */}
                            <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        Bukid: {pitak.bukid?.name}
                                    </div>
                                    {pitak.bukid?.kabisilya && (
                                        <div className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-green-light)', color: 'var(--accent-green)' }}>
                                            Kab: {pitak.bukid.kabisilya.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Created {formatDate(pitak.createdAt, 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewPitak(pitak.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditPitak(pitak.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    {pitak.status !== 'harvested' && (
                                        <button
                                            onClick={() => handleUpdateStatus(pitak.id, pitak.status)}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title={pitak.status === 'active' ? 'Deactivate' : 'Activate'}
                                        >
                                            {pitak.status === 'active' ? (
                                                <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {pitaks.length === 0 && !loading && (
                <div className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Pitak Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No pitak have been created yet. Get started by creating your first pitak.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreatePitak}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Pitak
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {pitaks.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} pitak
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

export default PitakTablePage;