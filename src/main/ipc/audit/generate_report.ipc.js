// ipc/auditTrail/generate_report.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
// @ts-ignore
const ExcelJS = require('exceljs');

module.exports = async function generateAuditReport(params = {}) {
  try {
    const { 
      // @ts-ignore
      reportType = 'summary', // 'summary', 'detailed', 'compliance', 'security'
      // @ts-ignore
      startDate,
      // @ts-ignore
      endDate,
      // @ts-ignore
      format = 'pdf', // 'pdf', 'excel', 'html'
      // @ts-ignore
      _userId 
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include entire end day
      
      dateFilter = {
        timestamp: {
          $gte: start,
          $lte: end
        }
      };
    } else {
      // Default: last 30 days
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      dateFilter = {
        timestamp: {
          $gte: defaultStart
        }
      };
    }
    
    // Get data based on report type
    let reportData;
    let fileName;
    
    switch (reportType) {
      case 'summary':
        reportData = await generateSummaryReport(auditRepo, dateFilter);
        fileName = `audit_summary_${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'detailed':
        reportData = await generateDetailedReport(auditRepo, dateFilter);
        fileName = `audit_detailed_${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'compliance':
        reportData = await generateComplianceReport(auditRepo, dateFilter);
        fileName = `audit_compliance_${new Date().toISOString().split('T')[0]}`;
        break;
      
      case 'security':
        reportData = await generateSecurityReport(auditRepo, dateFilter);
        fileName = `audit_security_${new Date().toISOString().split('T')[0]}`;
        break;
      
      default:
        return {
          status: false,
          message: `Unknown report type: ${reportType}`,
          data: null
        };
    }
    
    // Generate report in requested format
    let generatedReport;
    let fileExtension;
    
    switch (format) {
      case 'pdf':
        generatedReport = await generatePDFReport(reportData, reportType);
        fileExtension = 'pdf';
        break;
      
      case 'excel':
        generatedReport = await generateExcelReport(reportData, reportType);
        fileExtension = 'xlsx';
        break;
      
      case 'html':
        generatedReport = generateHTMLReport(reportData, reportType);
        fileExtension = 'html';
        break;
      
      default:
        return {
          status: false,
          message: `Unsupported format: ${format}`,
          data: null
        };
    }
    
    // Save report to file
    const exportDir = path.join(__dirname, '../../../../exports/audit_reports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    const fullFileName = `${fileName}.${fileExtension}`;
    const filePath = path.join(exportDir, fullFileName);
    
    if (format === 'pdf' || format === 'excel') {
      await saveBufferToFile(generatedReport, filePath);
    } else {
      fs.writeFileSync(filePath, generatedReport);
    }
    
    // Log report generation
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'generate_audit_report',
      actor: `User ${_userId}`,
      details: { 
        reportType, 
        format, 
        startDate: startDate || 'default (30 days)', 
        endDate: endDate || 'now',
        fileName: fullFileName 
      },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit report generated successfully',
      data: {
        reportType,
        format,
        fileName: fullFileName,
        filePath,
        downloadUrl: `/exports/audit_reports/${fullFileName}`,
        generatedAt: new Date().toISOString(),
        metadata: {
          recordCount: reportData.metadata?.recordCount || 0,
          dateRange: reportData.metadata?.dateRange || {},
          generatedBy: `User ${_userId}`
        }
      }
    };
    
  } catch (error) {
    console.error('Error in generateAuditReport:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate audit report: ${error.message}`,
      data: null
    };
  }
};

// Helper functions for different report types
/**
 * @param {{ find: (arg0: { where: any; order: { timestamp: string; }; take: number; }) => any; }} auditRepo
 * @param {{ timestamp?: any; }} dateFilter
 */
async function generateSummaryReport(auditRepo, dateFilter) {
  const activities = await auditRepo.find({
    where: dateFilter,
    order: { timestamp: 'DESC' },
    take: 1000
  });
  
  // Calculate statistics
  const totalCount = activities.length;
  const uniqueActors = new Set(activities.map((/** @type {{ actor: any; }} */ a) => a.actor)).size;
  const uniqueActions = new Set(activities.map((/** @type {{ action: any; }} */ a) => a.action)).size;
  
  // Group by action
  const actionCounts = {};
  activities.forEach((/** @type {{ action: string | number; }} */ activity) => {
    // @ts-ignore
    actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1;
  });
  
  // Top 10 actions
  const topActions = Object.keys(actionCounts)
    // @ts-ignore
    .map(action => ({ action, count: actionCounts[action] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Top 10 actors
  const actorCounts = {};
  activities.forEach((/** @type {{ actor: string | number; }} */ activity) => {
    // @ts-ignore
    actorCounts[activity.actor] = (actorCounts[activity.actor] || 0) + 1;
  });
  
  const topActors = Object.keys(actorCounts)
    // @ts-ignore
    .map(actor => ({ actor, count: actorCounts[actor] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Daily activity
  const dailyActivity = {};
  activities.forEach((/** @type {{ timestamp: { toISOString: () => string; }; }} */ activity) => {
    const date = activity.timestamp.toISOString().split('T')[0];
    // @ts-ignore
    dailyActivity[date] = (dailyActivity[date] || 0) + 1;
  });
  
  return {
    type: 'summary',
    metadata: {
      recordCount: totalCount,
      dateRange: dateFilter.timestamp || { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    },
    statistics: {
      totalActivities: totalCount,
      uniqueActors,
      uniqueActions,
      averageDaily: totalCount / 30 // Assuming 30 days
    },
    topActions,
    topActors,
    dailyActivity: Object.keys(dailyActivity).map(date => ({
      date,
      // @ts-ignore
      count: dailyActivity[date]
    })).sort((a, b) => a.date.localeCompare(b.date))
  };
}

/**
 * @param {{ find: (arg0: { where: any; order: { timestamp: string; }; take: number; // Limit for performance
 }) => any; }} auditRepo
 * @param {{ timestamp?: any; }} dateFilter
 */
async function generateDetailedReport(auditRepo, dateFilter) {
  const activities = await auditRepo.find({
    where: dateFilter,
    order: { timestamp: 'DESC' },
    take: 5000 // Limit for performance
  });
  
  return {
    type: 'detailed',
    metadata: {
      recordCount: activities.length,
      dateRange: dateFilter.timestamp
    },
    activities: activities.map((/** @type {{ id: any; timestamp: any; action: any; actor: any; details: any; }} */ activity) => ({
      id: activity.id,
      timestamp: activity.timestamp,
      action: activity.action,
      actor: activity.actor,
      details: activity.details
    }))
  };
}

/**
 * @param {{ find: (arg0: { where: any; order: { timestamp: string; }; }) => any; }} auditRepo
 * @param {{ timestamp?: any; }} dateFilter
 */
async function generateComplianceReport(auditRepo, dateFilter) {
  // Focus on compliance-related activities
  const complianceActivities = await auditRepo.find({
    where: {
      ...dateFilter,
      action: {
        $in: [
          'user_login',
          'user_logout',
          'permission_change',
          'role_assignment',
          'data_access',
          'data_modification',
          'system_config_change',
          'security_setting_change'
        ]
      }
    },
    order: { timestamp: 'DESC' }
  });
  
  // Group by compliance category
  const categories = {
    authentication: [],
    authorization: [],
    data_integrity: [],
    configuration: [],
    security: []
  };
  
  complianceActivities.forEach((/** @type {{ action: any; }} */ activity) => {
    const action = activity.action;
    
    if (action.includes('login') || action.includes('logout')) {
      // @ts-ignore
      categories.authentication.push(activity);
    } else if (action.includes('permission') || action.includes('role')) {
      // @ts-ignore
      categories.authorization.push(activity);
    } else if (action.includes('data')) {
      // @ts-ignore
      categories.data_integrity.push(activity);
    } else if (action.includes('config')) {
      // @ts-ignore
      categories.configuration.push(activity);
    } else if (action.includes('security')) {
      // @ts-ignore
      categories.security.push(activity);
    }
  });
  
  // Calculate compliance metrics
  const metrics = {
    totalComplianceEvents: complianceActivities.length,
    authenticationEvents: categories.authentication.length,
    authorizationEvents: categories.authorization.length,
    dataIntegrityEvents: categories.data_integrity.length,
    configurationEvents: categories.configuration.length,
    securityEvents: categories.security.length,
    uniqueUsers: new Set(complianceActivities.map((/** @type {{ actor: any; }} */ a) => a.actor)).size
  };
  
  return {
    type: 'compliance',
    metadata: {
      recordCount: complianceActivities.length,
      dateRange: dateFilter.timestamp
    },
    categories,
    metrics,
    complianceScore: calculateComplianceScore(metrics)
  };
}

/**
 * @param {{ totalComplianceEvents: any; authenticationEvents: any; authorizationEvents: any; dataIntegrityEvents: any; configurationEvents: any; securityEvents: any; uniqueUsers?: number; }} metrics
 */
function calculateComplianceScore(metrics) {
  // Simple scoring algorithm
  let score = 0;
  const totalEvents = metrics.totalComplianceEvents;
  
  if (totalEvents === 0) return 0;
  
  // Weight different types of events
  score += metrics.authenticationEvents * 1.5;
  score += metrics.authorizationEvents * 2;
  score += metrics.dataIntegrityEvents * 2.5;
  score += metrics.configurationEvents * 1;
  score += metrics.securityEvents * 3;
  
  // Normalize to 0-100
  const maxPossibleScore = totalEvents * 3;
  return Math.min(100, Math.round((score / maxPossibleScore) * 100));
}

/**
 * @param {{ find: (arg0: { where: any; order: { timestamp: string; }; }) => any; }} auditRepo
 * @param {{ timestamp?: any; }} dateFilter
 */
async function generateSecurityReport(auditRepo, dateFilter) {
  const securityActivities = await auditRepo.find({
    where: {
      ...dateFilter,
      $or: [
        { action: { $like: '%login%' } },
        { action: { $like: '%logout%' } },
        { action: { $like: '%security%' } },
        { action: { $like: '%access%' } },
        { action: { $like: '%permission%' } },
        { action: { $like: '%failed%' } },
        { action: { $like: '%unauthorized%' } }
      ]
    },
    order: { timestamp: 'DESC' }
  });
  
  // Identify security incidents
  const incidents = {
    failed_logins: [],
    unauthorized_access: [],
    permission_changes: [],
    security_settings: [],
    suspicious_activity: []
  };
  
  securityActivities.forEach((/** @type {{ action: string; details: {}; }} */ activity) => {
    const action = activity.action.toLowerCase();
    const details = activity.details || {};
    
    if (action.includes('failed_login') || action.includes('login_failed')) {
      // @ts-ignore
      incidents.failed_logins.push(activity);
    // @ts-ignore
    } else if (action.includes('unauthorized') || details.unauthorized) {
      // @ts-ignore
      incidents.unauthorized_access.push(activity);
    } else if (action.includes('permission') || action.includes('role')) {
      // @ts-ignore
      incidents.permission_changes.push(activity);
    } else if (action.includes('security_setting') || action.includes('security_config')) {
      // @ts-ignore
      incidents.security_settings.push(activity);
    } else if (isSuspicious(activity)) {
      // @ts-ignore
      incidents.suspicious_activity.push(activity);
    }
  });
  
  // Security metrics
  const metrics = {
    totalSecurityEvents: securityActivities.length,
    failedLoginAttempts: incidents.failed_logins.length,
    unauthorizedAccessAttempts: incidents.unauthorized_access.length,
    permissionChanges: incidents.permission_changes.length,
    securitySettingChanges: incidents.security_settings.length,
    suspiciousActivities: incidents.suspicious_activity.length,
    uniqueSourceIPs: new Set(securityActivities.map((/** @type {{ details: { ip_address: any; }; }} */ a) => 
      a.details?.ip_address || 'unknown'
    )).size
  };
  
  // Risk assessment
  const riskLevel = calculateRiskLevel(metrics);
  
  return {
    type: 'security',
    metadata: {
      recordCount: securityActivities.length,
      dateRange: dateFilter.timestamp
    },
    incidents,
    metrics,
    riskAssessment: {
      level: riskLevel.level,
      score: riskLevel.score,
      recommendations: riskLevel.recommendations
    },
    timeline: securityActivities.slice(0, 50).map((/** @type {{ timestamp: any; action: any; actor: any; }} */ a) => ({
      timestamp: a.timestamp,
      action: a.action,
      actor: a.actor,
      risk: getActionRisk(a.action)
    }))
  };
}

/**
 * @param {{ action: string; }} activity
 */
function isSuspicious(activity) {
  const suspiciousPatterns = [
    'multiple_failed_logins',
    'unusual_time',
    'bulk_operations',
    'sensitive_data_access'
  ];
  
  const action = activity.action.toLowerCase();
  return suspiciousPatterns.some(pattern => action.includes(pattern));
}

/**
 * @param {string} action
 */
function getActionRisk(action) {
  const highRiskActions = ['delete', 'drop', 'truncate', 'password_reset', 'role_change'];
  const mediumRiskActions = ['update', 'modify', 'config_change', 'permission_change'];
  
  if (highRiskActions.some(a => action.toLowerCase().includes(a))) return 'high';
  if (mediumRiskActions.some(a => action.toLowerCase().includes(a))) return 'medium';
  return 'low';
}

/**
 * @param {{ totalSecurityEvents?: any; failedLoginAttempts: any; unauthorizedAccessAttempts: any; permissionChanges: any; securitySettingChanges?: number; suspiciousActivities: any; uniqueSourceIPs?: number; }} metrics
 */
function calculateRiskLevel(metrics) {
  let score = 0;
  
  // Weight different metrics
  score += metrics.failedLoginAttempts * 10;
  score += metrics.unauthorizedAccessAttempts * 20;
  score += metrics.suspiciousActivities * 15;
  score += metrics.permissionChanges * 5;
  
  // Determine risk level
  let level, recommendations;
  
  if (score > 100) {
    level = 'critical';
    recommendations = [
      'Immediate security review required',
      'Consider implementing additional authentication measures',
      'Review all permission changes in the last 24 hours'
    ];
  } else if (score > 50) {
    level = 'high';
    recommendations = [
      'Schedule security audit',
      'Monitor failed login attempts closely',
      'Review access logs daily'
    ];
  } else if (score > 20) {
    level = 'medium';
    recommendations = [
      'Regular security monitoring',
      'Ensure all users have strong passwords',
      'Review permission changes weekly'
    ];
  } else {
    level = 'low';
    recommendations = [
      'Continue regular security practices',
      'Monthly security review recommended'
    ];
  }
  
  return { level, score, recommendations };
}

// Report generation functions
/**
 * @param {{ type: string; metadata: { recordCount: any; dateRange: any; }; statistics: { totalActivities: any; uniqueActors: number; uniqueActions: number; averageDaily: number; // Assuming 30 days
 }; topActions: { action: string; count: any; }[]; topActors: { actor: string; count: any; }[]; dailyActivity: { date: string; count: any; }[]; } | { type: string; metadata: { recordCount: any; dateRange: any; }; activities: any; } | { type: string; metadata: { recordCount: any; dateRange: any; }; categories: { authentication: never[]; authorization: never[]; data_integrity: never[]; configuration: never[]; security: never[]; }; metrics: { totalComplianceEvents: any; authenticationEvents: number; authorizationEvents: number; dataIntegrityEvents: number; configurationEvents: number; securityEvents: number; uniqueUsers: number; }; complianceScore: number; } | { type: string; metadata: { recordCount: any; dateRange: any; }; incidents: { failed_logins: never[]; unauthorized_access: never[]; permission_changes: never[]; security_settings: never[]; suspicious_activity: never[]; }; metrics: { totalSecurityEvents: any; failedLoginAttempts: number; unauthorizedAccessAttempts: number; permissionChanges: number; securitySettingChanges: number; suspiciousActivities: number; uniqueSourceIPs: number; }; riskAssessment: { level: string; score: number; recommendations: string[]; }; timeline: any; }} reportData
 * @param {string} reportType
 */
async function generatePDFReport(reportData, reportType) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      /**
         * @type {any[] | readonly Uint8Array<ArrayBufferLike>[]}
         */
      const chunks = [];
      
      // @ts-ignore
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Report header
      doc.fontSize(20).text(`Audit Trail Report - ${reportType.toUpperCase()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
      doc.text(`Report period: ${reportData.metadata?.dateRange ? 'Custom range' : 'Last 30 days'}`);
      doc.moveDown();
      
      // Report content based on type
      switch (reportType) {
        case 'summary':
          // @ts-ignore
          generateSummaryPDF(doc, reportData);
          break;
        case 'detailed':
          // @ts-ignore
          generateDetailedPDF(doc, reportData);
          break;
        case 'compliance':
          // @ts-ignore
          generateCompliancePDF(doc, reportData);
          break;
        case 'security':
          // @ts-ignore
          generateSecurityPDF(doc, reportData);
          break;
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {{ statistics: { totalActivities: any; uniqueActors: any; uniqueActions: any; averageDaily: number; }; topActions: any[]; topActors: any[]; }} data
 */
function generateSummaryPDF(doc, data) {
  doc.fontSize(16).text('Summary Report', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(12).text(`Total Activities: ${data.statistics.totalActivities}`);
  doc.text(`Unique Actors: ${data.statistics.uniqueActors}`);
  doc.text(`Unique Actions: ${data.statistics.uniqueActions}`);
  doc.text(`Average Daily: ${data.statistics.averageDaily.toFixed(2)}`);
  doc.moveDown();
  
  doc.fontSize(14).text('Top Actions:');
  data.topActions.forEach((/** @type {{ action: any; count: any; }} */ action, /** @type {number} */ index) => {
    doc.text(`${index + 1}. ${action.action}: ${action.count} occurrences`);
  });
  
  doc.moveDown();
  doc.fontSize(14).text('Top Actors:');
  data.topActors.forEach((/** @type {{ actor: any; count: any; }} */ actor, /** @type {number} */ index) => {
    doc.text(`${index + 1}. ${actor.actor}: ${actor.count} activities`);
  });
}

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {{ activities: any[]; }} data
 */
function generateDetailedPDF(doc, data) {
  doc.fontSize(16).text('Detailed Audit Trail', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(10);
  data.activities.forEach((/** @type {{ timestamp: { toISOString: () => any; }; actor: any; action: any; details: any; }} */ activity, /** @type {number} */ index) => {
    if (index % 20 === 0 && index > 0) {
      doc.addPage();
    }
    
    doc.text(`[${activity.timestamp.toISOString()}] ${activity.actor} - ${activity.action}`);
    if (activity.details) {
      doc.text(`   Details: ${JSON.stringify(activity.details)}`);
    }
    doc.moveDown(0.2);
  });
}

/**
 * @param {{ type: string; metadata: { recordCount: any; dateRange: any; }; statistics: { totalActivities: any; uniqueActors: number; uniqueActions: number; averageDaily: number; // Assuming 30 days
 }; topActions: { action: string; count: any; }[]; topActors: { actor: string; count: any; }[]; dailyActivity: { date: string; count: any; }[]; } | { type: string; metadata: { recordCount: any; dateRange: any; }; activities: any; } | { type: string; metadata: { recordCount: any; dateRange: any; }; categories: { authentication: never[]; authorization: never[]; data_integrity: never[]; configuration: never[]; security: never[]; }; metrics: { totalComplianceEvents: any; authenticationEvents: number; authorizationEvents: number; dataIntegrityEvents: number; configurationEvents: number; securityEvents: number; uniqueUsers: number; }; complianceScore: number; } | { type: string; metadata: { recordCount: any; dateRange: any; }; incidents: { failed_logins: never[]; unauthorized_access: never[]; permission_changes: never[]; security_settings: never[]; suspicious_activity: never[]; }; metrics: { totalSecurityEvents: any; failedLoginAttempts: number; unauthorizedAccessAttempts: number; permissionChanges: number; securitySettingChanges: number; suspiciousActivities: number; uniqueSourceIPs: number; }; riskAssessment: { level: string; score: number; recommendations: string[]; }; timeline: any; }} reportData
 * @param {string} reportType
 */
async function generateExcelReport(reportData, reportType) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Audit Report');
  
  // Add header
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = `Audit Trail Report - ${reportType.toUpperCase()}`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Add metadata
  worksheet.getCell('A3').value = 'Generated:';
  worksheet.getCell('B3').value = new Date().toLocaleString();
  
  worksheet.getCell('A4').value = 'Report Type:';
  worksheet.getCell('B4').value = reportType;
  
  // Add data based on report type
  switch (reportType) {
    case 'summary':
      // @ts-ignore
      await addSummaryToExcel(worksheet, reportData);
      break;
    case 'detailed':
      // @ts-ignore
      await addDetailedToExcel(worksheet, reportData);
      break;
    case 'compliance':
      // @ts-ignore
      await addComplianceToExcel(worksheet, reportData);
      break;
    case 'security':
      // @ts-ignore
      await addSecurityToExcel(worksheet, reportData);
      break;
  }
  
  // Auto-size columns
  worksheet.columns.forEach((/** @type {{ eachCell: (arg0: { includeEmpty: boolean; }, arg1: (cell: any) => void) => void; width: number; }} */ column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (/** @type {{ value: { toString: () => { (): any; new (): any; length: any; }; }; }} */ cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * @param {{ getCell: (arg0: string) => { (): any; new (): any; value: string; font: { bold: boolean; }; }; }} worksheet
 * @param {{ statistics: { totalActivities: any; uniqueActors: any; uniqueActions: any; averageDaily: number; }; topActions: any[]; }} data
 */
async function addSummaryToExcel(worksheet, data) {
  // Summary statistics
  worksheet.getCell('A6').value = 'Summary Statistics';
  worksheet.getCell('A6').font = { bold: true };
  
  const stats = [
    ['Total Activities', data.statistics.totalActivities],
    ['Unique Actors', data.statistics.uniqueActors],
    ['Unique Actions', data.statistics.uniqueActions],
    ['Average Daily', data.statistics.averageDaily.toFixed(2)]
  ];
  
  stats.forEach(([label, value], index) => {
    worksheet.getCell(`A${7 + index}`).value = label;
    worksheet.getCell(`B${7 + index}`).value = value;
  });
  
  // Top Actions
  const actionsStartRow = 7 + stats.length + 2;
  worksheet.getCell(`A${actionsStartRow}`).value = 'Top Actions';
  worksheet.getCell(`A${actionsStartRow}`).font = { bold: true };
  
  worksheet.getCell(`A${actionsStartRow + 1}`).value = 'Action';
  worksheet.getCell(`B${actionsStartRow + 1}`).value = 'Count';
  worksheet.getCell(`A${actionsStartRow + 1}`).font = { bold: true };
  worksheet.getCell(`B${actionsStartRow + 1}`).font = { bold: true };
  
  data.topActions.forEach((/** @type {{ action: any; count: any; }} */ action, /** @type {number} */ index) => {
    worksheet.getCell(`A${actionsStartRow + 2 + index}`).value = action.action;
    worksheet.getCell(`B${actionsStartRow + 2 + index}`).value = action.count;
  });
}

/**
 * @param {{ type: string; metadata: { recordCount: any; dateRange: any; }; statistics: { totalActivities: any; uniqueActors: number; uniqueActions: number; averageDaily: number; // Assuming 30 days
 }; topActions: { action: string; count: any; }[]; topActors: { actor: string; count: any; }[]; dailyActivity: { date: string; count: any; }[]; } | { type: string; metadata: { recordCount: any; dateRange: any; }; activities: any; } | { type: string; metadata: { recordCount: any; dateRange: any; }; categories: { authentication: never[]; authorization: never[]; data_integrity: never[]; configuration: never[]; security: never[]; }; metrics: { totalComplianceEvents: any; authenticationEvents: number; authorizationEvents: number; dataIntegrityEvents: number; configurationEvents: number; securityEvents: number; uniqueUsers: number; }; complianceScore: number; } | { type: string; metadata: { recordCount: any; dateRange: any; }; incidents: { failed_logins: never[]; unauthorized_access: never[]; permission_changes: never[]; security_settings: never[]; suspicious_activity: never[]; }; metrics: { totalSecurityEvents: any; failedLoginAttempts: number; unauthorizedAccessAttempts: number; permissionChanges: number; securitySettingChanges: number; suspiciousActivities: number; uniqueSourceIPs: number; }; riskAssessment: { level: string; score: number; recommendations: string[]; }; timeline: any; }} reportData
 * @param {string} reportType
 */
function generateHTMLReport(reportData, reportType) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Audit Trail Report - ${reportType}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #555; border-left: 4px solid #007bff; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: bold; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e9ecef; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 12px; color: #666; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Audit Trail Report - ${reportType.toUpperCase()}</h1>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Report Type:</strong> ${reportType}</p>
        <p><strong>Record Count:</strong> ${reportData.metadata?.recordCount || 0}</p>
    </div>
    
    ${generateHTMLContent(reportData, reportType)}
    
    <div class="footer">
        <p>Report generated by Kabisilya Management System</p>
        <p>This is an automated report. For questions, contact system administrator.</p>
    </div>
</body>
</html>`;
  
  return html;
}

/**
 * @param {any} reportData
 * @param {any} reportType
 */
function generateHTMLContent(reportData, reportType) {
  switch (reportType) {
    case 'summary':
      return generateSummaryHTML(reportData);
    case 'detailed':
      // @ts-ignore
      return generateDetailedHTML(reportData);
    case 'compliance':
      // @ts-ignore
      return generateComplianceHTML(reportData);
    case 'security':
      // @ts-ignore
      return generateSecurityHTML(reportData);
    default:
      return '<p>Report content not available</p>';
  }
}

/**
 * @param {{ statistics: { totalActivities: any; uniqueActors: any; uniqueActions: any; averageDaily: number; }; topActions: any[]; topActors: any[]; }} data
 */
function generateSummaryHTML(data) {
  return `
<div class="section">
    <h2>Summary Statistics</h2>
    <div class="metric">
        <div class="metric-value">${data.statistics.totalActivities}</div>
        <div class="metric-label">Total Activities</div>
    </div>
    <div class="metric">
        <div class="metric-value">${data.statistics.uniqueActors}</div>
        <div class="metric-label">Unique Actors</div>
    </div>
    <div class="metric">
        <div class="metric-value">${data.statistics.uniqueActions}</div>
        <div class="metric-label">Unique Actions</div>
    </div>
    <div class="metric">
        <div class="metric-value">${data.statistics.averageDaily.toFixed(2)}</div>
        <div class="metric-label">Avg Daily</div>
    </div>
</div>

<div class="section">
    <h2>Top 10 Actions</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Action</th>
                <th>Count</th>
            </tr>
        </thead>
        <tbody>
            ${data.topActions.map((/** @type {{ action: any; count: any; }} */ action, /** @type {number} */ index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${action.action}</td>
                <td>${action.count}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</div>

<div class="section">
    <h2>Top 10 Actors</h2>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Actor</th>
                <th>Activities</th>
            </tr>
        </thead>
        <tbody>
            ${data.topActors.map((/** @type {{ actor: any; count: any; }} */ actor, /** @type {number} */ index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${actor.actor}</td>
                <td>${actor.count}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</div>`;
}

/**
 * @param {string | NodeJS.ArrayBufferView<ArrayBufferLike>} buffer
 * @param {fs.PathOrFileDescriptor} filePath
 */
function saveBufferToFile(buffer, filePath) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, buffer, (error) => {
      if (error) reject(error);
      // @ts-ignore
      else resolve();
    });
  });
}