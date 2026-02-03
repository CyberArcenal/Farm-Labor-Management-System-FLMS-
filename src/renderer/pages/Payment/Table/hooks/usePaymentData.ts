// components/Payment/hooks/usePaymentData.ts
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import paymentAPI from "../../../../apis/payment";
import type {
  PaymentData,
  PaymentStatsData,
  PaymentSummaryData,
  PaymentPaginationData,
} from "../../../../apis/payment";
import { showError } from "../../../../utils/notification";

export const usePaymentData = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [stats, setStats] = useState<PaymentStatsData | null>(null);
  const [summary, setSummary] = useState<PaymentSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [workerFilter, setWorkerFilter] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("paymentDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // View options
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedPayments, setSelectedPayments] = useState<number[]>([]);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        status: statusFilter !== "all" ? statusFilter : undefined,
        workerId: workerFilter || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        paymentMethod:
          paymentMethodFilter !== "all" ? paymentMethodFilter : undefined,
        page: currentPage, // Current page from state
        limit: limit, // Limit from state
        sortBy: sortBy, // Sorting from state
        sortOrder: sortOrder, // Sort order from state
      };

      let response;
      if (searchQuery.trim()) {
        // If searching, we might want to handle it differently
        response = await paymentAPI.searchPayments({
          query: searchQuery,
          page: currentPage,
          limit: limit,
          sortBy: sortBy,
          sortOrder: sortOrder,
        });
      } else {
        response = await paymentAPI.getAllPayments(params);
      }

      if (response.status) {
        const data = response.data as PaymentPaginationData;

        // Set the payments directly from the API response
        setPayments(data.payments || []);

        // Set pagination info from API
        setTotalItems(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);

        // Remove client-side sorting and pagination - let server handle it
        // Since we're passing sortBy and sortOrder to the API
      } else {
        throw new Error(response.message || "Failed to fetch payments");
      }
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    searchQuery,
    statusFilter,
    workerFilter,
    dateFrom,
    dateTo,
    paymentMethodFilter,
    currentPage, // Add currentPage to dependencies
    limit, // Add limit to dependencies
    sortBy, // Add sortBy to dependencies
    sortOrder, // Add sortOrder to dependencies
  ]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await paymentAPI.getPaymentStats();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch payment stats:", err);
    }
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const response = await paymentAPI.getPaymentSummary({
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        workerId: workerFilter || undefined,
      });
      if (response.status) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch payment summary:", err);
    }
  }, [dateFrom, dateTo, workerFilter]);

  // Initial load and refetch when dependencies change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Fetch stats and summary separately (less frequent)
  useEffect(() => {
    fetchStats();
    fetchSummary();
  }, [fetchStats, fetchSummary]);

  // Search debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when search changes
      // fetchPayments will be called due to dependency change
    }, 500);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Reset selections on page change
  useEffect(() => {
    setSelectedPayments([]);
  }, [currentPage]);

  // Handle filter changes - reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    workerFilter,
    dateFrom,
    dateTo,
    paymentMethodFilter,
    sortBy,
    sortOrder,
  ]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPayments(), fetchStats(), fetchSummary()]);
  };

  return {
    payments, // Directly use payments from API
    stats,
    summary,
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
    paymentMethodFilter,
    setPaymentMethodFilter,
    viewMode,
    setViewMode,
    selectedPayments,
    setSelectedPayments,
    fetchPayments,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    limit,
  };
};