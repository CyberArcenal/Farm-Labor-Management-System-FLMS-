// pitakAPI.ts - Complete API for Pitak Management
import { kabAuthStore } from "../lib/kabAuthStore";

export interface PitakData {
  id: number;
  bukidId: number;
  location?: string | null;
  totalLuwang: number;
  status: "active" | "inactive" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSummary {
  id: number;
  assignmentDate: string;
  luwangCount: number;
  status: string;
  worker?: {
    id: number;
    name: string;
  };
}

export interface PaymentSummary {
  id: number;
  paymentDate: string;
  grossPay: number;
  netPay: number;
  status: string;
  worker?: {
    id: number;
    name: string;
  };
}

export interface PitakWithDetails extends PitakData {
  bukid?: {
    id: number;
    name: string;
    location?: string;
  };
  assignments?: AssignmentSummary[];
  payments?: PaymentSummary[];
  stats?: {
    assignments: {
      total: number;
      totalLuWangAssigned: number;
      completed: number;
      active: number;
    };
    payments: {
      total: number;
      totalGrossPay: number;
      totalNetPay: number;
      completed: number;
    };
    utilizationRate: number;
  };
}

export interface PitakStatsData {
  totalPitaks: number;
  activePitaks: number;
  inactivePitaks: number;
  harvestedPitaks: number;
  totalLuWangCapacity: number;
  totalLuWangAssigned: number;
  averageLuWang: number;
  utilizationRate: number;
  bukidDistribution: Record<string, number>;
}

export interface PitakProductivityData {
  pitakId: number;
  period: {
    startDate: string;
    endDate: string;
  };
  totalAssignments: number;
  totalLuWangAssigned: number;
  averageLuWangPerAssignment: number;
  uniqueWorkers: number;
  utilizationRate: number;
  topWorkers: Array<{
    workerId: number;
    workerName: string;
    assignments: number;
    totalLuWang: number;
    averageLuWang: number;
  }>;
  dailyProductivity: Array<{
    date: string;
    assignments: number;
    totalLuWang: number;
    uniqueWorkers: number;
    averageLuWangPerAssignment: number;
  }>;
}

export interface PitakUtilizationData {
  bukidId: number;
  period: {
    startDate: string;
    endDate: string;
  };
  utilizationByDay: Array<{
    date: string;
    utilizationRate: number;
    capacityUsed: number;
    capacityAvailable: number;
  }>;
  pitakUtilization: Array<{
    pitakId: number;
    location: string;
    utilizationRate: number;
    assignments: number;
  }>;
  recommendations: Array<{
    type: string;
    message: string;
    priority: "low" | "medium" | "high";
  }>;
}

export interface PitakForecastData {
  pitakId: number;
  period: string;
  forecast: Array<{
    date: string;
    forecastedLuWang: number;
    projectedUtilization: number;
    capacityRemaining: number;
    riskLevel: "low" | "medium" | "high";
  }>;
  metrics: {
    basedOnDays: number;
    averageDailyLuWang: number;
    maxDailyLuWang: number;
    confidenceScore: number;
  };
  recommendations: Array<{
    type: string;
    message: string;
    action: string;
  }>;
}

export interface PitakTrendData {
  period: {
    startDate: string;
    endDate: string;
  };
  weeklyTrends: Array<{
    weekStart: string;
    weekEnd: string;
    assignments: number;
    luWangAssigned: number;
    payments: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    assignments: number;
    luWangAssigned: number;
    revenue: number;
    growthRate: number;
  }>;
  insights: Array<{
    type: string;
    message: string;
    severity: "info" | "warning" | "critical";
  }>;
  recommendations: Array<{
    action: string;
    priority: "low" | "medium" | "high";
    timeframe: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fields: Record<string, string>;
}

export interface AvailabilityCheck {
  pitakId: number;
  location?: string;
  status: string;
  totalLuwang: number;
  isAvailable: boolean;
  reasons: string[];
  existingAssignments?: number;
  assignedWorkers?: Array<{
    workerId: number;
    workerName: string;
    luwangCount: number;
  }>;
  remainingLuWang: number;
  utilizationRate: number;
  recommendation: {
    canAssign: boolean;
    maxLuWang?: number;
    message: string;
    reasons?: string[];
    suggestedAction?: string;
  };
}

export interface DuplicateCheck {
  bukidId: number;
  location?: string;
  exactMatches: Array<{
    id: number;
    location?: string;
    totalLuwang: number;
    status: string;
    createdAt: string;
  }>;
  similarMatches: Array<{
    id: number;
    location?: string;
    totalLuwang: number;
    status: string;
    similarity: number;
    createdAt: string;
  }>;
  hasDuplicates: boolean;
  riskAssessment: {
    score: number;
    level: "none" | "low" | "medium" | "high";
    reasons: string[];
    recommendation: string;
  };
}

export interface CapacityValidation {
  pitakId: number;
  location?: string;
  totalCapacity: number;
  currentlyAssigned: number;
  remainingCapacity: number;
  requested: number;
  canAccommodate: boolean;
  utilizationRate: number;
  assignments: Array<{
    id: number;
    assignmentDate: string;
    luwangCount: number;
    status: string;
    worker?: {
      id: number;
      name: string;
    };
  }>;
  recommendations: Array<{
    type: string;
    message: string;
    severity?: "warning" | "error";
    options?: string[];
  }>;
}

export interface BulkCreateResult {
  created: PitakData[];
  skipped: Array<{
    pitak: any;
    reason: string;
    existingPitakId?: number;
  }>;
  failed: Array<{
    pitak: any;
    errors: string[];
  }>;
  meta: {
    totalProcessed: number;
    totalCreated: number;
    totalSkipped: number;
    totalFailed: number;
    totalLuWangCreated: number;
  };
}

export interface ImportResult {
  imported: PitakData[];
  errors: Array<{
    row: number;
    error: string;
    data: string;
  }>;
  successful: Array<{
    row: number;
    pitakId: number;
    location?: string;
  }>;
  meta: {
    totalRows: number;
    imported: number;
    failed: number;
    totalLuWangImported: number;
  };
}

export interface ExportResult {
  csv: string;
  filename: string;
  count: number;
  totalLuWang?: number;
}

export interface PitakReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalPitaks: number;
    activePitaks: number;
    inactivePitaks: number;
    harvestedPitaks: number;
    totalLuWangCapacity: number;
    totalAssignments: number;
    totalLuWangAssigned: number;
    totalPayments: number;
    totalGrossPay: number;
    totalNetPay: number;
    utilizationRate: number;
  };
  detailedData: Array<{
    pitak: PitakData;
    assignmentMetrics: {
      totalAssignments: number;
      totalLuWang: number;
      completedCount: number;
      activeCount: number;
      cancelledCount: number;
    };
    paymentMetrics: {
      totalPayments: number;
      totalGrossPay: number;
      totalNetPay: number;
      totalDebtDeduction: number;
      completedCount: number;
    };
    assignments: AssignmentSummary[];
    payments: PaymentSummary[];
  }>;
  generatedAt: string;
}

