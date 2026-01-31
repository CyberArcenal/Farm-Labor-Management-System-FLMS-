// components/Bukid/BukidTablePage.tsx
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
    Sprout, Package, CheckCircle,
    XCircle,
    AlertCircle, Home,
    Grid,
    List,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Hash, Clock
} from 'lucide-react';
import type { BukidData, BukidFilters, BukidStatsData, BukidSummaryData } from '../../../apis/bukid';
import bukidAPI from '../../../apis/bukid';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { dialogs, showConfirm } from '../../../utils/dialogs';
import { formatDate } from '../../../utils/formatters';

const BukidTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [bukids, setBukids] = useState<BukidData[]>([]);
    const [summary, setSummary] = useState<BukidSummaryData[]>([]);
    const [stats, setStats] = useState<BukidStatsData | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [kabisilyaFilter, setKabisilyaFilter] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedBukids, setSelectedBukids] = useState<number[]>([]);
    const [expandedBukid, setExpandedBukid] = useState<number | null>(null);

    // Fetch bukid data
    const fetchBukids = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: BukidFilters = {
                page: currentPage,
                limit,
                sortBy,
                sortOrder,
                status: statusFilter !== 'all' ? statusFilter : undefined,
            };

            // If search query exists, use search endpoint
            let response;
            if (searchQuery.trim()) {
                response = await bukidAPI.search(searchQuery, filters);
            } else {
                response = await bukidAPI.getAll(filters);
            }

            if (response.status) {
                setBukids(response.data.bukids || []);
                setTotalPages(response.data.pagination.totalPages);
                setTotalItems(response.data.pagination.total);
            } else {
                throw new Error(response.message || 'Failed to fetch bukid data');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch bukid data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, kabisilyaFilter, sortBy, sortOrder]);

    // Fetch summary and stats
    const fetchSummaryAndStats = async () => {
        try {
            const [summaryRes, statsRes] = await Promise.all([
                bukidAPI.getStats(),
                bukidAPI.getActive({ limit: 5 })
            ]);

            if (summaryRes.status) {
                setStats(summaryRes.data.summary);
            }

            if (statsRes.status && statsRes.data.bukids) {
                const summaryData = await Promise.all(
                    statsRes.data.bukids.map(async (bukid) => {
                        try {
                            const summary = await bukidAPI.getSummary(bukid.id!);
                            return summary.status ? summary.data.summary : null;
                        } catch {
                            return null;
                        }
                    })
                );
                setSummary(summaryData.filter(Boolean) as BukidSummaryData[]);
            }
        } catch (err) {
            console.error('Failed to fetch summary/stats:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchBukids();
        fetchSummaryAndStats();
    }, [fetchBukids]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchBukids(), fetchSummaryAndStats()]);
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchBukids();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchBukids]);

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
        if (selectedBukids.length === bukids.length) {
            setSelectedBukids([]);
        } else {
            setSelectedBukids(bukids.map(b => b.id!));
        }
    };

    const toggleSelectBukid = (id: number) => {
        setSelectedBukids(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewBukid = (id: number) => {
        navigate(`/bukid/view/${id}`);
    };

    const handleEditBukid = (id: number) => {
        navigate(`/bukid/edit/${id}`);
    };

    const handleCreateBukid = () => {
        navigate('/bukid/create');
    };

    const handleDeleteBukid = async (id: number, name: string) => {
        const confirmed = await dialogs.delete(name);
        if (!confirmed) return;

        try {
            showToast('Deleting bukid...', 'info');
            const response = await bukidAPI.delete(id);

            if (response.status) {
                showSuccess(`Bukid "${name}" deleted successfully`);
                fetchBukids();
                fetchSummaryAndStats();
                // Remove from selected
                setSelectedBukids(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete bukid');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedBukids.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedBukids.length} selected bukid(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected bukid...', 'info');
            const results = await Promise.allSettled(
                selectedBukids.map(id => bukidAPI.delete(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} bukid(s)`);
            } else {
                showError(`Deleted ${successful.length} bukid(s), failed to delete ${failed.length} bukid(s)`);
            }

            fetchBukids();
            fetchSummaryAndStats();
            setSelectedBukids([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete bukid');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');
            const response = await bukidAPI.exportToCSV({
                status: statusFilter !== 'all' ? statusFilter : undefined
            });

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = response.data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showSuccess(`Exported ${response.data.recordCount} records to CSV`);
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
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Bukid`,
            message: `Are you sure you want to ${action} this bukid?`,
            icon: 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing bukid...`, 'info');
            const response = await bukidAPI.updateStatus(id, newStatus);

            if (response.status) {
                showSuccess(`Bukid ${action}d successfully`);
                fetchBukids();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || `Failed to ${action} bukid`);
        }
    };

    // Toggle bukid expansion
    const toggleExpandBukid = (id: number) => {
        setExpandedBukid(prev => prev === id ? null : id);
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
            pending: {
                text: 'Pending',
                bg: 'var(--status-growing-bg)',
                color: 'var(--status-growing)',
                border: 'rgba(214, 158, 46, 0.3)',
                icon: AlertCircle
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
                        Loading bukid data...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !bukids.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Bukid Data
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
                        <Home className="w-6 h-6" />
                        Bukid Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage farm lands, track assignments, and monitor productivity
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
                        onClick={handleCreateBukid}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Bukid
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
                            <Home className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
                        {stats?.total || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Bukid</p>
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
                        {stats?.active || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Bukid</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <MapPin className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-purple-light)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            Locations
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {summary.filter(b => b.location).length || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>With Location</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
                            <Package className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Assignments
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {summary.reduce((acc, curr) => acc + curr.assignmentCount, 0) || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Assignments</p>
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
                            placeholder="Search bukid by name, location..."
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
                    <div className="flex gap-2">
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
            {selectedBukids.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedBukids.length} bukid(s) selected
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
                            onClick={() => setSelectedBukids([])}
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
                                            checked={selectedBukids.length === bukids.length && bukids.length > 0}
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
                                        Location
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
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {bukids.map((bukid) => {
                                    const bukidSummary = summary.find(s => s.id === bukid.id);
                                    return (
                                        <React.Fragment key={bukid.id}>
                                            <tr className="hover:bg-gray-50 transition-colors"
                                                style={{ borderBottom: '1px solid var(--border-color)' }}
                                            >
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBukids.includes(bukid.id!)}
                                                        onChange={() => toggleSelectBukid(bukid.id!)}
                                                        className="rounded"
                                                        style={{ borderColor: 'var(--border-color)' }}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                                            <Home className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {bukid.name}
                                                            </div>
                                                            {bukidSummary && (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                                                        <Package className="w-3 h-3 inline mr-1" />
                                                                        {bukidSummary.assignmentCount} assignments
                                                                    </span>
                                                                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                                                        <MapPin className="w-3 h-3 inline mr-1" />
                                                                        {bukidSummary.pitakCount} pitaks
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                            {bukid.location || 'No location'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {getStatusBadge(bukid.status)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        {formatDate(bukid.createdAt, 'MMM dd, yyyy')}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleViewBukid(bukid.id!)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditBukid(bukid.id!)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(bukid.id!, bukid.status || 'active')}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title={bukid.status === 'active' ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {bukid.status === 'active' ? (
                                                                <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBukid(bukid.id!, bukid.name)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                        </button>
                                                        <button
                                                            onClick={() => toggleExpandBukid(bukid.id!)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="More Details"
                                                        >
                                                            <ChevronRight className={`w-4 h-4 transition-transform ${expandedBukid === bukid.id ? 'rotate-90' : ''}`} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Row */}
                                            {expandedBukid === bukid.id && bukidSummary && (
                                                <tr>
                                                    <td colSpan={6} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Package className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        Assignments
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active:</span>
                                                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                        {bukidSummary.activeAssignments}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total:</span>
                                                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                        {bukidSummary.assignmentCount}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <MapPin className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        Pitaks
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total:</span>
                                                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                        {bukidSummary.pitakCount}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Luwang:</span>
                                                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                                        {bukidSummary.totalLuwang}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Sprout className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        Kabisilya
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Clock className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        Last Updated
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                                    {formatDate(bukid.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bukids.map((bukid) => {
                        const bukidSummary = summary.find(s => s.id === bukid.id);
                        return (
                            <div
                                key={bukid.id}
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
                                        checked={selectedBukids.includes(bukid.id!)}
                                        onChange={() => toggleSelectBukid(bukid.id!)}
                                        className="rounded"
                                        style={{ borderColor: 'var(--border-color)' }}
                                    />
                                </div>

                                {/* Header */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                        <Home className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                            {bukid.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {bukid.location || 'No location'}
                                            </span>
                                        </div>
                                        {getStatusBadge(bukid.status)}
                                    </div>
                                </div>

                                {/* Stats */}
                                {bukidSummary && (
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <Package className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-sky)' }} />
                                            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {bukidSummary.assignmentCount}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assignments</div>
                                        </div>
                                        <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <MapPin className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-earth)' }} />
                                            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {bukidSummary.pitakCount}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pitaks</div>
                                        </div>
                                        <div className="text-center p-2 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                            <Hash className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--accent-gold)' }} />
                                            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                                {bukidSummary.totalLuwang}
                                            </div>
                                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Luwang</div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes Preview */}
                                {bukid.notes && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-600 line-clamp-2">{bukid.notes}</p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        Created {formatDate(bukid.createdAt, 'MMM dd, yyyy')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleViewBukid(bukid.id!)}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                        </button>
                                        <button
                                            onClick={() => handleEditBukid(bukid.id!)}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(bukid.id!, bukid.status || 'active')}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title={bukid.status === 'active' ? 'Deactivate' : 'Activate'}
                                        >
                                            {bukid.status === 'active' ? (
                                                <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                            ) : (
                                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {bukids.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Home className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Bukid Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No bukid have been created yet. Get started by creating your first bukid.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreateBukid}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Bukid
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {bukids.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} bukid
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

export default BukidTablePage;