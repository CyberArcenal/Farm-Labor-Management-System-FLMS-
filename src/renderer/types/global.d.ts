// src/types/global.d.ts o sa kasalukuyang preload declarations
export {};

declare global {
  interface Window {
    backendAPI: {
      kabisilya?: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<any>;




      worker?: (payload: { method: string; params?: Record<string, any> }) => Promise<any>;
      onWorkerCreated?: (callback: (data: any) => void) => void;
      onWorkerUpdated?: (callback: (data: any) => void) => void;
      onWorkerDeleted?: (callback: (id: number) => void) => void;
      onWorkerStatusChanged?: (callback: (data: any) => void) => void;

      user: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<any>;
      onUserLogin?: (callback: (user: any) => void) => void;
      onUserLogout?: (callback: () => void) => void;
      onUserUpdated?: (callback: (user: any) => void) => void;
      onUserCreated?: (callback: (user: any) => void) => void;
      onUserDeleted?: (callback: (userId: number) => void) => void;
      // Existing activation API
      activation: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<any>;
      onActivationCompleted?: (callback: (data: any) => void) => void;
      onActivationDeactivated?: (callback: () => void) => void;

      auditTrail?: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<any>;
      
      // Event listeners (optional)
      onAuditTrailCreated?: (callback: (data: any) => void) => void;
      onAuditTrailUpdated?: (callback: (data: any) => void) => void;
      onAuditTrailDeleted?: (callback: (data: any) => void) => void;

      notification?: (payload: NotificationPayload) => Promise<NotificationResponse>;
      onNotificationCreated?: (callback: (data: any) => void) => void;
      onNotificationDeleted?: (callback: (id: number) => void) => void;
      onNotificationUpdated?: (callback: (data: any) => void) => void;
      onBulkNotificationsDeleted?: (callback: (count: number) => void) => void;

        // ⚙️ SYSTEM CONFIG API
      systemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
    };
  }
}