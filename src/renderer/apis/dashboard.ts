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
      id: any;
      name: any;
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
    workerId: any;
    workerName: any;
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
    workerId: any;
    workerName: any;
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
    date: any;
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
      start: any;
      end: any;
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
    status: any;
    count: number;
    totalBalance: number;
    totalAmount: number;
  }>;
  upcomingDueDates: Array<{
    debtId: any;
    dueDate: Date;
    balance: number;
    originalAmount: number;
    workerName: any;
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
    status: any;
    count: number;
    totalAmount: number;
    averageAmount: number;
  }>;
  overdueDebts: Array<{
    id: any;
    amount: number;
    balance: number;
    daysOverdue: number;
    workerName: any;
    status: any;
  }>;
  debtTrend: Array<{
    date: any;
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
    date: any;
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
    workerId: any;
    workerName: any;
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
    date: any;
    revenue: number;
    payments: number;
    averageRevenue: number;
  }>;
  metrics: {
    totalRevenue: number;
    totalPayments: number;
    averageDailyRevenue: number;
    peakRevenueDay: {
      date: any;
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
    date: any;
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
    date: any;
    collected: number;
    paymentCount: number;
  }>;
  collectionEfficiency: {
    averageDailyCollection: number;
    bestCollectionDay: {
      date: any;
      collected: number;
    };
    totalCollectionDays: number;
  };
  problematicDebts: Array<{
    id: any;
    amount: number;
    collected: number;
    balance: number;
    ageInDays: number;
    collectionRate: number;
    status: any;
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
    date: any;
    newAssignments: number;
    completedAssignments: number;
    cancelledAssignments: number;
  }>;
  metrics: {
    totalAssignments: number;
    completionRate: number;
    averageDailyAssignments: number;
    peakDay: {
      date: any;
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
    date: any;
    totalLuwang: number;
    assignmentCount: number;
    averageLuwang: number;
  }>;
  topLuwangWorkers: Array<{
    workerId: any;
    workerName: any;
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
    date: any;
    completed: number;
    total: number;
    completionRate: number;
  }>;
  completionByWorker: Array<{
    workerId: any;
    workerName: any;
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
    pitakId: any;
    location: any;
    bukidName: any;
    totalLuwang: number;
    status: any;
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
      pitaks: any[];
      percentage: number;
    };
    medium: {
      count: number;
      pitaks: any[];
      percentage: number;
    };
    low: {
      count: number;
      pitaks: any[];
      percentage: number;
    };
    underutilized: {
      count: number;
      pitaks: any[];
      percentage: number;
    };
  };
  mostUtilized: any[];
  needsAttention: any[];
  recommendations: string[];
}

// Kabisilya Analytics Interfaces
export interface KabisilyaOverviewData {
  kabisilyas: Array<{
    id: any;
    name: any;
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
    createdAt: any;
    lastUpdated: any;
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
      name: any;
      workerCount: number;
      activeWorkers: number;
    }>;
    byDebt: Array<{
      name: any;
      totalDebt: number;
      averageDebt: number;
    }>;
  };
  mostActive: any[];
  highestDebt: any[];
  lastUpdated: Date;
}

export interface BukidSummaryData {
  bukidSummary: Array<{
    bukidId: any;
    bukidName: any;
    kabisilyaName: any;
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
      bukids: any[];
    };
    mediumUtilization: {
      count: number;
      percentage: number;
      bukids: any[];
    };
    lowUtilization: {
      count: number;
      percentage: number;
      bukids: any[];
    };
  };
  mostUtilized: any[];
  needsAttention: any[];
  recommendations: string[];
}

export interface PitakSummaryData {
  pitakSummary: Array<{
    pitakId: any;
    location: any;
    bukidName: any;
    kabisilyaName: any;
    totalLuwang: number;
    assignedLuwang: number;
    completedLuwang: number;
    utilizationRate: number;
    status: any;
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
      pitaks: any[];
    };
    mediumUtilization: {
      count: number;
      percentage: number;
      pitaks: any[];
    };
    lowUtilization: {
      count: number;
      percentage: number;
      pitaks: any[];
    };
  };
  mostUtilized: any[];
  needsAttention: any[];
  recommendations: string[];
}

export interface ProductionByKabisilyaData {
  productionData: Array<{
    kabisilyaId: any;
    kabisilyaName: any;
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
    byProduction: any[];
    byEfficiency: any[];
  };
  trends: Array<{
    date: any;
    totalLuwang: number;
    completedLuwang: number;
    productionRate: number;
  }>;
}

export interface LandUtilizationData {
  landUtilization: Array<{
    bukidId: any;
    bukidName: any;
    kabisilyaName: any;
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
      bukids: any[];
    };
    wellUtilized: {
      count: number;
      percentage: number;
      bukids: any[];
    };
    underutilized: {
      count: number;
      percentage: number;
      bukids: any[];
    };
    severelyUnderutilized: {
      count: number;
      percentage: number;
      bukids: any[];
    };
  };
  rankings: {
    byUtilization: Array<{
      bukidName: any;
      overallUtilization: number;
      capacityUtilization: number;
      kabisilyaName: any;
    }>;
    byCapacity: Array<{
      bukidName: any;
      totalLuwang: number;
      assignedLuwang: number;
      kabisilyaName: any;
    }>;
  };
  byKabisilya: Array<{
    kabisilyaName: any;
    bukidCount: number;
    capacityUtilization: number;
    completionUtilization: number;
    overallUtilization: number;
    totalLuwangCapacity: number;
    assignedLuwang: number;
    completedLuwang: number;
  }>;
  needsAttention: any[];
  mostUtilized: any[];
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
    type: string;
    id: any;
    workerName: any;
    pitakLocation?: any;
    luwangCount?: number;
    netPay?: number;
    status: any;
    timestamp: any;
    action: string;
  }>;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    priority: string;
    timestamp?: Date;
    details?: any[];
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
    id: any;
    workerName: any;
    pitakLocation: any;
    luwangCount: number;
    status: any;
    startTime: any;
    duration: number;
  }>;
  recentCompletions: Array<{
    id: any;
    workerName: any;
    pitakLocation: any;
    luwangCount: number;
    completionTime: any;
  }>;
  metrics: {
    totalActive: number;
    averageDuration: number;
    completionRate: number;
  };
}

export interface RecentPaymentsData {
  recentPayments: Array<{
    id: any;
    workerName: any;
    netPay: number;
    grossPay: number;
    deductions: number;
    timestamp: any;
  }>;
  summary: {
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
  };
}

export interface PendingDebtsData {
  pendingDebts: Array<{
    id: any;
    workerName: any;
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
    status: string;
    uptime: number;
  };
  memory: any;
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
    action: any;
    count: number;
    first: any;
    last: any;
  }>;
  total: number;
  period: {
    start: any;
    end: any;
  };
}

export interface RecentActivitiesData {
  activities: Array<{
    id: any;
    action: any;
    actor: any;
    details: any;
    timestamp: any;
  }>;
  total: number;
}

export interface NotificationsData {
  notifications: Array<{
    id: any;
    type: any;
    context: any;
    timestamp: any;
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
    trend: string | null;
    subValue?: string;
    format?: string;
  }>;
  quickStats: {
    completionRate: number;
    activeAssignments: number;
    pendingDebts: number;
    totalDebtBalance: number;
    averagePayment: number;
  };
  recentActivities: Array<{
    id: any;
    type: string;
    workerName: any;
    action: string;
    luwangCount: number;
    status: any;
    time: string;
  }>;
  todaysTopWorkers: Array<{
    workerName: any;
    assignmentCount: number;
    totalLuwang: number;
  }>;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    priority: string;
  }>;
  lastUpdated: string;
}

