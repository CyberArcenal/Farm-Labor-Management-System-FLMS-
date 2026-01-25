// PaymentTable.tsx placeholder
// components/Payment/PaymentTablePage.tsx
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
    Percent
} from 'lucide-react';
import type {
    PaymentData,
    PaymentStatsData,
    PaymentPaginationData,
    PaymentSummaryData
} from '../../../apis/payment';
import paymentAPI from '../../../apis/payment';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import WorkerSelect from '../../../components/Selects/Worker';

const PaymentTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [payments, setPayments] = useState<PaymentData[]>([]);
    const [stats, setStats] = useState<PaymentStatsData | null>(null);
    const [summary, setSummary] = useState<PaymentSummaryData | null>(null);

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
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('paymentDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
    const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

    // Fetch payments data
    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: currentPage,
                limit,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                workerId: workerFilter || undefined,
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined
            };

            let response;
            if (searchQuery.trim()) {
                response = await paymentAPI.searchPayments({
                    query: searchQuery,
                    ...params
                });
            } else {
                response = await paymentAPI.getAllPayments(params);
            }

            if (response.status) {
                const data = response.data as PaymentPaginationData;
                setPayments(data.payments || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setTotalItems(data.pagination?.total || 0);

                // Update stats and summary
                await fetchStats();
                await fetchSummary();
            } else {
                throw new Error(response.message || 'Failed to fetch payments');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch payments:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, workerFilter, dateFrom, dateTo, paymentMethodFilter, sortBy, sortOrder]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await paymentAPI.getPaymentStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch payment stats:', err);
        }
    };

    // Fetch summary
    const fetchSummary = async () => {
        try {
            const response = await paymentAPI.getPaymentSummary({
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                workerId: workerFilter || undefined
            });
            if (response.status) {
                setSummary(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch payment summary:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPayments();
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchPayments();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchPayments]);

    // Handle status filter change
    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Handle payment method filter change
    const handlePaymentMethodFilterChange = (method: string) => {
        setPaymentMethodFilter(method);
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
        if (selectedPayments.length === payments.length) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(payments.map(p => p.id));
        }
    };

    const toggleSelectPayment = (id: number) => {
        setSelectedPayments(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewPayment = (id: number) => {
        navigate(`/payment/view/${id}`);
    };

    const handleEditPayment = (id: number) => {
        navigate(`/payment/edit/${id}`);
    };

    const handleCreatePayment = () => {
        navigate('/payment/create');
    };

    const handleDeletePayment = async (id: number) => {
        const payment = payments.find(p => p.id === id);
        const confirmed = await showConfirm({
            title: 'Delete Payment',
            message: `Are you sure you want to delete payment #${id}?`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting payment...', 'info');
            const response = await paymentAPI.deletePayment(id);

            if (response.status) {
                showSuccess('Payment deleted successfully');
                fetchPayments();
                setSelectedPayments(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete payment');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPayments.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedPayments.length} selected payment(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected payments...', 'info');
            const results = await Promise.allSettled(
                selectedPayments.map(id => paymentAPI.deletePayment(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} payment(s)`);
            } else {
                showError(`Deleted ${successful.length} payment(s), failed to delete ${failed.length} payment(s)`);
            }

            fetchPayments();
            setSelectedPayments([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete payments');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');

            const response = await paymentAPI.exportPaymentsToCSV({
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                workerId: workerFilter || undefined
            });

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                const blob = new Blob([response.data.content], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.fileName || 'payments.csv';
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

    const handleUpdateStatus = async (id: number, currentStatus: string, newStatus: string) => {
        const action = newStatus === 'completed' ? 'complete' :
            newStatus === 'processing' ? 'process' :
                newStatus === 'cancelled' ? 'cancel' : 'update';

        const confirmed = await showConfirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Payment`,
            message: `Are you sure you want to ${action} this payment?`,
            icon: 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing payment...`, 'info');
            const response = await paymentAPI.updatePaymentStatus(id, { status: newStatus });

            if (response.status) {
                showSuccess(`Payment ${action}ed successfully`);
                fetchPayments();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || `Failed to ${action} payment`);
        }
    };

    const handleProcessPayment = async (id: number) => {
        try {
            showToast('Processing payment...', 'info');
            const response = await paymentAPI.processPayment(id);

            if (response.status) {
                showSuccess('Payment processed successfully');
                fetchPayments();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to process payment');
        }
    };

    const handleCancelPayment = async (id: number) => {
        const confirmed = await showConfirm({
            title: 'Cancel Payment',
            message: 'Are you sure you want to cancel this payment?',
            icon: 'warning',
            confirmText: 'Cancel Payment',
            cancelText: 'Keep Active'
        });

        if (!confirmed) return;

        try {
            showToast('Cancelling payment...', 'info');
            const response = await paymentAPI.cancelPayment(id, 'Cancelled by user');

            if (response.status) {
                showSuccess('Payment cancelled successfully');
                fetchPayments();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to cancel payment');
        }
    };

    const handleGeneratePaymentSlip = async (id: number) => {
        try {
            showToast('Generating payment slip...', 'info');
            const response = await paymentAPI.exportPaymentSlip(id);

            if (response.status) {
                // Create download link for PDF
                const link = document.createElement('a');
                const blob = new Blob([response.data.content], { type: response.data.contentType });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.fileName || `payment-slip-${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess('Payment slip generated successfully');
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to generate payment slip');
        }
    };

    // Toggle payment expansion
    const toggleExpandPayment = (id: number) => {
        setExpandedPayment(prev => prev === id ? null : id);
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
            processing: {
                text: 'Processing',
                bg: 'var(--status-irrigation-bg)',
                color: 'var(--status-irrigation)',
                border: 'rgba(49, 130, 206, 0.3)',
                icon: RefreshCw
            },
            completed: {
                text: 'Completed',
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
            partially_paid: {
                text: 'Partially Paid',
                bg: 'rgba(168, 85, 247, 0.1)',
                color: 'rgb(126, 34, 206)',
                border: 'rgba(168, 85, 247, 0.2)',
                icon: Percent
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

    // Get payment method badge
    const getPaymentMethodBadge = (method: string | null) => {
        const methodConfig: Record<string, any> = {
            cash: {
                text: 'Cash',
                bg: 'rgba(34, 197, 94, 0.1)',
                color: 'rgb(21, 128, 61)',
                icon: Banknote
            },
            bank: {
                text: 'Bank Transfer',
                bg: 'rgba(59, 130, 246, 0.1)',
                color: 'rgb(29, 78, 216)',
                icon: CreditCard
            },
            check: {
                text: 'Check',
                bg: 'rgba(245, 158, 11, 0.1)',
                color: 'rgb(180, 83, 9)',
                icon: FileText
            },
            digital: {
                text: 'Digital',
                bg: 'rgba(139, 92, 246, 0.1)',
                color: 'rgb(109, 40, 217)',
                icon: Receipt
            }
        };

        const config = method && methodConfig[method] ? methodConfig[method] : {
            text: method || 'Not Specified',
            bg: 'var(--border-light)',
            color: 'var(--text-tertiary)',
            icon: DollarSign
        };
        const Icon = config.icon;

        return (
            <span
                className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
                style={{
                    background: config.bg,
                    color: config.color
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
        setPaymentMethodFilter('all');
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
                        Loading payments...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !payments.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Payment Data
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
                        Payment Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage worker payments, track deductions, and monitor payment status
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
                        onClick={handleCreatePayment}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Payment
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
                            <DollarSign className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
                        {formatCurrency(summary?.totalNet || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Net Paid</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <TrendingUp className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Gross
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(summary?.totalGross || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Gross Pay</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <TrendingDown className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-gold-light)',
                                color: 'var(--accent-gold)'
                            }}
                        >
                            Deductions
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(summary?.totalDebtDeductions || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Deductions</p>
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
                                background: 'var(--accent-purple-light)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            Average
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(stats?.averagePayment || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Average Payment</p>
                </div>
            </div>

            {/* Status Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <RefreshCw className="w-5 h-5" style={{ color: 'var(--status-irrigation)' }} />
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Processing</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--status-irrigation)' }}>
                            {stats?.processingCount || 0}
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
                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Completed</span>
                        </div>
                        <span className="text-2xl font-bold" style={{ color: 'var(--status-planted)' }}>
                            {stats?.completedCount || 0}
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
                                placeholder="Search payments..."
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
                            {['all', 'pending', 'processing', 'completed', 'cancelled', 'partially_paid'].map((status) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
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
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Payment Method
                        </label>
                        <select
                            value={paymentMethodFilter}
                            onChange={(e) => handlePaymentMethodFilterChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="all">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank">Bank Transfer</option>
                            <option value="check">Check</option>
                            <option value="digital">Digital</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedPayments.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedPayments.length} payment(s) selected
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
                            onClick={() => setSelectedPayments([])}
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
                                            checked={selectedPayments.length === payments.length && payments.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('paymentDate')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Date
                                            {sortBy === 'paymentDate' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Worker
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('grossPay')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Gross Pay
                                            {sortBy === 'grossPay' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('netPay')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Net Pay
                                            {sortBy === 'netPay' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Deductions
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Method
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
                                {payments.map((payment) => (
                                    <React.Fragment key={payment.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPayments.includes(payment.id)}
                                                    onChange={() => toggleSelectPayment(payment.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {payment.paymentDate ? formatDate(payment.paymentDate, 'MMM dd, yyyy') : 'Not Paid'}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {payment.id}
                                                        </div>
                                                        {payment.periodStart && payment.periodEnd && (
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                Period: {formatDate(payment.periodStart, 'MMM dd')} - {formatDate(payment.periodEnd, 'MMM dd')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {payment.worker ? (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                        <div>
                                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {payment.worker.name}
                                                            </div>
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                Worker ID: {payment.worker.id}
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
                                                        {formatCurrency(payment.grossPay)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="w-4 h-4" style={{ color: 'var(--accent-green-dark)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {formatCurrency(payment.netPay)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        Debt: {formatCurrency(payment.totalDebtDeduction)}
                                                    </div>
                                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        Manual: {formatCurrency(payment.manualDeduction)}
                                                    </div>
                                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        Other: {formatCurrency(payment.otherDeductions || 0)}
                                                    </div>
                                                    <div className="text-xs font-semibold mt-1" style={{ color: 'var(--accent-rust)' }}>
                                                        Total: {formatCurrency(payment.totalDebtDeduction + payment.manualDeduction + (payment.otherDeductions || 0))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getPaymentMethodBadge(payment.paymentMethod)}
                                                {payment.referenceNumber && (
                                                    <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                                        Ref: {payment.referenceNumber}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(payment.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewPayment(payment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditPayment(payment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    {payment.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleProcessPayment(payment.id)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Process Payment"
                                                        >
                                                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        </button>
                                                    )}
                                                    {payment.status === 'pending' || payment.status === 'processing' ? (
                                                        <button
                                                            onClick={() => handleCancelPayment(payment.id)}
                                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                            title="Cancel Payment"
                                                        >
                                                            <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                        </button>
                                                    ) : null}
                                                    <button
                                                        onClick={() => handleGeneratePaymentSlip(payment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Generate Payment Slip"
                                                    >
                                                        <FileText className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePayment(payment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandPayment(payment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedPayment === payment.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedPayment === payment.id && (
                                            <tr>
                                                <td colSpan={9} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Payment Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(payment.createdAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(payment.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Reference:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {payment.referenceNumber || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                {payment.notes && (
                                                                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                                                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                                                                            {payment.notes}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Worker Information
                                                                </span>
                                                            </div>
                                                            {payment.worker && (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {payment.worker.name}
                                                                        </span>
                                                                    </div>
                                                                    {payment.worker.contact && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contact:</span>
                                                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                {payment.worker.contact}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Debt:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {formatCurrency(payment.worker.totalDebt || 0)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Balance:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {formatCurrency(payment.worker.currentBalance || 0)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Payment Breakdown
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gross Pay:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(payment.grossPay)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manual Deduction:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(payment.manualDeduction)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Debt Deduction:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(payment.totalDebtDeduction)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Other Deductions:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatCurrency(payment.otherDeductions || 0)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Net Pay:</span>
                                                                    <span className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>
                                                                        {formatCurrency(payment.netPay)}
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
                    {payments.map((payment) => (
                        <div
                            key={payment.id}
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
                                    checked={selectedPayments.includes(payment.id)}
                                    onChange={() => toggleSelectPayment(payment.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                    <DollarSign className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        Payment #{payment.id}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {payment.paymentDate ? formatDate(payment.paymentDate, 'MMM dd, yyyy') : 'Not Paid'}
                                        </span>
                                    </div>
                                    {getStatusBadge(payment.status)}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {payment.worker?.name || 'No worker assigned'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {formatCurrency(payment.netPay)}
                                        </div>
                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Net Pay
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Gross Pay
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(payment.grossPay)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Deductions
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--accent-rust)' }}>
                                        {formatCurrency(payment.manualDeduction + payment.totalDebtDeduction + (payment.otherDeductions || 0))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Method
                                    </div>
                                    <div>
                                        {getPaymentMethodBadge(payment.paymentMethod)}
                                    </div>
                                </div>
                            </div>

                            {/* Notes preview */}
                            {payment.notes && (
                                <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {payment.notes.length > 100 ? `${payment.notes.substring(0, 100)}...` : payment.notes}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Created {formatDate(payment.createdAt, 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewPayment(payment.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditPayment(payment.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    {payment.status === 'pending' && (
                                        <button
                                            onClick={() => handleProcessPayment(payment.id)}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title="Process"
                                        >
                                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleGeneratePaymentSlip(payment.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Slip"
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
            {payments.length === 0 && !loading && (
                <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Payments Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No payments have been created yet. Get started by creating your first payment.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreatePayment}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Payment
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {payments.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} payments
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

export default PaymentTablePage;