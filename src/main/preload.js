// preload.js - Kabisilya Management System
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendAPI", {
  // 🪟 Window controls
  windowControl: (payload) => ipcRenderer.invoke("window-control", payload),
  
  // 📋 Core Management Modules
  assignment: (payload) => ipcRenderer.invoke("assignment", payload),
  auditTrail: (payload) => ipcRenderer.invoke("auditTrail", payload),
  bukid: (payload) => ipcRenderer.invoke("bukid", payload),
  kabisilyaDashboard: (payload) => ipcRenderer.invoke("kabisilyaDashboard", payload),
  debt: (payload) => ipcRenderer.invoke("debt", payload),
  kabisilya: (payload) => ipcRenderer.invoke("kabisilya", payload),
  notification: (payload) => ipcRenderer.invoke("notification", payload),
  payment: (payload) => ipcRenderer.invoke("payment", payload),
  pitak: (payload) => ipcRenderer.invoke("pitak", payload),
  user: (payload) => ipcRenderer.invoke("user", payload),
  worker: (payload) => ipcRenderer.invoke("worker", payload),

  // ⚙️ System & Configuration
  activation: (payload) => ipcRenderer.invoke("activation", payload),
  systemConfig: (payload) => ipcRenderer.invoke("systemConfig", payload),
  sync: (payload) => ipcRenderer.invoke("sync", payload),

  // 🎯 Event listeners
  onAppReady: (callback) => {
    ipcRenderer.on("app-ready", callback);
    return () => ipcRenderer.removeListener("app-ready", callback);
  },
  
  on: (event, callback) => {
    ipcRenderer.on(event, callback);
    return () => ipcRenderer.removeListener(event, callback);
  },

  // 🪟 Window Events
  onWindowMaximized: (callback) =>
    ipcRenderer.on("window:maximized", () => callback()),
  
  onWindowRestored: (callback) =>
    ipcRenderer.on("window:restored", () => callback()),
  
  onWindowMinimized: (callback) =>
    ipcRenderer.on("window:minimized", () => callback()),
  
  onWindowClosed: (callback) =>
    ipcRenderer.on("window:closed", () => callback()),
  
  onWindowResized: (callback) =>
    ipcRenderer.on("window:resized", (event, bounds) => callback(bounds)),
  
  onWindowMoved: (callback) =>
    ipcRenderer.on("window:moved", (event, position) => callback(position)),

  // 📊 Real-time Updates
  onWorkerUpdated: (callback) =>
    ipcRenderer.on("worker:updated", (event, data) => callback(data)),
  
  onAssignmentUpdated: (callback) =>
    ipcRenderer.on("assignment:updated", (event, data) => callback(data)),
  
  onPaymentProcessed: (callback) =>
    ipcRenderer.on("payment:processed", (event, data) => callback(data)),
  
  onDebtUpdated: (callback) =>
    ipcRenderer.on("debt:updated", (event, data) => callback(data)),

  // 🔔 Notification Events
  onNewNotification: (callback) =>
    ipcRenderer.on("notification:new", (event, data) => callback(data)),
  
  onNotificationRead: (callback) =>
    ipcRenderer.on("notification:read", (event, data) => callback(data)),

  // 🔧 Utility Methods
  showAbout: () => ipcRenderer.send("show-about"),
  skipSetup: () => ipcRenderer.send("skip-setup"),
  getSetupStatus: () => ipcRenderer.invoke("get-setup-status"),
  
  onSetupComplete: (callback) => 
    ipcRenderer.on("setup-complete", callback),

  // 📁 File Operations
  exportToCSV: (payload) => ipcRenderer.invoke("export-csv", payload),
  importFromCSV: (payload) => ipcRenderer.invoke("import-csv", payload),
  generateReport: (payload) => ipcRenderer.invoke("generate-report", payload),

  // 🖨️ Print Operations
  printDocument: (payload) => ipcRenderer.invoke("print-document", payload),
  printPaymentSlip: (payload) => ipcRenderer.invoke("print-payment-slip", payload),
  printWorkerSummary: (payload) => ipcRenderer.invoke("print-worker-summary", payload),

  // 📊 Dashboard Updates
  onDashboardUpdate: (callback) =>
    ipcRenderer.on("dashboard:update", (event, data) => callback(data)),

  // 🔄 Sync Events
  onSyncStart: (callback) =>
    ipcRenderer.on("sync:start", () => callback()),
  
  onSyncComplete: (callback) =>
    ipcRenderer.on("sync:complete", (event, data) => callback(data)),
  
  onSyncError: (callback) =>
    ipcRenderer.on("sync:error", (event, error) => callback(error)),

  // 🛠️ Logging Utilities
  log: {
    info: (message, data) => console.log("[Renderer]", message, data),
    error: (message, error) => console.error("[Renderer]", message, error),
    warn: (message, warning) => console.warn("[Renderer]", message, warning),
    debug: (message, data) => console.debug("[Renderer]", message, data),
  },

  // 📱 Mobile/Desktop Mode
  isMobileMode: () => ipcRenderer.invoke("is-mobile-mode"),
  toggleMobileMode: () => ipcRenderer.send("toggle-mobile-mode"),

  // 🔐 Security & Permissions
  checkPermission: (permission) => 
    ipcRenderer.invoke("check-permission", permission),
  
  onPermissionChanged: (callback) =>
    ipcRenderer.on("permission:changed", (event, data) => callback(data)),

  // 🌐 Network Status
  getNetworkStatus: () => ipcRenderer.invoke("get-network-status"),
  onNetworkOnline: (callback) =>
    ipcRenderer.on("network:online", () => callback()),
  
  onNetworkOffline: (callback) =>
    ipcRenderer.on("network:offline", () => callback()),

  // 💾 Backup & Restore
  createBackup: () => ipcRenderer.invoke("create-backup"),
  restoreBackup: (payload) => ipcRenderer.invoke("restore-backup", payload),
  onBackupComplete: (callback) =>
    ipcRenderer.on("backup:complete", (event, data) => callback(data)),
});