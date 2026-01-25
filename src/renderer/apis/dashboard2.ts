// dashboardAPI.ts - API for Kabisilya Dashboard Management

export interface DashboardResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

// Worker Analytics Interfaces
export interface WorkersOverviewData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
    activePercentage: number;
  };
  financial: {
    totalDebt: number;
    averageDebt: number;
    topDebtors: Array<{
      id: string | number;
      name: string;
      totalDebt: number;
      currentBalance: number;
    }>;
  };
  assignments: {
    active: number;
    averagePerWorker: number;
  };
  lastUpdated: Date;
}

export interface WorkerPerformanceData {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  performance: Array<{
    workerId: string | number;
    workerName: string;
    assignmentsCompleted: number;
    totalLuwang: number;
    totalGrossPay: number;
    totalNetPay: number;
    paymentCount: number;
    productivityScore: number;
  }>;
  metrics: {
    totalWorkers: number;
    totalAssignments: number;
    totalLuwang: number;
    averageLuwangPerWorker: number;
    totalNetPay: number;
    averageNetPay: number;
  };
}

export interface WorkerStatusSummaryData {
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  metrics: {
    totalWorkers: number;
    activityRate: number;
    averageTenure: number;
  };
  trends: {
    newWorkers: number;
    statusChanges: number;
  };
}

export interface TopPerformersData {
  category: string;
  timeFrame: string;
  performers: Array<{
    workerId: string | number;
    workerName: string;
    metric: string;
    value: number;
    secondaryValue: number;
    secondaryLabel: string;
  }>;
  summary: {
    count: number;
    averageValue: number;
  };
}

export interface WorkerAttendanceData {
  attendanceRecords: Array<{
    date: string; // DATE(assignment.assignmentDate)
    totalAssignments: number;
    completedAssignments: number;
    activeAssignments: number;
    completionRate: number;
  }>;
  summary: {
    totalDays: number;
    daysWithAssignments: number;
    attendanceRate: number;
    averageCompletionRate: number;
    period: {
      start: string | null;
      end: string | null;
    };
  };
}

// Financial Analytics Interfaces
export interface FinancialOverviewData {
  payments: {
    currentMonth: {
      gross: number;
      net: number;
      debtDeductions: number;
      count: number;
      averageNet: number;
    };
    previousMonth: {
      gross: number;
      net: number;
    };
    growthRate: number;
  };
  debts: {
    totalCount: number;
    totalAmount: number;
    totalBalance: number;
    totalPaid: number;
    collectionRate: number;
    averageInterestRate: number;
  };
  debtStatusBreakdown: Array<{
    status: string;
    count: number;
    totalBalance: number;
    totalAmount: number;
  }>;
  upcomingDueDates: Array<{
    debtId: string | number;
    dueDate: Date | string;
    balance: number;
    originalAmount: number;
    workerName: string;
    daysUntilDue: number;
  }>;
  timestamp: Date;
}

export interface DebtSummaryData {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  overallMetrics: {
    totalDebts: number;
    totalAmount: number;
    totalBalance: number;
    averageAmount: number;
    averageBalance: number;
    averageInterestRate: number;
  };
  debtStatusBreakdown: Array<{
    status: string;
    count: number;
    totalAmount: number;
    averageAmount: number;
  }>;
  overdueDebts: Array<{
    id: string | number;
    amount: number;
    balance: number;
    daysOverdue: number;
    workerName: string;
    status: string;
  }>;
  debtTrend: Array<{
    date: string;
    newDebts: number;
    paidDebts: number;
    totalAmount: number;
  }>;
  recommendations: string[];
}

export interface PaymentSummaryData {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  overallMetrics: {
    totalPayments: number;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    averageGross: number;
    averageNet: number;
  };
  paymentTrend: Array<{
    date: string;
    totalNet: number;
    paymentCount: number;
    averageNet: number;
  }>;
  deductionBreakdown: {
    totalDebtDeductions: number;
    totalOtherDeductions: number;
    debtDeductionRate: number;
  };
  topPayers: Array<{
    workerId: string | number;
    workerName: string;
    totalNet: number;
    paymentCount: number;
    averageNet: number;
  }>;
  recommendations: string[];
}

export interface RevenueTrendData {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  trendData: Array<{
    date: string;
    revenue: number;
    payments: number;
    averageRevenue: number;
  }>;
  metrics: {
    totalRevenue: number;
    totalPayments: number;
    averageDailyRevenue: number;
    peakRevenueDay: {
      date: string;
      revenue: number;
    };
    growthRate: number;
  };
  projections: {
    nextPeriodEstimate: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
  };
  anomalies: Array<{
    date: string;
    revenue: number;
    expected: number;
    deviation: number;
    type: string;
  }>;
}

export interface DebtCollectionRateData {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  overallMetrics: {
    totalDebtAmount: number;
    totalCollected: number;
    totalBalance: number;
    collectionRate: number;
    averageCollectionPerDebt: number;
    debtsCount: number;
  };
  collectionByAge: Array<{
    ageBucket: string;
    totalAmount: number;
    totalCollected: number;
    remainingBalance: number;
    collectionRate: number;
    debtCount: number;
  }>;
  dailyTrend: Array<{
    date: string;
    collected: number;
    paymentCount: number;
  }>;
  collectionEfficiency: {
    averageDailyCollection: number;
    bestCollectionDay: {
      date: string;
      collected: number;
    } | null;
    totalCollectionDays: number;
  };
  problematicDebts: Array<{
    id: string | number;
    amount: number;
    collected: number;
    balance: number;
    ageInDays: number;
    collectionRate: number;
    status: string;
  }>;
  recommendations: string[];
}

// Assignment Analytics Interfaces
export interface AssignmentOverviewData {
  summary: {
    totalAssignments: number;
    activeAssignments: number;
    completedAssignments: number;
    cancelledAssignments: number;
    completionRate: number;
  };
  periodMetrics: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    dailyAverage: number;
  };
  luwangMetrics: {
    total: number;
    average: number;
    maximum: number;
    minimum: number;
    averagePerWorker: number;
  };
  utilization: {
    workers: {
      active: number;
      total: number;
      utilizationRate: number;
    };
    pitaks: {
      active: number;
      total: number;
      utilizationRate: number;
    };
  };
  statusBreakdown: Record<string, {
    count: number;
    totalLuwang: number;
  }>;
  lastUpdated: Date;
}

export interface AssignmentTrendData {
  trendData: Array<{
    date: string;
    newAssignments: number;
    completedAssignments: number;
    cancelledAssignments: number;
  }>;
  metrics: {
    totalAssignments: number;
    completionRate: number;
    averageDailyAssignments: number;
    peakDay: {
      date: string;
      assignments: number;
    };
  };
  projections: {
    nextPeriodEstimate: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
  };
}

export interface LuwangSummaryData {
  overallMetrics: {
    totalLuwang: number;
    averageLuwang: number;
    maxLuwang: number;
    minLuwang: number;
    totalAssignments: number;
  };
  luwangDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
    totalLuwang: number;
  }>;
  trend: Array<{
    date: string;
    totalLuwang: number;
    assignmentCount: number;
    averageLuwang: number;
  }>;
  topLuwangWorkers: Array<{
    workerId: string | number;
    workerName: string;
    totalLuwang: number;
    assignmentCount: number;
    averageLuwang: number;
  }>;
}

export interface AssignmentCompletionRateData {
  period: {
    start: Date;
    end: Date;
    type: string;
  };
  overallMetrics: {
    totalAssignments: number;
    completedAssignments: number;
    completionRate: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
  };
  completionTrend: Array<{
    date: string;
    completed: number;
    total: number;
    completionRate: number;
  }>;
  completionByWorker: Array<{
    workerId: string | number;
    workerName: string;
    totalAssignments: number;
    completed: number;
    completionRate: number;
    averageTime: number;
  }>;
  incompleteReasons: Record<string, {
    count: number;
    percentage: number;
  }>;
  recommendations: string[];
}

export interface PitakUtilizationData {
  pitakUtilization: Array<{
    pitakId: string | number;
    location: string;
    bukidName: string;
    totalLuwang: number;
    status: string;
    utilization: {
      totalAssignments: number;
      activeAssignments: number;
      completedAssignments: number;
      totalLuwangAssigned: number;
      utilizationRate: number;
      uniqueWorkers: number;
      lastAssignment: Date | null;
      daysSinceLastAssignment: number | null;
    };
  }>;
  overallMetrics: {
    totalPitaks: number;
    totalLuwang: number;
    totalAssignedLuwang: number;
    overallUtilizationRate: number;
    averageUtilizationRate: number;
    totalAssignments: number;
    totalActiveAssignments: number;
    averageAssignmentsPerPitak: number;
    averageWorkersPerPitak: number;
  };
  categories: {
    high: {
      count: number;
      pitaks: Array<any>;
      percentage: number;
    };
    medium: {
      count: number;
      pitaks: Array<any>;
      percentage: number;
    };
    low: {
      count: number;
      pitaks: Array<any>;
      percentage: number;
    };
    underutilized: {
      count: number;
      pitaks: Array<any>;
      percentage: number;
    };
  };
  mostUtilized: Array<any>;
  needsAttention: Array<any>;
  recommendations: string[];
}

// Kabisilya Analytics Interfaces
export interface KabisilyaOverviewData {
  kabisilyas: Array<{
    id: string | number;
    name: string;
    workers: {
      total: number;
      active: number;
      inactive: number;
      activePercentage: number;
    };
    bukids: {
      total: number;
    };
    financial: {
      totalDebt: number;
      averageDebt: number;
      totalPaid: number;
      averagePaid: number;
    };
    createdAt: Date;
    lastUpdated: Date;
  }>;
  overallMetrics: {
    totalKabisilyas: number;
    totalWorkers: number;
    totalActiveWorkers: number;
    totalBukids: number;
    totalDebt: number;
    totalPaid: number;
    workerActivityRate: number;
    averageWorkersPerKabisilya: number;
    averageBukidsPerKabisilya: number;
    averageDebtPerKabisilya: number;
    averageDebtPerWorker: number;
  };
  rankings: {
    byWorkers: Array<{
      name: string;
      workerCount: number;
      activeWorkers: number;
    }>;
    byDebt: Array<{
      name: string;
      totalDebt: number;
      averageDebt: number;
    }>;
  };
  mostActive: Array<any>;
  highestDebt: Array<any>;
  lastUpdated: Date;
}

export interface BukidSummaryData {
  bukidSummary: Array<{
    bukidId: string | number;
    bukidName: string;
    kabisilyaName: string;
    totalPitaks: number;
    activePitaks: number;
    totalLuwang: number;
    assignedLuwang: number;
    completedLuwang: number;
    utilizationRate: number;
  }>;
  overallMetrics: {
    totalBukids: number;
    totalPitaks: number;
    activePitaks: number;
    totalLuwang: number;
    assignedLuwang: number;
    completedLuwang: number;
    overallUtilization: number;
    averageUtilization: number;
  };
  categories: {
    highUtilization: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
    mediumUtilization: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
    lowUtilization: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
  };
  mostUtilized: Array<any>;
  needsAttention: Array<any>;
  recommendations: string[];
}

export interface PitakSummaryData {
  pitakSummary: Array<{
    pitakId: string | number;
    location: string;
    bukidName: string;
    kabisilyaName: string;
    totalLuwang: number;
    assignedLuwang: number;
    completedLuwang: number;
    utilizationRate: number;
    status: string;
  }>;
  overallMetrics: {
    totalPitaks: number;
    activePitaks: number;
    totalLuwang: number;
    assignedLuwang: number;
    completedLuwang: number;
    overallUtilization: number;
    averageUtilization: number;
    pitakActivityRate: number;
  };
  categories: {
    highUtilization: {
      count: number;
      percentage: number;
      pitaks: Array<any>;
    };
    mediumUtilization: {
      count: number;
      percentage: number;
      pitaks: Array<any>;
    };
    lowUtilization: {
      count: number;
      percentage: number;
      pitaks: Array<any>;
    };
  };
  mostUtilized: Array<any>;
  needsAttention: Array<any>;
  recommendations: string[];
}

export interface ProductionByKabisilyaData {
  productionData: Array<{
    kabisilyaId: string | number;
    kabisilyaName: string;
    totalLuwang: number;
    completedLuwang: number;
    productionRate: number;
    totalAssignments: number;
    completedAssignments: number;
  }>;
  overallMetrics: {
    totalKabisilyas: number;
    totalLuwang: number;
    completedLuwang: number;
    overallProductionRate: number;
    averageProductionPerKabisilya: number;
  };
  rankings: {
    byProduction: Array<any>;
    byEfficiency: Array<any>;
  };
  trends: Array<{
    date: string;
    totalLuwang: number;
    completedLuwang: number;
    productionRate: number;
  }>;
}

export interface LandUtilizationData {
  landUtilization: Array<{
    bukidId: string | number;
    bukidName: string;
    kabisilyaName: string;
    totalPitaks: number;
    activePitaks: number;
    capacity: {
      totalLuwang: number;
      assignedLuwang: number;
      completedLuwang: number;
    };
    utilization: {
      capacityUtilization: number;
      completionUtilization: number;
      overallUtilization: number;
    };
  }>;
  overallMetrics: {
    totalBukids: number;
    totalPitaks: number;
    activePitaks: number;
    totalLuwangCapacity: number;
    totalAssignedLuwang: number;
    totalCompletedLuwang: number;
    remainingCapacity: number;
    overallCapacityUtilization: number;
    overallCompletionRate: number;
    averageCapacityUtilization: number;
    averageCompletionUtilization: number;
    averageOverallUtilization: number;
    pitakActivityRate: number;
  };
  categories: {
    highlyUtilized: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
    wellUtilized: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
    underutilized: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
    severelyUnderutilized: {
      count: number;
      percentage: number;
      bukids: Array<any>;
    };
  };
  rankings: {
    byUtilization: Array<{
      bukidName: string;
      overallUtilization: number;
      capacityUtilization: number;
      kabisilyaName: string;
    }>;
    byCapacity: Array<{
      bukidName: string;
      totalLuwang: number;
      assignedLuwang: number;
      kabisilyaName: string;
    }>;
  };
  byKabisilya: Array<{
    kabisilyaName: string;
    bukidCount: number;
    capacityUtilization: number;
    completionUtilization: number;
    overallUtilization: number;
    totalLuwangCapacity: number;
    assignedLuwang: number;
    completedLuwang: number;
  }>;
  needsAttention: Array<any>;
  mostUtilized: Array<any>;
  recommendations: string[];
}

// Real-Time Dashboard Interfaces
export interface LiveDashboardData {
  timestamp: string;
  overview: {
    assignments: {
      today: number;
      completed: number;
      active: number;
      completionRate: number;
    };
    workers: {
      totalActive: number;
      withAssignments: number;
      utilizationRate: number;
    };
    financial: {
      todayPayments: number;
      todayPaymentCount: number;
      activeDebts: number;
      totalDebtBalance: number;
    };
    resources: {
      activePitaks: number;
    };
  };
  recentActivities: Array<{
    type: 'assignment' | 'payment';
    id: string | number;
    workerName: string;
    pitakLocation?: string;
    luwangCount?: number;
    netPay?: number;
    status: string;
    timestamp: Date;
    action: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'info';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    timestamp?: Date;
    details?: string[];
  }>;
  quickStats: {
    averageAssignmentTime: number;
    averagePaymentAmount: number;
    debtCollectionRate: number;
  };
}

export interface TodayStatsData {
  assignments: {
    total: number;
    completed: number;
    active: number;
    completionRate: number;
  };
  payments: {
    totalAmount: number;
    count: number;
    average: number;
  };
  workers: {
    active: number;
    withAssignments: number;
    utilizationRate: number;
  };
  hourlyDistribution: {
    assignments: Array<{
      hour: number;
      assignments: number;
    }>;
    payments: Array<{
      hour: number;
      amount: number;
    }>;
  };
  recommendations: string[];
}

export interface RealTimeAssignmentsData {
  activeAssignments: Array<{
    id: string | number;
    workerName: string;
    pitakLocation: string;
    luwangCount: number;
    status: string;
    startTime: Date;
    duration: number;
  }>;
  recentCompletions: Array<{
    id: string | number;
    workerName: string;
    pitakLocation: string;
    luwangCount: number;
    completionTime: Date;
  }>;
  metrics: {
    totalActive: number;
    averageDuration: number;
    completionRate: number;
  };
}

export interface RecentPaymentsData {
  recentPayments: Array<{
    id: string | number;
    workerName: string;
    netPay: number;
    grossPay: number;
    deductions: number;
    timestamp: Date;
  }>;
  summary: {
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
  };
}

export interface PendingDebtsData {
  pendingDebts: Array<{
    id: string | number;
    workerName: string;
    amount: number;
    balance: number;
    dueDate: Date;
    daysOverdue: number;
  }>;
  summary: {
    totalPending: number;
    totalBalance: number;
    overdueCount: number;
  };
}

export interface SystemHealthData {
  database: {
    status: 'connected' | 'disconnected';
    uptime: number;
  };
  memory: NodeJS.MemoryUsage;
  platform: string;
  nodeVersion: string;
  entityCounts: {
    workers: number;
    activeAssignments: number;
    pendingDebts: number;
  };
  timestamp: string;
}

export interface AuditSummaryData {
  summary: Array<{
    action: string;
    count: number;
    first: Date | string;
    last: Date | string;
  }>;
  total: number;
  period: {
    start: string | undefined;
    end: string | undefined;
  };
}

export interface RecentActivitiesData {
  activities: Array<{
    id: string | number;
    action: string;
    actor: string;
    details: any;
    timestamp: Date;
  }>;
  total: number;
}

export interface NotificationsData {
  notifications: Array<{
    id: string | number;
    type: string;
    context: any;
    timestamp: Date;
    isUnread: boolean;
  }>;
  unreadCount: number;
  total: number;
}

// Mobile Dashboard Interfaces
export interface MobileDashboardData {
  timestamp: string;
  overviewCards: Array<{
    title: string;
    value: number;
    icon: string;
    color: string;
    trend: 'good' | 'average' | 'poor' | null;
    subValue?: string;
    format?: 'currency';
  }>;
  quickStats: {
    completionRate: number;
    activeAssignments: number;
    pendingDebts: number;
    totalDebtBalance: number;
    averagePayment: number;
  };
  recentActivities: Array<{
    id: string | number;
    type: string;
    workerName: string;
    action: string;
    luwangCount: number;
    status: string;
    time: string;
  }>;
  todaysTopWorkers: Array<{
    workerName: string;
    assignmentCount: number;
    totalLuwang: number;
  }>;
  alerts: Array<{
    type: 'warning' | 'info';
    title: string;
    message: string;
    priority: 'high' | 'medium';
  }>;
  lastUpdated: string;
}

export interface QuickStatsData {
  overallHealth: 'excellent' | 'good' | 'fair' | 'needs_attention';
  keyMetrics: {
    activeWorkers: number;
    activeAssignments: number;
    pendingDebts: number;
    todayPayments: number;
    completionRate: number;
  };
  priorityActions: string[];
}

