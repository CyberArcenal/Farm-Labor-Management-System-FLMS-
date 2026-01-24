// notificationAPI.ts - SIMILAR STRUCTURE TO activation.ts
export interface NotificationData {
  id: number;
  type: string;
  context: any;
  timestamp: string;
  createdAt?: string;
}

export interface NotificationListData {
  notifications: NotificationData[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface NotificationStatsData {
  totalCount: number;
  recentCount: number;
  todayCount: number;
  byType: Record<string, number>;
}

export interface NotificationTypesData {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
}

export interface NotificationPreferencesData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface SystemNotificationParams {
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  context?: any;
}

export interface WorkerNotificationParams {
  workerId: number;
  workerName?: string;
  notificationType: 'assignment' | 'payment' | 'debt' | 'status_change' | 'other';
  message: string;
  context?: any;
}

export interface DebtNotificationParams {
  debtId: number;
  workerId?: number;
  workerName?: string;
  amount?: number;
  status: 'created' | 'updated' | 'payment_received' | 'overdue' | 'settled';
  message: string;
  context?: any;
}

export interface PaymentNotificationParams {
  paymentId: number;
  workerId?: number;
  workerName?: string;
  amount?: number;
  status: 'created' | 'processing' | 'completed' | 'failed' | 'cancelled';
  message: string;
  context?: any;
}

export interface SearchNotificationsParams {
  query?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ExportNotificationsParams {
  startDate?: string;
  endDate?: string;
  type?: string;
}

export interface ExportReportParams {
  startDate: string;
  endDate: string;
  reportType?: 'summary' | 'daily' | 'detailed';
  groupBy?: string;
}

export interface NotificationResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface CSVExportResponse {
  csv: string;
  filename: string;
  count: number;
}

export interface ReportExportResponse extends CSVExportResponse {
  reportType: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  recordCount: number;
}

export interface NotificationPayload {
  method: string;
  params?: Record<string, any>;
}

class NotificationAPI {
  // 📋 READ-ONLY METHODS

  async getAllNotifications(params?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<NotificationResponse<NotificationListData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getAllNotifications",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all notifications");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all notifications");
    }
  }

  async getNotificationById(id: number): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getNotificationById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get notification by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get notification by ID");
    }
  }

  async getNotificationsByType(type: string, params?: {
    limit?: number;
    offset?: number;
  }): Promise<NotificationResponse<NotificationListData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getNotificationsByType",
        params: { type, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get notifications by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get notifications by type");
    }
  }

  async getRecentNotifications(params?: {
    limit?: number;
    days?: number;
  }): Promise<NotificationResponse<{ notifications: NotificationData[] }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getRecentNotifications",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get recent notifications");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get recent notifications");
    }
  }

  async getUnreadNotifications(params?: {
    limit?: number;
    offset?: number;
    userId?: number;
  }): Promise<NotificationResponse<NotificationListData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getUnreadNotifications",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get unread notifications");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get unread notifications");
    }
  }

  async getNotificationsByDateRange(
    startDate: string,
    endDate: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<NotificationResponse<NotificationListData & { dateRange: { startDate: string; endDate: string } }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getNotificationsByDateRange",
        params: { startDate, endDate, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get notifications by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get notifications by date range");
    }
  }

  async getNotificationStats(params?: {
    days?: number;
  }): Promise<NotificationResponse<{ stats: NotificationStatsData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getNotificationStats",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get notification stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get notification stats");
    }
  }

  async searchNotifications(params: SearchNotificationsParams): Promise<NotificationResponse<NotificationListData & {
    searchParams: SearchNotificationsParams;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "searchNotifications",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search notifications");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search notifications");
    }
  }

  async getUserPreferences(userId: number): Promise<NotificationResponse<{ preferences: NotificationPreferencesData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getUserPreferences",
        params: { userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user preferences");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user preferences");
    }
  }

  async getNotificationTypes(): Promise<NotificationResponse<{ notificationTypes: NotificationTypesData[] }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "getNotificationTypes",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get notification types");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get notification types");
    }
  }

  // ✏️ WRITE OPERATIONS

  async createNotification(type: string, context?: any): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "createNotification",
        params: { type, context },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create notification");
    }
  }

  async updateNotification(id: number, updates: {
    type?: string;
    context?: any;
  }): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "updateNotification",
        params: { id, ...updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update notification");
    }
  }

  async deleteNotification(id: number): Promise<NotificationResponse<{ deletedId: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "deleteNotification",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete notification");
    }
  }

  async markAsRead(id: number): Promise<NotificationResponse<{ notificationId: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "markAsRead",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark notification as read");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark notification as read");
    }
  }

  async markAllAsRead(params?: {
    type?: string;
  }): Promise<NotificationResponse<{ affected: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "markAllAsRead",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark all notifications as read");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark all notifications as read");
    }
  }

  async bulkDeleteNotifications(params: {
    ids?: number[];
    olderThan?: string;
    type?: string;
  }): Promise<NotificationResponse<{ deletedCount: number }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "bulkDeleteNotifications",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk delete notifications");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk delete notifications");
    }
  }

  // 📊 SPECIALIZED NOTIFICATION CREATION

  async createSystemNotification(params: SystemNotificationParams): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "createSystemNotification",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create system notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create system notification");
    }
  }

  async createWorkerNotification(params: WorkerNotificationParams): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "createWorkerNotification",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create worker notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create worker notification");
    }
  }

  async createDebtNotification(params: DebtNotificationParams): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "createDebtNotification",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create debt notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create debt notification");
    }
  }

  async createPaymentNotification(params: PaymentNotificationParams): Promise<NotificationResponse<{ notification: NotificationData }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "createPaymentNotification",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create payment notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payment notification");
    }
  }

  // 🔔 NOTIFICATION PREFERENCES

  async updateUserPreferences(userId: number, preferences: Partial<NotificationPreferencesData>): Promise<NotificationResponse<{
    userId: number;
    preferences: Partial<NotificationPreferencesData>;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "updateUserPreferences",
        params: { userId, preferences },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update user preferences");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user preferences");
    }
  }

  // 📤 EXPORT OPERATIONS

  async exportNotificationsToCSV(params?: ExportNotificationsParams): Promise<NotificationResponse<CSVExportResponse>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "exportNotificationsToCSV",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export notifications to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export notifications to CSV");
    }
  }

  async exportNotificationReport(params: ExportReportParams): Promise<NotificationResponse<ReportExportResponse>> {
    try {
      if (!window.backendAPI || !window.backendAPI.notification) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.notification({
        method: "exportNotificationReport",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export notification report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export notification report");
    }
  }

  // 🔧 UTILITY METHODS

  async getNotificationsCount(type?: string): Promise<number> {
    try {
      const stats = await this.getNotificationStats();
      if (type) {
        return stats.data.stats.byType[type] || 0;
      }
      return stats.data.stats.totalCount;
    } catch (error) {
      console.error("Error getting notifications count:", error);
      return 0;
    }
  }

  async getTodayNotifications(): Promise<NotificationData[]> {
    try {
      const today = new Date();
      const todayStart = today.toISOString().split('T')[0];
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await this.getNotificationsByDateRange(todayStart, todayEnd, { limit: 1000 });
      return response.data.notifications;
    } catch (error) {
      console.error("Error getting today's notifications:", error);
      return [];
    }
  }

  async getUnreadCount(userId?: number): Promise<number> {
    try {
      const response = await this.getUnreadNotifications({ limit: 1, userId });
      return response.data.pagination.total;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  async createQuickNotification(type: string, message: string, context?: any): Promise<NotificationResponse<{ notification: NotificationData }>> {
    return this.createNotification(type, {
      message,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  async notifySystem(title: string, message: string, priority: SystemNotificationParams['priority'] = 'medium'): Promise<NotificationResponse<{ notification: NotificationData }>> {
    return this.createSystemNotification({
      title,
      message,
      priority
    });
  }

  async notifyWorkerAssignment(workerId: number, workerName: string, assignmentDetails: any): Promise<NotificationResponse<{ notification: NotificationData }>> {
    return this.createWorkerNotification({
      workerId,
      workerName,
      notificationType: 'assignment',
      message: `New assignment for ${workerName}`,
      context: assignmentDetails
    });
  }

  async notifyDebtCreated(debtId: number, workerId: number, workerName: string, amount: number): Promise<NotificationResponse<{ notification: NotificationData }>> {
    return this.createDebtNotification({
      debtId,
      workerId,
      workerName,
      amount,
      status: 'created',
      message: `New debt created for ${workerName}: ₱${amount.toFixed(2)}`
    });
  }

  async notifyPaymentCompleted(paymentId: number, workerId: number, workerName: string, amount: number): Promise<NotificationResponse<{ notification: NotificationData }>> {
    return this.createPaymentNotification({
      paymentId,
      workerId,
      workerName,
      amount,
      status: 'completed',
      message: `Payment completed for ${workerName}: ₱${amount.toFixed(2)}`
    });
  }

  async clearOldNotifications(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const response = await this.bulkDeleteNotifications({
        olderThan: cutoffDate.toISOString()
      });
      
      return response.data.deletedCount;
    } catch (error) {
      console.error("Error clearing old notifications:", error);
      return 0;
    }
  }

  async isNotificationEnabled(type: string, userId: number): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences.data.preferences.notificationTypes[type] !== false;
    } catch (error) {
      console.error("Error checking notification preference:", error);
      return true; // Default to enabled if check fails
    }
  }

  async setNotificationPreference(userId: number, type: string, enabled: boolean): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const updatedPreferences = {
        ...preferences.data.preferences,
        notificationTypes: {
          ...preferences.data.preferences.notificationTypes,
          [type]: enabled
        }
      };
      
      await this.updateUserPreferences(userId, updatedPreferences);
      return true;
    } catch (error) {
      console.error("Error setting notification preference:", error);
      return false;
    }
  }

  async downloadNotificationsCSV(filename?: string): Promise<void> {
    try {
      const response = await this.exportNotificationsToCSV();
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || response.data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading notifications CSV:", error);
      throw error;
    }
  }

  async downloadReport(params: ExportReportParams): Promise<void> {
    try {
      const response = await this.exportNotificationReport(params);
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading notification report:", error);
      throw error;
    }
  }

  // 📡 EVENT LISTENERS (if available in your backend API)

  onNotificationCreated(callback: (data: NotificationData) => void) {
    if (window.backendAPI && window.backendAPI.onNotificationCreated) {
      window.backendAPI.onNotificationCreated(callback);
    }
  }

  onNotificationDeleted(callback: (id: number) => void) {
    if (window.backendAPI && window.backendAPI.onNotificationDeleted) {
      window.backendAPI.onNotificationDeleted(callback);
    }
  }

  onNotificationUpdated(callback: (data: NotificationData) => void) {
    if (window.backendAPI && window.backendAPI.onNotificationUpdated) {
      window.backendAPI.onNotificationUpdated(callback);
    }
  }

  onBulkNotificationsDeleted(callback: (count: number) => void) {
    if (window.backendAPI && window.backendAPI.onBulkNotificationsDeleted) {
      window.backendAPI.onBulkNotificationsDeleted(callback);
    }
  }
}

const notificationAPI = new NotificationAPI();

export default notificationAPI;