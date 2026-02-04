import React, { useState } from 'react';
import { History, Download, RefreshCw, Users, DollarSign } from 'lucide-react';
import { type HistoryType } from './types/history.types';
import { useHistoryFilters } from './hooks/useHistoryFilters';
import { useHistoryData } from './hooks/useHistoryData';
import { useHistoryStats } from './hooks/useHistoryStats';
import HistoryViewToggle from './components/HistoryViewToggle';
import HistoryStats from './components/HistoryStats';
import HistoryFilters from './components/HistoryFilters';
import HistoryList from './components/HistoryList';
import PaymentPagination from '../Payment/Table/components/PaymentPagination';

interface HistoryPageProps {
  defaultView?: HistoryType;
  workerId?: number;
  initialDateRange?: { start: string; end: string };
}

const HistoryPage: React.FC<HistoryPageProps> = ({ 
  defaultView = 'payment',
  workerId,
  initialDateRange 
}) => {
  const [viewType, setViewType] = useState<HistoryType>(defaultView);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  const { filters, updateFilter, clearFilters } = useHistoryFilters({
    workerId,
    dateFrom: initialDateRange?.start,
    dateTo: initialDateRange?.end,
  });

  const {
    paymentHistory,
    debtHistory,
    paymentHistorySummary,
    debtHistorySummary,
    loading,
    error,
    totalPages,
    totalItems,
    refresh,
  } = useHistoryData(viewType, filters, currentPage, limit);

  const stats = useHistoryStats(viewType, paymentHistory, debtHistory);

  const handleViewTypeChange = (type: HistoryType) => {
    setViewType(type);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    refresh();
  };

  const handleClearFilters = () => {
    clearFilters();
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refresh();
  };

  const exportToCSV = () => {
    alert('Export feature coming soon!');
  };

  // Calculate unique workers
  const uniqueWorkers = () => {
    if (viewType === 'payment') {
      const workerIds = new Set(paymentHistory.map(item => item.worker?.id).filter(Boolean));
      return workerIds.size;
    } else {
      const workerIds = new Set(debtHistory.map(item => item.worker?.id).filter(Boolean));
      return workerIds.size;
    }
  };

  // Calculate total amount
  const totalAmount = () => {
    if (viewType === 'payment') {
      return paymentHistory.reduce((sum, item) => {
        const amountChange = Math.abs(
          (item.changes.newAmount || 0) - (item.changes.oldAmount || 0)
        );
        return sum + amountChange;
      }, 0);
    } else {
      return debtHistory.reduce((sum, item) => sum + item.amountPaid, 0);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <History className="w-6 h-6" />
              Transaction History
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track all payment and debt transaction history with detailed audit logs
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* View Type Toggle */}
        <div className="mb-6">
          <HistoryViewToggle viewType={viewType} onChange={handleViewTypeChange} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique Workers</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueWorkers()}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(totalAmount())}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <HistoryFilters
            filters={filters}
            onFilterChange={updateFilter}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            viewType={viewType}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <History className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading History</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && 
          (viewType === 'payment' ? paymentHistory.length === 0 : debtHistory.length === 0) && (
          <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 bg-white">
            <div className="text-center p-8">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2 text-gray-800">
                No History Records Found
              </h3>
              <p className="text-sm mb-6 max-w-md mx-auto text-gray-600">
                {filters.searchQuery || filters.dateFrom || filters.dateTo
                  ? 'No records match your current filters. Try adjusting your search criteria.'
                  : `No ${viewType} history records have been created yet.`}
              </p>
              {(filters.searchQuery || filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md inline-flex items-center bg-blue-600 text-white hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* History List */}
        {!loading && !error && 
          (viewType === 'payment' ? paymentHistory.length > 0 : debtHistory.length > 0) && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {viewType === 'payment' ? paymentHistory.length : debtHistory.length} records
                  {uniqueWorkers() > 0 && ` from ${uniqueWorkers()} unique workers`}
                </p>
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>

            <HistoryList
              viewType={viewType}
              paymentHistory={paymentHistory}
              debtHistory={debtHistory}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <PaymentPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  limit={limit}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;