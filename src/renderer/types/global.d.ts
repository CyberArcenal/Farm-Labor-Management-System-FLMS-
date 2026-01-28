// src/types/global.d.ts
export {};

declare global {
  interface Window {
    backendAPI: {
      // 📊 Dashboard
      kabisilyaDashboard: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<any>;

      // 👥 Core Management Modules
      kabisilya?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      worker?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      assignment?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      bukid?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      pitak?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      debt?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      payment?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      attendance?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;

      // 👤 User Management
      user: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;

      // 🔐 Activation
      activation: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;

      // 📜 Audit Trail
      auditTrail?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;

      // 🔔 Notifications
      notification?: (payload: any) => Promise<any>;

      // ⚙️ System Config
      systemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;

      // 🪟 Window Control
      windowControl?: (payload: { method: string; params?: Record<string, any> }) => Promise<{
        status: boolean;
        message: string;
        data?: any;
      }>;

      // 🔄 Sync
      sync?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;

      // 🎯 App lifecycle
      onAppReady?: (callback: () => void) => void;
      onSetupComplete?: (callback: () => void) => void;
      getSetupStatus?: () => Promise<any>;
      skipSetup?: () => void;

      // 👥 Worker Events
      onWorkerCreated?: (callback: (data: any) => void) => void;
      onWorkerUpdated?: (callback: (data: any) => void) => void;
      onWorkerDeleted?: (callback: (id: number) => void) => void;
      onWorkerStatusChanged?: (callback: (data: any) => void) => void;

      // 👤 User Events
      onUserLogin?: (callback: (user: any) => void) => void;
      onUserLogout?: (callback: () => void) => void;
      onUserUpdated?: (callback: (user: any) => void) => void;
      onUserCreated?: (callback: (user: any) => void) => void;
      onUserDeleted?: (callback: (userId: number) => void) => void;

      // 🔐 Activation Events
      onActivationCompleted?: (callback: (data: any) => void) => void;
      onActivationDeactivated?: (callback: () => void) => void;

      // 📜 Audit Trail Events
      onAuditTrailCreated?: (callback: (data: any) => void) => void;
      onAuditTrailUpdated?: (callback: (data: any) => void) => void;
      onAuditTrailDeleted?: (callback: (data: any) => void) => void;

      // 🔔 Notification Events
      onNotificationCreated?: (callback: (data: any) => void) => void;
      onNotificationDeleted?: (callback: (id: number) => void) => void;
      onNotificationUpdated?: (callback: (data: any) => void) => void;
      onBulkNotificationsDeleted?: (callback: (count: number) => void) => void;
      onNewNotification?: (callback: (data: any) => void) => void;
      onNotificationRead?: (callback: (data: any) => void) => void;

      // 🪟 Window Events
      onWindowMaximized?: (callback: () => void) => void;
      onWindowRestored?: (callback: () => void) => void;
      onWindowMinimized?: (callback: () => void) => void;
      onWindowClosed?: (callback: () => void) => void;
      onWindowResized?: (callback: (bounds: any) => void) => void;
      onWindowMoved?: (callback: (position: any) => void) => void;

      // 📊 Real-time Updates
      onAssignmentUpdated?: (callback: (data: any) => void) => void;
      onPaymentProcessed?: (callback: (data: any) => void) => void;
      onDebtUpdated?: (callback: (data: any) => void) => void;
      onDashboardUpdate?: (callback: (data: any) => void) => void;

      // 📁 File Operations
      exportToCSV?: (payload: any) => Promise<any>;
      importFromCSV?: (payload: any) => Promise<any>;
      generateReport?: (payload: any) => Promise<any>;

      // 🖨️ Print Operations
      printDocument?: (payload: any) => Promise<any>;
      printPaymentSlip?: (payload: any) => Promise<any>;
      printWorkerSummary?: (payload: any) => Promise<any>;

      // 🔄 Sync Events
      onSyncStart?: (callback: () => void) => void;
      onSyncComplete?: (callback: (data: any) => void) => void;
      onSyncError?: (callback: (error: any) => void) => void;

      // 🛠️ Logging Utilities
      log?: {
        info: (message: string, data?: any) => void;
        error: (message: string, error?: any) => void;
        warn: (message: string, warning?: any) => void;
        debug: (message: string, data?: any) => void;
      };

      // 📱 Mobile/Desktop Mode
      isMobileMode?: () => Promise<boolean>;
      toggleMobileMode?: () => void;

      // 🔐 Security & Permissions
      checkPermission?: (permission: string) => Promise<boolean>;
      onPermissionChanged?: (callback: (data: any) => void) => void;

      // 🌐 Network Status
      getNetworkStatus?: () => Promise<any>;
      onNetworkOnline?: (callback: () => void) => void;
      onNetworkOffline?: (callback: () => void) => void;

      // 💾 Backup & Restore
      createBackup?: () => Promise<any>;
      restoreBackup?: (payload: any) => Promise<any>;
      onBackupComplete?: (callback: (data: any) => void) => void;

      // 🔧 Utility Methods
      showAbout?: () => void;
    };
  }
}