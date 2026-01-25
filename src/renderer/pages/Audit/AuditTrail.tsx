// components/Audit/AuditTrailTablePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Download,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    ChevronRight as ChevronRightIcon, Users,
    Activity,
    Shield,
    FileText,
    AlertCircle,
    Filter,
    List,
    Grid,
    Eye,
    Trash2,
    Archive,
    BarChart3,
    Clock,
    UserCheck,
    AlertTriangle,
    Database,
    HardDrive, History
} from 'lucide-react';
import type { AuditTrailListData, AuditTrailRecord, AuditTrailStatsData, FilterParams } from '../../apis/audit';
import auditAPI from '../../apis/audit';
import { showError, showSuccess, showToast } from '../../utils/notification';
import { showConfirm } from '../../utils/dialogs';
import { formatDate, formatNumber } from '../../utils/formatters';


const AuditTrailTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [auditTrails, setAuditTrails] = useState<AuditTrailRecord[]>([]);
    const [stats, setStats] = useState<AuditTrailStatsData | null>(null);
    const [summary, setSummary] = useState<any>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [actorFilter, setActorFilter] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [severityFilter, setSeverityFilter] = useState<string>('all');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedTrails, setSelectedTrails] = useState<number[]>([]);
    const [expandedTrail, setExpandedTrail] = useState<number | null>(null);
    const [availableActions, setAvailableActions] = useState<string[]>([]);
    const [availableActors, setAvailableActors] = useState<string[]>([]);

    // Maintenance actions
    const [showCleanupDialog, setShowCleanupDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);
    const [daysToKeep, setDaysToKeep] = useState(90);
    const [archiveMonthsOld, setArchiveMonthsOld] = useState(12);

    // Fetch audit trails data
    const fetchAuditTrails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: FilterParams = {
                action: actionFilter !== 'all' ? actionFilter : undefined,
                actor: actorFilter || undefined,
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                page: currentPage,
                limit,
                sortBy,
                sortOrder: sortOrder === 'asc' ? 'ASC' : 'DESC' as 'ASC' | 'DESC'
            };

            let response;
            if (searchQuery.trim()) {
                response = await auditAPI.searchAuditTrails({
                    query: searchQuery,
                    page: currentPage,
                    limit,
                    sortBy,
                    sortOrder: sortOrder === 'asc' ? 'ASC' : 'DESC'
                });
            } else {
                response = await auditAPI.filterAuditTrails(filters);
            }

            if (response.status) {
                const data = response.data as AuditTrailListData;
                setAuditTrails(data.auditTrails);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.total);

                // Update stats and get available filters
                await Promise.all([fetchStats(), fetchSummary(), fetchAvailableFilters()]);
            } else {
                throw new Error(response.message || 'Failed to fetch audit trails');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch audit trails:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, actionFilter, actorFilter, dateFrom, dateTo, sortBy, sortOrder]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await auditAPI.getAuditTrailStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch audit stats:', err);
        }
    };

    // Fetch summary
    const fetchSummary = async () => {
        try {
            const response = await auditAPI.getAuditTrailSummary({ days: 30 });
            if (response.status) {
                setSummary(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch audit summary:', err);
        }
    };

    // Fetch available filters (actions and actors)
    const fetchAvailableFilters = async () => {
        try {
            const [actionsRes, actorsRes] = await Promise.all([
                auditAPI.getActionsList({ limit: 50 }),
                auditAPI.getActorsList({ limit: 50 })
            ]);

            if (actionsRes.status) {
                setAvailableActions(actionsRes.data.actions.map((a: any) => a.action));
            }
            if (actorsRes.status) {
                setAvailableActors(actorsRes.data.actors.map((a: any) => a.actor));
            }
        } catch (err) {
            console.error('Failed to fetch filter options:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchAuditTrails();
    }, [fetchAuditTrails]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAuditTrails();
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchAuditTrails();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchAuditTrails]);

    // Handle action filter change
    const handleActionFilterChange = (action: string) => {
        setActionFilter(action);
        setCurrentPage(1);
    };

    // Handle severity filter change
    const handleSeverityFilterChange = (severity: string) => {
        setSeverityFilter(severity);
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
        if (selectedTrails.length === auditTrails.length) {
            setSelectedTrails([]);
        } else {
            setSelectedTrails(auditTrails.map(a => a.id));
        }
    };

    const toggleSelectTrail = (id: number) => {
        setSelectedTrails(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewDetails = (id: number) => {
        navigate(`/audit/view/${id}`);
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting audit trails to CSV...', 'info');

            const response = await auditAPI.exportAuditTrailsToCSV({
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                filters: {
                    action: actionFilter !== 'all' ? actionFilter : undefined,
                    actor: actorFilter || undefined
                }
            });

            if (response.status) {
                // Create download link
                const link = document.createElement('a');
                const blob = new Blob([response.data.downloadUrl], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess(`Exported ${response.data.recordCount} records to CSV`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export to CSV');
        }
    };

    const handleExportJSON = async () => {
        try {
            showToast('Exporting audit trails to JSON...', 'info');

            const response = await auditAPI.exportAuditTrailsToJSON({
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                filters: {
                    action: actionFilter !== 'all' ? actionFilter : undefined,
                    actor: actorFilter || undefined
                },
                format: 'pretty'
            });

            if (response.status) {
                const link = document.createElement('a');
                const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = response.data.filename || 'audit-trails.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                showSuccess(`Exported ${response.data.recordCount} records to JSON`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to export to JSON');
        }
    };

    const handleGenerateReport = async (reportType: string) => {
        try {
            showToast(`Generating ${reportType} report...`, 'info');

            const response = await auditAPI.generateAuditReport({
                reportType: reportType as any,
                startDate: dateFrom || undefined,
                endDate: dateTo || undefined,
                format: 'pdf'
            });

            if (response.status) {
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = response.data.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                showSuccess(`Report generated: ${response.data.fileName}`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to generate report');
        }
    };

    const handleCleanupOldTrails = async () => {
        const confirmed = await showConfirm({
            title: 'Cleanup Old Audit Trails',
            message: `This will delete audit trails older than ${daysToKeep} days. This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Cleanup',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Cleaning up old audit trails...', 'info');
            const response = await auditAPI.cleanupOldAuditTrails({
                daysToKeep,
                dryRun: false
            });

            if (response.status) {
                showSuccess(`Cleaned up ${response.data.actuallyDeleted} old records`);
                fetchAuditTrails();
                setShowCleanupDialog(false);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to cleanup old trails');
        }
    };

    const handleArchiveTrails = async () => {
        const confirmed = await showConfirm({
            title: 'Archive Audit Trails',
            message: `This will archive audit trails older than ${archiveMonthsOld} months and remove them from the active database.`,
            icon: 'warning',
            confirmText: 'Archive',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Archiving audit trails...', 'info');
            const response = await auditAPI.archiveAuditTrails({
                monthsOld: archiveMonthsOld,
                archiveFormat: 'zip',
                compress: true
            });

            if (response.status) {
                showSuccess(`Archived ${response.data.recordsArchived} records to ${response.data.archiveFilename}`);
                fetchAuditTrails();
                setShowArchiveDialog(false);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to archive trails');
        }
    };

    const handleCompactTrails = async () => {
        const confirmed = await showConfirm({
            title: 'Compact Audit Trails',
            message: 'This will summarize and compress older audit trail entries to save space while preserving statistics.',
            icon: 'warning',
            confirmText: 'Compact',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Compacting audit trails...', 'info');
            const response = await auditAPI.compactAuditTrails({
                monthsOld: 6,
                compactMethod: 'summarize',
                sampleRate: 0.1
            });

            if (response.status) {
                showSuccess(`Compacted ${response.data.originalCount} records to ${response.data.compactedCount} (saved ${response.data.spaceSavedPercentage} space)`);
                fetchAuditTrails();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to compact trails');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTrails.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedTrails.length} selected audit trail(s)? This action is irreversible.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected audit trails...', 'info');
            // Note: Bulk delete would need to be implemented in backend
            showError('Bulk delete functionality not yet implemented');
            // For now, just clear selection
            setSelectedTrails([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete audit trails');
        }
    };

    // Toggle trail expansion
    const toggleExpandTrail = (id: number) => {
        setExpandedTrail(prev => prev === id ? null : id);
    };

    // Get severity badge
    const getSeverityBadge = (action: string) => {
        const severityConfig: Record<string, {
            text: string;
            bg: string;
            color: string;
            border: string;
            icon: any;
        }> = {
            'error': {
                text: 'Error',
                bg: 'var(--crop-diseased-bg)',
                color: 'var(--crop-diseased)',
                border: 'rgba(197, 48, 48, 0.3)',
                icon: AlertCircle
            },
            'warning': {
                text: 'Warning',
                bg: 'var(--crop-stressed-bg)',
                color: 'var(--crop-stressed)',
                border: 'rgba(214, 158, 46, 0.3)',
                icon: AlertTriangle
            },
            'security': {
                text: 'Security',
                bg: 'var(--accent-purple-light)',
                color: 'var(--accent-purple)',
                border: 'rgba(128, 90, 213, 0.3)',
                icon: Shield
            },
            'login': {
                text: 'Authentication',
                bg: 'var(--accent-sky-light)',
                color: 'var(--accent-sky)',
                border: 'rgba(49, 130, 206, 0.3)',
                icon: UserCheck
            },
            'system': {
                text: 'System',
                bg: 'var(--accent-earth-light)',
                color: 'var(--accent-earth)',
                border: 'rgba(212, 165, 116, 0.3)',
                icon: HardDrive
            },
            'data': {
                text: 'Data',
                bg: 'var(--accent-green-light)',
                color: 'var(--accent-green)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: Database
            }
        };

        // Determine severity based on action
        let severity = 'system';
        const actionLower = action.toLowerCase();

        if (actionLower.includes('error') || actionLower.includes('fail') || actionLower.includes('exception')) {
            severity = 'error';
        } else if (actionLower.includes('warn') || actionLower.includes('alert')) {
            severity = 'warning';
        } else if (actionLower.includes('login') || actionLower.includes('logout') || actionLower.includes('auth')) {
            severity = 'login';
        } else if (actionLower.includes('security') || actionLower.includes('breach') || actionLower.includes('access')) {
            severity = 'security';
        } else if (actionLower.includes('create') || actionLower.includes('update') || actionLower.includes('delete')) {
            severity = 'data';
        }

        const config = severityConfig[severity] || severityConfig.system;
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

    // Get action category badge
    const getActionBadge = (action: string) => {
        const actionConfig: Record<string, {
            text: string;
            bg: string;
            color: string;
            border: string;
        }> = {
            'user_created': { text: 'User Created', bg: 'rgba(34, 197, 94, 0.1)', color: 'rgb(21, 128, 61)', border: 'rgba(34, 197, 94, 0.2)' },
            'user_updated': { text: 'User Updated', bg: 'rgba(59, 130, 246, 0.1)', color: 'rgb(29, 78, 216)', border: 'rgba(59, 130, 246, 0.2)' },
            'user_deleted': { text: 'User Deleted', bg: 'rgba(239, 68, 68, 0.1)', color: 'rgb(185, 28, 28)', border: 'rgba(239, 68, 68, 0.2)' },
            'login_success': { text: 'Login Success', bg: 'rgba(34, 197, 94, 0.1)', color: 'rgb(21, 128, 61)', border: 'rgba(34, 197, 94, 0.2)' },
            'login_failed': { text: 'Login Failed', bg: 'rgba(245, 158, 11, 0.1)', color: 'rgb(180, 83, 9)', border: 'rgba(245, 158, 11, 0.2)' },
            'data_export': { text: 'Data Export', bg: 'rgba(168, 85, 247, 0.1)', color: 'rgb(126, 34, 206)', border: 'rgba(168, 85, 247, 0.2)' },
            'system_startup': { text: 'System Startup', bg: 'rgba(6, 182, 212, 0.1)', color: 'rgb(8, 145, 178)', border: 'rgba(6, 182, 212, 0.2)' },
            'system_shutdown': { text: 'System Shutdown', bg: 'rgba(107, 114, 128, 0.1)', color: 'rgb(75, 85, 99)', border: 'rgba(107, 114, 128, 0.2)' },
        };

        const config = actionConfig[action] || {
            text: action,
            bg: 'var(--card-secondary-bg)',
            color: 'var(--text-secondary)',
            border: 'var(--border-color)'
        };

        return (
            <span
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                    background: config.bg,
                    color: config.color,
                    border: `1px solid ${config.border}`
                }}
            >
                {config.text}
            </span>
        );
    };

    // Clear filters
    const clearFilters = () => {
        setActionFilter('all');
        setActorFilter('');
        setDateFrom('');
        setDateTo('');
        setSearchQuery('');
        setSeverityFilter('all');
        setCurrentPage(1);
    };

    // Format details for display
    const formatDetails = (details: any) => {
        if (!details) return 'No details';

        if (typeof details === 'string') {
            try {
                const parsed = JSON.parse(details);
                return JSON.stringify(parsed, null, 2);
            } catch {
                return details;
            }
        }

        if (typeof details === 'object') {
            return JSON.stringify(details, null, 2);
        }

        return String(details);
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
                        Loading audit trails...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !auditTrails.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading Audit Trail Data
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
                        <History className="w-6 h-6" />
                        Audit Trail
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Monitor and review system activities, user actions, and security events
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => handleGenerateReport('summary')}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--card-secondary-bg)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                    </button>

                    <div className="relative">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                    </div>
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
                            <Database className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
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
                        {formatNumber(stats?.totalCount || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Audit Records</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-sky-light)' }}>
                            <Activity className="w-6 h-6" style={{ color: 'var(--accent-sky)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-sky-light)',
                                color: 'var(--accent-sky)'
                            }}
                        >
                            Today
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(stats?.todayCount || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Today's Activities</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <Users className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-gold-light)',
                                color: 'var(--accent-gold)'
                            }}
                        >
                            Active Users
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(stats?.topActors?.length || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Unique Actors</p>
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
                            Activity
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {formatNumber(summary?.dailyActivity?.[summary.dailyActivity.length - 1]?.count || 0)}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Recent Activities</p>
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
                                placeholder="Search audit trails..."
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

                        {/* Action Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={actionFilter}
                                onChange={(e) => handleActionFilterChange(e.target.value)}
                                className="px-3 py-2 rounded-lg text-sm"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="all">All Actions</option>
                                {availableActions.slice(0, 10).map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                                {availableActions.length > 10 && (
                                    <option value="more">... {availableActions.length - 10} more</option>
                                )}
                            </select>
                        </div>

                        {/* Actor Filter */}
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={actorFilter}
                                onChange={(e) => setActorFilter(e.target.value)}
                                className="px-3 py-2 rounded-lg text-sm"
                                style={{
                                    background: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="">All Actors</option>
                                {availableActors.slice(0, 10).map(actor => (
                                    <option key={actor} value={actor}>{actor}</option>
                                ))}
                                {availableActors.length > 10 && (
                                    <option value="more">... {availableActors.length - 10} more</option>
                                )}
                            </select>
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
                            Severity
                        </label>
                        <select
                            value={severityFilter}
                            onChange={(e) => handleSeverityFilterChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="all">All Severities</option>
                            <option value="error">Errors</option>
                            <option value="warning">Warnings</option>
                            <option value="security">Security</option>
                            <option value="login">Authentication</option>
                            <option value="system">System</option>
                            <option value="data">Data Operations</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Maintenance
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCleanupDialog(true)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md"
                                style={{
                                    background: 'var(--accent-rust-light)',
                                    color: 'var(--accent-rust)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <Trash2 className="w-3 h-3 inline mr-1" />
                                Cleanup
                            </button>
                            <button
                                onClick={() => setShowArchiveDialog(true)}
                                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md"
                                style={{
                                    background: 'var(--accent-sky-light)',
                                    color: 'var(--accent-sky)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <Archive className="w-3 h-3 inline mr-1" />
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedTrails.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedTrails.length} audit trail(s) selected
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
                            onClick={() => setSelectedTrails([])}
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
                                            checked={selectedTrails.length === auditTrails.length && auditTrails.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        <button
                                            onClick={() => handleSort('timestamp')}
                                            className="flex items-center gap-1 hover:text-primary"
                                        >
                                            Timestamp
                                            {sortBy === 'timestamp' && (
                                                <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Action
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actor
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Severity
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Details
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditTrails.map((trail) => (
                                    <React.Fragment key={trail.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTrails.includes(trail.id)}
                                                    onChange={() => toggleSelectTrail(trail.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {formatDate(trail.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {trail.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getActionBadge(trail.action)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {trail.actor}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getSeverityBadge(trail.action)}
                                            </td>
                                            <td className="p-4">
                                                <div className="max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                                    {formatDetails(trail.details).substring(0, 100)}
                                                    {formatDetails(trail.details).length > 100 && '...'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(trail.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandTrail(trail.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedTrail === trail.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedTrail === trail.id && (
                                            <tr>
                                                <td colSpan={7} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FileText className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Audit Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>ID:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {trail.id}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Timestamp:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(trail.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Action:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {trail.action}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Actor:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {trail.actor}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg col-span-2" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Activity className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Event Details
                                                                </span>
                                                            </div>
                                                            <div className="bg-gray-50 p-3 rounded overflow-auto max-h-60">
                                                                <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                                                                    {formatDetails(trail.details)}
                                                                </pre>
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
                    {auditTrails.map((trail) => (
                        <div
                            key={trail.id}
                            className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg relative"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                        <Activity className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                            {getActionBadge(trail.action)}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                {formatDate(trail.timestamp, 'HH:mm:ss')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={selectedTrails.includes(trail.id)}
                                    onChange={() => toggleSelectTrail(trail.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                        {trail.actor}
                                    </span>
                                </div>

                                <div className="mb-2">
                                    {getSeverityBadge(trail.action)}
                                </div>

                                <div className="p-3 rounded text-xs" style={{ background: 'var(--card-secondary-bg)', color: 'var(--text-secondary)' }}>
                                    {formatDetails(trail.details).substring(0, 150)}
                                    {formatDetails(trail.details).length > 150 && '...'}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {formatDate(trail.timestamp, 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewDetails(trail.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {auditTrails.length === 0 && !loading && (
                <div className="text-center py-12">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Audit Trails Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No audit trails found for "${searchQuery}". Try a different search term.`
                            : 'No audit trail records found for the selected filters.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={clearFilters}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {auditTrails.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} audit trails
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

            {/* Cleanup Dialog */}
            {showCleanupDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full" style={{ background: 'var(--card-bg)' }}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Trash2 className="w-5 h-5" />
                            Cleanup Old Audit Trails
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Keep records for (days):
                                </label>
                                <input
                                    type="number"
                                    value={daysToKeep}
                                    onChange={(e) => setDaysToKeep(parseInt(e.target.value) || 90)}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    min="1"
                                    max="3650"
                                />
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                This will permanently delete audit trails older than {daysToKeep} days.
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowCleanupDialog(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                    style={{
                                        background: 'var(--card-secondary-bg)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCleanupOldTrails}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md"
                                    style={{
                                        background: 'var(--accent-rust)',
                                        color: 'white'
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 inline mr-2" />
                                    Cleanup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Archive Dialog */}
            {showArchiveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full" style={{ background: 'var(--card-bg)' }}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Archive className="w-5 h-5" />
                            Archive Audit Trails
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Archive records older than (months):
                                </label>
                                <input
                                    type="number"
                                    value={archiveMonthsOld}
                                    onChange={(e) => setArchiveMonthsOld(parseInt(e.target.value) || 12)}
                                    className="w-full px-3 py-2 rounded-lg text-sm"
                                    style={{
                                        background: 'var(--input-bg)',
                                        border: '1px solid var(--input-border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    min="1"
                                    max="120"
                                />
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Records older than {archiveMonthsOld} months will be archived and removed from the active database.
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowArchiveDialog(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                                    style={{
                                        background: 'var(--card-secondary-bg)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleArchiveTrails}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                                    style={{
                                        background: 'var(--accent-sky)',
                                        color: 'white'
                                    }}
                                >
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTrailTablePage;