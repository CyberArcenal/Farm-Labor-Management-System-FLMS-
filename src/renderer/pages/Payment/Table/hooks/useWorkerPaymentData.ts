// components/Payment/hooks/useWorkerPaymentData.ts
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import paymentAPI from "../../../../apis/payment";
import workerAPI from "../../../../apis/worker";
import type {
  PaymentData,
  PaymentStatsData,
  PaymentSummaryData,
  PaymentPaginationData,
  WorkerPaymentSummaryData,
} from "../../../../apis/payment";
import { showError } from "../../../../utils/notification";

export interface WorkerPaymentSummary {
  worker: any;
  totalPayments: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDeductions: number;
  pendingPayments: number;
  processingPayments: number;
  completedPayments: number;
  cancelledPayments: number;
  partiallyPaidPayments: number;
  totalDebt: number;
  lastPaymentDate: string | null;
  paymentMethods: Set<string>;
  payments: PaymentData[];
  recentPayments: PaymentData[];
}

export const useWorkerPaymentData = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [workerSummaries, setWorkerSummaries] = useState<WorkerPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination para sa worker view
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(10); // Same limit as payment view

  // Filters para sa worker view
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("totalNetPay");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagkalkula ng worker summaries mula sa mga workers
  const calculateWorkerSummaries = useCallback(async (workerList: any[]) => {
    try {
      const summaries: WorkerPaymentSummary[] = [];

      for (const worker of workerList) {
        try {
          // Kumuha ng payment summary para sa bawat worker
          const paymentResponse = await paymentAPI.getWorkerPaymentSummary(worker.id, {
            startDate: dateFrom || undefined,
            endDate: dateTo || undefined,
          });

          if (paymentResponse.status) {
            const summaryData = paymentResponse.data;
            
            // Kumuha ng recent payments para sa worker
            const recentPaymentsRes = await paymentAPI.getPaymentsByWorker(worker.id, {
              limit: 5,
              page: 1,
              status: statusFilter !== "all" ? statusFilter : undefined,
            });

            const workerSummary: WorkerPaymentSummary = {
              worker,
              totalPayments: summaryData.summary?.totalPayments || 0,
              totalGrossPay: parseFloat(summaryData.summary?.totalGross?.toString() || "0"),
              totalNetPay: parseFloat(summaryData.summary?.totalNet?.toString() || "0"),
              totalDeductions: summaryData.summary?.totalDeductions || 0,
              pendingPayments: Object.entries(summaryData.summary?.statusDistribution || {}).find(([key]) => 
                key.includes('pending'))?.[1] || 0,
              processingPayments: Object.entries(summaryData.summary?.statusDistribution || {}).find(([key]) => 
                key.includes('processing'))?.[1] || 0,
              completedPayments: Object.entries(summaryData.summary?.statusDistribution || {}).find(([key]) => 
                key.includes('completed'))?.[1] || 0,
              cancelledPayments: Object.entries(summaryData.summary?.statusDistribution || {}).find(([key]) => 
                key.includes('cancelled'))?.[1] || 0,
              partiallyPaidPayments: Object.entries(summaryData.summary?.statusDistribution || {}).find(([key]) => 
                key.includes('partially'))?.[1] || 0,
              totalDebt: worker.totalDebt || 0,
              lastPaymentDate: summaryData.recentPayments?.[0]?.paymentDate || null,
              paymentMethods: new Set(),
              payments: recentPaymentsRes.data?.payments || [],
              recentPayments: recentPaymentsRes.data?.payments?.slice(0, 3) || [],
            };

            // Kolektahin ang mga payment methods
            if (recentPaymentsRes.data?.payments) {
              recentPaymentsRes.data.payments.forEach((payment: PaymentData) => {
                if (payment.paymentMethod) {
                  workerSummary.paymentMethods.add(payment.paymentMethod);
                }
              });
            }

            summaries.push(workerSummary);
          }
        } catch (err) {
          console.error(`Error fetching summary for worker ${worker.id}:`, err);
          // Magpatuloy sa susunod na worker
          continue;
        }
      }

      // Pag-filter base sa search query
      let filteredSummaries = summaries;
      if (searchQuery.trim()) {
        filteredSummaries = summaries.filter(summary => 
          summary.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          summary.worker.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          summary.worker.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Pag-filter base sa status
      if (statusFilter !== "all") {
        filteredSummaries = filteredSummaries.filter(summary => {
          switch (statusFilter) {
            case "has_pending":
              return summary.pendingPayments > 0;
            case "has_debt":
              return summary.totalDebt > 0;
            case "has_completed":
              return summary.completedPayments > 0;
            default:
              return true;
          }
        });
      }

      // Pag-sort
      filteredSummaries.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case "workerName":
            aValue = a.worker.name.toLowerCase();
            bValue = b.worker.name.toLowerCase();
            break;
          case "totalPayments":
            aValue = a.totalPayments;
            bValue = b.totalPayments;
            break;
          case "totalGrossPay":
            aValue = a.totalGrossPay;
            bValue = b.totalGrossPay;
            break;
          case "totalNetPay":
            aValue = a.totalNetPay;
            bValue = b.totalNetPay;
            break;
          case "totalDeductions":
            aValue = a.totalDeductions;
            bValue = b.totalDeductions;
            break;
          case "totalDebt":
            aValue = a.totalDebt;
            bValue = b.totalDebt;
            break;
          default:
            aValue = a.totalNetPay;
            bValue = b.totalNetPay;
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Pagkalkula ng pagination
      const startIndex = (currentPage - 1) * limit;
      const paginatedSummaries = filteredSummaries.slice(startIndex, startIndex + limit);

      setWorkerSummaries(paginatedSummaries);
      setTotalItems(filteredSummaries.length);
      setTotalPages(Math.ceil(filteredSummaries.length / limit));
      
    } catch (err: any) {
      console.error("Error calculating worker summaries:", err);
      setError(err.message || "Failed to calculate worker summaries");
    }
  }, [searchQuery, statusFilter, dateFrom, dateTo, sortBy, sortOrder, currentPage, limit]);

  // Kunin ang mga workers
  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await workerAPI.getAllWorkers({
        page: currentPage,
        limit: 100, // Kunin ang lahat para ma-calculate ang summaries
        sortBy: "name",
        sortOrder: "ASC"
      });

      if (response.status) {
        setWorkers(response.data.workers || []);
        // Kalkulahin ang summaries pagkatapos makuha ang workers
        await calculateWorkerSummaries(response.data.workers || []);
      } else {
        throw new Error(response.message || "Failed to fetch workers");
      }
    } catch (err: any) {
      setError(err.message);
      showError(err.message);
      console.error("Failed to fetch workers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calculateWorkerSummaries, currentPage]);

  // Initial load
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Search debounce para sa worker view
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when search changes
      fetchWorkers(); // I-refresh ang data
    }, 500);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // I-refresh ang data kapag nagbago ang mga filter
  useEffect(() => {
    setCurrentPage(1);
    fetchWorkers();
  }, [statusFilter, dateFrom, dateTo, sortBy, sortOrder]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkers();
  };

  return {
    // Data
    workers,
    workerSummaries,
    
    // Loading states
    loading,
    refreshing,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    limit,
    setCurrentPage,
    
    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    
    // Sorting
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    
    // Actions
    handleRefresh,
    fetchWorkers,
  };
};