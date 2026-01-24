// paymentAPI.ts - Payment Management API
export interface PaymentData {
  id: number;
  grossPay: number;
  manualDeduction: number;
  netPay: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'partially_paid';
  paymentDate: string | null;
  paymentMethod: string | null;
  referenceNumber: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  totalDebtDeduction: number;
  otherDeductions: number;
  deductionBreakdown: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  worker?: WorkerData;
  pitak?: PitakData;
}

export interface WorkerData {
  id: number;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  status: string;
  hireDate: string | null;
  totalDebt: number;
  totalPaid: number;
  currentBalance: number;
}

export interface PitakData {
  id: number;
  location: string | null;
  totalLuwang: number;
  status: string;
}

export interface PaymentHistoryData {
  id: number;
  actionType: string;
  changedField: string;
  oldValue: string | null;
  newValue: string | null;
  oldAmount: number | null;
  newAmount: number | null;
  notes: string | null;
  performedBy: string | null;
  changeDate: string;
}

export interface DebtHistoryData {
  id: number;
  amountPaid: number;
  previousBalance: number;
  newBalance: number;
  transactionType: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  transactionDate: string;
}

export interface PaymentSummaryData {
  totalPayments: number;
  totalGross: number;
  totalNet: number;
  totalDebtDeductions: number;
  totalManualDeductions: number;
  totalOtherDeductions: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  topWorkers: Array<{
    workerId: number;
    workerName: string;
    paymentCount: number;
    totalPaid: number;
  }>;
}

export interface WorkerPaymentSummaryData {
  worker: WorkerData;
  summary: {
    totalPayments: number;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    breakdown: {
      debt: number;
      manual: number;
      other: number;
    };
    averages: {
      payment: number;
      deduction: number;
    };
    statusDistribution: Record<string, number>;
  };
  monthlyBreakdown: Array<{
    monthYear: string;
    period: string;
    grossPay: number;
    netPay: number;
    deductions: number;
    paymentCount: number;
  }>;
  recentPayments: Array<{
    id: number;
    period: string;
    grossPay: number;
    netPay: number;
    status: string;
    paymentDate: string;
  }>;
}

export interface PaymentPeriodData {
  year: number;
  month: number;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  paymentCount: number;
  totalAmount: number;
  isCurrent: boolean;
}

export interface NetPayCalculationData {
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  deductionBreakdown: {
    manualDeduction: number;
    debtDeductions: number;
    otherDeductions: number;
    totalDeductions: number;
  };
}

export interface PaymentBreakdownData {
  paymentDetails: {
    id: number;
    workerName: string;
    grossPay: number;
    netPay: number;
    status: string;
    period: string;
  };
  deductions: {
    total: number;
    byCategory: {
      debt: number;
      manual: number;
      other: number;
    };
    debtBreakdown: Array<{
      debtId: number;
      amount: number;
      transactionType: string;
      previousBalance: number;
      newBalance: number;
    }>;
  };
  activeDebts: Array<{
    id: number;
    originalAmount: number;
    balance: number;
    status: string;
    dueDate: string | null;
    interestRate: number;
  }>;
}

export interface PaymentReportData {
  metadata: {
    generatedAt: string;
    period: string;
    filters: {
      workerId: string;
      status: string;
    };
  };
  summary: {
    totalPayments: number;
    totalGross: string;
    totalNet: string;
    totalDeductions: string;
    statusBreakdown: Record<string, number>;
  };
  payments: Array<{
    id: number;
    worker: string;
    grossPay: string;
    netPay: string;
    deductions: {
      debt: string;
      manual: string;
      other: string;
    };
    status: string;
    paymentDate: string;
    period: string;
  }>;
}

export interface PaymentStatsData {
  totalPayments: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  cancelledCount: number;
  totalAmount: number;
  averagePayment: number;
  monthlyTrend: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export interface CSVExportData {
  format: string;
  content: string;
  count: number;
  fileName: string;
  contentType?: string;
}

export interface PDFExportData {
  format: string;
  content: Buffer;
  fileName: string;
  contentType: string;
}

export interface PaymentPaginationData {
  payments: PaymentData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: any;
}

export interface PaymentResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

export interface FileOperationResponse {
  status: boolean;
  message: string;
  data: {
    filePath: string;
  };
}

export interface PaymentPayload {
  method: string;
  params?: Record<string, any>;
}

class PaymentAPI {
  // 🔎 Read-only methods
  
