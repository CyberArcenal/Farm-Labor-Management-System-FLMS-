// dashboard/index.js - Main Dashboard Handler for Kabisilya Management
//@ts-check
const { ipcMain } = require("electron");
const { AppDataSource } = require("../../db/dataSource");

// Import modular handlers for Kabisilya Management
const workerAnalytics = require("./handlers/workerAnalytics");
const financialAnalytics = require("./handlers/financialAnalytics");
const assignmentAnalytics = require("./handlers/assignmentAnalytics");
const kabisilyaAnalytics = require("./handlers/kabisilyaAnalytics");
const realTimeDashboard = require("./handlers/realTimeDashboard");
const mobileDashboard = require("./handlers/mobileDashboard");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../utils/errorHandler");

class KabisilyaDashboardHandler {
  constructor() {
    this.repositories = null;
    this.initializeRepositories();
  }

  initializeRepositories() {
    try {
      this.repositories = {
        worker: AppDataSource.getRepository("Worker"),
        kabisilya: AppDataSource.getRepository("Kabisilya"),
        bukid: AppDataSource.getRepository("Bukid"),
        pitak: AppDataSource.getRepository("Pitak"),
        assignment: AppDataSource.getRepository("Assignment"),
        debt: AppDataSource.getRepository("Debt"),
        debtHistory: AppDataSource.getRepository("DebtHistory"),
        payment: AppDataSource.getRepository("Payment"),
        paymentHistory: AppDataSource.getRepository("PaymentHistory"),
        auditTrail: AppDataSource.getRepository("AuditTrail"),
        notification: AppDataSource.getRepository("Notification")
      };
    } catch (error) {
      console.error("Failed to initialize repositories:", error);
      if (logger) {
        // @ts-ignore
        logger.error("Failed to initialize repositories:", error);
      }
    }
  }