export interface LuWangReportData {
  pitakId: number;
  period: {
    startDate: string;
    endDate: string;
  };
  luWangSummary: {
    totalCapacity: number;
    totalAssigned: number;
    utilizationRate: number;
    averageDailyLuWang: number;
    peakDailyLuWang: number;
    daysWithAssignments: number;
  };
  dailyBreakdown: Array<{
    date: string;
    assignments: number;
    totalLuWang: number;
    workers: number;
  }>;
  workerPerformance: Array<{
    workerId: number;
    workerName: string;
    totalLuWang: number;
    assignments: number;
    averageLuWang: number;
  }>;
}

// Response Interfaces
export interface PitakResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
  meta?: any;
}

export interface PitakListResponse extends PitakResponse<PitakWithDetails[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats?: PitakStatsData;
  };
}

export interface PitakDetailResponse extends PitakResponse<PitakWithDetails> {}

export interface PitakStatsResponse extends PitakResponse<PitakStatsData> {}

export interface PitakProductivityResponse extends PitakResponse<PitakProductivityData> {}

export interface PitakUtilizationResponse extends PitakResponse<PitakUtilizationData> {}

export interface PitakForecastResponse extends PitakResponse<PitakForecastData> {}

export interface PitakTrendResponse extends PitakResponse<PitakTrendData> {}

export interface ValidationResponse extends PitakResponse<ValidationResult> {}

export interface AvailabilityResponse extends PitakResponse<AvailabilityCheck> {}

