// auditAPI.ts - Similar structure to activation.ts
export interface AuditTrailRecord {
  id: number;
  action: string;
  actor: string;
  details: any;
  timestamp: string;
}

export interface AuditTrailListData {
  auditTrails: AuditTrailRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditTrailStatsData {
  totalCount: number;
  todayCount: number;
  lastWeekCount: number;
  topActions: Array<{ action: string; count: number }>;
  topActors: Array<{ actor: string; count: number }>;
  hourlyActivity: Array<{ hour: number; count: number }>;
}

export interface AuditTrailSummaryData {
  periodDays: number;
  totalCount: number;
  actionSummary: Array<{ action: string; count: number; lastOccurrence: string; firstOccurrence: string }>;
  actorSummary: Array<{ actor: string; count: number; lastActivity: string; firstActivity: string }>;
  dailyActivity: Array<{ date: string; count: number }>;
  busiestHours: Array<{ hour: number; count: number }>;
}

export interface ActionsListData {
  actions: Array<{ action: string; count?: number; lastOccurrence?: string; firstOccurrence?: string }>;
  categorized: {
    user_actions: string[];
    system_actions: string[];
    data_actions: string[];
    security_actions: string[];
    other: string[];
  };
  totals: {
    totalUniqueActions: number;
    userActions: number;
    systemActions: number;
    dataActions: number;
    securityActions: number;
    otherActions: number;
  };
}

export interface ActorsListData {
  actors: Array<{ actor: string; count?: number; lastActivity?: string; firstActivity?: string; uniqueActions?: number }>;
  categorized: {
    users: string[];
    system: string[];
    automated: string[];
    unknown: string[];
  };
  actorDetails: Array<{ actor: string; topActions: Array<{ action: string; count: number }> }>;
  totals: {
    totalUniqueActors: number;
    users: number;
    system: number;
    automated: number;
    unknown: number;
  };
}

export interface ActivityData {
  activity: Array<{ period: string; count: number; uniqueActors: number; uniqueActions: number }>;
  periodDetails: Array<{
    period: string;
    total: number;
    uniqueActors: number;
    uniqueActions: number;
    topActions: Array<{ action: string; count: number }>;
    topActors: Array<{ actor: string; count: number }>;
  }>;
  timeframe: string;
  statistics: {
    totalPeriods: number;
    totalActivity: number;
    averageActivity: number;
    maxActivity: number;
    minActivity: number;
    busiestPeriod: {
      period: string;
      count: number;
      uniqueActors: number;
      uniqueActions: number;
    };
  };
}

export interface SystemActivityData {
  systemActivities: AuditTrailRecord[];
  userActivities?: AuditTrailRecord[];
  categorized: {
    startup_shutdown: AuditTrailRecord[];
    errors: AuditTrailRecord[];
    warnings: AuditTrailRecord[];
    maintenance: AuditTrailRecord[];
    backups: AuditTrailRecord[];
    security: AuditTrailRecord[];
    performance: AuditTrailRecord[];
    other: AuditTrailRecord[];
  };
  stats: {
    totalSystemActivities: number;
    totalUserActivities: number;
    byCategory: Record<string, number>;
    timeRange: {
      start: string;
      end: string;
      hours: number;
    };
  };
  errorDetails: Array<{
    id: number;
    action: string;
    actor: string;
    timestamp: string;
    details: any;
  }>;
  healthIndicators: {
    hasRecentErrors: boolean;
    errorRate: number;
    warningRate: number;
    securityEvents: number;
    lastBackup: string | null;
    systemUptime: string;
  };
}

export interface UserActivityData {
  activities?: AuditTrailRecord[];
  activitiesByUser?: Record<string, AuditTrailRecord[]>;
  userStats: Array<{
    userId: string;
    username: string;
    totalActions: number;
    firstActivity: string;
    lastActivity: string;
    mostFrequentAction: string;
    actionCounts: Record<string, number>;
    peakHour: number;
    activityLevel: string;
    uniqueActions: number;
  }>;
  overallStats: {
    totalUsers: number;
    totalActivities: number;
    averageActivitiesPerUser: number;
    busiestUser: any;
    timeRange: {
      start: string;
      end: string;
      days: number;
    };
    activityTrend: string;
  };
  topActions: Array<{ action: string; count: number }>;
}

export interface FilterParams {
  action?: string;
  actor?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ExportResultData {
  filename: string;
  filepath: string;
  recordCount: number;
  downloadUrl: string;
  fileSize?: number;
  format?: string;
}

export interface ReportResultData {
  reportType: string;
  format: string;
  fileName: string;
  filePath: string;
  downloadUrl: string;
  generatedAt: string;
  metadata: {
    recordCount: number;
    dateRange: any;
    generatedBy: string;
  };
}

export interface CleanupResultData {
  cutoffDate: string;
  daysToKeep: number;
  dryRun: boolean;
  wouldDelete: number;
  actuallyDeleted: number;
}

export interface ArchiveResultData {
  archiveId: string;
  archiveFilename: string;
  archivePath: string;
  metadataPath: string;
  archiveSize: number;
  recordsArchived: number;
  recordsDeleted: number;
  dateRange: {
    oldest: string;
    newest: string;
  };
  downloadUrl: string;
}

export interface CompactionResultData {
  method: string;
  originalCount: number;
  compactedCount: number;
  retainedCount: number;
  spaceSaved: number;
  spaceSavedPercentage: string;
  dateRange: {
    oldest: string;
    newest: string;
  };
}

export interface AuditPayload {
  method: string;
  params?: Record<string, any>;
}

// Response Interfaces
export interface AuditListResponse {
  status: boolean;
  message: string;
  data: AuditTrailListData;
}

export interface AuditSingleResponse {
  status: boolean;
  message: string;
  data: {
    auditTrail: AuditTrailRecord;
  };
}

export interface AuditStatsResponse {
  status: boolean;
  message: string;
  data: AuditTrailStatsData;
}

export interface AuditSummaryResponse {
  status: boolean;
  message: string;
  data: AuditTrailSummaryData;
}

export interface ActionsListResponse {
  status: boolean;
  message: string;
  data: ActionsListData;
}

export interface ActorsListResponse {
  status: boolean;
  message: string;
  data: ActorsListData;
}

export interface ActivityResponse {
  status: boolean;
  message: string;
  data: ActivityData;
}

export interface SystemActivityResponse {
  status: boolean;
  message: string;
  data: SystemActivityData;
}

export interface UserActivityResponse {
  status: boolean;
  message: string;
  data: UserActivityData;
}

export interface ExportResponse {
  status: boolean;
  message: string;
  data: ExportResultData;
}

export interface ReportResponse {
  status: boolean;
  message: string;
  data: ReportResultData;
}

export interface CleanupResponse {
  status: boolean;
  message: string;
  data: CleanupResultData;
}

export interface ArchiveResponse {
  status: boolean;
  message: string;
  data: ArchiveResultData;
}

export interface CompactionResponse {
  status: boolean;
  message: string;
  data: CompactionResultData;
}

export interface FilterResponse {
  status: boolean;
  message: string;
  data: AuditTrailListData;
}

export interface SearchResponse {
  status: boolean;
  message: string;
  data: AuditTrailListData;
}

export interface GenericResponse {
  status: boolean;
  message: string;
  data: any;
}

class AuditAPI {
  // 🔎 Read-only methods

