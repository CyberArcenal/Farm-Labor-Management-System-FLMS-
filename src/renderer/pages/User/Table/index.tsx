// components/User/UserTablePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Edit,
    Trash2,
    Eye,
    Download,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Calendar,
    Users,
    UserCheck,
    Mail,
    Phone, Clock,
    CheckCircle,
    XCircle,
    AlertCircle, Filter,
    List,
    Grid,
    Shield,
    ShieldAlert,
    ShieldCheck,
    UserX,
    UserPlus,
    Key,
    Activity
} from 'lucide-react';
import type { UserData, UserStatsData, UserPaginationData } from '../../../apis/user';
import userAPI from '../../../apis/user';
import { showError, showSuccess, showToast } from '../../../utils/notification';
import { showConfirm } from '../../../utils/dialogs';
import { formatDate } from '../../../utils/formatters';

interface UserFilters {
    role?: string;
    isActive?: boolean;
    dateFrom?: string;
    dateTo?: string;
    searchQuery?: string;
}

const UserTablePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [users, setUsers] = useState<UserData[]>([]);
    const [stats, setStats] = useState<UserStatsData | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [limit] = useState(20);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // View options
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);

    // Fetch users data
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const filters = {
                role: roleFilter !== 'all' ? roleFilter : undefined,
                isActive: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined
            };

            // If search query exists, use search endpoint
            let response;
            if (searchQuery.trim()) {
                response = await userAPI.searchUsers(
                    searchQuery,
                    currentPage,
                    limit,
                    roleFilter !== 'all' ? roleFilter : undefined,
                    statusFilter !== 'all' ? statusFilter === 'active' : undefined
                );
            } else {
                response = await userAPI.getAllUsers(
                    currentPage,
                    limit,
                    sortBy,
                    sortOrder === 'asc' ? 'ASC' : 'DESC',
                    statusFilter === 'inactive'
                );
            }

            if (response.status) {
                const data = response.data as UserPaginationData;
                setUsers(data.users);
                setTotalPages(data.pagination.totalPages);
                setTotalItems(data.pagination.total);

                // Update stats
                await fetchStats();
            } else {
                throw new Error(response.message || 'Failed to fetch users');
            }

        } catch (err: any) {
            setError(err.message);
            showError(err.message);
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentPage, limit, searchQuery, roleFilter, statusFilter, dateFrom, dateTo, sortBy, sortOrder]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await userAPI.getUserStats();
            if (response.status) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch user stats:', err);
        }
    };

    // Initial load
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Refresh function
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
    };

    // Search handler with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchUsers();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, fetchUsers]);

    // Handle role filter change
    const handleRoleFilterChange = (role: string) => {
        setRoleFilter(role);
        setCurrentPage(1);
    };

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
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map(u => u.id));
        }
    };

    const toggleSelectUser = (id: number) => {
        setSelectedUsers(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    // Action handlers
    const handleViewUser = (id: number) => {
        navigate(`/user/view/${id}`);
    };

    const handleEditUser = (id: number) => {
        navigate(`/user/edit/${id}`);
    };

    const handleCreateUser = () => {
        navigate('/user/create');
    };

    const handleDeleteUser = async (id: number) => {
        const user = users.find(u => u.id === id);
        const confirmed = await showConfirm({
            title: 'Delete User',
            message: `Are you sure you want to delete user "${user?.username}"? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting user...', 'info');
            const response = await userAPI.deleteUser(id);

            if (response.status) {
                showSuccess('User deleted successfully');
                fetchUsers();
                setSelectedUsers(prev => prev.filter(item => item !== id));
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete user');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedUsers.length} selected user(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected users...', 'info');
            const results = await Promise.allSettled(
                selectedUsers.map(id => userAPI.deleteUser(id))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} user(s)`);
            } else {
                showError(`Deleted ${successful.length} user(s), failed to delete ${failed.length} user(s)`);
            }

            fetchUsers();
            setSelectedUsers([]);
        } catch (err: any) {
            showError(err.message || 'Failed to delete users');
        }
    };

    const handleExportCSV = async () => {
        try {
            showToast('Exporting to CSV...', 'info');

            const response = await userAPI.exportUsersToCSV(
                statusFilter === 'inactive',
                roleFilter !== 'all' ? [roleFilter] : [],
                dateFrom || undefined,
                dateTo || undefined
            );

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

    const handleUpdateStatus = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const action = newStatus ? 'activate' : 'deactivate';

        const confirmed = await showConfirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
            message: `Are you sure you want to ${action} this user?`,
            icon: 'warning',
            confirmText: action.charAt(0).toUpperCase() + action.slice(1),
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing user...`, 'info');
            const response = await userAPI.updateUserStatus(id, newStatus);

            if (response.status) {
                showSuccess(`User ${action}d successfully`);
                fetchUsers();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || `Failed to ${action} user`);
        }
    };

    const handleUpdateRole = async (id: number, currentRole: string) => {
        const roles = ['admin', 'manager', 'user'];
        const currentIndex = roles.indexOf(currentRole);
        const newRole = roles[(currentIndex + 1) % roles.length];

        const confirmed = await showConfirm({
            title: 'Change User Role',
            message: `Change user role from ${currentRole} to ${newRole}?`,
            icon: 'warning',
            confirmText: 'Change Role',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Updating user role...', 'info');
            const response = await userAPI.updateUserRole(id, newRole as any);

            if (response.status) {
                showSuccess(`User role updated to ${newRole}`);
                fetchUsers();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to update user role');
        }
    };

    const handleResetPassword = async (id: number, username: string) => {
        const confirmed = await showConfirm({
            title: 'Reset Password',
            message: `Reset password for user "${username}"? A temporary password will be generated.`,
            icon: 'warning',
            confirmText: 'Reset Password',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Resetting password...', 'info');
            const newPassword = Math.random().toString(36).slice(-8);
            const response = await userAPI.changePassword(id, newPassword, newPassword);

            if (response.status) {
                showSuccess(`Password reset successful. New password: ${newPassword}`);
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to reset password');
        }
    };

    // Toggle user expansion
    const toggleExpandUser = (id: number) => {
        setExpandedUser(prev => prev === id ? null : id);
    };

    // Get role badge
    const getRoleBadge = (role: string = 'user') => {
        const roleConfig = {
            admin: {
                text: 'Admin',
                bg: 'var(--status-harvested-bg)',
                color: 'var(--status-harvested)',
                border: 'rgba(128, 90, 213, 0.3)',
                icon: Shield
            },
            manager: {
                text: 'Manager',
                bg: 'var(--status-growing-bg)',
                color: 'var(--status-growing)',
                border: 'rgba(214, 158, 46, 0.3)',
                icon: ShieldAlert
            },
            user: {
                text: 'User',
                bg: 'var(--status-planted-bg)',
                color: 'var(--status-planted)',
                border: 'rgba(56, 161, 105, 0.3)',
                icon: ShieldCheck
            }
        };

        const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
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

    // Get status badge
    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 status-badge-active">
                <CheckCircle className="w-3 h-3" />
                Active
            </span>
        ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 status-badge-inactive">
                <XCircle className="w-3 h-3" />
                Inactive
            </span>
        );
    };

    // Clear filters
    const clearFilters = () => {
        setRoleFilter('all');
        setStatusFilter('all');
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
                        Loading users...
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !users.length) {
        return (
            <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--danger-color)' }} />
                <p className="text-base font-semibold mb-1" style={{ color: 'var(--danger-color)' }}>
                    Error Loading User Data
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
                        User Management
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Manage system users, roles, permissions, and access control
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
                        onClick={handleCreateUser}
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center"
                        style={{
                            background: 'var(--primary-color)',
                            color: 'var(--sidebar-text)'
                        }}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        New User
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
                        {stats?.totalUsers || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Total Users</p>
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
                            Active
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.activeUsers || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Active Users</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-earth-light)' }}>
                            <Shield className="w-6 h-6" style={{ color: 'var(--accent-earth)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-gold-light)',
                                color: 'var(--accent-gold)'
                            }}
                        >
                            Admins
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.usersByRole?.find(r => r.role === 'admin')?.count || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Administrators</p>
                </div>

                <div className="p-5 rounded-xl transition-all duration-300 hover:shadow-lg"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--accent-gold-light)' }}>
                            <Activity className="w-6 h-6" style={{ color: 'var(--accent-gold)' }} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                                background: 'var(--accent-purple-light)',
                                color: 'var(--accent-purple)'
                            }}
                        >
                            Recent
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                        {stats?.recentRegistrations || 0}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Recent Registrations</p>
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
                                placeholder="Search users..."
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

                        {/* Role Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'admin', 'manager', 'user'].map((role) => (
                                <button
                                    key={role}
                                    onClick={() => handleRoleFilterChange(role)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${roleFilter === role ? '' : 'opacity-70 hover:opacity-100'}`}
                                    style={{
                                        background: roleFilter === role ? 'var(--primary-color)' : 'var(--card-secondary-bg)',
                                        color: roleFilter === role ? 'var(--sidebar-text)' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
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
            {selectedUsers.length > 0 && (
                <div className="p-4 rounded-xl flex items-center justify-between"
                    style={{
                        background: 'var(--card-hover-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {selectedUsers.length} user(s) selected
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
                            onClick={() => setSelectedUsers([])}
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
                                            checked={selectedUsers.length === users.length && users.length > 0}
                                            onChange={toggleSelectAll}
                                            className="rounded"
                                            style={{ borderColor: 'var(--border-color)' }}
                                        />
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
                                        Username
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Name & Email
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Role
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Last Login
                                    </th>
                                    <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <React.Fragment key={user.id}>
                                        <tr className="hover:bg-gray-50 transition-colors"
                                            style={{ borderBottom: '1px solid var(--border-color)' }}
                                        >
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="rounded"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {formatDate(user.createdAt, 'MMM dd, yyyy')}
                                                        </div>
                                                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            ID: {user.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    <div>
                                                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                            {user.username}
                                                        </div>
                                                        {user.profilePicture && (
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 mt-1"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {user.name || 'No name'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                    {user.contact && (
                                                        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                            <Phone className="w-3 h-3" />
                                                            {user.contact}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(user.isActive)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                        {user.lastLogin ? formatDate(user.lastLogin, 'MMM dd, yyyy HH:mm') : 'Never'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewUser(user.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditUser(user.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateRole(user.id, user.role)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Change Role"
                                                    >
                                                        <Shield className="w-4 h-4" style={{ color: 'var(--accent-purple)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(user.id, user.username)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        <Key className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(user.id, user.isActive)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title={user.isActive ? "Deactivate" : "Activate"}
                                                    >
                                                        {user.isActive ? (
                                                            <UserX className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                        ) : (
                                                            <UserCheck className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleExpandUser(user.id)}
                                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                                        title="More Details"
                                                    >
                                                        <ChevronRight className={`w-4 h-4 transition-transform ${expandedUser === user.id ? 'rotate-90' : ''}`} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Row */}
                                        {expandedUser === user.id && (
                                            <tr>
                                                <td colSpan={8} className="p-4" style={{ background: 'var(--card-secondary-bg)' }}>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Users className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    User Details
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Created:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(user.createdAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Updated:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {formatDate(user.updatedAt, 'MMM dd, yyyy HH:mm')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>User ID:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {user.id}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Mail className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Contact Information
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Email:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {user.email}
                                                                    </span>
                                                                </div>
                                                                {user.contact && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Contact:</span>
                                                                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                            {user.contact}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {user.address && (
                                                                    <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                                                        <span className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Address:</span>
                                                                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                                                            {user.address}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)' }}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Activity className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                    Activity
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                                                                    {getStatusBadge(user.isActive)}
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Role:</span>
                                                                    {getRoleBadge(user.role)}
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Last Login:</span>
                                                                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                                        {user.lastLogin ? formatDate(user.lastLogin, 'MMM dd, yyyy HH:mm') : 'Never logged in'}
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
                    {users.map((user) => (
                        <div
                            key={user.id}
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
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => toggleSelectUser(user.id)}
                                    className="rounded"
                                    style={{ borderColor: 'var(--border-color)' }}
                                />
                            </div>

                            {/* Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="p-3 rounded-lg" style={{ background: 'var(--accent-green-light)' }}>
                                    <Users className="w-6 h-6" style={{ color: 'var(--accent-green)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                                        {user.username}
                                    </h3>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Joined {formatDate(user.createdAt, 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {getRoleBadge(user.role)}
                                        {getStatusBadge(user.isActive)}
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        {user.email}
                                    </span>
                                </div>
                                {user.name && (
                                    <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4" style={{ color: 'var(--accent-earth)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {user.name}
                                        </span>
                                    </div>
                                )}
                                {user.contact && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {user.contact}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                        Last login: {user.lastLogin ? formatDate(user.lastLogin, 'MMM dd, yyyy') : 'Never'}
                                    </span>
                                </div>
                            </div>

                            {/* Address preview */}
                            {user.address && (
                                <div className="mb-4 p-3 rounded" style={{ background: 'var(--card-secondary-bg)' }}>
                                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                        {user.address.length > 100 ? `${user.address.substring(0, 100)}...` : user.address}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    User ID: {user.id}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleViewUser(user.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" style={{ color: 'var(--accent-sky)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleEditUser(user.id)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" style={{ color: 'var(--accent-gold)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(user.id, user.isActive)}
                                        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                        title={user.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {user.isActive ? (
                                            <UserX className="w-4 h-4" style={{ color: 'var(--accent-rust)' }} />
                                        ) : (
                                            <UserCheck className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {users.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        No Users Found
                    </h3>
                    <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery
                            ? `No results found for "${searchQuery}". Try a different search term.`
                            : 'No users have been created yet. Get started by creating your first user.'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={handleCreateUser}
                            className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center"
                            style={{
                                background: 'var(--primary-color)',
                                color: 'var(--sidebar-text)'
                            }}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create First User
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {users.length > 0 && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl"
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} users
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

export default UserTablePage;