export interface DuplicateResponse extends PitakResponse<DuplicateCheck> {}

export interface CapacityResponse extends PitakResponse<CapacityValidation> {}

export interface BulkCreateResponse extends PitakResponse<BulkCreateResult> {}

export interface ImportResponse extends PitakResponse<ImportResult> {}

export interface ExportResponse extends PitakResponse<ExportResult> {}

export interface ReportResponse extends PitakResponse<PitakReportData> {}

export interface LuWangReportResponse extends PitakResponse<LuWangReportData> {}

// Request Interfaces
export interface PitakFilters {
  status?: string;
  bukidId?: number;
  location?: string;
  minLuWang?: number;
  maxLuWang?: number;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PitakPayload {
  method: string;
  params?: Record<string, any>;
}

class PitakAPI {
  // Helper method to get current user ID
  private getCurrentUserId(): number | null {
    try {
      const user = kabAuthStore.getUser();
      if (user && user.id) {
        // Ensure we return a number
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        return isNaN(userId) ? null : userId;
      }
      return null;
    } catch (error) {
      console.error("Error getting current user ID:", error);
      return null;
    }
  }

  // Helper method to enrich params with userId
  private enrichParams(params: any = {}): any {
    const userId = this.getCurrentUserId();
    return { ...params, userId: userId !== null ? userId : 0 };
  }

  // 📋 READ-ONLY OPERATIONS

  async getAllPitaks(filters: PitakFilters = {}): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getAllPitaks",
        params: this.enrichParams({ filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all pitaks");
    }
  }

  async getPitakById(id: number): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakById",
        params: this.enrichParams({ id }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak by ID");
    }
  }

  async getPitaksByStatus(
    status: string,
    filters: PitakFilters = {},
  ): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitaksByStatus",
        params: this.enrichParams({ status, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitaks by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitaks by status");
    }
  }

  async getPitaksByBukid(
    bukidId: number,
    filters: PitakFilters = {},
  ): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitaksByBukid",
        params: this.enrichParams({ bukidId, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitaks by bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitaks by bukid");
    }
  }

  async getActivePitaks(
    filters: PitakFilters = {},
  ): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getActivePitaks",
        params: this.enrichParams({ filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get active pitaks");
    }
  }

  async getInactivePitaks(
    filters: PitakFilters = {},
  ): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getInactivePitaks",
        params: this.enrichParams({ filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get inactive pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get inactive pitaks");
    }
  }

  async getCompletedPitaks(
    filters: PitakFilters = {},
  ): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getCompletedPitaks",
        params: this.enrichParams({ filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get completed pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get completed pitaks");
    }
  }

  async getPitakStats(dateRange?: DateRange): Promise<PitakStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakStats",
        params: this.enrichParams({ dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak stats");
    }
  }