  /**
     * @param {{ sender: { id: any; }; }} event
     * @param {{ method: any; params: {}; }} payload
     */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      // @ts-ignore
      const userId = params.userId || event.sender.id || 0;

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`KabisiylaDashboardHandler: ${method}`, { params, userId });
      }

      // Ensure repositories are initialized
      if (!this.repositories) {
        this.initializeRepositories();
        if (!this.repositories) {
          throw new Error("Database repositories not available");
        }
      }

      // ROUTE REQUESTS
      switch (method) {
        // 👤 WORKER ANALYTICS
        case "getWorkersOverview":
          return await workerAnalytics.getWorkersOverview(this.repositories, params);
        
        case "getWorkerPerformance":
          return await workerAnalytics.getWorkerPerformance(this.repositories, params);
        
        case "getWorkerStatusSummary":
          return await workerAnalytics.getWorkerStatusSummary(this.repositories, params);
        
        case "getTopPerformers":
          return await workerAnalytics.getTopPerformers(this.repositories, params);
        
        case "getWorkerAttendance":
          return await workerAnalytics.getWorkerAttendance(this.repositories, params);

        // 💰 FINANCIAL ANALYTICS
        case "getFinancialOverview":
          return await financialAnalytics.getFinancialOverview(this.repositories, params);
        
        case "getDebtSummary":
          // @ts-ignore
          return await financialAnalytics.getDebtSummary(this.repositories, params);
        
        case "getPaymentSummary":
          // @ts-ignore
          return await financialAnalytics.getPaymentSummary(this.repositories, params);
        
        case "getRevenueTrend":
          return await financialAnalytics.getRevenueTrend(this.repositories, params);
        
        case "getDebtCollectionRate":
          return await financialAnalytics.getDebtCollectionRate(this.repositories, params);

        // 📝 ASSIGNMENT ANALYTICS
        case "getAssignmentOverview":
          return await assignmentAnalytics.getAssignmentOverview(this.repositories, params);
        
        case "getAssignmentTrend":
          return await assignmentAnalytics.getAssignmentTrend(this.repositories, params);
        
        case "getLuwangSummary":
          // @ts-ignore
          return await assignmentAnalytics.getLuwangSummary(this.repositories, params);
        
        case "getAssignmentCompletionRate":
          return await assignmentAnalytics.getAssignmentCompletionRate(this.repositories, params);
        
        case "getPitakUtilization":
          return await assignmentAnalytics.getPitakUtilization(this.repositories, params);

        // 🌾 KABISILYA ANALYTICS
        case "getKabisilyaOverview":
          return await kabisilyaAnalytics.getKabisilyaOverview(this.repositories, params);
        
        case "getBukidSummary":
          // @ts-ignore
          return await kabisilyaAnalytics.getBukidSummary(this.repositories, params);
        
        case "getPitakSummary":
          // @ts-ignore
          return await kabisilyaAnalytics.getPitakSummary(this.repositories, params);
        
        case "getProductionByKabisilya":
          // @ts-ignore
          return await kabisilyaAnalytics.getProductionByKabisilya(this.repositories, params);
        
        case "getLandUtilization":
          return await kabisilyaAnalytics.getLandUtilization(this.repositories, params);

        // 📈 REAL-TIME DASHBOARD
        case "getLiveDashboard":
          return await realTimeDashboard.getLiveDashboard(this.repositories, params);
        
        case "getTodayStats":
          return await realTimeDashboard.getTodayStats(this.repositories, params);
        
        case "getRealTimeAssignments":
          // @ts-ignore
          return await realTimeDashboard.getRealTimeAssignments(this.repositories, params);
        
        case "getRecentPayments":
          return await realTimeDashboard.getRecentPayments(this.repositories, params);
        
        case "getPendingDebts":
          return await realTimeDashboard.getPendingDebts(this.repositories, params);
        
        case "getSystemHealth":
          return await this.getSystemHealth(this.repositories, params);
        
        case "getAuditSummary":
          return await this.getAuditSummary(this.repositories, params);
        
        case "getRecentActivities":
          return await this.getRecentActivities(this.repositories, params);
        
        case "getNotifications":
          return await this.getNotifications(this.repositories, params);

        // 📱 MOBILE DASHBOARD
        case "getMobileDashboard":
          return await mobileDashboard.getMobileDashboard(this.repositories, params);
        
        case "getQuickStats":
          return await mobileDashboard.getQuickStats(this.repositories, params);
        
        case "getWorkerQuickView":
          // @ts-ignore
          return await mobileDashboard.getWorkerQuickView(this.repositories, params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("KabisilyaDashboardHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("KabisilyaDashboardHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // System Health Check
  // @ts-ignore
  // @ts-ignore
  async getSystemHealth(repositories, params) {
    try {
      // Check database connection
      const isDbConnected = await AppDataSource.query("SELECT 1 as health_check");
      
      // Get entity counts for health monitoring
      const workerCount = await repositories.worker.count();
      const assignmentCount = await repositories.assignment.count();
      const debtCount = await repositories.debt.count({
        where: { status: "pending" }
      });
      
      return {
        status: true,
        message: "System health check completed",
        data: {
          database: { 
            status: isDbConnected ? "connected" : "disconnected", 
            uptime: process.uptime() 
          },
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          entityCounts: {
            workers: workerCount,
            activeAssignments: assignmentCount,
            pendingDebts: debtCount
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: false,
        message: "System health check failed",
        data: {
          database: { status: "disconnected" },
          // @ts-ignore
          error: error.message
        }
      };
    }
  }

  /**
   * @param {{ worker?: any; kabisilya?: any; bukid?: any; pitak?: any; assignment?: any; debt?: any; debtHistory?: any; payment?: any; paymentHistory?: any; auditTrail: any; notification?: any; }} repositories
   * @param {{ startDate?: any; endDate?: any; }} params
   */
  async getAuditSummary(repositories, params) {
    const { auditTrail: auditRepo } = repositories;
    const { startDate, endDate } = params;
    
    const query = auditRepo.createQueryBuilder("audit")
      .select([
        "audit.action",
        "COUNT(*) as count",
        "MIN(audit.timestamp) as first",
        "MAX(audit.timestamp) as last"
      ])
      .groupBy("audit.action")
      .orderBy("count", "DESC");

    if (startDate && endDate) {
      query.where("audit.timestamp BETWEEN :start AND :end", { 
        start: new Date(startDate), 
        end: new Date(endDate) 
      });
    }

    const auditSummary = await query.getRawMany();

    return {
      status: true,
      message: "Audit summary retrieved",
      data: {
        summary: auditSummary.map((/** @type {{ audit_action: any; count: string; first: any; last: any; }} */ a) => ({
          action: a.audit_action,
          count: parseInt(a.count),
          first: a.first,
          last: a.last
        })),
        total: auditSummary.reduce((/** @type {number} */ sum, /** @type {{ count: string; }} */ a) => sum + parseInt(a.count), 0),
        period: {
          start: startDate,
          end: endDate
        }
      }
    };
  }

  /**
   * @param {{ worker?: any; kabisilya?: any; bukid?: any; pitak?: any; assignment?: any; debt?: any; debtHistory?: any; payment?: any; paymentHistory?: any; auditTrail: any; notification?: any; }} repositories
   * @param {{ limit?: any; }} params
   */
  async getRecentActivities(repositories, params) {
    const { auditTrail: auditRepo } = repositories;
    const { limit = 20 } = params;
    
    const activities = await auditRepo.createQueryBuilder("audit")
      .select([
        "audit.id",
        "audit.action",
        "audit.actor",
        "audit.details",
        "audit.timestamp"
      ])
      .orderBy("audit.timestamp", "DESC")
      .limit(limit)
      .getMany();

    return {
      status: true,
      message: "Recent activities retrieved",
      data: {
        activities: activities.map((/** @type {{ id: any; action: any; actor: any; details: any; timestamp: any; }} */ a) => ({
          id: a.id,
          action: a.action,
          actor: a.actor,
          details: a.details,
          timestamp: a.timestamp
        })),
        total: activities.length
      }
    };
  }

  /**
   * @param {{ worker?: any; kabisilya?: any; bukid?: any; pitak?: any; assignment?: any; debt?: any; debtHistory?: any; payment?: any; paymentHistory?: any; auditTrail?: any; notification: any; }} repositories
   * @param {{ unreadOnly?: boolean; limit?: number; }} params
   */
  async getNotifications(repositories, params) {
    const { notification: notificationRepo } = repositories;
    const { unreadOnly = false, limit = 50 } = params;
    
    const query = notificationRepo.createQueryBuilder("notification")
      .select([
        "notification.id",
        "notification.type",
        "notification.context",
        "notification.timestamp"
      ])
      .orderBy("notification.timestamp", "DESC")
      .limit(limit);

    if (unreadOnly) {
      // Assuming we add a 'read' column in the future
      // query.where("notification.read = :read", { read: false });
    }

    const notifications = await query.getMany();

    return {
      status: true,
      message: "Notifications retrieved",
      data: {
        notifications: notifications.map((/** @type {{ id: any; type: any; context: any; timestamp: any; }} */ n) => ({
          id: n.id,
          type: n.type,
          context: n.context,
          timestamp: n.timestamp,
          isUnread: true // Placeholder for future implementation
        })),
        unreadCount: notifications.length, // Update when read status is implemented
        total: notifications.length
      }
    };
  }
}

// Register IPC handler
const kabisilyaDashboardHandler = new KabisilyaDashboardHandler();

ipcMain.handle(
  "kabisilyaDashboard",
  withErrorHandling(
    // @ts-ignore
    kabisilyaDashboardHandler.handleRequest.bind(kabisilyaDashboardHandler),
    "IPC:kabisilyaDashboard"
  )
);

module.exports = { KabisilyaDashboardHandler, kabisilyaDashboardHandler };