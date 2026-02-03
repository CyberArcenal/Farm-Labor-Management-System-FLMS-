// components/Payment/PaymentTablePage.tsx
import React, { useState } from "react";
import {
  DollarSign,
  Plus,
  Download,
  AlertCircle,
  BarChart2,
  ChevronUp,
  ChevronDown,
  Users,
  List,
  Grid,
} from "lucide-react";
import { usePaymentData } from "./hooks/usePaymentData";
import { useWorkerPaymentData } from "./hooks/useWorkerPaymentData";
import { useWorkerPaymentActions } from "./hooks/useWorkerPaymentActions";
import PaymentFormDialog from "./Dialogs/PaymentFormDialog";
import { usePaymentActions } from "./hooks/usePaymentActions";
import PaymentStats from "./components/PaymentStats";
import PaymentFilters from "./components/PaymentFilters";
import PaymentBulkActions from "./components/PaymentBulkActions";
import PaymentTableView from "./components/PaymentTableView";
import WorkerPaymentTable from "./components/WorkerPaymentTableView";
import PaymentPagination from "./components/PaymentPagination";
import PaymentViewDialog from "./Dialogs/PaymentViewDialog";
import { useDebtPaymentDialog } from "./Dialogs/hooks/useDebtPaymentDialog";
import DebtPaymentDialog from "./Dialogs/DebtPaymentDialog";