  async getPitakWithAssignments(
    pitakId: number,
    dateRange?: DateRange,
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakWithAssignments",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get pitak with assignments",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak with assignments");
    }
  }

  async getPitakWithPayments(
    pitakId: number,
    dateRange?: DateRange,
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakWithPayments",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak with payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak with payments");
    }
  }

  async searchPitaks(query: string): Promise<PitakListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "searchPitaks",
        params: this.enrichParams({ query }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search pitaks");
    }
  }

  // 📊 REPORT OPERATIONS

  async getPitakReport(
    dateRange: DateRange,
    filters: PitakFilters = {},
  ): Promise<ReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakReport",
        params: this.enrichParams({ dateRange, filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak report");
    }
  }

  async getPitakSummaryReport(
    bukidId?: number,
    status?: string,
  ): Promise<ReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakSummaryReport",
        params: this.enrichParams({ bukidId, status }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak summary report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak summary report");
    }
  }

  async getPitakPerformanceReport(
    pitakId: number,
    dateRange: DateRange,
  ): Promise<PitakProductivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakPerformanceReport",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get pitak performance report",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get pitak performance report",
      );
    }
  }

  async getPitakLuWangReport(
    pitakId: number,
    dateRange: DateRange,
  ): Promise<LuWangReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakLuWangReport",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak LuWang report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak LuWang report");
    }
  }

  // ✏️ WRITE OPERATIONS

  async createPitak(data: {
    bukidId: number;
    location?: string;
    totalLuwang?: number;
    status?: string;
  }): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "createPitak",
        params: this.enrichParams(data),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create pitak");
    }
  }

  async updatePitak(
    id: number,
    data: {
      location?: string;
      totalLuwang?: number;
      status?: string;
    },
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "updatePitak",
        params: this.enrichParams({ id, ...data }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update pitak");
    }
  }

  async deletePitak(
    id: number,
    force: boolean = false,
  ): Promise<PitakResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "deletePitak",
        params: this.enrichParams({ id, force }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete pitak");
    }
  }

  async updatePitakStatus(
    id: number,
    status: string,
    notes?: string,
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "updatePitakStatus",
        params: this.enrichParams({ id, status, notes }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update pitak status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update pitak status");
    }
  }

  async updatePitakLuWang(
    id: number,
    totalLuwang: number,
    adjustmentType: "add" | "subtract" | "set" = "set",
    notes?: string,
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "updatePitakLuWang",
        params: this.enrichParams({ id, totalLuwang, adjustmentType, notes }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update pitak LuWang");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update pitak LuWang");
    }
  }

  async updatePitakLocation(
    id: number,
    location: string,
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "updatePitakLocation",
        params: this.enrichParams({ id, location }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update pitak location");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update pitak location");
    }
  }

  async transferPitakBukid(
    id: number,
    newBukidId: number,
  ): Promise<PitakDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "transferPitakBukid",
        params: this.enrichParams({ id, newBukidId }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to transfer pitak bukid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to transfer pitak bukid");
    }
  }

  async bulkUpdatePitaks(
    pitakIds: number[],
    updates: {
      location?: string;
      totalLuwang?: number;
      status?: string;
    },
  ): Promise<PitakResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "bulkUpdatePitaks",
        params: this.enrichParams({ pitakIds, updates }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update pitaks");
    }
  }

  // 🔄 BATCH OPERATIONS

  async bulkCreatePitaks(
    pitaks: Array<{
      bukidId: number;
      location?: string;
      totalLuwang?: number;
      status?: string;
    }>,
  ): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "bulkCreatePitaks",
        params: this.enrichParams({ pitaks }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create pitaks");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create pitaks");
    }
  }

  async importPitaksFromCSV(
    csvData: string,
    options: {
      hasHeaders?: boolean;
      delimiter?: string;
      skipFirst?: number;
      maxRows?: number;
    } = {},
  ): Promise<ImportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "importPitaksFromCSV",
        params: this.enrichParams({ csvData, options }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import pitaks from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import pitaks from CSV");
    }
  }

  async exportPitaksToCSV(filters: PitakFilters = {}): Promise<ExportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "exportPitaksToCSV",
        params: this.enrichParams({ filters }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export pitaks to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export pitaks to CSV");
    }
  }

  async exportPitakAssignments(
    pitakId: number,
    dateRange?: DateRange,
  ): Promise<ExportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "exportPitakAssignments",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export pitak assignments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export pitak assignments");
    }
  }

  async exportPitakPayments(
    pitakId: number,
    dateRange?: DateRange,
  ): Promise<ExportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "exportPitakPayments",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export pitak payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export pitak payments");
    }
  }

  // 📈 ANALYTICS OPERATIONS

  async getPitakProductivity(
    pitakId: number,
    dateRange: DateRange,
  ): Promise<PitakProductivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakProductivity",
        params: this.enrichParams({ pitakId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak productivity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak productivity");
    }
  }

  async getPitakUtilization(
    bukidId: number,
    dateRange: DateRange,
  ): Promise<PitakUtilizationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakUtilization",
        params: this.enrichParams({ bukidId, dateRange }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak utilization");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak utilization");
    }
  }

  async getPitakForecast(
    bukidId: number,
    period: string = "30d",
  ): Promise<PitakForecastResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakForecast",
        params: this.enrichParams({ bukidId, period }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak forecast");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak forecast");
    }
  }

  async getPitakTrends(
    bukidId: number,
    period: string = "90d",
  ): Promise<PitakTrendResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "getPitakTrends",
        params: this.enrichParams({ bukidId, period }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pitak trends");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pitak trends");
    }
  }

  // ⚙️ VALIDATION OPERATIONS

  async validatePitakData(
    data: {
      bukidId?: number;
      location?: string;
      totalLuwang?: number;
      status?: string;
    },
    excludePitakId?: number,
  ): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "validatePitakData",
        params: this.enrichParams({ ...data, excludePitakId }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate pitak data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate pitak data");
    }
  }

  async checkPitakAvailability(
    pitakId: number,
    date?: string,
    workerId?: number,
  ): Promise<AvailabilityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "checkPitakAvailability",
        params: this.enrichParams({ pitakId, date, workerId }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check pitak availability");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check pitak availability");
    }
  }

  async validateLuWangCapacity(
    pitakId: number,
    requestedLuWang: number,
    date?: string,
  ): Promise<CapacityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "validateLuWangCapacity",
        params: this.enrichParams({ pitakId, requestedLuWang, date }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate LuWang capacity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate LuWang capacity");
    }
  }

  async checkDuplicatePitak(
    data: {
      bukidId: number;
      location?: string;
    },
    excludePitakId?: number,
  ): Promise<DuplicateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.pitak) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.pitak({
        method: "checkDuplicatePitak",
        params: this.enrichParams({ ...data, excludePitakId }),
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check duplicate pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check duplicate pitak");
    }
  }

  // 🔧 UTILITY METHODS

  async validateAndCreate(data: {
    bukidId: number;
    location?: string;
    totalLuwang?: number;
    status?: string;
  }): Promise<PitakDetailResponse> {
    try {
      // First validate
      const validation = await this.validatePitakData(data);
      if (!validation.data.isValid) {
        throw new Error(
          `Validation failed: ${validation.data.errors.join(", ")}`,
        );
      }

      // Check for duplicates
      const duplicateCheck = await this.checkDuplicatePitak(data);
      if (duplicateCheck.data.hasDuplicates) {
        throw new Error(
          `Potential duplicates found: ${duplicateCheck.data.riskAssessment.reasons.join(", ")}`,
        );
      }

      // Create if valid
      return await this.createPitak(data);
    } catch (error: any) {
      throw new Error(`Failed to validate and create: ${error.message}`);
    }
  }

  async getPitakSummary(id: number): Promise<PitakWithDetails> {
    try {
      const response = await this.getPitakById(id);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get pitak summary: ${error.message}`);
    }
  }

  async getPitaksByBukidName(bukidName: string): Promise<PitakWithDetails[]> {
    try {
      const allResponse = await this.getAllPitaks();
      return allResponse.data.filter((pitak) =>
        pitak.bukid?.name?.toLowerCase().includes(bukidName.toLowerCase()),
      );
    } catch (error: any) {
      throw new Error(`Failed to get pitaks by bukid name: ${error.message}`);
    }
  }

  async searchPitaksByLocation(location: string): Promise<PitakWithDetails[]> {
    try {
      const response = await this.searchPitaks(location);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to search pitaks by location: ${error.message}`);
    }
  }

  async getPitaksWithHighUtilization(
    threshold: number = 80,
  ): Promise<PitakWithDetails[]> {
    try {
      const response = await this.getAllPitaks();
      return response.data.filter((pitak) => {
        const utilization = pitak.stats?.utilizationRate || 0;
        return utilization >= threshold;
      });
    } catch (error: any) {
      throw new Error(
        `Failed to get pitaks with high utilization: ${error.message}`,
      );
    }
  }

  async getPitaksWithLowUtilization(
    threshold: number = 20,
  ): Promise<PitakWithDetails[]> {
    try {
      const response = await this.getAllPitaks();
      return response.data.filter((pitak) => {
        const utilization = pitak.stats?.utilizationRate || 0;
        return utilization <= threshold;
      });
    } catch (error: any) {
      throw new Error(
        `Failed to get pitaks with low utilization: ${error.message}`,
      );
    }
  }

  async isPitakAvailable(
    pitakId: number,
    date?: string,
    workerId?: number,
  ): Promise<boolean> {
    try {
      const response = await this.checkPitakAvailability(
        pitakId,
        date,
        workerId,
      );
      return response.data.isAvailable;
    } catch (error: any) {
      console.error("Error checking pitak availability:", error);
      return false;
    }
  }

  async hasSufficientCapacity(
    pitakId: number,
    requestedLuWang: number,
    date?: string,
  ): Promise<boolean> {
    try {
      const response = await this.validateLuWangCapacity(
        pitakId,
        requestedLuWang,
        date,
      );
      return response.data.canAccommodate;
    } catch (error: any) {
      console.error("Error checking pitak capacity:", error);
      return false;
    }
  }

  async generatePitakReport(
    pitakId: number,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    try {
      const dateRange: DateRange = { startDate, endDate };
      const [report, productivity, luWangReport] = await Promise.all([
        this.getPitakReport(dateRange, { bukidId: pitakId }),
        this.getPitakProductivity(pitakId, dateRange),
        this.getPitakLuWangReport(pitakId, dateRange),
      ]);

      return {
        ...report.data,
        productivity: productivity.data,
        luWangReport: luWangReport.data,
      };
    } catch (error: any) {
      throw new Error(
        `Failed to generate comprehensive pitak report: ${error.message}`,
      );
    }
  }

  async exportPitakData(
    pitakId: number,
    includeAssignments: boolean = true,
    includePayments: boolean = true,
  ): Promise<ExportResult[]> {
    try {
      const exports: ExportResult[] = [];

      // Export pitak details
      const pitakResponse = await this.exportPitaksToCSV({ bukidId: pitakId });
      exports.push(pitakResponse.data);

      // Export assignments if requested
      if (includeAssignments) {
        const assignmentsResponse = await this.exportPitakAssignments(pitakId);
        exports.push(assignmentsResponse.data);
      }

      // Export payments if requested
      if (includePayments) {
        const paymentsResponse = await this.exportPitakPayments(pitakId);
        exports.push(paymentsResponse.data);
      }

      return exports;
    } catch (error: any) {
      throw new Error(`Failed to export pitak data: ${error.message}`);
    }
  }

  async validateAndUpdate(
    id: number,
    updates: {
      location?: string;
      totalLuwang?: number;
      status?: string;
    },
  ): Promise<PitakDetailResponse> {
    try {
      // Validate the updates
      const validation = await this.validatePitakData(updates, id);
      if (!validation.data.isValid) {
        throw new Error(
          `Validation failed: ${validation.data.errors.join(", ")}`,
        );
      }

      // Check for duplicates if location is being updated
      if (updates.location) {
        // Need to get current bukidId for duplicate check
        const currentPitak = await this.getPitakById(id);
        const duplicateCheck = await this.checkDuplicatePitak(
          {
            bukidId: currentPitak.data.bukidId,
            location: updates.location,
          },
          id,
        );

        if (duplicateCheck.data.hasDuplicates) {
          throw new Error(
            `Potential duplicates found: ${duplicateCheck.data.riskAssessment.reasons.join(", ")}`,
          );
        }
      }

      // Perform the update
      return await this.updatePitak(id, updates);
    } catch (error: any) {
      throw new Error(`Failed to validate and update: ${error.message}`);
    }
  }

  async adjustPitakLuWang(
    id: number,
    amount: number,
    operation: "increase" | "decrease" = "increase",
    notes?: string,
  ): Promise<PitakDetailResponse> {
    try {
      const adjustmentType = operation === "increase" ? "add" : "subtract";
      return await this.updatePitakLuWang(id, amount, adjustmentType, notes);
    } catch (error: any) {
      throw new Error(`Failed to adjust pitak LuWang: ${error.message}`);
    }
  }

  async markPitakAsHarvested(
    id: number,
    notes?: string,
  ): Promise<PitakDetailResponse> {
    try {
      return await this.updatePitakStatus(id, "completed", notes);
    } catch (error: any) {
      throw new Error(`Failed to mark pitak as completed: ${error.message}`);
    }
  }

  async activatePitak(
    id: number,
    notes?: string,
  ): Promise<PitakDetailResponse> {
    try {
      return await this.updatePitakStatus(id, "active", notes);
    } catch (error: any) {
      throw new Error(`Failed to activate pitak: ${error.message}`);
    }
  }

  async deactivatePitak(
    id: number,
    notes?: string,
  ): Promise<PitakDetailResponse> {
    try {
      return await this.updatePitakStatus(id, "inactive", notes);
    } catch (error: any) {
      throw new Error(`Failed to deactivate pitak: ${error.message}`);
    }
  }

  async getPitakAssignmentHistory(
    pitakId: number,
    limit: number = 10,
  ): Promise<AssignmentSummary[]> {
    try {
      const response = await this.getPitakWithAssignments(pitakId);
      return response.data.assignments?.slice(0, limit) || [];
    } catch (error: any) {
      throw new Error(
        `Failed to get pitak assignment history: ${error.message}`,
      );
    }
  }

  async getPitakPaymentHistory(
    pitakId: number,
    limit: number = 10,
  ): Promise<PaymentSummary[]> {
    try {
      const response = await this.getPitakWithPayments(pitakId);
      return response.data.payments?.slice(0, limit) || [];
    } catch (error: any) {
      throw new Error(`Failed to get pitak payment history: ${error.message}`);
    }
  }

  async getAvailablePitaksForAssignment(
    date: string,
    bukidId?: number,
  ): Promise<PitakWithDetails[]> {
    try {
      const filters: PitakFilters = { status: "active" };
      if (bukidId) filters.bukidId = bukidId;

      const response = await this.getActivePitaks(filters);
      const availablePitaks: PitakWithDetails[] = [];

      for (const pitak of response.data) {
        const availability = await this.checkPitakAvailability(pitak.id, date);
        if (availability.data.isAvailable) {
          availablePitaks.push(pitak);
        }
      }

      return availablePitaks;
    } catch (error: any) {
      throw new Error(
        `Failed to get available pitaks for assignment: ${error.message}`,
      );
    }
  }

  // 📊 ANALYTICS UTILITIES

  async getProductivityTrend(
    pitakId: number,
    periods: string[] = ["7d", "30d", "90d"],
  ): Promise<any[]> {
    try {
      const trends = await Promise.all(
        periods.map((period) =>
          this.getPitakProductivity(pitakId, {
            startDate: this.calculateStartDate(period),
            endDate: new Date().toISOString().split("T")[0],
          }),
        ),
      );
      return trends.map((trend, index) => ({
        ...trend.data,
        period: periods[index],
      }));
    } catch (error: any) {
      throw new Error(`Failed to get productivity trend: ${error.message}`);
    }
  }

  async getUtilizationComparison(
    bukidId: number,
    dateRange: DateRange,
  ): Promise<PitakUtilizationData> {
    try {
      const response = await this.getPitakUtilization(bukidId, dateRange);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get utilization comparison: ${error.message}`);
    }
  }

  async getForecastComparison(
    bukidId: number,
    period: string = "30d",
  ): Promise<PitakForecastData> {
    try {
      const response = await this.getPitakForecast(bukidId, period);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get forecast comparison: ${error.message}`);
    }
  }

  async getTrendAnalysis(
    bukidId: number,
    period: string = "90d",
  ): Promise<PitakTrendData> {
    try {
      const response = await this.getPitakTrends(bukidId, period);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get trend analysis: ${error.message}`);
    }
  }

  // 🎯 EVENT LISTENERS (if supported by backend)

  // onPitakCreated(callback: (data: PitakData) => void) {
  //   if (window.backendAPI && window.backendAPI.onPitakCreated) {
  //     window.backendAPI.onPitakCreated(callback);
  //   }
  // }

  // onPitakUpdated(callback: (data: PitakData) => void) {
  //   if (window.backendAPI && window.backendAPI.onPitakUpdated) {
  //     window.backendAPI.onPitakUpdated(callback);
  //   }
  // }

  // onPitakDeleted(callback: (id: number) => void) {
  //   if (window.backendAPI && window.backendAPI.onPitakDeleted) {
  //     window.backendAPI.onPitakDeleted(callback);
  //   }
  // }

  // onPitakStatusChanged(callback: (data: { id: number, oldStatus: string, newStatus: string }) => void) {
  //   if (window.backendAPI && window.backendAPI.onPitakStatusChanged) {
  //     window.backendAPI.onPitakStatusChanged(callback);
  //   }
  // }

  // 🔧 PRIVATE HELPER METHODS

  private calculateStartDate(period: string): string {
    const today = new Date();
    let days = 7; // default 7 days

    if (period.includes("d")) {
      days = parseInt(period);
    } else if (period.includes("w")) {
      days = parseInt(period) * 7;
    } else if (period.includes("m")) {
      days = parseInt(period) * 30;
    }

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    return startDate.toISOString().split("T")[0];
  }
}

const pitakAPI = new PitakAPI();

export default pitakAPI;