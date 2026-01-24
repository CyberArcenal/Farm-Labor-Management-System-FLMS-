// ipc/auditTrail/get/activity.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailActivity(params = {}) {
  try {
    const { 
      // @ts-ignore
      timeframe = 'hourly', // 'hourly', 'daily', 'weekly', 'monthly'
      // @ts-ignore
      limit = 24, // Number of periods to return
      // @ts-ignore
      _userId 
    } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    let activityData;
    let groupByClause;
    let dateFormat;
    
    // Determine grouping based on timeframe
    switch (timeframe) {
      case 'hourly':
        groupByClause = "DATE_FORMAT(audit.timestamp, '%Y-%m-%d %H:00:00')";
        dateFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'daily':
        groupByClause = "DATE(audit.timestamp)";
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupByClause = "YEARWEEK(audit.timestamp)";
        dateFormat = 'Week %v, %Y';
        break;
      case 'monthly':
        groupByClause = "DATE_FORMAT(audit.timestamp, '%Y-%m-01')";
        dateFormat = '%Y-%m';
        break;
      default:
        groupByClause = "DATE(audit.timestamp)";
        dateFormat = '%Y-%m-%d';
    }
    
    // Get activity data
    activityData = await auditRepo.createQueryBuilder("audit")
      .select(`${groupByClause}`, "period")
      .addSelect("COUNT(*)", "count")
      .addSelect("COUNT(DISTINCT audit.actor)", "uniqueActors")
      .addSelect("COUNT(DISTINCT audit.action)", "uniqueActions")
      .groupBy("period")
      .orderBy("period", "DESC")
      .limit(parseInt(limit))
      .getRawMany();
    
    // Get top actions for each period (for the most recent periods)
    const recentPeriods = activityData.slice(0, 5);
    const periodDetails = [];
    
    for (const period of recentPeriods) {
      const topActions = await auditRepo.createQueryBuilder("audit")
        .select("audit.action", "action")
        .addSelect("COUNT(*)", "count")
        .where(`${groupByClause} = :period`, { period: period.period })
        .groupBy("audit.action")
        .orderBy("count", "DESC")
        .limit(3)
        .getRawMany();
      
      const topActors = await auditRepo.createQueryBuilder("audit")
        .select("audit.actor", "actor")
        .addSelect("COUNT(*)", "count")
        .where(`${groupByClause} = :period`, { period: period.period })
        .groupBy("audit.actor")
        .orderBy("count", "DESC")
        .limit(3)
        .getRawMany();
      
      periodDetails.push({
        period: period.period,
        total: parseInt(period.count),
        uniqueActors: parseInt(period.uniqueActors),
        uniqueActions: parseInt(period.uniqueActions),
        topActions: topActions.map((/** @type {{ action: any; count: string; }} */ a) => ({ action: a.action, count: parseInt(a.count) })),
        topActors: topActors.map((/** @type {{ actor: any; count: string; }} */ a) => ({ actor: a.actor, count: parseInt(a.count) }))
      });
    }
    
    // Calculate statistics
    const counts = activityData.map((/** @type {{ count: string; }} */ item) => parseInt(item.count));
    const totalActivity = counts.reduce((/** @type {any} */ sum, /** @type {any} */ count) => sum + count, 0);
    const averageActivity = totalActivity / (activityData.length || 1);
    const maxActivity = Math.max(...counts);
    const minActivity = Math.min(...counts);
    
    // Identify busiest period
    const busiestPeriod = activityData.reduce((/** @type {{ count: string; }} */ max, /** @type {{ count: string; }} */ item) => 
      parseInt(item.count) > parseInt(max.count) ? item : max, 
      activityData[0] || { period: 'N/A', count: 0 }
    );
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trail_activity',
      actor: `User ${_userId}`,
      details: { timeframe, limit, periods: activityData.length },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trail activity retrieved successfully',
      data: {
        activity: activityData,
        periodDetails,
        timeframe,
        statistics: {
          totalPeriods: activityData.length,
          totalActivity,
          averageActivity: Math.round(averageActivity * 100) / 100,
          maxActivity,
          minActivity,
          busiestPeriod: {
            period: busiestPeriod.period,
            count: parseInt(busiestPeriod.count),
            uniqueActors: parseInt(busiestPeriod.uniqueActors),
            uniqueActions: parseInt(busiestPeriod.uniqueActions)
          }
        }
      }
    };
  } catch (error) {
    console.error('Error in getAuditTrailActivity:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trail activity: ${error.message}`,
      data: null
    };
  }
};