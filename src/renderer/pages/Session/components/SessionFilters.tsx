// components/Session/components/SessionFilters.tsx
import React, { useRef, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Grid,
  Table,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SessionFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  yearFilter: number | "all";
  setYearFilter: (year: number | "all") => void;
  seasonTypeFilter: string;
  setSeasonTypeFilter: (seasonType: string) => void;
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
  handleRefresh: () => void;
  refreshing: boolean;
  handleStatusFilterChange: (status: string) => void;
  handleYearFilterChange: (year: number | "all") => void;
  handleSeasonTypeFilterChange: (seasonType: string) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: "ASC" | "DESC";
  setSortOrder: (order: "ASC" | "DESC") => void;
  setCurrentPage: (page: number) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
}

const SessionFilters: React.FC<SessionFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  yearFilter,
  setYearFilter,
  seasonTypeFilter,
  setSeasonTypeFilter,
  viewMode,
  setViewMode,
  handleRefresh,
  refreshing,
  handleStatusFilterChange,
  handleYearFilterChange,
  handleSeasonTypeFilterChange,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  setCurrentPage,
  showAdvancedFilters,
  setShowAdvancedFilters,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    }, 500);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
  ];

  const seasonTypeOptions = [
    { value: "all", label: "All Seasons" },
    { value: "tag-ulan", label: "Tag-ulan (Rainy)" },
    { value: "tag-araw", label: "Tag-araw (Dry)" },
    { value: "other", label: "Other" },
  ];

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "year", label: "Year" },
    { value: "startDate", label: "Start Date" },
    { value: "endDate", label: "End Date" },
    { value: "createdAt", label: "Created Date" },
  ];

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sessions by name..."
            value={localSearch}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleStatusFilterChange(e.target.value);
            }}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => {
              const value =
                e.target.value === "all" ? "all" : parseInt(e.target.value);
              setYearFilter(value);
              handleYearFilterChange(value);
            }}
            className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "table" ? "bg-white shadow-sm" : "text-gray-600"}`}
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-600"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4" />
            {showAdvancedFilters ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Filters
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                More Filters
              </>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Season Type Filter */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700">
                Season Type
              </label>
              <select
                value={seasonTypeFilter}
                onChange={(e) => {
                  setSeasonTypeFilter(e.target.value);
                  handleSeasonTypeFilterChange(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {seasonTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
                  }
                  className="px-3 py-2 rounded-lg text-sm border border-gray-300 bg-white hover:bg-gray-50"
                >
                  {sortOrder === "ASC" ? "↑ Asc" : "↓ Desc"}
                </button>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setLocalSearch("");
                  setStatusFilter("all");
                  setYearFilter("all");
                  setSeasonTypeFilter("all");
                  setSortBy("startDate");
                  setSortOrder("DESC");
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionFilters;
