export type HistoryType = 'payment' | 'debt';

export interface HistoryFilters {
  dateFrom: string;
  dateTo: string;
  transactionType: string;
  status: string;
  workerId?: number;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery: string;
}

export interface HistoryStats {
  totalRecords: number;
  totalAmount: number;
  averageAmount: number;
  mostActiveWorker: string;
  mostRecent: string;
  byMonth: Array<{ month: string; count: number; amount: number }>;
  byStatus: Record<string, number>;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}