  async getAllPayments(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getAllPayments",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all payments");
    }
  }

  async getPaymentById(paymentId: number): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentById",
        params: { paymentId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payment by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payment by ID");
    }
  }

  async getPaymentsByWorker(workerId: number, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentsByWorker",
        params: { workerId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payments by worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payments by worker");
    }
  }

  async getPaymentsByPitak(pitakId: number, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentsByPitak",
        params: { pitakId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payments by pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payments by pitak");
    }
  }

  async getPaymentsByStatus(status: string, params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentsByStatus",
        params: { status, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payments by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payments by status");
    }
  }

  async getPaymentsByDateRange(startDate: string, endDate: string, params?: {
    status?: string;
    workerId?: number;
    pitakId?: number;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentsByDateRange",
        params: { startDate, endDate, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payments by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payments by date range");
    }
  }

  async getPaymentWithDetails(paymentId: number): Promise<PaymentResponse<{
    payment: PaymentData;
    history: PaymentHistoryData[];
    debtPayments: DebtHistoryData[];
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentWithDetails",
        params: { paymentId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payment with details");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payment with details");
    }
  }

  async getPaymentSummary(params?: {
    startDate?: string;
    endDate?: string;
    workerId?: number;
    pitakId?: number;
  }): Promise<PaymentResponse<PaymentSummaryData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentSummary",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payment summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payment summary");
    }
  }

  async getPendingPayments(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPendingPayments",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get pending payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pending payments");
    }
  }

  async getPaymentStats(params?: {
    year?: number;
    month?: number;
  }): Promise<PaymentResponse<PaymentStatsData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentStats",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payment stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payment stats");
    }
  }

  async searchPayments(params: {
    query?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    workerName?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<PaymentPaginationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "searchPayments",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search payments");
    }
  }

  async calculateNetPay(params: {
    grossPay: number;
    manualDeduction?: number;
    debtDeductions?: number;
    otherDeductions?: number;
  }): Promise<PaymentResponse<NetPayCalculationData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "calculateNetPay",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate net pay");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate net pay");
    }
  }

  async getPaymentHistory(paymentId: number, params?: {
    actionType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PaymentResponse<{
    history: Array<{
      id: number;
      timestamp: string;
      action: string;
      field: string;
      changes: {
        oldValue: string | null;
        newValue: string | null;
        oldAmount: number | null;
        newAmount: number | null;
      };
      performedBy: string | null;
      notes: string | null;
    }>;
    summary: {
      totalRecords: number;
      activitySummary: Array<{ actionType: string; count: number }>;
      firstChange: string | null;
      lastChange: string | null;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentHistory",
        params: { paymentId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payment history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payment history");
    }
  }

  async getPaymentPeriods(params?: {
    year?: number;
    workerId?: number;
  }): Promise<PaymentResponse<{
    periods: PaymentPeriodData[];
    years: Array<{
      year: number;
      paymentCount: number;
      totalAmount: string;
      averagePayment: string;
    }>;
    currentPeriod: PaymentPeriodData | null;
    summary: {
      totalPeriods: number;
      totalYears: number;
      earliestYear: number | null;
      latestYear: number | null;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getPaymentPeriods",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payment periods");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payment periods");
    }
  }

  async getWorkerPaymentSummary(workerId: number, params?: {
    year?: number;
    month?: number;
  }): Promise<PaymentResponse<WorkerPaymentSummaryData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "getWorkerPaymentSummary",
        params: { workerId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get worker payment summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get worker payment summary");
    }
  }

  async generatePaymentBreakdown(paymentId: number): Promise<PaymentResponse<{
    breakdown: {
      summary: Record<string, string>;
      deductions: Record<string, number>;
      activeDebtsCount: number;
      calculationSteps: string[];
    };
    detailed: PaymentBreakdownData;
    raw: any;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "generatePaymentBreakdown",
        params: { paymentId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate payment breakdown");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate payment breakdown");
    }
  }

  async generatePaymentReport(params: {
    format?: 'pdf' | 'csv' | 'json';
    startDate?: string;
    endDate?: string;
    workerId?: number;
    status?: string;
    reportType?: string;
  }): Promise<PaymentResponse<CSVExportData | PDFExportData | PaymentReportData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "generatePaymentReport",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate payment report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate payment report");
    }
  }

  async exportPaymentsToCSV(params?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    workerId?: number;
  }): Promise<PaymentResponse<CSVExportData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "exportPaymentsToCSV",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export payments to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export payments to CSV");
    }
  }

  async exportPaymentSlip(paymentId: number): Promise<PaymentResponse<PDFExportData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "exportPaymentSlip",
        params: { paymentId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export payment slip");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export payment slip");
    }
  }

  // ✏️ Write methods

  async createPayment(params: {
    workerId: number;
    pitakId?: number;
    grossPay: number;
    periodStart?: string;
    periodEnd?: string;
    manualDeduction?: number;
    otherDeductions?: number;
    notes?: string;
  }): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "createPayment",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment");
    }
  }

  async updatePayment(paymentId: number, params: {
    grossPay?: number;
    manualDeduction?: number;
    otherDeductions?: number;
    notes?: string;
    periodStart?: string;
    periodEnd?: string;
  }): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "updatePayment",
        params: { paymentId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update payment");
    }
  }

  async deletePayment(paymentId: number): Promise<PaymentResponse<{
    deletedPayment: {
      id: number;
      workerName?: string;
      amount: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "deletePayment",
        params: { paymentId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete payment");
    }
  }

  async updatePaymentStatus(paymentId: number, params: {
    status: string;
    notes?: string;
  }): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "updatePaymentStatus",
        params: { paymentId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update payment status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update payment status");
    }
  }

  async addPaymentNote(paymentId: number, note: string): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "addPaymentNote",
        params: { paymentId, note },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add payment note");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add payment note");
    }
  }

  async processPayment(paymentId: number, params?: {
    paymentDate?: string;
    paymentMethod?: string;
    referenceNumber?: string;
  }): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "processPayment",
        params: { paymentId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to process payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to process payment");
    }
  }

  async cancelPayment(paymentId: number, reason?: string): Promise<PaymentResponse<{ payment: PaymentData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "cancelPayment",
        params: { paymentId, reason },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to cancel payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to cancel payment");
    }
  }

  async applyDebtDeduction(paymentId: number, params: {
    debtId?: number;
    deductionAmount: number;
  }): Promise<PaymentResponse<{
    payment: PaymentData;
    summary: {
      debtAmount: number;
      totalDebtDeductions: number;
      newNetPay: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "applyDebtDeduction",
        params: { paymentId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to apply debt deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to apply debt deduction");
    }
  }

  async updateDeductions(paymentId: number, params: {
    manualDeduction?: number;
    otherDeductions?: number;
    deductionBreakdown?: any;
  }): Promise<PaymentResponse<{
    payment: PaymentData;
    summary: {
      grossPay: number;
      totalDeductions: number;
      netPay: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "updateDeductions",
        params: { paymentId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update deductions");
    }
  }

  async assignPaymentToWorker(paymentId: number, workerId: number): Promise<PaymentResponse<{
    payment: PaymentData;
    oldWorker: { id: number; name: string } | null;
    newWorker: { id: number; name: string };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "assignPaymentToWorker",
        params: { paymentId, workerId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to assign payment to worker");
    } catch (error: any) {
      throw new Error(error.message || "Failed to assign payment to worker");
    }
  }

  async assignPaymentToPitak(paymentId: number, pitakId?: number): Promise<PaymentResponse<{
    payment: PaymentData;
    oldPitak: { id: number } | null;
    newPitak: { id: number } | null;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "assignPaymentToPitak",
        params: { paymentId, pitakId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to assign payment to pitak");
    } catch (error: any) {
      throw new Error(error.message || "Failed to assign payment to pitak");
    }
  }

  async linkDebtPayment(paymentId: number, debtHistoryId: number): Promise<PaymentResponse<{
    payment: PaymentData;
    debtHistory: DebtHistoryData;
    summary: {
      debtAmount: number;
      totalDebtDeductions: number;
      newNetPay: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "linkDebtPayment",
        params: { paymentId, debtHistoryId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to link debt payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to link debt payment");
    }
  }

  async bulkCreatePayments(payments: Array<{
    workerId: number;
    pitakId?: number;
    grossPay: number;
    periodStart?: string;
    periodEnd?: string;
    manualDeduction?: number;
    otherDeductions?: number;
    notes?: string;
  }>): Promise<PaymentResponse<BulkOperationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "bulkCreatePayments",
        params: { payments },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create payments");
    }
  }

  async bulkUpdatePayments(updates: Array<{
    paymentId: number;
    grossPay?: number;
    manualDeduction?: number;
    otherDeductions?: number;
    notes?: string;
    status?: string;
  }>): Promise<PaymentResponse<BulkOperationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "bulkUpdatePayments",
        params: { updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update payments");
    }
  }

  async bulkProcessPayments(paymentIds: number[], params?: {
    paymentDate?: string;
    paymentMethod?: string;
  }): Promise<PaymentResponse<BulkOperationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "bulkProcessPayments",
        params: { paymentIds, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk process payments");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk process payments");
    }
  }

  async importPaymentsFromCSV(filePath: string): Promise<PaymentResponse<BulkOperationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "importPaymentsFromCSV",
        params: { filePath },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import payments from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import payments from CSV");
    }
  }

  // Utility methods

  async calculatePaymentStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  }> {
    try {
      const stats = await this.getPaymentStats();
      return {
        total: stats.data.totalPayments,
        pending: stats.data.pendingCount,
        completed: stats.data.completedCount,
        totalAmount: stats.data.totalAmount,
      };
    } catch (error) {
      console.error("Error calculating payment stats:", error);
      return { total: 0, pending: 0, completed: 0, totalAmount: 0 };
    }
  }

  async getWorkerRecentPayments(workerId: number, limit: number = 5): Promise<PaymentData[]> {
    try {
      const response = await this.getPaymentsByWorker(workerId, { limit, page: 1 });
      return response.data.payments;
    } catch (error) {
      console.error("Error getting worker recent payments:", error);
      return [];
    }
  }

  async calculateWorkerTotalPaid(workerId: number): Promise<number> {
    try {
      const summary = await this.getWorkerPaymentSummary(workerId);
      return parseFloat(summary.data.summary.totalNet);
    } catch (error) {
      console.error("Error calculating worker total paid:", error);
      return 0;
    }
  }

  async getPaymentStatusCounts(): Promise<Record<string, number>> {
    try {
      const stats = await this.getPaymentStats();
      return {
        pending: stats.data.pendingCount,
        processing: stats.data.processingCount,
        completed: stats.data.completedCount,
        cancelled: stats.data.cancelledCount,
      };
    } catch (error) {
      console.error("Error getting payment status counts:", error);
      return { pending: 0, processing: 0, completed: 0, cancelled: 0 };
    }
  }

  async validatePaymentData(payment: Partial<PaymentData>): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payment) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payment({
        method: "validatePaymentData",
        params: { payment },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate payment data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate payment data");
    }
  }

  async quickSearch(query: string): Promise<PaymentData[]> {
    try {
      const response = await this.searchPayments({ query, limit: 10 });
      return response.data.payments;
    } catch (error) {
      console.error("Error in quick search:", error);
      return [];
    }
  }

  async generatePaymentPDF(paymentId: number): Promise<Blob> {
    try {
      const response = await this.exportPaymentSlip(paymentId);
      return new Blob([response.data.content], { type: response.data.contentType });
    } catch (error) {
      console.error("Error generating payment PDF:", error);
      throw error;
    }
  }

  // Event listeners
  onPaymentCreated(callback: (data: PaymentData) => void) {
    if (window.backendAPI && window.backendAPI.onPaymentCreated) {
      window.backendAPI.onPaymentCreated(callback);
    }
  }

  onPaymentUpdated(callback: (data: PaymentData) => void) {
    if (window.backendAPI && window.backendAPI.onPaymentUpdated) {
      window.backendAPI.onPaymentUpdated(callback);
    }
  }

  onPaymentDeleted(callback: (paymentId: number) => void) {
    if (window.backendAPI && window.backendAPI.onPaymentDeleted) {
      window.backendAPI.onPaymentDeleted(callback);
    }
  }

  onPaymentProcessed(callback: (data: PaymentData) => void) {
    if (window.backendAPI && window.backendAPI.onPaymentProcessed) {
      window.backendAPI.onPaymentProcessed(callback);
    }
  }
}

const paymentAPI = new PaymentAPI();

export default paymentAPI;
// export type {
//   PaymentData,
//   WorkerData,
//   PitakData,
//   PaymentHistoryData,
//   DebtHistoryData,
//   PaymentSummaryData,
//   WorkerPaymentSummaryData,
//   PaymentPeriodData,
//   NetPayCalculationData,
//   PaymentBreakdownData,
//   PaymentReportData,
//   PaymentStatsData,
//   BulkOperationResult,
//   CSVExportData,
//   PDFExportData,
//   PaymentPaginationData,
//   PaymentResponse,
//   ValidationResponse,
//   FileOperationResponse,
//   PaymentPayload
// };