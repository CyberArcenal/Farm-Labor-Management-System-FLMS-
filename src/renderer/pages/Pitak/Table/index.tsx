import React, { useState } from 'react';
import {
  MapPin, Plus, Download, AlertCircle, RefreshCw
} from 'lucide-react';
import PitakStats from './components/PitakStats';
import PitakFilters from './components/PitakFilters';
import PitakBulkActions from './components/PitakBulkActions';
import PitakTableView from './components/PitakTableView';
import PitakGridView from './components/PitakGridView';
import PitakPagination from './components/PitakPagination';
import AssignmentDialog from './dialogs/AssignmentDialog';
import BulkAssignDialog from './dialogs/BulkAssignDialog';
import LuWangUpdateDialog from './dialogs/LuWangUpdateDialog';
import ExportDialog from './dialogs/ExportDialog';
// Import new dialogs
import { usePitakData } from './hooks/usePitakData';
import { usePitakActions } from './hooks/usePitakActions';
import type { PitakWithDetails } from '../../../apis/pitak';
import ViewMultipleAssignmentsDialog from '../../Assignment/View/Dialogs/ViewMultipleAssignmentsDialog';
import AssignmentHistoryDialog from '../../Assignment/View/Dialogs/CreateAssignmentHistoryDialog';
import ViewSingleAssignmentDialog from '../../Assignment/View/Dialogs/ViewSingleAssignmentDialog';
import PitakFormDialog from '../Dialogs/Form';
import PitakViewDialog from '../Dialogs/View';

