// components/Worker/hooks/useWorkerData.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import workerAPI from "../../../../apis/worker";
import { showError } from "../../../../utils/notification";

type WorkerApiShape =
  | any[] // plain array
  | { workers: any[]; pagination?: { total?: number; totalPages?: number } }
  | { items: any[]; pagination?: { total?: number; totalPages?: number } }
  | Record<string, any>;

export const useWorkerData = () => {
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kabisilyaFilter, setKabisilyaFilter] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parseResponse = (data: WorkerApiShape) => {
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        totalPages: Math.max(1, Math.ceil(data.length / limit)),
      };
    }
    if (data && Array.isArray((data as any).workers)) {
      const items = (data as any).workers as any[];
      const pagination = (data as any).pagination;
      return {
        items,
        total: pagination?.total ?? items.length,
        totalPages:
          pagination?.totalPages ??
          Math.max(1, Math.ceil(items.length / limit)),
      };
    }
    if (data && Array.isArray((data as any).items)) {
      const items = (data as any).items as any[];
      const pagination = (data as any).pagination;
      return {
        items,
        total: pagination?.total ?? items.length,
        totalPages:
          pagination?.totalPages ??
          Math.max(1, Math.ceil(items.length / limit)),
      };
    }
    if (data && Array.isArray((data as any).data)) {
      const items = (data as any).data as any[];
      const pagination = (data as any).pagination;
      return {
        items,
        total: pagination?.total ?? items.length,
        totalPages:
          pagination?.totalPages ??
          Math.max(1, Math.ceil(items.length / limit)),
      };
    }
    return { items: [] as any[], total: 0, totalPages: 1 };
  };

  const fetchWorkers = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit,
        sortBy,
        sortOrder,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(kabisilyaFilter != null && { kabisilyaId: kabisilyaFilter }),
        ...(searchQuery.trim() && { query: searchQuery.trim() }),
      };

      let response: any;
      // Prefer dedicated search endpoint if it exists and there's a query
      if (
        searchQuery.trim() &&
        typeof (workerAPI as any).searchWorkers === "function"
      ) {
        // some APIs accept params object, some accept (query, params). Try both safely.
        try {
          response = await (workerAPI as any).searchWorkers(params);
        } catch {
          response = await (workerAPI as any).searchWorkers(
            searchQuery.trim(),
            params,
          );
        }
      } else if (typeof (workerAPI as any).getAllWorkers === "function") {
        // try calling with params object
        try {
          response = await (workerAPI as any).getAllWorkers(params);
        } catch {
          // fallback to positional signature if present: (page, limit, sortBy, sortOrder, status)
          try {
            response = await (workerAPI as any).getAllWorkers(
              currentPage,
              limit,
              sortBy,
              sortOrder,
              statusFilter === "inactive",
            );
          } catch {
            // last resort: call generic getAll
            response = await (workerAPI as any).getAll(params);
          }
        }
      } else {
        // generic fallback
        response = await (workerAPI as any).getAll(params);
      }

      if (!response || !response.status) {
        throw new Error(response?.message || "Failed to fetch workers");
      }

      const parsed = parseResponse(response.data);
      setAllWorkers(parsed.items);
      setTotalItems(parsed.total);
      setTotalPages(parsed.totalPages);
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
      showError(err?.message ?? "Failed to fetch workers");
      console.error("Failed to fetch workers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    currentPage,
    limit,
    searchQuery,
    statusFilter,
    kabisilyaFilter,
    sortBy,
    sortOrder,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await (workerAPI as any).getWorkerStats();
      if (response?.status) {
        // some APIs return { stats: {...} } or direct object
        setStats(response.data?.stats ?? response.data ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch worker stats:", err);
    }
  }, []);

  // Sorting
  const sortedWorkers = useMemo(() => {
    const arr = [...allWorkers];
    arr.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          break;
        case "status":
          aValue = a.isActive == null ? "" : a.isActive ? "active" : "inactive";
          bValue = b.isActive == null ? "" : b.isActive ? "active" : "inactive";
          break;
        case "createdAt":
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          aValue = a.id ?? 0;
          bValue = b.id ?? 0;
      }

      if (aValue === bValue) return 0;
      if (sortOrder === "ASC") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
    return arr;
  }, [allWorkers, sortBy, sortOrder]);

  // Pagination: derive visible workers
  useEffect(() => {
    const startIdx = (currentPage - 1) * limit;
    const endIdx = startIdx + limit;
    setWorkers(sortedWorkers.slice(startIdx, endIdx));
  }, [sortedWorkers, currentPage, limit]);

  // Initial load
  useEffect(() => {
    fetchWorkers();
    fetchStats();
  }, [fetchWorkers, fetchStats]);

  // Debounced search: reset to page 1 and fetch
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchWorkers();
    }, 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, fetchWorkers]);

  // Reset selections on page change
  useEffect(() => {
    setSelectedWorkers([]);
  }, [currentPage]);

  const handleRefresh = useCallback(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      } else {
        setSortBy(field);
        setSortOrder("ASC");
      }
      setCurrentPage(1);
    },
    [sortBy],
  );

  return {
    workers,
    allWorkers,
    stats,
    loading,
    refreshing,
    error,
    currentPage,
    totalPages,
    totalItems,
    limit,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    kabisilyaFilter,
    setKabisilyaFilter,
    viewMode,
    setViewMode,
    selectedWorkers,
    setSelectedWorkers,
    fetchWorkers,
    handleRefresh,
    setCurrentPage,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleSort,
  };
};
