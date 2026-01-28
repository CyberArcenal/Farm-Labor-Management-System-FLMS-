// components/Assignment/AssignmentTablePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Download, AlertCircle, RefreshCw } from 'lucide-react';
import AssignmentStats from './components/AssignmentStats';
import AssignmentFilters from './components/AssignmentFilters';
import AssignmentBulkActions from './components/AssignmentBulkActions';
import AssignmentTableView from './components/AssignmentTableView';
import AssignmentGridView from './components/AssignmentGridView';
import AssignmentPagination from './components/AssignmentPagination';
import { useAssignmentData } from './hooks/useAssignmentData';
import { useAssignmentActions } from './hooks/useAssignmentActions';
import ViewSingleAssignmentDialog from '../View/Dialogs/ViewSingleAssignmentDialog';
import AssignmentFormDialog from '../Dialogs/Form';

const AssignmentTablePage: React.FC = () => {
    const navigate = useNavigate();
    
    const {
        assignments,
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
        workerFilter,
        setWorkerFilter,
        pitakFilter,
        setPitakFilter,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        viewMode,
        setViewMode,
        selectedAssignments,
        setSelectedAssignments,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        fetchAssignments,
        handleRefresh,
        setCurrentPage,
        clearFilters,
    } = useAssignmentData();

    const {
        handleDeleteAssignment,
        handleUpdateStatus,
        handleCancelAssignment,
        handleBulkDelete,
        handleExportCSV
    } = useAssignmentActions(
        assignments,
        fetchAssignments,
        selectedAssignments,
        {
            statusFilter,
            workerFilter,
            pitakFilter,
            dateFrom,
            dateTo
        }
    );

    // Dialog states
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    
    // Form dialog states
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [formDialogMode, setFormDialogMode] = useState<'add' | 'edit'>('add');
    const [formDialogAssignmentId, setFormDialogAssignmentId] = useState<number | null>(null);

    // View Dialog handlers
    const openViewDialog = (id: number) => {
        setSelectedAssignmentId(id);
        setIsViewDialogOpen(true);
    };

    const closeViewDialog = () => {
        setIsViewDialogOpen(false);
        setSelectedAssignmentId(null);
    };

    // Form Dialog handlers
    const openFormDialog = (mode: 'add' | 'edit', id?: number) => {
        setFormDialogMode(mode);
        setFormDialogAssignmentId(id || null);
        setIsFormDialogOpen(true);
    };

    const closeFormDialog = () => {
        setIsFormDialogOpen(false);
        setFormDialogAssignmentId(null);
        setFormDialogMode('add');
    };

    const handleFormSuccess = () => {
        fetchAssignments(); // Refresh the data
        closeFormDialog();
    };

    const handleCreateAssignment = () => {
        openFormDialog('add');
    };

    const handleEditAssignment = (id: number) => {
        openFormDialog('edit', id);
    };

    // Delete handler with dialog integration
    const handleDeleteWithDialog = async (id: number) => {
        // If the dialog is open for this assignment, close it first
        if (selectedAssignmentId === id && isViewDialogOpen) {
            closeViewDialog();
        }
        if (formDialogAssignmentId === id && isFormDialogOpen) {
            closeFormDialog();
        }
        await handleDeleteAssignment(id);
    };

    // Update status handler with dialog integration
    const handleUpdateStatusWithDialog = async (id: number, currentStatus: string) => {
        // If the dialog is open for this assignment, close it first
        if (selectedAssignmentId === id && isViewDialogOpen) {
            closeViewDialog();
        }
        if (formDialogAssignmentId === id && isFormDialogOpen) {
            closeFormDialog();
        }
        await handleUpdateStatus(id, currentStatus);
    };

    // Cancel handler with dialog integration
    const handleCancelWithDialog = async (id: number) => {
        // If the dialog is open for this assignment, close it first
        if (selectedAssignmentId === id && isViewDialogOpen) {
            closeViewDialog();
        }
        if (formDialogAssignmentId === id && isFormDialogOpen) {
            closeFormDialog();
        }
        await handleCancelAssignment(id);
    };

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

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
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
        <>
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
                <AssignmentStats stats={stats} />

                {/* Filters */}
                <AssignmentFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    handleRefresh={handleRefresh}
                    refreshing={refreshing}
                    workerFilter={workerFilter}
                    setWorkerFilter={setWorkerFilter}
                    pitakFilter={pitakFilter}
                    setPitakFilter={setPitakFilter}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    clearFilters={clearFilters}
                    handleStatusFilterChange={handleStatusFilterChange}
                />

                {/* Bulk Actions */}
                {selectedAssignments.length > 0 && (
                    <AssignmentBulkActions
                        selectedCount={selectedAssignments.length}
                        onBulkDelete={handleBulkDelete}
                        onClearSelection={() => setSelectedAssignments([])}
                    />
                )}

                {/* Table or Grid View */}
                {assignments.length === 0 ? (
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
                ) : (
                    <>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {viewMode === 'table' ? (
                                <AssignmentTableView
                                    assignments={assignments}
                                    selectedAssignments={selectedAssignments}
                                    toggleSelectAll={toggleSelectAll}
                                    toggleSelectAssignment={toggleSelectAssignment}
                                    onView={openViewDialog}
                                    onEdit={handleEditAssignment} // Updated to use dialog
                                    onDelete={handleDeleteWithDialog}
                                    onUpdateStatus={handleUpdateStatusWithDialog}
                                    onCancel={handleCancelWithDialog}
                                    sortBy={sortBy}
                                    sortOrder={sortOrder}
                                    onSort={handleSort}
                                />
                            ) : (
                                <div className="p-6">
                                    <AssignmentGridView
                                        assignments={assignments}
                                        selectedAssignments={selectedAssignments}
                                        toggleSelectAssignment={toggleSelectAssignment}
                                        onView={openViewDialog}
                                        onEdit={handleEditAssignment} // Updated to use dialog
                                        onUpdateStatus={handleUpdateStatusWithDialog}
                                        onCancel={handleCancelWithDialog}
                                        onDelete={handleDeleteWithDialog}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <AssignmentPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                limit={20}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Assignment View Dialog */}
            {isViewDialogOpen && selectedAssignmentId && (
                <ViewSingleAssignmentDialog
                    assignmentId={selectedAssignmentId}
                    onClose={closeViewDialog}
                    onEdit={() => {
                        closeViewDialog();
                        handleEditAssignment(selectedAssignmentId);
                    }}
                    onDelete={() => handleDeleteWithDialog(selectedAssignmentId)}
                />
            )}

            {/* Assignment Form Dialog */}
            {isFormDialogOpen && (
                <AssignmentFormDialog
                    id={formDialogAssignmentId || undefined}
                    mode={formDialogMode}
                    onClose={closeFormDialog}
                    onSuccess={handleFormSuccess}
                />
            )}
        </>
    );
};

export default AssignmentTablePage;