const PaymentTablePage: React.FC = () => {
  const [viewType, setViewType] = useState<"payments" | "workers">("payments");

  // Payment data hook
  const {
    payments,
    stats,
    summary,
    loading: paymentLoading,
    refreshing: paymentRefreshing,
    error: paymentError,
    currentPage: paymentCurrentPage,
    totalPages: paymentTotalPages,
    totalItems: paymentTotalItems,
    searchQuery: paymentSearchQuery,
    setSearchQuery: setPaymentSearchQuery,
    statusFilter: paymentStatusFilter,
    setStatusFilter: setPaymentStatusFilter,
    workerFilter,
    setWorkerFilter,
    dateFrom: paymentDateFrom,
    setDateFrom: setPaymentDateFrom,
    dateTo: paymentDateTo,
    setDateTo: setPaymentDateTo,
    paymentMethodFilter,
    setPaymentMethodFilter,
    selectedPayments,
    setSelectedPayments,
    fetchPayments,
    handleRefresh: handlePaymentRefresh,
    setCurrentPage: setPaymentCurrentPage,
    sortBy: paymentSortBy,
    setSortBy: setPaymentSortBy,
    sortOrder: paymentSortOrder,
    setSortOrder: setPaymentSortOrder,
    limit: paymentLimit,
  } = usePaymentData();

  // Worker payment data hook
  const {
    workerSummaries,
    loading: workerLoading,
    refreshing: workerRefreshing,
    error: workerError,
    currentPage: workerCurrentPage,
    totalPages: workerTotalPages,
    totalItems: workerTotalItems,
    searchQuery: workerSearchQuery,
    setSearchQuery: setWorkerSearchQuery,
    statusFilter: workerStatusFilter,
    setStatusFilter: setWorkerStatusFilter,
    dateFrom: workerDateFrom,
    setDateFrom: setWorkerDateFrom,
    dateTo: workerDateTo,
    setDateTo: setWorkerDateTo,
    sortBy: workerSortBy,
    setSortBy: setWorkerSortBy,
    sortOrder: workerSortOrder,
    setSortOrder: setWorkerSortOrder,
    handleRefresh: handleWorkerRefresh,
    limit: workerLimit,
    setCurrentPage: setWorkerCurrentPage,
  } = useWorkerPaymentData();

  const {
    handleProcessAllPayments,
    handlePayWorkerDebt,
    handleViewWorkerDetails,
    handleExportWorkerReport,
    handleGenerateWorkerSlips,
  } = useWorkerPaymentActions(workerSummaries, handleWorkerRefresh);

  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
    null,
  );
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [showStats, setShowStats] = useState(false);
  const [showDebtPaymentDialog, setShowDebtPaymentDialog] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const {
    handleDeletePayment,
    handleBulkDelete,
    handleExportCSV,
    handleUpdateStatus,
    handleProcessPayment,
    handleCancelPayment,
    handleGeneratePaymentSlip,
  } = usePaymentActions(
    payments,
    fetchPayments,
    selectedPayments,
    setSelectedPayments,
  );

  // Conditional variables based on viewType
  const loading = viewType === "payments" ? paymentLoading : workerLoading;
  const refreshing =
    viewType === "payments" ? paymentRefreshing : workerRefreshing;
  const error = viewType === "payments" ? paymentError : workerError;
  const currentPage =
    viewType === "payments" ? paymentCurrentPage : workerCurrentPage;
  const totalPages =
    viewType === "payments" ? paymentTotalPages : workerTotalPages;
  const totalItems =
    viewType === "payments" ? paymentTotalItems : workerTotalItems;
  const searchQuery =
    viewType === "payments" ? paymentSearchQuery : workerSearchQuery;
  const statusFilter =
    viewType === "payments" ? paymentStatusFilter : workerStatusFilter;
  const dateFrom = viewType === "payments" ? paymentDateFrom : workerDateFrom;
  const dateTo = viewType === "payments" ? paymentDateTo : workerDateTo;
  const sortBy = viewType === "payments" ? paymentSortBy : workerSortBy;
  const sortOrder =
    viewType === "payments" ? paymentSortOrder : workerSortOrder;
  const limit = viewType === "payments" ? paymentLimit : workerLimit;
  const handleOnDebtPayment = async (workerId: number) => {
    setShowDebtPaymentDialog(true);
    setSelectedWorkerId(workerId);
  };
  const onDebtDialogSuccess = () => {
    setShowDebtPaymentDialog(false);
    setSelectedWorkerId(null);
  };
  const setSearchQueryWrapper = (value: string) => {
    if (viewType === "payments") setPaymentSearchQuery(value);
    else setWorkerSearchQuery(value);
  };

  const setStatusFilterWrapper = (value: string) => {
    if (viewType === "payments") setPaymentStatusFilter(value);
    else setWorkerStatusFilter(value);
  };

  const setDateFromWrapper = (value: string) => {
    if (viewType === "payments") setPaymentDateFrom(value);
    else setWorkerDateFrom(value);
  };

  const setDateToWrapper = (value: string) => {
    if (viewType === "payments") setPaymentDateTo(value);
    else setWorkerDateTo(value);
  };

  const setCurrentPageWrapper = (value: number) => {
    if (viewType === "payments") setPaymentCurrentPage(value);
    else setWorkerCurrentPage(value);
  };

  const setSortByWrapper = (value: string) => {
    if (viewType === "payments") setPaymentSortBy(value);
    else setWorkerSortBy(value);
  };

  const setSortOrderWrapper = (value: "asc" | "desc") => {
    if (viewType === "payments") setPaymentSortOrder(value);
    else setWorkerSortOrder(value);
  };

  // Add dummy functions for worker view filters
  const dummySetPaymentMethodFilter = (method: string) => {};
  const dummySetWorkerFilter = (workerId: number | null) => {};

  // Create conditional variables for empty state
  const isEmpty =
    viewType === "payments"
      ? payments.length === 0
      : workerSummaries.length === 0;

  const hasData =
    viewType === "payments" ? payments.length > 0 : workerSummaries.length > 0;

  // Dialog handlers
  const openCreateDialog = () => {
    setDialogMode("add");
    setSelectedPaymentId(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (id: number) => {
    setDialogMode("edit");
    setSelectedPaymentId(id);
    setIsFormDialogOpen(true);
  };

  const openViewDialog = (id: number) => {
    setSelectedPaymentId(id);
    setIsViewDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setSelectedPaymentId(null);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedPaymentId(null);
  };

  const handleFormSuccess = async () => {
    await fetchPayments();
    closeFormDialog();
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map((p) => p.id));
    }
  };

  const toggleSelectPayment = (id: number) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrderWrapper(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortByWrapper(field);
      setSortOrderWrapper("asc");
    }
    setCurrentPageWrapper(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilterWrapper(status);
    setCurrentPageWrapper(1);
  };

  const handlePaymentMethodFilterChange = (method: string) => {
    setPaymentMethodFilter(method);
    setCurrentPageWrapper(1);
  };

  const clearFilters = () => {
    setStatusFilterWrapper("all");
    setWorkerFilter(null);
    setDateFromWrapper("");
    setDateToWrapper("");
    setPaymentMethodFilter("all");
    setSearchQueryWrapper("");
    setCurrentPageWrapper(1);
  };

  const handleRefresh = () => {
    if (viewType === "payments") handlePaymentRefresh();
    else handleWorkerRefresh();
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => {
    if (viewType === "payments") {
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
                    "Gross Pay",
                    "Net Pay",
                    "Deductions",
                    "Method",
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                        <div>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else {
      // Worker view skeleton
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                  <div>
                    <div className="h-5 bg-gray-100 rounded w-32 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="h-4 bg-gray-100 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-100 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

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
                Payment Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {viewType === "payments"
                  ? "Manage individual payments and track status"
                  : "View worker payment summaries and take bulk actions"}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* View type toggle */}
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 rounded-lg p-1 flex">
                  <button
                    onClick={() => setViewType("payments")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                      viewType === "payments"
                        ? "bg-white shadow-sm text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Payments
                  </button>
                  <button
                    onClick={() => setViewType("workers")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                      viewType === "workers"
                        ? "bg-white shadow-sm text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Workers
                  </button>
                </div>
              </div>

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
                New Payment
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
                <PaymentStats stats={stats} summary={summary} />
              </div>
            )}

            {/* Filters */}
            <div className="mb-6">
              <PaymentFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQueryWrapper}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilterWrapper}
                workerFilter={viewType === "payments" ? workerFilter : null}
                setWorkerFilter={
                  viewType === "payments"
                    ? setWorkerFilter
                    : dummySetWorkerFilter
                }
                dateFrom={dateFrom}
                setDateFrom={setDateFromWrapper}
                dateTo={dateTo}
                setDateTo={setDateToWrapper}
                paymentMethodFilter={
                  viewType === "payments" ? paymentMethodFilter : "all"
                }
                setPaymentMethodFilter={
                  viewType === "payments"
                    ? setPaymentMethodFilter
                    : dummySetPaymentMethodFilter
                }
                handleRefresh={handleRefresh}
                refreshing={refreshing}
                clearFilters={clearFilters}
                handleStatusFilterChange={handleStatusFilterChange}
                handlePaymentMethodFilterChange={
                  handlePaymentMethodFilterChange
                }
                sortBy={sortBy}
                sortOrder={sortOrder}
                handleSort={handleSort}
                setCurrentPage={setCurrentPageWrapper}
                viewType={viewType}
              />
            </div>

            {/* Bulk Actions - Only show for payments view */}
            {viewType === "payments" && selectedPayments.length > 0 && (
              <div className="mb-6">
                <PaymentBulkActions
                  selectedCount={selectedPayments.length}
                  onBulkDelete={handleBulkDelete}
                  onClearSelection={() => setSelectedPayments([])}
                />
              </div>
            )}

            {/* Loading State */}
            {loading && !refreshing && (
              <div className="mb-6">{renderLoadingSkeleton()}</div>
            )}

            {/* Empty State */}
            {!loading && isEmpty ? (
              <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <div className="text-center p-8">
                  {viewType === "payments" ? (
                    <DollarSign
                      className="w-16 h-16 mx-auto mb-4 opacity-20"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  ) : (
                    <Users
                      className="w-16 h-16 mx-auto mb-4 opacity-20"
                      style={{ color: "var(--text-secondary)" }}
                    />
                  )}
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    {viewType === "payments"
                      ? "No Payments Found"
                      : "No Worker Payments Found"}
                  </h3>
                  <p className="text-sm mb-6 max-w-md mx-auto text-gray-600">
                    {searchQuery
                      ? `No results found for "${searchQuery}". Try a different search term.`
                      : viewType === "payments"
                        ? "No payments have been created yet. Get started by creating your first payment."
                        : "No worker payments have been recorded yet."}
                  </p>
                  {!searchQuery && viewType === "payments" && (
                    <button
                      onClick={openCreateDialog}
                      className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md inline-flex items-center bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Payment
                    </button>
                  )}
                </div>
              </div>
            ) : !loading && hasData ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                  {viewType === "payments" ? (
                    <PaymentTableView
                      payments={payments}
                      selectedPayments={selectedPayments}
                      toggleSelectAll={toggleSelectAll}
                      toggleSelectPayment={toggleSelectPayment}
                      onView={openViewDialog}
                      onUpdateStatus={handleUpdateStatus}
                      onProcessPayment={handleProcessPayment}
                      onCancelPayment={handleCancelPayment}
                      onGenerateSlip={handleGeneratePaymentSlip}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  ) : (
                    <WorkerPaymentTable
                      workerSummaries={workerSummaries}
                      onProcessAllPayments={handleProcessAllPayments}
                      onPayWorkerDebt={handleOnDebtPayment}
                      onViewWorkerDetails={handleViewWorkerDetails}
                      onExportWorkerReport={handleExportWorkerReport}
                      onGenerateWorkerSlips={handleGenerateWorkerSlips}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <PaymentPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      limit={limit}
                      onPageChange={setCurrentPageWrapper}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Payment Form Dialog */}
      {isFormDialogOpen && (
        <PaymentFormDialog
          id={selectedPaymentId || undefined}
          mode={dialogMode}
          onClose={closeFormDialog}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Payment View Dialog */}
      {isViewDialogOpen && selectedPaymentId && (
        <PaymentViewDialog
          paymentId={selectedPaymentId}
          onClose={closeViewDialog}
        />
      )}
      {showDebtPaymentDialog && selectedWorkerId && (
        <DebtPaymentDialog
          workerId={selectedWorkerId}
          onClose={() => setShowDebtPaymentDialog(false)}
          onSuccess={() => onDebtDialogSuccess}
        />
      )}
    </>
  );
};

export default PaymentTablePage;