export interface QuickStatsData {
  overallHealth: string;
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
    name: any;
    status: any;
    kabisilya: any;
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
    category: string;
  };
  recentActivity: {
    assignments: Array<{
      id: any;
      pitakLocation: any;
      luwangCount: number;
      status: any;
      date: any;
    }>;
    debts: Array<{
      id: any;
      amount: number;
      balance: number;
      dateIncurred: any;
      status: any;
    }>;
    payments: Array<{
      id: any;
      netPay: number;
      grossPay: number;
      deductions: number;
      date: any;
    }>;
  };
  alerts: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
  summary: {
    lastUpdated: string;
    overallStatus: string;
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

  async getWorkerPerformance(params: any = {}): Promise<DashboardResponse<WorkerPerformanceData>> {
    return this.callBackend("getWorkerPerformance", params);
  }

  async getWorkerStatusSummary(params: any = {}): Promise<DashboardResponse<WorkerStatusSummaryData>> {
    return this.callBackend("getWorkerStatusSummary", params);
  }

  async getTopPerformers(params: any = {}): Promise<DashboardResponse<TopPerformersData>> {
    return this.callBackend("getTopPerformers", params);
  }

  async getWorkerAttendance(params: any = {}): Promise<DashboardResponse<WorkerAttendanceData>> {
    return this.callBackend("getWorkerAttendance", params);
  }

  // Financial Analytics Methods
  async getFinancialOverview(params: any = {}): Promise<DashboardResponse<FinancialOverviewData>> {
    return this.callBackend("getFinancialOverview", params);
  }

  async getDebtSummary(params: any = {}): Promise<DashboardResponse<DebtSummaryData>> {
    return this.callBackend("getDebtSummary", params);
  }

  async getPaymentSummary(params: any = {}): Promise<DashboardResponse<PaymentSummaryData>> {
    return this.callBackend("getPaymentSummary", params);
  }

  async getRevenueTrend(params: any = {}): Promise<DashboardResponse<RevenueTrendData>> {
    return this.callBackend("getRevenueTrend", params);
  }

  async getDebtCollectionRate(params: any = {}): Promise<DashboardResponse<DebtCollectionRateData>> {
    return this.callBackend("getDebtCollectionRate", params);
  }

  // Assignment Analytics Methods
  async getAssignmentOverview(params: any = {}): Promise<DashboardResponse<AssignmentOverviewData>> {
    return this.callBackend("getAssignmentOverview", params);
  }

  async getAssignmentTrend(params: any = {}): Promise<DashboardResponse<AssignmentTrendData>> {
    return this.callBackend("getAssignmentTrend", params);
  }

  async getLuwangSummary(params: any = {}): Promise<DashboardResponse<LuwangSummaryData>> {
    return this.callBackend("getLuwangSummary", params);
  }

  async getAssignmentCompletionRate(params: any = {}): Promise<DashboardResponse<AssignmentCompletionRateData>> {
    return this.callBackend("getAssignmentCompletionRate", params);
  }

  async getPitakUtilization(params: any = {}): Promise<DashboardResponse<PitakUtilizationData>> {
    return this.callBackend("getPitakUtilization", params);
  }

  // Kabisilya Analytics Methods
  async getKabisilyaOverview(params: any = {}): Promise<DashboardResponse<KabisilyaOverviewData>> {
    return this.callBackend("getKabisilyaOverview", params);
  }

  async getBukidSummary(params: any = {}): Promise<DashboardResponse<BukidSummaryData>> {
    return this.callBackend("getBukidSummary", params);
  }

  async getPitakSummary(params: any = {}): Promise<DashboardResponse<PitakSummaryData>> {
    return this.callBackend("getPitakSummary", params);
  }

  async getProductionByKabisilya(params: any = {}): Promise<DashboardResponse<ProductionByKabisilyaData>> {
    return this.callBackend("getProductionByKabisilya", params);
  }

  async getLandUtilization(params: any = {}): Promise<DashboardResponse<LandUtilizationData>> {
    return this.callBackend("getLandUtilization", params);
  }

  // Real-Time Dashboard Methods
  async getLiveDashboard(params: any = {}): Promise<DashboardResponse<LiveDashboardData>> {
    return this.callBackend("getLiveDashboard", params);
  }

  async getTodayStats(params: any = {}): Promise<DashboardResponse<TodayStatsData>> {
    return this.callBackend("getTodayStats", params);
  }

  async getRealTimeAssignments(params: any = {}): Promise<DashboardResponse<RealTimeAssignmentsData>> {
    return this.callBackend("getRealTimeAssignments", params);
  }

  async getRecentPayments(params: any = {}): Promise<DashboardResponse<RecentPaymentsData>> {
    return this.callBackend("getRecentPayments", params);
  }

  async getPendingDebts(params: any = {}): Promise<DashboardResponse<PendingDebtsData>> {
    return this.callBackend("getPendingDebts", params);
  }

  async getSystemHealth(params: any = {}): Promise<DashboardResponse<SystemHealthData>> {
    return this.callBackend("getSystemHealth", params);
  }

  async getAuditSummary(params: any = {}): Promise<DashboardResponse<AuditSummaryData>> {
    return this.callBackend("getAuditSummary", params);
  }

  async getRecentActivities(params: any = {}): Promise<DashboardResponse<RecentActivitiesData>> {
    return this.callBackend("getRecentActivities", params);
  }

  async getNotifications(params: any = {}): Promise<DashboardResponse<NotificationsData>> {
    return this.callBackend("getNotifications", params);
  }

  // Mobile Dashboard Methods
  async getMobileDashboard(params: any = {}): Promise<DashboardResponse<MobileDashboardData>> {
    return this.callBackend("getMobileDashboard", params);
  }

  async getQuickStats(params: any = {}): Promise<DashboardResponse<QuickStatsData>> {
    return this.callBackend("getQuickStats", params);
  }

  async getWorkerQuickView(params: any = {}): Promise<DashboardResponse<WorkerQuickViewData>> {
    return this.callBackend("getWorkerQuickView", params);
  }
}

const dashboardAPI = new DashboardAPI();

export default dashboardAPI;