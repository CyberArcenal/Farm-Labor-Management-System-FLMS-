// components/Worker/components/WorkerFilters.tsx
import React, { useState } from 'react';
import { Search, Filter, RefreshCw, List, Grid, ChevronDown, ChevronUp } from 'lucide-react';


interface WorkerFiltersProps {
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    viewMode: 'table' | 'grid';
    setViewMode: (mode: 'table' | 'grid') => void;
    handleRefresh: () => void;
    refreshing: boolean;
    handleStatusFilterChange: (status: string) => void;
    sortBy: string;
    setSortBy: (value: string) => void;
    sortOrder: 'ASC' | 'DESC';
    setSortOrder: (value: 'ASC' | 'DESC') => void;
    setCurrentPage: (page: number) => void;
    showAdvancedFilters: boolean;
    setShowAdvancedFilters: (value: boolean) => void;
}

const WorkerFilters: React.FC<WorkerFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    handleRefresh,
    refreshing,
    handleStatusFilterChange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setCurrentPage,
    showAdvancedFilters,
    setShowAdvancedFilters
}) => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [hasDebtFilter, setHasDebtFilter] = useState<boolean | null>(null);

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setHasDebtFilter(null);
        setCurrentPage(1);
    };

    const handleSortChange = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setCurrentPage(1);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Main Filters */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'active', 'inactive', 'on-leave', 'terminated'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusFilterChange(status)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-gray-300">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Advanced Filters Toggle */}
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                    >
                        <Filter className="w-4 h-4" />
                        {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <div className="pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                Hire Date From
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                Hire Date To
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="name">Name</option>
                                <option value="status">Status</option>
                                <option value="hireDate">Hire Date</option>
                                <option value="currentBalance">Balance</option>
                                <option value="createdAt">Created Date</option>
                            </select>
                        </div>
                    </div>

                    {/* Debt Filter */}
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setHasDebtFilter(hasDebtFilter === true ? null : true)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${hasDebtFilter === true ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Has Debt
                        </button>
                        <button
                            onClick={() => setHasDebtFilter(hasDebtFilter === false ? null : false)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${hasDebtFilter === false ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            No Debt
                        </button>
                    </div>

                    {/* Clear All Filters */}
                    <div className="flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkerFilters;