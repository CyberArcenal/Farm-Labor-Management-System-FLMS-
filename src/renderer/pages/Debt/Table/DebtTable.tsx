// DebtTable.tsx placeholder
// DebtTable.tsx
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
    DollarSign,
    FileText,
    BarChart3,
    Filter,
    List,
    Grid,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    CreditCard,
    Banknote,
    Receipt,
    TrendingUp,
    TrendingDown,
    Percent,
    AlertTriangle,
    Check,
    X
} from 'lucide-react';
import type {
    DebtData,
    DebtStats,
    DebtFilters,
    DateRange,
    DebtResponse
} from '../../../apis/debt';
import debtAPI from '../../../apis/debt';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import WorkerSelect from '../../../components/Selects/Worker';

const DebtTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [debts, setDebts] = useState<DebtData[]>([]);
    const [stats, setStats] = useState<DebtStats | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [workerFilter, setWorkerFilter] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('dateIncurred');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedDebts, setSelectedDebts] = useState<number[]>([]);
    const [expandedDebt, setExpandedDebt] = useState<number | null>(null);

    // Fetch debts data
    const fetchDebts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: DebtFilters = {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                worker_id: workerFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            };

            let response: DebtResponse<DebtData[]>;
            if (searchQuery.trim()) {
                response = await debtAPI.search(searchQuery);
            } else {
                response = await debtAPI.getAll(filters);
            }

            if (response.status) {
                const data = response.data;
                setDebts(data || []);
                setTotalItems(data.length || 0);
                setTotalPages(Math.ceil(data.length / limit) || 1);

                // Update stats
                await fetchStats();
            } else {
                throw new Error(response.message || 'Failed to fetch debts');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch debts:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, workerFilter, dateFrom, dateTo, sortBy, sortOrder]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await debtAPI.getStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch debt stats:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchDebts();
    }, [fetchDebts]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDebts();
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchDebts();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchDebts]);

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
        if (selectedDebts.length === debts.length) {
            setSelectedDebts([]);
        } else {
            setSelectedDebts(debts.map(d => d.id));
        }
    };

    const toggleSelectDebt = (id: number) => {
        setSelectedDebts(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewDebt = (id: number) => {
        navigate(`/debt/view/${id}`);
    };

    const handleEditDebt = (id: number) => {
        navigate(`/debt/edit/${id}`);
    };

    const handleCreateDebt = () => {
        navigate('/debt/create');
    };

    const handleDeleteDebt = async (id: number) => {
        const debt = debts.find(d => d.id === id);
        const confirmed = await showConfirm({
            title: 'Delete Debt',
            message: `Are you sure you want to delete debt #${id}?`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting debt...', 'info');
            const response = await debtAPI.delete(id);

            if (response.status) {
                showSuccess('Debt deleted successfully');
                fetchDebts();
                setSelectedDebts(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete debt');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDebts.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedDebts.length} selected debt(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected debts...', 'info');
            const results = await Promise.allSettled(
                selectedDebts.map(id => debtAPI.delete(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} debt(s)`);
            } else {
                showError(`Deleted ${successful.length} debt(s), failed to delete ${failed.length} debt(s)`);
            }

            fetchDebts();
            setSelectedDebts([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete debts');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');

            const filters: DebtFilters = {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                worker_id: workerFilter || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            };

            const response = await debtAPI.exportToCSV(filters);

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                const blob = new Blob([response.data.filePath], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.filePath || 'debts.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess('Debts exported to CSV successfully');
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export CSV');
        }
    };

    const handleMakePayment = async (id: number) => {
        navigate(`/debt/payment/${id}`);
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        const confirmed = await showConfirm({
            title: 'Update Debt Status',
            message: `Are you sure you want to update this debt's status to "${newStatus}"?`,
            icon: 'warning',
            confirmText: 'Update',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Updating debt status...', 'info');
            const response = await debtAPI.updateStatus(id, newStatus);

            if (response.status) {
                showSuccess('Debt status updated successfully');
                fetchDebts();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to update debt status');
        }
    };

    const handleViewHistory = async (id: number) => {
        navigate(`/debt/history/${id}`);
    };

    // Toggle debt expansion
    const toggleExpandDebt = (id: number) => {
        setExpandedDebt(prev => prev === id ? null : id);
    };

    // Get status badge
    const getStatusBadge = (status: string = 'pending') => {
        const statusConfig: Record<string, any> = {
            pending: {
                text: 'Pending',
                bg: 'var(--status-growing-bg)',
                color: 'var(--status-growing)',
                border: 'rgba(214, 158, 46, 0.3)',
                icon: Clock
            },
            partially_paid: {
                text: 'Partially Paid',
                bg: 'rgba(168, 85, 247, 0.1)',
                color: 'rgb(126, 34, 206)',
                border: 'rgba(168, 85, 247, 0.2)',
                icon: Percent
            },
            paid: {
                text: 'Paid',
                bg: 'var(--status-planted-bg)',
                color: 'var(--status-planted)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: CheckCircle
            },
            cancelled: {
                text: 'Cancelled',
                bg: 'var(--accent-rust-light)',
                color: 'var(--accent-rust)',
                border: 'rgba(197, 48, 48, 0.3)',
                icon: XCircle
            },
            overdue: {
                text: 'Overdue',
                bg: 'rgba(239, 68, 68, 0.1)',
                color: 'rgb(220, 38, 38)',
                border: 'rgba(239, 68, 68, 0.2)',
                icon: AlertTriangle
            }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
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

    // Clear filters
    const clearFilters = () => {
        setStatusFilter('all');
        setWorkerFilter(null);
        setDateFrom('');
        setDateTo('');
        setSearchQuery('');
        setCurrentPage(1);
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
                        Loading debts...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !debts.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Debt Data
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
                        <DollarSign className="w-6 h-6" />
                        Debt Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage worker debts, track payments, and monitor outstanding balances
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
                        Export CSV
                    </button>

                    <button
                        onClick={handleCreateDebt}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Debt
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
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <DollarSign className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Total
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(stats?.totalAmount || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Debt Amount</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                            <TrendingDown className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-green-light)',
                                color: 'var(--accent-green)'
                            }}
                        >
                            Balance
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(stats?.totalBalance || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Outstanding</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <Banknote className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-earth-light)',
                                color: 'var(--accent-earth)'
                            }}
                        >
                            Paid
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(stats?.totalPaid || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Amount Paid</p>
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
                            Active
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.activeCount || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Debts</p>
                </div>
            </div>

            {/* Status Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" style={{ color: 'var(--status-growing)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Pending</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--status-growing)' }}>
                            {stats?.pendingCount || 0}
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Percent className="w-5 h-5" style={{ color: 'rgb(126, 34, 206)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Partially Paid</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'rgb(126, 34, 206)' }}>
                            {stats?.partiallyPaidCount || 0}
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" style={{ color: 'var(--status-planted)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Paid</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--status-planted)' }}>
                            {stats?.paidCount || 0}
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5" style={{ color: 'var(--accent-rust)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Cancelled</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--accent-rust)' }}>
                            {stats?.cancelledCount || 0}
                        </span>
                    </div>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" style={{ color: 'rgb(220, 38, 38)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Overdue</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'rgb(220, 38, 38)' }}>
                            {stats?.overdueCount || 0}
                        </span>
                    </div>
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
                                placeholder="Search debts..."
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
                            {['all', 'pending', 'partially_paid', 'paid', 'cancelled', 'overdue'].map((status) => (
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
                                    {status === 'all' ? 'All' :
                                        status === 'partially_paid' ? 'Partially Paid' :
                                            status.charAt(0).toUpperCase() + status.slice(1)}
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
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Worker
                        </label>
                        <WorkerSelect
                            value={workerFilter}
                            onChange={(id) => setWorkerFilter(id)}
                            placeholder="Filter by worker"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Date From
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Date To
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedDebts.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedDebts.length} debt(s) selected
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
                            onClick={() => setSelectedDebts([])}
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
                                            checked={selectedDebts.length === debts.length && debts.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('dateIncurred')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Date Incurred
                                            {sortBy === 'dateIncurred' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Worker
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('amount')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Original Amount
                                            {sortBy === 'amount' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('balance')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Current Balance
                                            {sortBy === 'balance' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Reason
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Due Date
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
                                {debts.map((debt) => (
                                    <React.Fragment key={debt.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDebts.includes(debt.id)}
                                                    onChange={() => toggleSelectDebt(debt.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {formatDate(debt.dateIncurred, 'MMM dd, yyyy')}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {debt.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {debt.worker ? (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                        <div>
                                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {debt.worker?.name || ""}
                                                            </div>
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                Worker ID: {debt.worker.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No worker</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {formatCurrency(debt.originalAmount || debt.amount)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="w-4 h-4" style={{ color: debt.balance > 0 ? 'var(--accent-rust)' : 'var(--accent-green-dark)' }} />
                                                    <span className="font-medium" style={{ color: debt.balance > 0 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                                                        {formatCurrency(debt.balance)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {debt.reason || 'No reason provided'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {debt.dueDate ? (
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                            {formatDate(debt.dueDate, 'MMM dd, yyyy')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No due date</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(debt.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDebt(debt.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditDebt(debt.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    {debt.balance > 0 && debt.status !== 'cancelled' && (
                                                        <button
                                                            onClick={() => handleMakePayment(debt.id)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Make Payment"
                                                        >
                                                            <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewHistory(debt.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View History"
                                                    >
                                                        <FileText className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                    </button>
                                                    {debt.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(debt.id, 'cancelled')}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Cancel Debt"
                                                        >
                                                            <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                        </button>
                                                    )}
                                                    {debt.status === 'cancelled' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(debt.id, 'pending')}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Reactivate Debt"
                                                        >
                                                            <Check className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteDebt(debt.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandDebt(debt.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedDebt === debt.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedDebt === debt.id && (
                                            <tr>
                                                <td colSpan={9} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Debt Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(debt.createdAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(debt.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payment Term:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {debt.paymentTerm || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Interest Rate:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {debt.interestRate}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Interest:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(debt.totalInterest)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Worker Information
                                                                </span>
                                                            </div>
                                                            {debt.worker && (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {debt.worker.name}
                                                                        </span>
                                                                    </div>
                                                                    {debt.worker.contact && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contact:</span>
                                                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                {debt.worker.contact}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {formatCurrency(debt.totalPaid)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last Payment:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {debt.lastPaymentDate ? formatDate(debt.lastPaymentDate, 'MMM dd, yyyy') : 'No payments yet'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Payment Summary
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Original Amount:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(debt.originalAmount || debt.amount)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(debt.totalPaid)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Interest Accrued:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(debt.totalInterest)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Current Balance:</span>
                                                                    <span className="text-sm font-semibold" style={{ color: debt.balance > 0 ? 'var(--accent-rust)' : 'var(--accent-green)' }}>
                                                                        {formatCurrency(debt.balance)}
                                                                    </span>
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
                    {debts.map((debt) => (
                        <div
                            key={debt.id}
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
                                    checked={selectedDebts.includes(debt.id)}
                                    onChange={() => toggleSelectDebt(debt.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                                    <DollarSign className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        Debt #{debt.id}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {formatDate(debt.dateIncurred, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    {getStatusBadge(debt.status)}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {debt.worker?.name || 'No worker assigned'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium" style={{ color: debt.balance > 0 ? 'var(--accent-rust)' : 'var(--text-primary)' }}>
                                            {formatCurrency(debt.balance)}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Balance
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Original Amount
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(debt.originalAmount || debt.amount)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Amount Paid
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>
                                        {formatCurrency(debt.totalPaid)}
                                    </div>
                                </div>

                                {debt.dueDate && (
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Due Date
                                        </div>
                                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {formatDate(debt.dueDate, 'MMM dd, yyyy')}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Reason
                                    </div>
                                    <div className="text-sm font-medium truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }} title={debt.reason || ''}>
                                        {debt.reason || 'No reason provided'}
                                    </div>
                                </div>
                            </div>

                            {/* Interest info */}
                            {debt.interestRate > 0 && (
                                <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Interest Rate
                                        </div>
                                        <div className="text-xs font-medium" style={{ color: 'var(--accent-gold)' }}>
                                            {debt.interestRate}%
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            Total Interest
                                        </div>
                                        <div className="text-xs font-medium" style={{ color: 'var(--accent-gold)' }}>
                                            {formatCurrency(debt.totalInterest)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Created {formatDate(debt.createdAt, 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewDebt(debt.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditDebt(debt.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    {debt.balance > 0 && debt.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleMakePayment(debt.id)}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title="Make Payment"
                                        >
                                            <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleViewHistory(debt.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="History"
                                    >
                                        <FileText className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {debts.length === 0 && !loading && (
                <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Debts Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No debts have been created yet. Get started by creating your first debt record.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreateDebt}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Debt
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {debts.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} debts
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

export default DebtTablePage;