  /**
   * Get all audit trails with pagination
   */
  async getAllAuditTrails(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Promise<AuditListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAllAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all audit trails");
    }
  }

  /**
   * Get audit trail by ID
   */
  async getAuditTrailById(params: { id: number }): Promise<AuditSingleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailById",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trail by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trail by ID");
    }
  }

  /**
   * Get audit trails by action
   */
  async getAuditTrailsByAction(params: {
    action: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<AuditListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByAction",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by action");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by action");
    }
  }

  /**
   * Get audit trails by actor
   */
  async getAuditTrailsByActor(params: {
    actor: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<AuditListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByActor",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by actor");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by actor");
    }
  }

  /**
   * Get audit trails by date range
   */
  async getAuditTrailsByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<AuditListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByDateRange",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by date range");
    }
  }

  /**
   * Get recent audit trails
   */
  async getRecentAuditTrails(params: {
    limit?: number;
    days?: number;
  } = {}): Promise<AuditListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getRecentAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get recent audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get recent audit trails");
    }
  }

  /**
   * Get audit trail statistics
   */
  async getAuditTrailStats(params: {} = {}): Promise<AuditStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailStats",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trail stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trail stats");
    }
  }

  /**
   * Search audit trails
   */
  async searchAuditTrails(params: {
    query: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<SearchResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "searchAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search audit trails");
    }
  }

  /**
   * Get audit trail summary
   */
  async getAuditTrailSummary(params: {
    days?: number;
  } = {}): Promise<AuditSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailSummary",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trail summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trail summary");
    }
  }

  /**
   * Get actions list
   */
  async getActionsList(params: {
    limit?: number;
    includeCounts?: boolean;
  } = {}): Promise<ActionsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getActionsList",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get actions list");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get actions list");
    }
  }

  /**
   * Get actors list
   */
  async getActorsList(params: {
    limit?: number;
    includeCounts?: boolean;
  } = {}): Promise<ActorsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getActorsList",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get actors list");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get actors list");
    }
  }

  /**
   * Get audit trail activity
   */
  async getAuditTrailActivity(params: {
    timeframe?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    limit?: number;
  } = {}): Promise<ActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailActivity",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trail activity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trail activity");
    }
  }

  /**
   * Get system activity
   */
  async getSystemActivity(params: {
    hours?: number;
    includeUserActions?: boolean;
  } = {}): Promise<SystemActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getSystemActivity",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get system activity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get system activity");
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(params: {
    userId?: string;
    days?: number;
    includeSystemActions?: boolean;
  } = {}): Promise<UserActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getUserActivity",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user activity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user activity");
    }
  }

  /**
   * Filter audit trails
   */
  async filterAuditTrails(params: FilterParams): Promise<FilterResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "filterAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to filter audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to filter audit trails");
    }
  }

  // 📈 Reporting methods

  /**
   * Generate audit report
   */
  async generateAuditReport(params: {
    reportType?: 'summary' | 'detailed' | 'compliance' | 'security';
    startDate?: string;
    endDate?: string;
    format?: 'pdf' | 'excel' | 'html';
  } = {}): Promise<ReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "generateAuditReport",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate audit report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate audit report");
    }
  }

  // 🔄 Export methods

  /**
   * Export audit trails to CSV
   */
  async exportAuditTrailsToCSV(params: {
    filters?: Record<string, any>;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ExportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "exportAuditTrailsToCSV",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export audit trails to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export audit trails to CSV");
    }
  }

  /**
   * Export audit trails to JSON
   */
  async exportAuditTrailsToJSON(params: {
    filters?: Record<string, any>;
    startDate?: string;
    endDate?: string;
    format?: 'pretty' | 'compact';
  } = {}): Promise<ExportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "exportAuditTrailsToJSON",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export audit trails to JSON");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export audit trails to JSON");
    }
  }

  // 🔧 Maintenance methods (Admin only)

  /**
   * Cleanup old audit trails
   */
  async cleanupOldAuditTrails(params: {
    daysToKeep?: number;
    dryRun?: boolean;
  } = {}): Promise<CleanupResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "cleanupOldAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to cleanup old audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to cleanup old audit trails");
    }
  }

  /**
   * Archive audit trails
   */
  async archiveAuditTrails(params: {
    monthsOld?: number;
    archiveFormat?: 'zip' | 'tar';
    compress?: boolean;
  } = {}): Promise<ArchiveResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "archiveAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to archive audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to archive audit trails");
    }
  }

  /**
   * Compact audit trails
   */
  async compactAuditTrails(params: {
    monthsOld?: number;
    compactMethod?: 'summarize' | 'aggregate' | 'sample';
    sampleRate?: number;
  } = {}): Promise<CompactionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "compactAuditTrails",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to compact audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to compact audit trails");
    }
  }

  // 🔧 Utility methods

  /**
   * Get paginated audit trails (utility method)
   */
  async getPaginatedAuditTrails(page: number = 1, limit: number = 50): Promise<AuditTrailListData | null> {
    try {
      const response = await this.getAllAuditTrails({ page, limit });
      return response.data;
    } catch (error) {
      console.error("Error getting paginated audit trails:", error);
      return null;
    }
  }

  /**
   * Get today's activities
   */
  async getTodayActivities(): Promise<AuditTrailRecord[] | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await this.getAuditTrailsByDateRange({
        startDate: today,
        endDate: today,
        limit: 1000
      });
      return response.data.auditTrails;
    } catch (error) {
      console.error("Error getting today's activities:", error);
      return null;
    }
  }

  /**
   * Get activities for last 7 days
   */
  async getLastWeekActivities(): Promise<AuditTrailRecord[] | null> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const response = await this.getAuditTrailsByDateRange({
        startDate: startDateStr,
        endDate: endDate,
        limit: 5000
      });
      return response.data.auditTrails;
    } catch (error) {
      console.error("Error getting last week activities:", error);
      return null;
    }
  }

  /**
   * Search activities by keyword
   */
  async searchActivities(keyword: string): Promise<AuditTrailRecord[] | null> {
    try {
      const response = await this.searchAuditTrails({
        query: keyword,
        limit: 100
      });
      return response.data.auditTrails;
    } catch (error) {
      console.error("Error searching activities:", error);
      return null;
    }
  }

  /**
   * Get user's recent activities
   */
  async getUserRecentActivities(userId: string, limit: number = 50): Promise<AuditTrailRecord[] | null> {
    try {
      const response = await this.getAuditTrailsByActor({
        actor: `User ${userId}`,
        limit,
        sortBy: 'timestamp',
        sortOrder: 'DESC'
      });
      return response.data.auditTrails;
    } catch (error) {
      console.error("Error getting user recent activities:", error);
      return null;
    }
  }

  /**
   * Log an audit trail entry (convenience method)
   */
  async logActivity(action: string, actor: string, details?: any): Promise<GenericResponse> {
    try {
      // Note: This assumes there's a createAuditTrail method in the backend
      // If not, you'll need to add it to the IPC handler
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "createAuditTrail",
        params: {
          action,
          actor,
          details,
          timestamp: new Date().toISOString()
        },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to log activity");
    } catch (error: any) {
      console.error("Error logging activity:", error);
      return {
        status: false,
        message: error.message || "Failed to log activity",
        data: null
      };
    }
  }

  /**
   * Check if audit trail feature is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        return false;
      }
      
      // Try to call a simple method
      await this.getAuditTrailStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get total audit trail count
   */
  async getTotalCount(): Promise<number> {
    try {
      const stats = await this.getAuditTrailStats();
      return stats.data.totalCount || 0;
    } catch (error) {
      console.error("Error getting total count:", error);
      return 0;
    }
  }

  /**
   * Get today's activity count
   */
  async getTodayCount(): Promise<number> {
    try {
      const stats = await this.getAuditTrailStats();
      return stats.data.todayCount || 0;
    } catch (error) {
      console.error("Error getting today's count:", error);
      return 0;
    }
  }

  /**
   * Get top 5 actions
   */
  async getTopActions(limit: number = 5): Promise<Array<{action: string, count: number}>> {
    try {
      const stats = await this.getAuditTrailStats();
      return stats.data.topActions.slice(0, limit);
    } catch (error) {
      console.error("Error getting top actions:", error);
      return [];
    }
  }

  /**
   * Get top 5 actors
   */
  async getTopActors(limit: number = 5): Promise<Array<{actor: string, count: number}>> {
    try {
      const stats = await this.getAuditTrailStats();
      return stats.data.topActors.slice(0, limit);
    } catch (error) {
      console.error("Error getting top actors:", error);
      return [];
    }
  }

  // Event listeners (if supported by backend)
  onAuditTrailCreated(callback: (data: any) => void) {
    if (window.backendAPI && window.backendAPI.onAuditTrailCreated) {
      window.backendAPI.onAuditTrailCreated(callback);
    }
  }

  onAuditTrailUpdated(callback: (data: any) => void) {
    if (window.backendAPI && window.backendAPI.onAuditTrailUpdated) {
      window.backendAPI.onAuditTrailUpdated(callback);
    }
  }

  onAuditTrailDeleted(callback: (data: any) => void) {
    if (window.backendAPI && window.backendAPI.onAuditTrailDeleted) {
      window.backendAPI.onAuditTrailDeleted(callback);
    }
  }
}

const auditAPI = new AuditAPI();

export default auditAPI;