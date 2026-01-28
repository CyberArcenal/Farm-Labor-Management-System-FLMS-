// components/Bukid/BukidTablePage.tsx
import React, { useState } from 'react';
import { Home, Plus, Download, AlertCircle, RefreshCw } from 'lucide-react';
import BukidStats from './components/BukidStats';
import BukidFilters from './components/BukidFilters';
import BukidBulkActions from './components/BukidBulkActions';
import BukidTableView from './components/BukidTableView';
import BukidGridView from './components/BukidGridView';
import BukidPagination from './components/BukidPagination';
import { useBukidData } from './hooks/useBukidData';
import { useBukidActions } from './hooks/useBukidActions';
import BukidFormDialog from '../Dialogs/Form';
import BukidViewDialog from '../Dialogs/View'; // Add this import
import { dialogs } from '../../../utils/dialogs';

const BukidTablePage: React.FC = () => {
    const {
        bukids,
        summary,
        stats,
        loading,
        refreshing,
        error,
        currentPage,
        totalPages,
        totalItems,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        viewMode,
        setViewMode,
        selectedBukids,
        setSelectedBukids,
        fetchBukids,
        handleRefresh,
        setCurrentPage,
        kabisilyaFilter,
        setKabisilyaFilter,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder
    } = useBukidData();

    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false); // Add this state
    const [selectedBukidId, setSelectedBukidId] = useState<number | null>(null);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');

    const {
        handleDeleteBukid,
        handleUpdateStatus,
        handleBulkDelete,
        handleExportCSV
    } = useBukidActions(
        bukids,
        fetchBukids,
        selectedBukids,
        statusFilter,
        kabisilyaFilter
    );

    // Dialog handlers
    const openCreateDialog = () => {
        setDialogMode('add');
        setSelectedBukidId(null);
        setIsFormDialogOpen(true);
    };

    const openEditDialog = (id: number) => {
        setDialogMode('edit');
        setSelectedBukidId(id);
        setIsFormDialogOpen(true);
    };

    const openViewDialog = (id: number) => { // Add this function
        setSelectedBukidId(id);
        setIsViewDialogOpen(true);
    };

    const closeFormDialog = async () => {
        if (!await dialogs.confirm({ title: 'Close Bukid View', message: 'Are you sure you want to close the bukid view?' })) return;
        setIsFormDialogOpen(false);
        setSelectedBukidId(null);
    };

    const closeViewDialog = async () => { // Add this function

        setIsViewDialogOpen(false);
        setSelectedBukidId(null);
    };

    const handleFormSuccess = async(bukid: any) => {
        // Refresh the list after successful operation
        
        await fetchBukids();
        closeFormDialog();
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

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
        } else {
            setSortBy(field);
            setSortOrder('ASC');
        }
        setCurrentPage(1);
    };

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Loading state
    if (loading && !refreshing) {
        return (
            <div className="flex items-center justify-center h-screen">
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
            <div className="flex items-center justify-center h-screen">
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
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-screen bg-gray-50">
                {/* Header */}
                <div className="p-6 bg-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                                onClick={openCreateDialog}
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
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto p-6">
                        {/* Stats Cards */}
                        <div className="mb-6">
                            <BukidStats stats={stats} summary={summary} />
                        </div>

                        {/* Filters */}
                        <div className="mb-6">
                            <BukidFilters
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                statusFilter={statusFilter}
                                setStatusFilter={setStatusFilter}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                handleRefresh={handleRefresh}
                                refreshing={refreshing}
                                kabisilyaFilter={kabisilyaFilter}
                                setKabisilyaFilter={setKabisilyaFilter}
                                handleStatusFilterChange={handleStatusFilterChange}
                            />
                        </div>

                        {/* Bulk Actions */}
                        {selectedBukids.length > 0 && (
                            <div className="mb-6">
                                <BukidBulkActions
                                    selectedCount={selectedBukids.length}
                                    onBulkDelete={handleBulkDelete}
                                    onClearSelection={() => setSelectedBukids([])}
                                />
                            </div>
                        )}

                        {/* Table or Grid View */}
                        {bukids.length === 0 ? (
                            <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 bg-white">
                                <div className="text-center">
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
                                            onClick={openCreateDialog}
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
                            </div>
                        ) : (
                            <>
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                                    {viewMode === 'table' ? (
                                        <BukidTableView
                                            bukids={bukids}
                                            summary={summary}
                                            selectedBukids={selectedBukids}
                                            toggleSelectAll={toggleSelectAll}
                                            toggleSelectBukid={toggleSelectBukid}
                                            onView={openViewDialog} // Changed to use dialog
                                            onEdit={openEditDialog}
                                            onDelete={handleDeleteBukid}
                                            onUpdateStatus={handleUpdateStatus}
                                            sortBy={sortBy}
                                            sortOrder={sortOrder}
                                            onSort={handleSort}
                                        />
                                    ) : (
                                        <div className="p-6">
                                            <BukidGridView
                                                bukids={bukids}
                                                summary={summary}
                                                selectedBukids={selectedBukids}
                                                toggleSelectBukid={toggleSelectBukid}
                                                onView={openViewDialog} // Changed to use dialog
                                                onEdit={openEditDialog}
                                                onUpdateStatus={handleUpdateStatus}
                                                onDelete={handleDeleteBukid}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <BukidPagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={totalItems}
                                            limit={20}
                                            onPageChange={setCurrentPage}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Bukid Form Dialog */}
            {isFormDialogOpen && (
                <BukidFormDialog
                    id={selectedBukidId || undefined}
                    mode={dialogMode}
                    onClose={closeFormDialog}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Bukid View Dialog */}
            {isViewDialogOpen && selectedBukidId && (
                <BukidViewDialog
                    id={selectedBukidId}
                    onClose={closeViewDialog}
                    onEdit={openEditDialog}
                />
            )}
        </>
    );
};

export default BukidTablePage;