const PitakTablePage: React.FC = () => {
  const {
    pitaks,
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
    selectedPitaks,
    setSelectedPitaks,
    fetchPitaks,
    handleRefresh,
    setCurrentPage
  } = usePitakData();

  const {
    showAssignmentDialog,
    setShowAssignmentDialog,
    showBulkAssignDialog,
    setShowBulkAssignDialog,
    showLuWangUpdateDialog,
    setShowLuWangUpdateDialog,
    showExportDialog,
    setShowExportDialog,
    // New dialog states
    showSingleAssignmentDialog,
    setShowSingleAssignmentDialog,
    showMultipleAssignmentsDialog,
    setShowMultipleAssignmentsDialog,
    showAssignmentHistoryDialog,
    setShowAssignmentHistoryDialog,
    // View Dialog states
    showViewDialog,
    setShowViewDialog,
    selectedViewPitakId,
    setSelectedViewPitakId,
    selectedAssignmentId,
    selectedPitakId,
    assignmentData,
    setAssignmentData,
    bulkOperationData,
    setBulkOperationData,
    luwangUpdateData,
    setLuWangUpdateData,
    handleCreatePitak,
    handleViewPitak,
    handleEditPitak,
    handleDeletePitak,
    handleAssignWorker,
    handleSubmitAssignment,
    handleUpdateLuWang,
    handleSubmitLuWangUpdate,
    handleBulkAssign,
    handleSubmitBulkAssign,
    handleBulkStatusChange,
    handleBulkDelete,
    handleExport,
    handleViewAssignments,
    handleViewReport,
    handleViewAssignedWorkers,
    handleMarkAsHarvested,
    handleUpdatePitakStatus,
    // New functions
    handleViewAssignmentDialog,
    handleViewPitakAssignmentsDialog,
    handleViewAssignmentHistoryDialog,

    
    isFormDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    selectPitakId,
    dialogMode,
    setIsFormDialogOpen,
    setSelectPitakId,
    setDialogMode,
  } = usePitakActions(pitaks, fetchPitaks);

 
  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-3 border-blue-500"></div>
          <p className="text-sm text-gray-600">Loading pitak data...</p>
        </div>
      </div>
    );
  }

  if (error && !pitaks.length) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-base font-semibold mb-1 text-gray-900">Error Loading Pitak Data</p>
        <p className="text-sm mb-3 text-gray-600">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center mx-auto bg-blue-600 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </button>
      </div>
    );
  }

  const toggleSelectAll = () => {
    setSelectedPitaks(selectedPitaks.length === pitaks.length ? [] : pitaks.map(p => p.id));
  };

  const toggleSelectPitak = (id: number) => {
    setSelectedPitaks(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAssignWorkerWithData = (pitakId: number) => {
    const pitak = pitaks.find(p => p.id === pitakId);
    if (!pitak) return;
    handleAssignWorker(pitakId, pitak);
  };

  const handleUpdateLuWangWithData = (pitakId: number) => {
    const pitak = pitaks.find(p => p.id === pitakId);
    if (!pitak) return;
    handleUpdateLuWang(pitakId, pitak.totalLuwang);
  };

  const handleDeletePitakWithData = (id: number) => {
    const pitak = pitaks.find(p => p.id === id);
    handleDeletePitak(id, pitak?.location as string);
  };

  const handleMarkAsHarvestedWithData = (id: number) => {
    const pitak = pitaks.find(p => p.id === id);
    handleMarkAsHarvested(id, pitak?.location as string);
  };

  const handleUpdatePitakStatusWithData = (id: number, currentStatus: string) => {
    const pitak = pitaks.find(p => p.id === id);
    handleUpdatePitakStatus(id, currentStatus, pitak?.location as string);
  };

  const handleBulkAssignWithData = () => {
    if (selectedPitaks.length === 0) return;
    handleBulkAssign(selectedPitaks);
  };

  const handleBulkDeleteWithData = () => {
    if (selectedPitaks.length === 0) return;
    handleBulkDelete(selectedPitaks);
  };

  const handleBulkActivateWithData = () => {
    if (selectedPitaks.length === 0) return;
    handleBulkStatusChange('active', selectedPitaks);
  };

  const handleBulkDeactivateWithData = () => {
    if (selectedPitaks.length === 0) return;
    handleBulkStatusChange('inactive', selectedPitaks);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <MapPin className="w-6 h-6" /> Pitak Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage planting areas, track luwang capacity, and monitor utilization
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowExportDialog(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button
            onClick={openCreateDialog}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" /> New Pitak
          </button>
        </div>
      </div>

      {/* Stats */}
      <PitakStats stats={stats} />

      {/* Filters */}
      <PitakFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Bulk Actions */}
      {selectedPitaks.length > 0 && (
        <PitakBulkActions
          selectedCount={selectedPitaks.length}
          onBulkAssign={handleBulkAssignWithData}
          onBulkActivate={handleBulkActivateWithData}
          onBulkDeactivate={handleBulkDeactivateWithData}
          onBulkDelete={handleBulkDeleteWithData}
          onClearSelection={() => setSelectedPitaks([])}
        />
      )}

      {/* Main Content */}
      {viewMode === 'table' ? (
        <PitakTableView
          pitaks={pitaks}
          selectedPitaks={selectedPitaks}
          toggleSelectAll={toggleSelectAll}
          toggleSelectPitak={toggleSelectPitak}
          onView={handleViewPitak} // This now opens the view dialog
          onEdit={handleEditPitak}
          onAssign={handleAssignWorkerWithData}
          onDelete={handleDeletePitakWithData}
          onUpdateLuWang={handleUpdateLuWangWithData}
          onViewAssignments={handleViewAssignments}
          onViewAssignedWorkers={handleViewAssignedWorkers}
          onViewReport={handleViewReport}
          onMarkAsHarvested={handleMarkAsHarvestedWithData}
          onUpdateStatus={handleUpdatePitakStatusWithData}
          // Pass new props
          onViewAssignment={handleViewAssignmentDialog}
          onViewPitakAssignments={handleViewPitakAssignmentsDialog}
          onViewAssignmentHistory={handleViewAssignmentHistoryDialog}
        />
      ) : (
        <PitakGridView
          pitaks={pitaks}
          selectedPitaks={selectedPitaks}
          toggleSelectPitak={toggleSelectPitak}
          onView={handleViewPitak} // This now opens the view dialog
          onEdit={handleEditPitak}
          onAssign={handleAssignWorkerWithData}
        />
      )}

      {/* Empty State */}
      {pitaks.length === 0 && !loading && (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-white">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900">No Pitak Found</h3>
          <p className="text-sm mb-6 max-w-md mx-auto text-gray-600">
            {searchQuery ? `No results found for "${searchQuery}". Try a different search term.` : 'No pitak have been created yet. Get started by creating your first pitak.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreatePitak}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-md inline-flex items-center bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Create First Pitak
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pitaks.length > 0 && totalPages > 1 && (
        <PitakPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={20}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Existing Dialogs */}
      {showAssignmentDialog && (
        <AssignmentDialog
          data={assignmentData}
          onChange={setAssignmentData}
          onSubmit={handleSubmitAssignment}
          onClose={() => setShowAssignmentDialog(false)}
        />
      )}

      {showBulkAssignDialog && (
        <BulkAssignDialog
          selectedCount={selectedPitaks.length}
          data={bulkOperationData}
          onChange={setBulkOperationData}
          onSubmit={() => handleSubmitBulkAssign(selectedPitaks, bulkOperationData)}
          onClose={() => setShowBulkAssignDialog(false)}
        />
      )}

      {showLuWangUpdateDialog && (
        <LuWangUpdateDialog
          data={luwangUpdateData}
          onChange={setLuWangUpdateData}
          onSubmit={handleSubmitLuWangUpdate}
          onClose={() => setShowLuWangUpdateDialog(false)}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          onExport={handleExport}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* Pitak View Dialog */}
      {showViewDialog && selectedViewPitakId && (
        <PitakViewDialog
          id={selectedViewPitakId}
          onClose={() => setShowViewDialog(false)}
          onEdit={(id) => {
            setShowViewDialog(false);
            openEditDialog(id);
          }}
        />
      )}

      {/* New Assignment Viewing Dialogs */}
      {showSingleAssignmentDialog && (
        <ViewSingleAssignmentDialog
          assignmentId={selectedAssignmentId}
          onClose={() => setShowSingleAssignmentDialog(false)}
          onEdit={() => {
            setShowSingleAssignmentDialog(false);
            // Handle edit functionality
            // navigate(`/assignments/edit/${selectedAssignmentId}`);
          }}
          onDelete={() => {
            setShowSingleAssignmentDialog(false);
            // Handle delete functionality
            // showConfirm dialog for deletion
          }}
          onViewHistory={() => {
            setShowSingleAssignmentDialog(false);
            setShowAssignmentHistoryDialog(true);
          }}
        />
      )}

      {showMultipleAssignmentsDialog && (
        <ViewMultipleAssignmentsDialog
          pitakId={selectedPitakId}
          onClose={() => setShowMultipleAssignmentsDialog(false)}
          onViewAssignment={(id) => {
            setShowMultipleAssignmentsDialog(false);
            handleViewAssignmentDialog(id);
          }}
        />
      )}

      {showAssignmentHistoryDialog && (
        <AssignmentHistoryDialog
          assignmentId={selectedAssignmentId}
          onClose={() => setShowAssignmentHistoryDialog(false)}
        />
      )}

      {/* Pitak Form Dialog */}
      {isFormDialogOpen && (
        <PitakFormDialog
          id={selectPitakId || undefined}
          mode={dialogMode}
          onClose={closeFormDialog}
          onSuccess={() => {
            // Refresh data
            fetchPitaks();
            closeFormDialog();
          }}
        />
      )}
    </div>
  );
};

export default PitakTablePage;