export interface WorkerQuickViewData {
  workerInfo: {
    name: string;
    status: string;
    kabisilya: string;
    totalAssignments: number;
    totalLuwang: number;
    totalDebt: number;
    currentBalance: number;
  };
  performance: {
    completionRate: number;
    averageLuwang: number;
    performanceScore: number;
    recentCompletionRate: number;
    category: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  };
  recentActivity: {
    assignments: Array<{
      id: string | number;
      pitakLocation: string;
      luwangCount: number;
      status: string;
      date: Date | string;
    }>;
    debts: Array<{
      id: string | number;
      amount: number;
      balance: number;
      dateIncurred: Date | string;
      status: string;
    }>;
    payments: Array<{
      id: string | number;
      netPay: number;
      grossPay: number;
      deductions: number;
      date: Date | string;
    }>;
  };
  alerts: Array<{
    type: 'debt' | 'assignment' | 'performance';
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  summary: {
    lastUpdated: string;
    overallStatus: 'inactive' | 'needs_attention' | 'busy' | 'active' | 'available';
  };
}

export interface DashboardPayload {
  method: string;
  params?: Record<string, any>;
}

class DashboardAPI {
  private async callBackend(method: string, params: any = {}): Promise<DashboardResponse<any>> {
    try {
      if (!window.backendAPI || !window.backendAPI.kabisilyaDashboard) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.kabisilyaDashboard({
        method,
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || `Failed to execute ${method}`);
    } catch (error: any) {
      throw new Error(error.message || `Failed to execute ${method}`);
    }
  }

  // Worker Analytics Methods
  async getWorkersOverview(params: any = {}): Promise<DashboardResponse<WorkersOverviewData>> {
    return this.callBackend("getWorkersOverview", params);
  }

  async getWorkerPerformance(params: { period?: 'week' | 'month' | 'quarter' | 'year'; limit?: number } = {}): Promise<DashboardResponse<WorkerPerformanceData>> {
    return this.callBackend("getWorkerPerformance", params);
  }

  async getWorkerStatusSummary(params: { period?: string } = {}): Promise<DashboardResponse<WorkerStatusSummaryData>> {
    return this.callBackend("getWorkerStatusSummary", params);
  }

  async getTopPerformers(params: { category: 'highest_production' | 'lowest_debt' | 'highest_earning'; timeFrame?: string; limit?: number } = { category: 'highest_production' }): Promise<DashboardResponse<TopPerformersData>> {
    return this.callBackend("getTopPerformers", params);
  }

  async getWorkerAttendance(params: { startDate?: string; endDate?: string; workerId?: string | number } = {}): Promise<DashboardResponse<WorkerAttendanceData>> {
    return this.callBackend("getWorkerAttendance", params);
  }

  // Financial Analytics Methods
  async getFinancialOverview(params: any = {}): Promise<DashboardResponse<FinancialOverviewData>> {
    return this.callBackend("getFinancialOverview", params);
  }

  async getDebtSummary(params: { status?: string; workerId?: string | number; startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<DebtSummaryData>> {
    return this.callBackend("getDebtSummary", params);
  }

  async getPaymentSummary(params: { period?: 'month' | 'quarter' | 'year'; startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<PaymentSummaryData>> {
    return this.callBackend("getPaymentSummary", params);
  }

  async getRevenueTrend(params: { period?: 'month' | 'quarter' | 'year' } = {}): Promise<DashboardResponse<RevenueTrendData>> {
    return this.callBackend("getRevenueTrend", params);
  }

  async getDebtCollectionRate(params: { period?: 'month' | 'quarter' | 'year'; startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<DebtCollectionRateData>> {
    return this.callBackend("getDebtCollectionRate", params);
  }

  // Assignment Analytics Methods
  async getAssignmentOverview(params: any = {}): Promise<DashboardResponse<AssignmentOverviewData>> {
    return this.callBackend("getAssignmentOverview", params);
  }

  async getAssignmentTrend(params: { period?: 'week' | 'month' | 'quarter'; groupBy?: 'daily' | 'hourly' } = {}): Promise<DashboardResponse<AssignmentTrendData>> {
    return this.callBackend("getAssignmentTrend", params);
  }

  async getLuwangSummary(params: { period?: 'month' | 'quarter' | 'year'; startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<LuwangSummaryData>> {
    return this.callBackend("getLuwangSummary", params);
  }

  async getAssignmentCompletionRate(params: { period?: 'month' | 'quarter' | 'year'; startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<AssignmentCompletionRateData>> {
    return this.callBackend("getAssignmentCompletionRate", params);
  }

  async getPitakUtilization(params: { period?: string; bukidId?: string | number } = {}): Promise<DashboardResponse<PitakUtilizationData>> {
    return this.callBackend("getPitakUtilization", params);
  }

  // Kabisilya Analytics Methods
  async getKabisilyaOverview(params: any = {}): Promise<DashboardResponse<KabisilyaOverviewData>> {
    return this.callBackend("getKabisilyaOverview", params);
  }

  async getBukidSummary(params: { kabisilyaId?: string | number } = {}): Promise<DashboardResponse<BukidSummaryData>> {
    return this.callBackend("getBukidSummary", params);
  }

  async getPitakSummary(params: { bukidId?: string | number } = {}): Promise<DashboardResponse<PitakSummaryData>> {
    return this.callBackend("getPitakSummary", params);
  }

  async getProductionByKabisilya(params: { period?: 'month' | 'quarter' | 'year'; startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<ProductionByKabisilyaData>> {
    return this.callBackend("getProductionByKabisilya", params);
  }

  async getLandUtilization(params: { period?: string } = {}): Promise<DashboardResponse<LandUtilizationData>> {
    return this.callBackend("getLandUtilization", params);
  }

  // Real-Time Dashboard Methods
  async getLiveDashboard(params: any = {}): Promise<DashboardResponse<LiveDashboardData>> {
    return this.callBackend("getLiveDashboard", params);
  }

  async getTodayStats(params: any = {}): Promise<DashboardResponse<TodayStatsData>> {
    return this.callBackend("getTodayStats", params);
  }

  async getRealTimeAssignments(params: { limit?: number } = {}): Promise<DashboardResponse<RealTimeAssignmentsData>> {
    return this.callBackend("getRealTimeAssignments", params);
  }

  async getRecentPayments(params: { limit?: number } = {}): Promise<DashboardResponse<RecentPaymentsData>> {
    return this.callBackend("getRecentPayments", params);
  }

  async getPendingDebts(params: { limit?: number } = {}): Promise<DashboardResponse<PendingDebtsData>> {
    return this.callBackend("getPendingDebts", params);
  }

  async getSystemHealth(params: any = {}): Promise<DashboardResponse<SystemHealthData>> {
    return this.callBackend("getSystemHealth", params);
  }

  async getAuditSummary(params: { startDate?: string; endDate?: string } = {}): Promise<DashboardResponse<AuditSummaryData>> {
    return this.callBackend("getAuditSummary", params);
  }

  async getRecentActivities(params: { limit?: number } = {}): Promise<DashboardResponse<RecentActivitiesData>> {
    return this.callBackend("getRecentActivities", params);
  }

  async getNotifications(params: { unreadOnly?: boolean; limit?: number } = {}): Promise<DashboardResponse<NotificationsData>> {
    return this.callBackend("getNotifications", params);
  }

  // Mobile Dashboard Methods
  async getMobileDashboard(params: any = {}): Promise<DashboardResponse<MobileDashboardData>> {
    return this.callBackend("getMobileDashboard", params);
  }

  async getQuickStats(params: any = {}): Promise<DashboardResponse<QuickStatsData>> {
    return this.callBackend("getQuickStats", params);
  }

  async getWorkerQuickView(params: { workerId: string | number }): Promise<DashboardResponse<WorkerQuickViewData>> {
    return this.callBackend("getWorkerQuickView", params);
  }
}

const dashboardAPI = new DashboardAPI();

export default dashboardAPI;