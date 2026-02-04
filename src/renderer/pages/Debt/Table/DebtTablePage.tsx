// components/Debt/DebtTablePage.tsx
import React, { useState } from "react";
import {
  DollarSign,
  Plus,
  Download,
  AlertCircle,
  BarChart2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useDebtData } from "./hooks/useDebtData";
import DebtFormDialog from "./Dialogs/DebtFormDialog";
import { useDebtActions } from "./hooks/useDebtActions";
import DebtStats from "./components/DebtStats";
import DebtFilters from "./components/DebtFilters";
import DebtBulkActions from "./components/DebtBulkActions";
import DebtTableView from "./components/DebtTableView";
import DebtGridView from "./components/DebtGridView";
import DebtPagination from "./components/DebtPagination";
import DebtViewDialog from "./Dialogs/DebtViewDialog";
import DebtPaymentDialog from "../../Payment/Table/Dialogs/Form/DebtPayment";

const DebtTablePage: React.FC = () => {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [showStats, setShowStats] = useState(false); // Add show/hide stats state
  const [showDebtPaymentDialog, setShowDebtPaymentDialog] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const {
    debts,
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
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    viewMode,
    setViewMode,
    selectedDebts,
    setSelectedDebts,
    fetchDebts,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    clearFilters,
  } = useDebtData();

  const {
    handleDeleteDebt,
    handleBulkDelete,
    handleExportCSV,
    
    handleUpdateStatus,
    handleViewHistory,
  } = useDebtActions(debts, fetchDebts, selectedDebts);

  // Dialog handlers
  const openCreateDialog = () => {
    setDialogMode("add");
    setSelectedDebtId(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (id: number) => {
    setDialogMode("edit");
    setSelectedDebtId(id);
    setIsFormDialogOpen(true);
  };

  const openViewDialog = (id: number) => {
    setSelectedDebtId(id);
    setIsViewDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setSelectedDebtId(null);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedDebtId(null);
  };

  const handleFormSuccess = async () => {
    await fetchDebts();
    closeFormDialog();
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedDebts.length === debts.length) {
      setSelectedDebts([]);
    } else {
      setSelectedDebts(debts.map((d) => d.id));
    }
  };

  const toggleSelectDebt = (id: number) => {
    setSelectedDebts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const onDebtDialogSuccess = () => {
    setShowDebtPaymentDialog(false);
    setSelectedWorkerId(null);
    handleRefresh();
  };

  const handleMakePayment = (id:number) => {
    setSelectedWorkerId(id);
    setShowDebtPaymentDialog(true);
  }

  // Loading skeleton
  const renderLoadingSkeleton = () => {
    if (viewMode === "table") {
      return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--table-header-bg)" }}>
                  <th className="p-4 text-left">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                  {[
                    "Date",
                    "Worker",
                    "Amount",
                    "Balance",
                    "Reason",
                    "Due Date",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th key={header} className="p-4 text-left">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-4">
                      <div className="w-4 h-4 bg-gray-100 rounded animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-24 mb-1"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mb-1"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 bg-gray-100 rounded animate-pulse"
                          ></div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-white border border-gray-200 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="h-8 bg-gray-100 rounded"></div>
                <div className="h-8 bg-gray-100 rounded"></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="h-3 bg-gray-100 rounded w-12"></div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  // Error state
  if (error && !debts.length && !loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="p-6 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1
                className="text-2xl font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <DollarSign className="w-6 h-6" />
                Debt Management
              </h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center p-8 bg-white rounded-xl border border-gray-200 max-w-md">
            <AlertCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: "var(--danger-color)" }}
            />
            <p
              className="text-base font-semibold mb-2"
              style={{ color: "var(--danger-color)" }}
            >
              Error Loading Debt Data
            </p>
            <p className="text-sm mb-6 text-gray-600">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center mx-auto bg-blue-600 text-white hover:bg-blue-700"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1
                className="text-2xl font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <DollarSign className="w-6 h-6" />
                Debt Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage worker debts, track payments, and monitor outstanding
                balances
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                {showStats ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide Stats
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show Stats
                  </>
                )}
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>

              <button
                onClick={openCreateDialog}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Debt
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="h-full p-6">
            {/* Stats Cards */}
            {showStats && (
              <div className="mb-6">
                <DebtStats stats={stats} />
              </div>
            )}

            {/* Filters */}
            <div className="mb-6">
              <DebtFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                workerFilter={workerFilter}
                setWorkerFilter={setWorkerFilter}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                viewMode={viewMode}
                setViewMode={setViewMode}
                handleRefresh={handleRefresh}
                refreshing={refreshing}
                handleStatusFilterChange={handleStatusFilterChange}
                clearFilters={clearFilters}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                setCurrentPage={setCurrentPage}
              />
            </div>

            {/* Bulk Actions */}
            {selectedDebts.length > 0 && (
              <div className="mb-6">
                <DebtBulkActions
                  selectedCount={selectedDebts.length}
                  onBulkDelete={handleBulkDelete}
                  onClearSelection={() => setSelectedDebts([])}
                />
              </div>
            )}

            {/* Loading State */}
            {loading && !refreshing && (
              <div className="mb-6">{renderLoadingSkeleton()}</div>
            )}

            {/* Table or Grid View */}
            {!loading && debts.length === 0 ? (
              <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <div className="text-center p-8">
                  <DollarSign
                    className="w-16 h-16 mx-auto mb-4 opacity-20"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    No Debts Found
                  </h3>
                  <p className="text-sm mb-6 max-w-md mx-auto text-gray-600">
                    {searchQuery
                      ? `No results found for "${searchQuery}". Try a different search term.`
                      : "No debts have been created yet. Get started by creating your first debt record."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={openCreateDialog}
                      className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md inline-flex items-center bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Debt
                    </button>
                  )}
                </div>
              </div>
            ) : !loading && debts.length > 0 ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                  {viewMode === "table" ? (
                    <DebtTableView
                      debts={debts}
                      selectedDebts={selectedDebts}
                      toggleSelectAll={toggleSelectAll}
                      toggleSelectDebt={toggleSelectDebt}
                      onView={openViewDialog}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteDebt}
                      onMakePayment={handleMakePayment}
                      onUpdateStatus={handleUpdateStatus}
                      onViewHistory={handleViewHistory}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  ) : (
                    <div className="p-6">
                      <DebtGridView
                        debts={debts}
                        selectedDebts={selectedDebts}
                        toggleSelectDebt={toggleSelectDebt}
                        onView={openViewDialog}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteDebt}
                        onMakePayment={handleMakePayment}
                        onUpdateStatus={handleUpdateStatus}
                        onViewHistory={handleViewHistory}
                      />
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <DebtPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      limit={10}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Debt Form Dialog */}
      {isFormDialogOpen && (
        <DebtFormDialog
          id={selectedDebtId || undefined}
          mode={dialogMode}
          onClose={closeFormDialog}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Debt View Dialog */}
      {isViewDialogOpen && selectedDebtId && (
        <DebtViewDialog
          id={selectedDebtId}
          onClose={closeViewDialog}
          onEdit={openEditDialog}
          onMakePayment={handleMakePayment}
          onViewHistory={handleViewHistory}
        />
      )}

      {showDebtPaymentDialog && selectedWorkerId && (
        <DebtPaymentDialog
          workerId={selectedWorkerId}
          onClose={() => setShowDebtPaymentDialog(false)}
          onSuccess={() => onDebtDialogSuccess()}
        />
      )}
    </>
  );
};

export default DebtTablePage;
