// components/Worker/WorkerTablePage.tsx
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
    Mail,
    Phone,
    MapPin,
    Hash,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    FileText,
    BarChart3,
    TrendingUp,
    Filter,
    List,
    Grid,
    DollarSign,
    CreditCard,
    Shield,
    UserPlus,
    UserMinus,
    DownloadCloud,
    UploadCloud,
    Printer
} from 'lucide-react';
import type { 
    WorkerData, 
    WorkerStatsData, 
    WorkerSearchParams,
    WorkerListResponseData,
    WorkerPaginationData 
} from '../../../apis/worker';
import workerAPI from '../../../apis/worker';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate, formatNumber, formatCurrency } from '../../../utils/formatters';
import KabisilyaSelect from '../../../components/Selects/Kabisilya';

const WorkerTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [workers, setWorkers] = useState<WorkerData[]>([]);
    const [stats, setStats] = useState<WorkerStatsData | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [kabisilyaFilter, setKabisilyaFilter] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [hasDebtFilter, setHasDebtFilter] = useState<boolean | null>(null);

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
    const [expandedWorker, setExpandedWorker] = useState<number | null>(null);

    // Fetch workers data
    const fetchWorkers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const searchParams: WorkerSearchParams = {
                query: searchQuery,
                page: currentPage,
                limit,
                sortBy,
                sortOrder,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                kabisilyaId: kabisilyaFilter || undefined
            };

            let response;
            if (searchQuery.trim()) {
                response = await workerAPI.searchWorkers(searchParams);
            } else {
                response = await workerAPI.getAllWorkers({
                    page: currentPage,
                    limit,
                    sortBy,
                    sortOrder,
                });
            }

            if (response.status) {
                const data = response.data as WorkerListResponseData;
                setWorkers(data.workers);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.total);

                // Fetch stats if not already loaded
                if (!stats) {
                    await fetchStats();
                }
            } else {
                throw new Error(response.message || 'Failed to fetch workers');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch workers:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, kabisilyaFilter, sortBy, sortOrder]);

    // Fetch stats
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

    // Initial load
    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchWorkers();
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchWorkers();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchWorkers]);

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
        if (selectedWorkers.length === workers.length) {
            setSelectedWorkers([]);
        } else {
            setSelectedWorkers(workers.map(w => w.id));
        }
    };

    const toggleSelectWorker = (id: number) => {
        setSelectedWorkers(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewWorker = (id: number) => {
        navigate(`/worker/view/${id}`);
    };

    const handleEditWorker = (id: number) => {
        navigate(`/workers/form/${id}`);
    };

    const handleCreateWorker = () => {
        navigate('/workers/form');
    };

    const handleDeleteWorker = async (id: number) => {
        const worker = workers.find(w => w.id === id);
        const confirmed = await showConfirm({
            title: 'Delete Worker',
            message: `Are you sure you want to delete ${worker?.name}? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting worker...', 'info');
            const response = await workerAPI.deleteWorker(id);

            if (response.status) {
                showSuccess('Worker deleted successfully');
                fetchWorkers();
                setSelectedWorkers(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete worker');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedWorkers.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedWorkers.length} selected worker(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected workers...', 'info');
            const results = await Promise.allSettled(
                selectedWorkers.map(id => workerAPI.deleteWorker(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} worker(s)`);
            } else {
                showError(`Deleted ${successful.length} worker(s), failed to delete ${failed.length} worker(s)`);
            }

            fetchWorkers();
            setSelectedWorkers([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete workers');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');
            
            const params = {
                workerIds: selectedWorkers.length > 0 ? selectedWorkers : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                kabisilyaId: kabisilyaFilter || undefined,
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                includeFields: ['id', 'name', 'contact', 'email', 'address', 'status', 'hireDate', 'totalDebt', 'totalPaid', 'currentBalance']
            };
            
            const response = await workerAPI.exportWorkersToCSV(params);

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                const blob = new Blob([response.data.csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = `workers_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess(`Exported ${selectedWorkers.length || workers.length} workers to CSV`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export CSV');
        }
    };

    const handleUpdateStatus = async (id: number, currentStatus: string, newStatus: string) => {
        const action = newStatus === 'active' ? 'activate' : 
                      newStatus === 'inactive' ? 'deactivate' : 
                      newStatus === 'on-leave' ? 'mark as on-leave' : 'terminate';

        const confirmed = await showConfirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Worker`,
            message: `Are you sure you want to ${action} this worker?`,
            icon: 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing worker...`, 'info');
            const response = await workerAPI.updateWorkerStatus(id, newStatus);

            if (response.status) {
                showSuccess(`Worker ${action}d successfully`);
                fetchWorkers();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || `Failed to ${action} worker`);
        }
    };

    const handleGenerateReport = async (id: number) => {
        try {
            showToast('Generating report...', 'info');
            const response = await workerAPI.generateWorkerReport(id, 'summary');

            if (response.status) {
                // Open report in new window or download
                const reportWindow = window.open('', '_blank');
                if (reportWindow) {
                    reportWindow.document.write(`
                        <html>
                            <head>
                                <title>Worker Report - ${response.data.worker.name}</title>
                                <style>
                                    body { font-family: Arial, sans-serif; margin: 40px; }
                                    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                                    .section { margin-bottom: 30px; }
                                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                    th { background-color: #f4f4f4; }
                                </style>
                            </head>
                            <body>
                                <div class="header">
                                    <h1>Worker Report</h1>
                                    <p>Generated: ${new Date(response.data.generatedAt).toLocaleString()}</p>
                                    <p>Worker: ${response.data.worker.name}</p>
                                    <p>Status: ${response.data.worker.status}</p>
                                </div>
                                <div class="section">
                                    <h2>Financial Summary</h2>
                                    <p>Total Debt: ${formatCurrency(response.data.worker.totalDebt)}</p>
                                    <p>Total Paid: ${formatCurrency(response.data.worker.totalPaid)}</p>
                                    <p>Current Balance: ${formatCurrency(response.data.worker.currentBalance)}</p>
                                </div>
                            </body>
                        </html>
                    `);
                    reportWindow.document.close();
                }
                showSuccess('Report generated successfully');
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to generate report');
        }
    };

    const handleImportCSV = async () => {
        // Create file input for CSV import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const confirmed = await showConfirm({
                title: 'Import Workers from CSV',
                message: `Import workers from ${file.name}?`,
                icon: 'info',
                confirmText: 'Import',
                cancelText: 'Cancel'
            });

            if (!confirmed) return;

            try {
                showToast('Importing workers from CSV...', 'info');
                // Note: You'll need to implement file upload logic here
                // For now, we'll show a placeholder
                showSuccess('CSV import functionality to be implemented');
            } catch (err: any) {
                showError(err.message || 'Failed to import CSV');
            }
        };

        input.click();
    };

    // Toggle worker expansion
    const toggleExpandWorker = (id: number) => {
        setExpandedWorker(prev => prev === id ? null : id);
    };

    // Get status badge
    const getStatusBadge = (status: string = 'active') => {
        const statusConfig = {
            active: {
                text: 'Active',
                bg: 'var(--accent-green-light)',
                color: 'var(--accent-green)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: CheckCircle
            },
            inactive: {
                text: 'Inactive',
                bg: 'var(--card-secondary-bg)',
                color: 'var(--text-secondary)',
                border: 'var(--border-color)',
                icon: UserMinus
            },
            'on-leave': {
                text: 'On Leave',
                bg: 'var(--accent-gold-light)',
                color: 'var(--accent-gold)',
                border: 'rgba(245, 158, 11, 0.3)',
                icon: Clock
            },
            terminated: {
                text: 'Terminated',
                bg: 'var(--accent-rust-light)',
                color: 'var(--accent-rust)',
                border: 'rgba(197, 48, 48, 0.3)',
                icon: XCircle
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

    // Get debt indicator
    const getDebtIndicator = (balance: number) => {
        if (balance === 0) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                        background: 'var(--accent-green-light)',
                        color: 'var(--accent-green)'
                    }}
                >
                    No Debt
                </span>
            );
        } else if (balance > 0) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                        background: 'var(--accent-rust-light)',
                        color: 'var(--accent-rust)'
                    }}
                >
                    Owes: {formatCurrency(balance)}
                </span>
            );
        } else {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                        background: 'var(--accent-sky-light)',
                        color: 'var(--accent-sky)'
                    }}
                >
                    Credit: {formatCurrency(Math.abs(balance))}
                </span>
            );
        }
    };

    // Clear filters
    const clearFilters = () => {
        setStatusFilter('all');
        setKabisilyaFilter(null);
        setDateFrom('');
        setDateTo('');
        setSearchQuery('');
        setHasDebtFilter(null);
        setCurrentPage(1);
    };

    // Filter workers by debt
    const filteredWorkers = hasDebtFilter === null 
        ? workers 
        : workers.filter(worker => 
            hasDebtFilter ? worker.currentBalance > 0 : worker.currentBalance <= 0
        );

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
                        Loading workers...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !workers.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Worker Data
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
                        <Users className="w-6 h-6" />
                        Worker Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage worker information, track debts and payments, and monitor worker status
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleImportCSV}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Import
                    </button>
                    
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
                        onClick={handleCreateWorker}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Worker
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
                            <Users className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
                        {stats?.totals?.all || 0}
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
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <UserPlus className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Active
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totals?.active || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Workers</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
                            <DollarSign className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-gold-light)',
                                color: 'var(--accent-gold)'
                            }}
                        >
                            Debt
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(stats?.financial?.totalDebt || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Worker Debt</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-purple-light)' }}>
                            <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-purple)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-purple-light)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            Average
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(stats?.financial?.averageBalance || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Average Balance</p>
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
                                placeholder="Search workers by name, email, or contact..."
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
                            {['all', 'active', 'inactive', 'on-leave', 'terminated'].map((status) => (
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
                                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Debt Filter */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setHasDebtFilter(hasDebtFilter === true ? null : true)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasDebtFilter === true ? '' : 'opacity-70 hover:opacity-100'}`}
                                style={{
                                    background: hasDebtFilter === true ? 'var(--accent-rust)' : 'var(--card-secondary-bg)',
                                    color: hasDebtFilter === true ? 'white' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <CreditCard className="w-4 h-4 inline mr-1" />
                                Has Debt
                            </button>
                            <button
                                onClick={() => setHasDebtFilter(hasDebtFilter === false ? null : false)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasDebtFilter === false ? '' : 'opacity-70 hover:opacity-100'}`}
                                style={{
                                    background: hasDebtFilter === false ? 'var(--accent-green)' : 'var(--card-secondary-bg)',
                                    color: hasDebtFilter === false ? 'white' : 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <Shield className="w-4 h-4 inline mr-1" />
                                No Debt
                            </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Kabisilya
                        </label>
                        <KabisilyaSelect
                            value={kabisilyaFilter}
                            onChange={(id) => setKabisilyaFilter(id)}
                            placeholder="Filter by kabisilya"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Hire Date From
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
                            Hire Date To
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
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="name">Name</option>
                            <option value="status">Status</option>
                            <option value="hireDate">Hire Date</option>
                            <option value="currentBalance">Balance</option>
                            <option value="createdAt">Created Date</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedWorkers.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedWorkers.length} worker(s) selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    const promises = selectedWorkers.map(id => 
                                        workerAPI.updateWorkerStatus(id, 'active')
                                    );
                                    Promise.all(promises).then(() => {
                                        showSuccess('Activated selected workers');
                                        fetchWorkers();
                                    });
                                }}
                                className="px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                                style={{
                                    background: 'var(--accent-green-light)',
                                    color: 'var(--accent-green)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                Activate All
                            </button>
                            <button
                                onClick={() => {
                                    const promises = selectedWorkers.map(id => 
                                        workerAPI.updateWorkerStatus(id, 'inactive')
                                    );
                                    Promise.all(promises).then(() => {
                                        showSuccess('Deactivated selected workers');
                                        fetchWorkers();
                                    });
                                }}
                                className="px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                                style={{
                                    background: 'var(--card-secondary-bg)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                Deactivate All
                            </button>
                        </div>
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
                            onClick={() => setSelectedWorkers([])}
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
                                            checked={selectedWorkers.length === workers.length && workers.length > 0}
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
                                            Worker Name
                                            {sortBy === 'name' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Contact Info
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('hireDate')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Hire Date
                                            {sortBy === 'hireDate' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('currentBalance')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Financial
                                            {sortBy === 'currentBalance' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'ASC' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Kabisilya
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkers.map((worker) => (
                                    <React.Fragment key={worker.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedWorkers.includes(worker.id)}
                                                    onChange={() => toggleSelectWorker(worker.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {worker.name}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {worker.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {worker.contact && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" style={{ color: 'var(--accent-sky)' }} />
                                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                                {worker.contact}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {worker.email && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3" style={{ color: 'var(--accent-gold)' }} />
                                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                                {worker.email}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {worker.address && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" style={{ color: 'var(--accent-earth)' }} />
                                                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                                {worker.address.substring(0, 30)}...
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {worker.hireDate ? formatDate(worker.hireDate, 'MMM dd, yyyy') : 'Not set'}
                                                        </div>
                                                        {worker.hireDate && (
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                {Math.floor((new Date().getTime() - new Date(worker.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(worker.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    {getDebtIndicator(worker.currentBalance)}
                                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                        Paid: {formatCurrency(worker.totalPaid)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {worker.kabisilya ? (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        <div>
                                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {worker.kabisilya.name}
                                                            </div>
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                ID: {worker.kabisilya.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No kabisilya</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewWorker(worker.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditWorker(worker.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    {worker.status !== 'active' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(worker.id, worker.status, 'active')}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Activate"
                                                        >
                                                            <UserPlus className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        </button>
                                                    )}
                                                    {worker.status === 'active' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(worker.id, worker.status, 'inactive')}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Deactivate"
                                                        >
                                                            <UserMinus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleGenerateReport(worker.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Generate Report"
                                                    >
                                                        <Printer className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWorker(worker.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandWorker(worker.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedWorker === worker.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedWorker === worker.id && (
                                            <tr>
                                                <td colSpan={8} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Worker Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(worker.createdAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(worker.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Days Employed:</span>
                                                                    {worker.hireDate && (
                                                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                                                                            {Math.floor((new Date().getTime() - new Date(worker.hireDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Financial Summary
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Debt:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(worker.totalDebt)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(worker.totalPaid)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Balance:</span>
                                                                    <span className={`text-sm font-medium ${worker.currentBalance > 0 ? 'text-red-600' : worker.currentBalance < 0 ? 'text-green-600' : ''}`}>
                                                                        {formatCurrency(worker.currentBalance)}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <button
                                                                        onClick={() => navigate(`/worker/financial/${worker.id}`)}
                                                                        className="text-xs px-2 py-1 rounded transition-colors"
                                                                        style={{
                                                                            background: 'var(--accent-gold-light)',
                                                                            color: 'var(--accent-gold)',
                                                                            border: '1px solid var(--border-color)'
                                                                        }}
                                                                    >
                                                                        View Financial Details
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Kabisilya Information
                                                                </span>
                                                            </div>
                                                            {worker.kabisilya ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {worker.kabisilya.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>ID:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {worker.kabisilya.id}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                        <button
                                                                            onClick={() => navigate(`/kabisilya/view/${worker.kabisilya?.id || 0}`)}
                                                                            className="text-xs px-2 py-1 rounded transition-colors"
                                                                            style={{
                                                                                background: 'var(--accent-green-light)',
                                                                                color: 'var(--accent-green)',
                                                                                border: '1px solid var(--border-color)'
                                                                            }}
                                                                        >
                                                                            View Kabisilya Details
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4">
                                                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No kabisilya assigned</p>
                                                                    <button
                                                                        onClick={() => navigate(`/worker/edit/${worker.id}`)}
                                                                        className="text-xs px-2 py-1 rounded mt-2 transition-colors"
                                                                        style={{
                                                                            background: 'var(--primary-color)',
                                                                            color: 'var(--sidebar-text)',
                                                                            border: '1px solid var(--border-color)'
                                                                        }}
                                                                    >
                                                                        Assign Kabisilya
                                                                    </button>
                                                                </div>
                                                            )}
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
                    {filteredWorkers.map((worker) => (
                        <div
                            key={worker.id}
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
                                    checked={selectedWorkers.includes(worker.id)}
                                    onChange={() => toggleSelectWorker(worker.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                    <User className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {worker.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            ID: {worker.id}
                                        </span>
                                        {worker.hireDate && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {formatDate(worker.hireDate, 'MM/dd/yyyy')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {getStatusBadge(worker.status)}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    {worker.contact ? (
                                        <>
                                            <Phone className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {worker.contact}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500">No contact</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {worker.email ? (
                                        <>
                                            <Mail className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {worker.email}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500">No email</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {worker.kabisilya ? (
                                        <>
                                            <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {worker.kabisilya.name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-500">No kabisilya</span>
                                    )}
                                </div>
                                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                    {getDebtIndicator(worker.currentBalance)}
                                </div>
                            </div>

                            {/* Address preview */}
                            {worker.address && (
                                <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                    <div className="flex items-start gap-1">
                                        <MapPin className="w-3 h-3 mt-0.5" style={{ color: 'var(--accent-earth)' }} />
                                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                            {worker.address.length > 80 ? `${worker.address.substring(0, 80)}...` : worker.address}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Created {formatDate(worker.createdAt, 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewWorker(worker.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditWorker(worker.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    {worker.status === 'active' && (
                                        <button
                                            onClick={() => handleUpdateStatus(worker.id, worker.status, 'inactive')}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title="Deactivate"
                                        >
                                            <UserMinus className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {filteredWorkers.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Workers Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery || statusFilter !== 'all' || kabisilyaFilter || hasDebtFilter !== null
                            ? `No results found for your filters. Try adjusting your search criteria.`
                            : 'No workers have been created yet. Get started by creating your first worker.'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && !kabisilyaFilter && hasDebtFilter === null && (
                        <button
                            onClick={handleCreateWorker}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Worker
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {filteredWorkers.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} workers
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

export default WorkerTablePage;