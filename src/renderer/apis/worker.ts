// workerAPI.ts - Similar structure to activation.ts
export interface WorkerData {
  id: number;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  hireDate: string | null;
  totalDebt: number;
  totalPaid: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
  kabisilya?: {
    id: number;
    name: string;
  };
}

export interface WorkerDebtSummaryData {
  totalDebts: number;
  totalOriginalAmount: number;
  totalAmount: number;
  totalBalance: number;
  totalInterest: number;
  totalPaid: number;
  byStatus: {
    pending: number;
    partially_paid: number;
    paid: number;
    cancelled: number;
    overdue: number;
  };
  overdueDebts: any[];
  averageInterestRate: number;
}

export interface WorkerPaymentSummaryData {
  totalPayments: number;
  totalGrossPay: number;
  totalNetPay: number;
  totalDebtDeduction: number;
  totalOtherDeductions: number;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    partially_paid: number;
  };
  byPaymentMethod: Record<string, { count: number; totalAmount: number }>;
  averageNetPay: number;
}

export interface WorkerAssignmentSummaryData {
  totalAssignments: number;
  totalLuwang: number;
  activeAssignments: number;
  completedAssignments: number;
  cancelledAssignments: number;
  byBukid: Record<string, number>;
  byPitak: Record<string, { count: number; totalLuwang: number; bukid: string }>;
  averageLuwang: number;
  productivity: {
    totalDaysWorked: number;
    averageLuwangPerDay: number;
    averageLuwangPerAssignment: number;
    completionRate: number;
    activeRate: number;
  };
}

export interface WorkerSummaryData {
  basicInfo: {
    name: string;
    status: string;
    hireDate: string | null;
    daysEmployed: number;
  };
  counts: {
    totalDebts: number;
    totalPayments: number;
    totalAssignments: number;
    activeAssignments: number;
  };
  financial: {
    totalDebt: number;
    totalPaid: number;
    currentBalance: number;
  };
}

export interface WorkerStatsData {
  totals: {
    all: number;
    active: number;
    inactive: number;
    onLeave: number;
    terminated: number;
  };
  distribution: {
    byKabisilya: Array<{ name: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  };
  financial: {
    averageBalance: number;
    totalDebt: number;
  };
  trends: {
    recentHires: number;
    hireRate: number;
  };
  percentages: {
    activeRate: number;
    turnoverRate: number;
  };
}

export interface WorkerAttendanceData {
  period: {
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  attendance: Array<{
    date: string;
    day: number;
    dayOfWeek: string;
    isWeekend: boolean;
    assignments: any[];
    hasWork: boolean;
    totalLuwang: number;
  }>;
  weeks: Array<{
    week: number;
    days: any[];
    summary: {
      daysInWeek: number;
      daysWorked: number;
      totalLuwang: number;
      averageLuwang: number;
    };
  }>;
  summary: {
    totalDays: number;
    workingDays: number;
    daysWorked: number;
    daysOff: number;
    weekendDaysWorked: number;
    totalLuwang: number;
    averageLuwangPerDay: number;
    attendanceRate: number;
  };
}

export interface WorkerPerformanceData {
  period: {
    type: string;
    current: {
      start: string;
      end: string;
      label: string;
    };
    previous: {
      start: string;
      end: string;
      label: string;
    } | null;
  };
  currentPeriod: {
    assignments: {
      total: number;
      completed: number;
      active: number;
      totalLuwang: number;
      completionRate: number;
    };
    payments: {
      total: number;
      totalNetPay: number;
      averageNetPay: number;
    };
    productivity: {
      luwangPerDay: number;
      earningsPerLuwang: number;
    };
  };
  performance: {
    score: number;
    grade: string;
    metrics: {
      attendance: string;
      quality: string;
      productivity: string;
    };
  };
  recommendations: Array<{
    type: string;
    area: string;
    current: string;
    target: string;
    suggestion: string;
  }>;
}

export interface WorkerReportData {
  worker: {
    id: number;
    name: string;
    contact: string | null;
    email: string | null;
    address: string | null;
    status: string;
    hireDate: string | null;
    kabisilya: string;
    totalDebt: number;
    totalPaid: number;
    currentBalance: number;
  };
  generatedAt: string;
  period: string | { startDate: string; endDate: string };
  financial?: {
    debts: {
      total: number;
      items: any[];
      summary: any;
    };
    payments: {
      total: number;
      items: any[];
      summary: any;
    };
  };
  assignments?: {
    total: number;
    items: any[];
    summary: any;
  };
  overallSummary?: {
    workDuration: string;
    averageMonthlyNetPay: number;
    debtToIncomeRatio: number;
    assignmentCompletionRate: number;
  };
  recommendations?: any[];
}

export interface WorkerCreateData {
  name: string;
  contact?: string;
  email?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'on-leave' | 'terminated';
  hireDate?: string;
  kabisilyaId?: number;
}

export interface WorkerUpdateData {
  id: number;
  name?: string;
  contact?: string;
  email?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'on-leave' | 'terminated';
  hireDate?: string;
  kabisilyaId?: number;
}

export interface WorkerSearchParams {
  query: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  kabisilyaId?: number;
}

export interface WorkerBulkCreateData {
  workers: WorkerCreateData[];
}

export interface WorkerBulkUpdateData {
  updates: Array<{
    id: number;
    [key: string]: any;
  }>;
}

export interface WorkerExportParams {
  workerIds?: number[];
  status?: string;
  kabisilyaId?: number;
  startDate?: string;
  endDate?: string;
  includeFields?: string | string[];
}

export interface WorkerResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface WorkerPaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WorkerListResponseData {
  workers: WorkerData[];
  pagination: WorkerPaginationData;
  stats?: any;
}

export interface WorkerDetailResponseData {
  worker: WorkerData;
  summary?: WorkerSummaryData;
}

export interface WorkerPayload {
  method: string;
  params?: Record<string, any>;
}

class WorkerAPI {
  // 📋 READ-ONLY METHODS

