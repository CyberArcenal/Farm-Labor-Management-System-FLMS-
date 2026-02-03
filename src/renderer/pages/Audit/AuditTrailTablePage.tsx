// components/AuditTrail/AuditTrailTablePage.tsx
import React, { useState } from "react";
import { History, Download, AlertCircle, Filter, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuditTrailData } from "./hooks/useAuditTrailData";
import AuditTrailViewDialog from "./Dialogs/AuditTrailViewDialog";
import { useAuditTrailActions } from "./hooks/useAuditTrailActions";
import AuditTrailFilters from "./components/AuditTrailFilters";
import AuditTrailBulkActions from "./components/AuditTrailBulkActions";
import AuditTrailStats from "./components/AuditTrailStats";
import AuditTrailTableView from "./components/AuditTrailTableView";
import AuditTrailGridView from "./components/AuditTrailGridView";
import AuditTrailPagination from "./components/AuditTrailPagination";

const AuditTrailTablePage: React.FC = () => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showStats, setShowStats] = useState(false); // Add show/hide stats state

  const {
    auditTrails,
    stats,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalItems,
    searchQuery,
    setSearchQuery,
    actionFilter,
    setActionFilter,
    actorFilter,
    setActorFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    viewMode,
    setViewMode,
    selectedTrails,
    setSelectedTrails,
    fetchAuditTrails,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    severityFilter,
    setSeverityFilter,
  } = useAuditTrailData();

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTrailId, setSelectedTrailId] = useState<number | null>(null);

  const {
    handleExportCSV,
    handleExportJSON,
    handleGenerateReport,
    handleCleanupOldTrails,
    handleArchiveTrails,
    handleBulkDelete,
    handleCompactTrails,
  } = useAuditTrailActions(selectedTrails, fetchAuditTrails, {
    dateFrom,
    dateTo,
    actionFilter,
    actorFilter,
  });

  // Dialog handlers
  const openViewDialog = (id: number) => {
    setSelectedTrailId(id);
    setIsViewDialogOpen(true);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedTrailId(null);
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedTrails.length === auditTrails.length) {
      setSelectedTrails([]);
    } else {
      setSelectedTrails(auditTrails.map((a) => a.id));
    }
  };

  const toggleSelectTrail = (id: number) => {
    setSelectedTrails((prev) =>
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

  const handleActionFilterChange = (action: string) => {
    setActionFilter(action);
    setCurrentPage(1);
  };

  const handleSeverityFilterChange = (severity: string) => {
    setSeverityFilter(severity);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActionFilter("all");
    setActorFilter("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setSeverityFilter("all");
    setCurrentPage(1);
  };

  // Loading skeleton
  const renderLoadingSkeleton = () => {
    // Similar to Kabisilya loading skeleton
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
                  "Timestamp",
                  "Action",
                  "Actor",
                  "Severity",
                  "Details",
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
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-32"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20"></div>
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-40"></div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {[...Array(3)].map((_, i) => (
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
  };

  // Error state
  if (error && !auditTrails.length && !loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="p-6 bg-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1
                className="text-2xl font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <History className="w-6 h-6" />
                Audit Trail Management
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
              Error Loading Audit Trail Data
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
                <History className="w-6 h-6" />
                Audit Trail
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor and review system activities, user actions, and security
                events
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Stats Toggle Button */}
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
                onClick={() => handleGenerateReport("summary")}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md flex items-center bg-blue-600 text-white hover:bg-blue-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="h-full p-6">
            {/* Stats Cards - Conditionally Rendered */}
            {showStats && (
              <div className="mb-6">
                <AuditTrailStats stats={stats} />
              </div>
            )}

            {/* Filters */}
            <div className="mb-6">
              <AuditTrailFilters
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                actionFilter={actionFilter}
                setActionFilter={setActionFilter}
                actorFilter={actorFilter}
                setActorFilter={setActorFilter}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                viewMode={viewMode}
                setViewMode={setViewMode}
                handleRefresh={handleRefresh}
                refreshing={refreshing}
                handleActionFilterChange={handleActionFilterChange}
                handleSeverityFilterChange={handleSeverityFilterChange}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                setCurrentPage={setCurrentPage}
                severityFilter={severityFilter}
                clearFilters={clearFilters}
                showAdvancedFilters={showAdvancedFilters}
                setShowAdvancedFilters={setShowAdvancedFilters}
                onCleanupClick={handleCleanupOldTrails}
                onArchiveClick={handleArchiveTrails}
                onCompactClick={handleCompactTrails}
              />
            </div>

            {/* Bulk Actions */}
            {selectedTrails.length > 0 && (
              <div className="mb-6">
                <AuditTrailBulkActions
                  selectedCount={selectedTrails.length}
                  onBulkDelete={handleBulkDelete}
                  onClearSelection={() => setSelectedTrails([])}
                />
              </div>
            )}

            {/* Loading State */}
            {loading && !refreshing && (
              <div className="mb-6">{renderLoadingSkeleton()}</div>
            )}

            {/* Table or Grid View */}
            {!loading && auditTrails.length === 0 ? (
              <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-300 bg-white">
                <div className="text-center p-8">
                  <History
                    className="w-16 h-16 mx-auto mb-4 opacity-20"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">
                    No Audit Trails Found
                  </h3>
                  <p className="text-sm mb-6 max-w-md mx-auto text-gray-600">
                    {searchQuery
                      ? `No results found for "${searchQuery}". Try a different search term.`
                      : "No audit trail records found for the selected filters."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md inline-flex items-center bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : !loading && auditTrails.length > 0 ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                  {viewMode === "table" ? (
                    <AuditTrailTableView
                      auditTrails={auditTrails}
                      selectedTrails={selectedTrails}
                      toggleSelectAll={toggleSelectAll}
                      toggleSelectTrail={toggleSelectTrail}
                      onView={openViewDialog}
                      sortBy={sortBy}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  ) : (
                    <div className="p-6">
                      <AuditTrailGridView
                        auditTrails={auditTrails}
                        selectedTrails={selectedTrails}
                        toggleSelectTrail={toggleSelectTrail}
                        onView={openViewDialog}
                      />
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <AuditTrailPagination
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

      {/* Audit Trail View Dialog */}
      {isViewDialogOpen && selectedTrailId && (
        <AuditTrailViewDialog id={selectedTrailId} onClose={closeViewDialog} />
      )}
    </>
  );
};

export default AuditTrailTablePage;