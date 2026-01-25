// components/Assignment/AssignmentTablePage.tsx
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
    BarChart3, Filter,
    List,
    Grid
} from 'lucide-react';
import type { Assignment, AssignmentFilters, AssignmentStats } from '../../../apis/assignment';
import assignmentAPI from '../../../apis/assignment';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate, formatNumber } from '../../../utils/formatters';
import PitakSelect from '../../../components/Selects/Pitak';
import WorkerSelect from '../../../components/Selects/Worker';

const AssignmentTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<AssignmentStats | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [workerFilter, setWorkerFilter] = useState<number | null>(null);
    const [pitakFilter, setPitakFilter] = useState<number | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('assignmentDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
    const [expandedAssignment, setExpandedAssignment] = useState<number | null>(null);

    // Fetch assignments data
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

            // If search query exists, use search endpoint
            let response;
            if (searchQuery.trim()) {
                response = await assignmentAPI.searchAssignments(searchQuery);
            } else {
                response = await assignmentAPI.getAllAssignments(filters);
            }

            if (response.status) {
                const data = response.data as Assignment[] || [];
                setAssignments(data as Assignment[]);
                
                // Simple pagination (adjust based on your API)
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
            showError(err.message);
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, statusFilter, workerFilter, pitakFilter, dateFrom, dateTo, sortBy, sortOrder]);

    // Fetch stats
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

    // Initial load
    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAssignments();
    };

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
    }, [searchQuery, fetchAssignments]);

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
        if (selectedAssignments.length === assignments.length) {
            setSelectedAssignments([]);
        } else {
            setSelectedAssignments(assignments.map(a => a.id));
        }
    };

    const toggleSelectAssignment = (id: number) => {
        setSelectedAssignments(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewAssignment = (id: number) => {
        navigate(`/assignment/view/${id}`);
    };

    const handleEditAssignment = (id: number) => {
        navigate(`/assignment/edit/${id}`);
    };

    const handleCreateAssignment = () => {
        navigate('/assignment/create');
    };

    const handleDeleteAssignment = async (id: number) => {
        const assignment = assignments.find(a => a.id === id);
        const confirmed = await showConfirm({
            title: 'Delete Assignment',
            message: `Are you sure you want to delete this assignment?`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting assignment...', 'info');
            const response = await assignmentAPI.deleteAssignment(id);

            if (response.status) {
                showSuccess('Assignment deleted successfully');
                fetchAssignments();
                setSelectedAssignments(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete assignment');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedAssignments.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedAssignments.length} selected assignment(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected assignments...', 'info');
            const results = await Promise.allSettled(
                selectedAssignments.map(id => assignmentAPI.deleteAssignment(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} assignment(s)`);
            } else {
                showError(`Deleted ${successful.length} assignment(s), failed to delete ${failed.length} assignment(s)`);
            }

            fetchAssignments();
            setSelectedAssignments([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete assignments');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');
            const filters: AssignmentFilters = {
                status: statusFilter !== 'all' ? statusFilter as any : undefined,
                workerId: workerFilter || undefined,
                pitakId: pitakFilter || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined
            };
            
            const response = await assignmentAPI.exportAssignmentsToCSV(filters);

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                const blob = new Blob([response.data.fileInfo.csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.fileInfo.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess(`Exported ${response.data.summary.count} records to CSV`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export CSV');
        }
    };

    const handleUpdateStatus = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'completed' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'complete';

        const confirmed = await showConfirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} Assignment`,
            message: `Are you sure you want to ${action} this assignment?`,
            icon: 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing assignment...`, 'info');
            const response = await assignmentAPI.updateAssignmentStatus(id, newStatus as any);

            if (response.status) {
                showSuccess(`Assignment ${action}d successfully`);
                fetchAssignments();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || `Failed to ${action} assignment`);
        }
    };

    const handleCancelAssignment = async (id: number) => {
        const confirmed = await showConfirm({
            title: 'Cancel Assignment',
            message: 'Are you sure you want to cancel this assignment?',
            icon: 'warning',
            confirmText: 'Cancel Assignment',
            cancelText: 'Keep Active'
        });

        if (!confirmed) return;

        try {
            showToast('Cancelling assignment...', 'info');
            const response = await assignmentAPI.cancelAssignment(id, 'Cancelled by user');

            if (response.status) {
                showSuccess('Assignment cancelled successfully');
                fetchAssignments();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to cancel assignment');
        }
    };

    // Toggle assignment expansion
    const toggleExpandAssignment = (id: number) => {
        setExpandedAssignment(prev => prev === id ? null : id);
    };

    // Get status badge
    const getStatusBadge = (status: string = 'active') => {
        const statusConfig = {
            active: {
                text: 'Active',
                bg: 'var(--status-planted-bg)',
                color: 'var(--status-planted)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: AlertCircle
            },
            completed: {
                text: 'Completed',
                bg: 'var(--accent-sky-light)',
                color: 'var(--accent-sky)',
                border: 'rgba(49, 130, 206, 0.3)',
                icon: CheckCircle
            },
            cancelled: {
                text: 'Cancelled',
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

    // Clear filters
    const clearFilters = () => {
        setStatusFilter('all');
        setWorkerFilter(null);
        setPitakFilter(null);
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
                        Loading assignments...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !assignments.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Assignment Data
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
                        <FileText className="w-6 h-6" />
                        Assignment Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage worker assignments, track luwang counts, and monitor assignment status
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
                        onClick={handleCreateAssignment}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Assignment
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
                            <FileText className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
                        {stats?.totalAssignments || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Assignments</p>
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
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Active
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.byStatus?.active?.count || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Assignments</p>
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
                                background: 'var(--accent-gold-light)',
                                color: 'var(--accent-gold)'
                            }}
                        >
                            LuWang
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.totalLuWang || '0'}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total LuWang Assigned</p>
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
                        {stats?.averages?.luwangPerAssignment || '0'}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>LuWang per Assignment</p>
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
                                placeholder="Search assignments..."
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
                            {['all', 'active', 'completed', 'cancelled'].map((status) => (
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
                            Pitak
                        </label>
                        <PitakSelect
                            value={pitakFilter}
                            onChange={(id) => setPitakFilter(id)}
                            placeholder="Filter by pitak"
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
            {selectedAssignments.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedAssignments.length} assignment(s) selected
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
                            onClick={() => setSelectedAssignments([])}
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
                                            checked={selectedAssignments.length === assignments.length && assignments.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('assignmentDate')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Date
                                            {sortBy === 'assignmentDate' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Worker
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Pitak
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('luwangCount')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            LuWang
                                            {sortBy === 'luwangCount' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
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
                                {assignments.map((assignment) => (
                                    <React.Fragment key={assignment.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssignments.includes(assignment.id)}
                                                    onChange={() => toggleSelectAssignment(assignment.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {formatDate(assignment.assignmentDate, 'MMM dd, yyyy')}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {assignment.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {assignment.worker ? (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                        <div>
                                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {assignment.worker.name}
                                                            </div>
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                {assignment.worker.code}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No worker</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {assignment.pitak ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                        <div>
                                                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                {assignment.pitak.name || `Pitak #${assignment.pitak.id}`}
                                                            </div>
                                                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                                {assignment.pitak.code}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">No pitak</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {formatNumber(assignment.luwangCount)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(assignment.status)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewAssignment(assignment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditAssignment(assignment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    {assignment.status === 'active' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateStatus(assignment.id, assignment.status)}
                                                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                                title="Mark as Completed"
                                                            >
                                                                <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelAssignment(assignment.id)}
                                                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                                title="Cancel Assignment"
                                                            >
                                                                <XCircle className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandAssignment(assignment.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedAssignment === assignment.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedAssignment === assignment.id && (
                                            <tr>
                                                <td colSpan={7} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Assignment Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(assignment.createdAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(assignment.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                {assignment.notes && (
                                                                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                                                                        <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                                                                            {assignment.notes}
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
                                                            {assignment.worker && (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {assignment.worker.name}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Code:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {assignment.worker.code}
                                                                        </span>
                                                                    </div>
                                                                    {assignment.worker.contactNumber && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contact:</span>
                                                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                {assignment.worker.contactNumber}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <MapPin className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Pitak Information
                                                                </span>
                                                            </div>
                                                            {assignment.pitak && (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {assignment.pitak.name || `Pitak #${assignment.pitak.id}`}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Code:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {assignment.pitak.code}
                                                                        </span>
                                                                    </div>
                                                                    {assignment.pitak.location && (
                                                                        <div className="flex justify-between">
                                                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Location:</span>
                                                                            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                                {assignment.pitak.location}
                                                                            </span>
                                                                        </div>
                                                                    )}
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
                    {assignments.map((assignment) => (
                        <div
                            key={assignment.id}
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
                                    checked={selectedAssignments.includes(assignment.id)}
                                    onChange={() => toggleSelectAssignment(assignment.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                    <Calendar className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        Assignment #{assignment.id}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {formatDate(assignment.assignmentDate, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    {getStatusBadge(assignment.status)}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {assignment.worker?.name || 'No worker assigned'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {assignment.pitak?.name || 'No pitak assigned'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {formatNumber(assignment.luwangCount)} LuWang
                                    </span>
                                </div>
                            </div>

                            {/* Notes preview */}
                            {assignment.notes && (
                                <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {assignment.notes.length > 100 ? `${assignment.notes.substring(0, 100)}...` : assignment.notes}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Created {formatDate(assignment.createdAt, 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewAssignment(assignment.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditAssignment(assignment.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    {assignment.status === 'active' && (
                                        <button
                                            onClick={() => handleUpdateStatus(assignment.id, assignment.status)}
                                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                            title="Complete"
                                        >
                                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {assignments.length === 0 && !loading && (
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Assignments Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No assignments have been created yet. Get started by creating your first assignment.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreateAssignment}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Assignment
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {assignments.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} assignments
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

export default AssignmentTablePage;