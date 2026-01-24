// ipc/auditTrail/get/recent.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getRecentAuditTrails(params = {}) {
  try {
    const { 
      // @ts-ignore
      limit = 100, 
      // @ts-ignore
      days = 7, // Default: last 7 days
      // @ts-ignore
      _userId 
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    const recentAuditTrails = await auditRepo.find({
      where: {
        timestamp: {
          $gte: dateThreshold
        }
      },
      order: { timestamp: 'DESC' },
      take: parseInt(limit),
    });
    
    // Group by date for summary
    const summaryByDate = {};
    const summaryByAction = {};
    
    recentAuditTrails.forEach((/** @type {{ timestamp: { toISOString: () => string; }; action: string | number; }} */ trail) => {
      // Group by date
      const dateKey = trail.timestamp.toISOString().split('T')[0];
      // @ts-ignore
      summaryByDate[dateKey] = (summaryByDate[dateKey] || 0) + 1;
      
      // Group by action
      // @ts-ignore
      summaryByAction[trail.action] = (summaryByAction[trail.action] || 0) + 1;
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_recent_audit_trails',
      actor: `User ${_userId}`,
      details: { limit, days },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Recent audit trails retrieved successfully',
      data: {
        auditTrails: recentAuditTrails,
        summary: {
          total: recentAuditTrails.length,
          byDate: summaryByDate,
          byAction: summaryByAction,
          dateRange: {
            from: dateThreshold.toISOString(),
            to: new Date().toISOString()
          }
        }
      }
    };
  } catch (error) {
    console.error('Error in getRecentAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve recent audit trails: ${error.message}`,
      data: null
    };
  }
};