  async getAllWorkers(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<WorkerResponse<WorkerListResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getAllWorkers",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all workers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all workers");
    }
  }

  async getWorkerById(id: number): Promise<WorkerResponse<WorkerDetailResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker");
    }
  }

  async getWorkerByName(name: string): Promise<WorkerResponse<WorkerListResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerByName",
        params: { name },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker by name");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker by name");
    }
  }

  async getWorkerByKabisilya(kabisilyaId: number, status?: string): Promise<WorkerResponse<WorkerListResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerByKabisilya",
        params: { kabisilyaId, status },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get workers by kabisilya");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get workers by kabisilya");
    }
  }

  async getWorkerByStatus(status: string, page?: number, limit?: number): Promise<WorkerResponse<WorkerListResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerByStatus",
        params: { status, page, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get workers by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get workers by status");
    }
  }

  async getWorkerWithDebts(id: number): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerWithDebts",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker with debts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker with debts");
    }
  }

  async getWorkerWithPayments(id: number, periodStart?: string, periodEnd?: string): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerWithPayments",
        params: { id, periodStart, periodEnd },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker with payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker with payments");
    }
  }

  async getWorkerWithAssignments(id: number, startDate?: string, endDate?: string): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerWithAssignments",
        params: { id, startDate, endDate },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker with assignments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker with assignments");
    }
  }

  async getWorkerSummary(id: number): Promise<WorkerResponse<WorkerDetailResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerSummary",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker summary");
    }
  }

  async getActiveWorkers(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeKabisilya?: boolean;
  }): Promise<WorkerResponse<WorkerListResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getActiveWorkers",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active workers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get active workers");
    }
  }

  async getWorkerStats(): Promise<WorkerResponse<{ stats: WorkerStatsData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker statistics");
    }
  }

  async searchWorkers(params: WorkerSearchParams): Promise<WorkerResponse<WorkerListResponseData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "searchWorkers",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search workers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search workers");
    }
  }

  async getKabisilyaInfo(workerId: number): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getKabisilyaInfo",
        params: { workerId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get kabisilya information");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get kabisilya information");
    }
  }

  async getWorkerDebtSummary(workerId: number, includeHistory?: boolean): Promise<WorkerResponse<{ debts: any[]; summary: WorkerDebtSummaryData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerDebtSummary",
        params: { workerId, includeHistory },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker debt summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker debt summary");
    }
  }

  async getWorkerPaymentSummary(workerId: number, periodStart?: string, periodEnd?: string, groupBy?: string): Promise<WorkerResponse<{ payments: any[]; summary: WorkerPaymentSummaryData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerPaymentSummary",
        params: { workerId, periodStart, periodEnd, groupBy },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker payment summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker payment summary");
    }
  }

  async getWorkerAssignmentSummary(workerId: number, startDate?: string, endDate?: string, groupBy?: string): Promise<WorkerResponse<{ assignments: any[]; summary: WorkerAssignmentSummaryData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerAssignmentSummary",
        params: { workerId, startDate, endDate, groupBy },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker assignment summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker assignment summary");
    }
  }

  async calculateWorkerBalance(workerId: number, recalculate?: boolean): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "calculateWorkerBalance",
        params: { workerId, recalculate },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate worker balance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate worker balance");
    }
  }

  async getWorkerAttendance(workerId: number, month?: number, year?: number): Promise<WorkerResponse<WorkerAttendanceData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerAttendance",
        params: { workerId, month, year },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker attendance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker attendance");
    }
  }

  async getWorkerPerformance(workerId: number, period?: string, compareToPrevious?: boolean): Promise<WorkerResponse<WorkerPerformanceData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "getWorkerPerformance",
        params: { workerId, period, compareToPrevious },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker performance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker performance");
    }
  }

  // ✏️ WRITE METHODS

  async createWorker(data: WorkerCreateData): Promise<WorkerResponse<{ worker: WorkerData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "createWorker",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create worker");
    }
  }

  async updateWorker(data: WorkerUpdateData): Promise<WorkerResponse<{ worker: WorkerData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "updateWorker",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update worker");
    }
  }

  async deleteWorker(id: number): Promise<WorkerResponse<{ id: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "deleteWorker",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete worker");
    }
  }

  async updateWorkerStatus(id: number, status: string, notes?: string): Promise<WorkerResponse<{ worker: WorkerData; change: { oldStatus: string; newStatus: string } }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "updateWorkerStatus",
        params: { id, status, notes },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update worker status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update worker status");
    }
  }

  async updateWorkerContact(id: number, contact?: string, email?: string, address?: string): Promise<WorkerResponse<{ worker: WorkerData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "updateWorkerContact",
        params: { id, contact, email, address },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update worker contact");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update worker contact");
    }
  }

  async updateWorkerFinancials(id: number, totalDebt?: number, totalPaid?: number, currentBalance?: number): Promise<WorkerResponse<{ worker: WorkerData; changes: any }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "updateWorkerFinancials",
        params: { id, totalDebt, totalPaid, currentBalance },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update worker financials");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update worker financials");
    }
  }

  async assignToKabisilya(workerId: number, kabisilyaId: number): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "assignToKabisilya",
        params: { workerId, kabisilyaId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to assign worker to kabisilya");
    } catch (error: any) {
      throw new Error(error.message || "Failed to assign worker to kabisilya");
    }
  }

  async removeFromKabisilya(workerId: number): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "removeFromKabisilya",
        params: { workerId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to remove worker from kabisilya");
    } catch (error: any) {
      throw new Error(error.message || "Failed to remove worker from kabisilya");
    }
  }

  // 🔄 BATCH OPERATIONS

  async bulkCreateWorkers(data: WorkerBulkCreateData): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "bulkCreateWorkers",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create workers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create workers");
    }
  }

  async bulkUpdateWorkers(data: WorkerBulkUpdateData): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "bulkUpdateWorkers",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update workers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update workers");
    }
  }

  async importWorkersFromCSV(filePath: string, hasHeader?: boolean, delimiter?: string): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "importWorkersFromCSV",
        params: { filePath, hasHeader, delimiter },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import workers from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import workers from CSV");
    }
  }

  async exportWorkersToCSV(params: WorkerExportParams): Promise<WorkerResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "exportWorkersToCSV",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export workers to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export workers to CSV");
    }
  }

  async generateWorkerReport(workerId: number, reportType?: string, startDate?: string, endDate?: string, format?: string): Promise<WorkerResponse<WorkerReportData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.worker) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.worker({
        method: "generateWorkerReport",
        params: { workerId, reportType, startDate, endDate, format },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate worker report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate worker report");
    }
  }

  // 🛠️ UTILITY METHODS

  async searchWorkerByName(name: string): Promise<WorkerData | null> {
    try {
      const response = await this.getWorkerByName(name);
      if (response.data.workers && response.data.workers.length > 0) {
        return response.data.workers[0];
      }
      return null;
    } catch (error) {
      console.error("Error searching worker by name:", error);
      return null;
    }
  }

  async getActiveWorkerCount(): Promise<number> {
    try {
      const response = await this.getActiveWorkers({ page: 1, limit: 1 });
      return response.data.pagination.total;
    } catch (error) {
      console.error("Error getting active worker count:", error);
      return 0;
    }
  }

  async isWorkerActive(workerId: number): Promise<boolean> {
    try {
      const response = await this.getWorkerById(workerId);
      return response.data.worker.status === 'active';
    } catch (error) {
      console.error("Error checking if worker is active:", error);
      return false;
    }
  }

  async getWorkerFinancialSummary(workerId: number): Promise<{ totalDebt: number; totalPaid: number; currentBalance: number } | null> {
    try {
      const response = await this.getWorkerSummary(workerId);
      return {
        totalDebt: response.data.summary?.financial.totalDebt || 0,
        totalPaid: response.data.summary?.financial.totalPaid || 0,
        currentBalance: response.data.summary?.financial.currentBalance || 0
      };
    } catch (error) {
      console.error("Error getting worker financial summary:", error);
      return null;
    }
  }

  async validateWorkerEmail(email: string): Promise<boolean> {
    try {
      const response = await this.searchWorkers({ query: email, limit: 1 });
      return response.data.workers.length === 0;
    } catch (error) {
      console.error("Error validating worker email:", error);
      return false;
    }
  }

  async calculateWorkerMetrics(workerId: number): Promise<{
    attendanceRate: number;
    productivityScore: number;
    completionRate: number;
    financialHealth: string;
  } | null> {
    try {
      const [attendanceRes, performanceRes] = await Promise.all([
        this.getWorkerAttendance(workerId),
        this.getWorkerPerformance(workerId, 'month', false)
      ]);

      const attendanceRate = attendanceRes.data.summary?.attendanceRate || 0;
      const productivityScore = performanceRes.data.performance?.score || 0;
      const completionRate = performanceRes.data.currentPeriod?.assignments.completionRate || 0;

      let financialHealth = 'good';
      const financialSummary = await this.getWorkerFinancialSummary(workerId);
      if (financialSummary) {
        if (financialSummary.currentBalance > 10000) financialHealth = 'critical';
        else if (financialSummary.currentBalance > 5000) financialHealth = 'warning';
        else if (financialSummary.currentBalance > 0) financialHealth = 'moderate';
        else financialHealth = 'good';
      }

      return {
        attendanceRate,
        productivityScore,
        completionRate,
        financialHealth
      };
    } catch (error) {
      console.error("Error calculating worker metrics:", error);
      return null;
    }
  }

  async createWorkerWithValidation(data: WorkerCreateData): Promise<WorkerResponse<{ worker: WorkerData }>> {
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        throw new Error("Worker name is required");
      }

      // Validate email if provided
      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error("Invalid email format");
        }

        // Check if email already exists
        const isEmailAvailable = await this.validateWorkerEmail(data.email);
        if (!isEmailAvailable) {
          throw new Error("Email already exists");
        }
      }

      // Validate status
      const validStatuses = ['active', 'inactive', 'on-leave', 'terminated'];
      if (data.status && !validStatuses.includes(data.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      return await this.createWorker(data);
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Validation failed",
        data: {
          worker: {} as WorkerData
        }
      };
    }
  }

  async updateWorkerWithValidation(data: WorkerUpdateData): Promise<WorkerResponse<{ worker: WorkerData }>> {
    try {
      if (!data.id) {
        throw new Error("Worker ID is required");
      }

      // Get current worker data
      const currentWorker = await this.getWorkerById(data.id);
      if (!currentWorker.status) {
        throw new Error("Worker not found");
      }

      // Validate email if being changed
      if (data.email && data.email !== currentWorker.data.worker.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error("Invalid email format");
        }

        const isEmailAvailable = await this.validateWorkerEmail(data.email);
        if (!isEmailAvailable) {
          throw new Error("Email already exists");
        }
      }

      // Validate status
      if (data.status) {
        const validStatuses = ['active', 'inactive', 'on-leave', 'terminated'];
        if (!validStatuses.includes(data.status)) {
          throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      return await this.updateWorker(data);
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Validation failed",
        data: {
          worker: {} as WorkerData
        }
      };
    }
  }

  async getWorkersByKabisilyaName(kabisilyaName: string): Promise<WorkerData[]> {
    try {
      // Note: This might require a different endpoint or filtering
      // For now, we'll get all workers and filter by kabisilya name
      const response = await this.getAllWorkers({ limit: 1000 });
      return response.data.workers.filter(worker => 
        worker.kabisilya?.name === kabisilyaName
      );
    } catch (error) {
      console.error("Error getting workers by kabisilya name:", error);
      return [];
    }
  }

  async getWorkersWithDebt(debtThreshold: number = 0): Promise<WorkerData[]> {
    try {
      const response = await this.getAllWorkers({ limit: 1000 });
      return response.data.workers.filter(worker => 
        parseFloat(worker.currentBalance.toString()) > debtThreshold
      );
    } catch (error) {
      console.error("Error getting workers with debt:", error);
      return [];
    }
  }

  // 📊 STATISTICS UTILITIES

  async getWorkerStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withDebt: number;
    averageBalance: number;
  }> {
    try {
      const [statsRes, workersRes] = await Promise.all([
        this.getWorkerStats(),
        this.getAllWorkers({ limit: 1000 })
      ]);

      const stats = statsRes.data.stats;
      const workers = workersRes.data.workers;

      const workersWithDebt = workers.filter(w => 
        parseFloat(w.currentBalance.toString()) > 0
      ).length;

      const totalBalance = workers.reduce((sum, w) => 
        sum + parseFloat(w.currentBalance.toString()), 0
      );

      return {
        total: stats.totals.all,
        active: stats.totals.active,
        inactive: stats.totals.inactive + stats.totals.terminated,
        withDebt: workersWithDebt,
        averageBalance: stats.totals.all > 0 ? totalBalance / stats.totals.all : 0
      };
    } catch (error) {
      console.error("Error getting worker statistics:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        withDebt: 0,
        averageBalance: 0
      };
    }
  }

  // 🎯 EVENT LISTENERS (if supported by backend)

  onWorkerCreated(callback: (data: WorkerData) => void) {
    if (window.backendAPI && window.backendAPI.onWorkerCreated) {
      window.backendAPI.onWorkerCreated(callback);
    }
  }

  onWorkerUpdated(callback: (data: { id: number; changes: any }) => void) {
    if (window.backendAPI && window.backendAPI.onWorkerUpdated) {
      window.backendAPI.onWorkerUpdated(callback);
    }
  }

  onWorkerDeleted(callback: (id: number) => void) {
    if (window.backendAPI && window.backendAPI.onWorkerDeleted) {
      window.backendAPI.onWorkerDeleted(callback);
    }
  }

  onWorkerStatusChanged(callback: (data: { id: number; oldStatus: string; newStatus: string }) => void) {
    if (window.backendAPI && window.backendAPI.onWorkerStatusChanged) {
      window.backendAPI.onWorkerStatusChanged(callback);
    }
  }
}

const workerAPI = new WorkerAPI();

export default workerAPI;