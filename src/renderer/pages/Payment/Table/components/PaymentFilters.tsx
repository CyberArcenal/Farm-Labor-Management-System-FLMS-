// components/Payment/components/PaymentFilters.tsx
import React, { useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  RefreshCw,
  X,
  ChevronDown,
  User,
  DollarSign,
  CreditCard,
  SortAsc,
  SortDesc,
} from "lucide-react";

interface PaymentFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  workerFilter: number | null;
  setWorkerFilter: (workerId: number | null) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  paymentMethodFilter: string;
  setPaymentMethodFilter: (method: string) => void;
  handleRefresh: () => void;
  refreshing: boolean;
  clearFilters: () => void;
  handleStatusFilterChange: (status: string) => void;
  handlePaymentMethodFilterChange: (method: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  setCurrentPage: (page: number) => void;
  viewType?: 'payments' | 'workers'; // Make this optional with default
}

const PaymentFilters: React.FC<PaymentFiltersProps> = ({
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
  paymentMethodFilter,
  setPaymentMethodFilter,
  handleRefresh,
  refreshing,
  clearFilters,
  handleStatusFilterChange,
  handlePaymentMethodFilterChange,
  sortBy,
  sortOrder,
  handleSort,
  setCurrentPage,
  viewType = 'payments', // Add default value
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [workers] = useState<any[]>([
    { id: 1, name: "Juan Dela Cruz" },
    { id: 2, name: "Maria Santos" },
    { id: 3, name: "Pedro Reyes" },
    { id: 4, name: "Ana Torres" },
  ]);

  const paymentStatusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "partially_paid", label: "Partially Paid" },
  ];

  const workerStatusOptions = [
    { value: "all", label: "All Workers" },
    { value: "has_pending", label: "Has Pending Payments" },
    { value: "has_debt", label: "Has Outstanding Debt" },
    { value: "has_completed", label: "Has Completed Payments" },
  ];

  const paymentMethodOptions = [
    { value: "all", label: "All Methods" },
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank Transfer" },
    { value: "check", label: "Check" },
    { value: "digital", label: "Digital Payment" },
  ];

  const sortOptions = viewType === 'payments' ? [
    { value: "paymentDate", label: "Payment Date" },
    { value: "createdAt", label: "Created Date" },
    { value: "grossPay", label: "Gross Pay" },
    { value: "netPay", label: "Net Pay" },
  ] : [
    { value: "workerName", label: "Worker Name" },
    { value: "totalPayments", label: "Total Payments" },
    { value: "totalNetPay", label: "Total Net Pay" },
    { value: "totalDebt", label: "Total Debt" },
  ];

  const getSortLabel = (field: string) => {
    return sortOptions.find(opt => opt.value === field)?.label || field;
  };

  const hasActiveFilters = () => {
    return (
      searchQuery.trim() !== "" ||
      statusFilter !== "all" ||
      workerFilter !== null ||
      dateFrom !== "" ||
      dateTo !== "" ||
      paymentMethodFilter !== "all"
    );
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-4">
        {/* Search and Basic Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-tertiary)" }}
              />
              <input
                type="text"
                placeholder={`Search ${viewType === 'payments' ? 'payments by ID, worker name, reference...' : 'workers by name, contact...'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                }}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-auto">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  handleStatusFilterChange(e.target.value);
                }}
                className="w-full px-3 py-2.5 rounded-lg border text-sm appearance-none"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                }}
              >
                {viewType === 'payments' 
                  ? paymentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  : workerStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                }
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="w-full md:w-auto">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  handleSort(e.target.value);
                }}
                className="w-full px-3 py-2.5 rounded-lg border text-sm appearance-none"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--card-bg)",
                  color: "var(--text-primary)",
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by: {option.label}
                  </option>
                ))}
              </select>
              {sortOrder === 'asc' ? (
                <SortAsc className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
              ) : (
                <SortDesc className="absolute right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
              )}
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                showAdvancedFilters
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              {showAdvancedFilters ? "Hide Filters" : "More Filters"}
            </button>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>

            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showAdvancedFilters && (
          <div className="border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Worker Filter (Only for payments view) */}
              {viewType === 'payments' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    <User className="w-4 h-4 inline-block mr-1" />
                    Worker
                  </label>
                  <div className="relative">
                    <select
                      value={workerFilter || ""}
                      onChange={(e) => setWorkerFilter(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--card-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="">All Workers</option>
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Payment Method Filter (Only for payments view) */}
              {viewType === 'payments' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    <CreditCard className="w-4 h-4 inline-block mr-1" />
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => {
                        setPaymentMethodFilter(e.target.value);
                        handlePaymentMethodFilterChange(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--card-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {paymentMethodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div className={viewType === 'payments' ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  <Calendar className="w-4 h-4 inline-block mr-1" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--card-bg)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400">to</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--card-bg)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional filters for worker view */}
              {viewType === 'workers' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    <DollarSign className="w-4 h-4 inline-block mr-1" />
                    Financial Filter
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--card-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="">All Financial Status</option>
                      <option value="debt_gt_0">Has Debt</option>
                      <option value="debt_eq_0">No Debt</option>
                      <option value="net_pay_gt_1000">Net Pay &gt; 1,000</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters() && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border-color)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    Active Filters:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ background: "var(--accent-sky-light)", color: "var(--accent-sky)" }}>
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery("")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  
                  {statusFilter !== "all" && (
                    <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ 
                        background: statusFilter === 'pending' ? "var(--status-growing-bg)" :
                                  statusFilter === 'processing' ? "var(--status-irrigation-bg)" :
                                  statusFilter === 'completed' ? "var(--status-planted-bg)" :
                                  "var(--accent-rust-light)",
                        color: statusFilter === 'pending' ? "var(--status-growing)" :
                               statusFilter === 'processing' ? "var(--status-irrigation)" :
                               statusFilter === 'completed' ? "var(--status-planted)" :
                               "var(--accent-rust)"
                      }}>
                      Status: {viewType === 'payments' 
                        ? paymentStatusOptions.find(o => o.value === statusFilter)?.label 
                        : workerStatusOptions.find(o => o.value === statusFilter)?.label}
                      <button onClick={() => setStatusFilter("all")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  
                  {workerFilter && viewType === 'payments' && (
                    <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}>
                      Worker: {workers.find(w => w.id === workerFilter)?.name || workerFilter}
                      <button onClick={() => setWorkerFilter(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  
                  {dateFrom && (
                    <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ background: "var(--accent-gold-light)", color: "var(--accent-gold)" }}>
                      From: {dateFrom}
                      <button onClick={() => setDateFrom("")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  
                  {dateTo && (
                    <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ background: "var(--accent-gold-light)", color: "var(--accent-gold)" }}>
                      To: {dateTo}
                      <button onClick={() => setDateTo("")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  
                  {paymentMethodFilter !== "all" && viewType === 'payments' && (
                    <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1"
                      style={{ background: "var(--accent-purple-light)", color: "var(--accent-purple)" }}>
                      Method: {paymentMethodOptions.find(m => m.value === paymentMethodFilter)?.label}
                      <button onClick={() => setPaymentMethodFilter("all")}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  
                  <button
                    onClick={clearFilters}
                    className="text-xs px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sort Indicator */}
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          <span>Sorted by: </span>
          <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
            {getSortLabel(sortBy)}
          </span>
          <span className="capitalize">({sortOrder})</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentFilters;