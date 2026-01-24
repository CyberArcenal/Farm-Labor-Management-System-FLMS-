// ipc/auditTrail/get/stats.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailStats(params = {}) {
  try {
    // @ts-ignore
    const { _userId } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    // Get total count
    const totalCount = await auditRepo.count();
    
    // Get count for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await auditRepo.count({
      where: {
        timestamp: {
          $gte: today
        }
      }
    });
    
    // Get count for last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastWeekCount = await auditRepo.count({
      where: {
        timestamp: {
          $gte: lastWeek
        }
      }
    });
    
    // Get top 10 actions
    const topActions = await auditRepo.createQueryBuilder("audit")
      .select("audit.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("audit.action")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();
    
    // Get top 10 actors
    const topActors = await auditRepo.createQueryBuilder("audit")
      .select("audit.actor", "actor")
      .addSelect("COUNT(*)", "count")
      .groupBy("audit.actor")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();
    
    // Get activity by hour for today
    const hourlyActivity = await auditRepo.createQueryBuilder("audit")
      .select("HOUR(audit.timestamp)", "hour")
      .addSelect("COUNT(*)", "count")
      .where("DATE(audit.timestamp) = CURDATE()")
      .groupBy("HOUR(audit.timestamp)")
      .orderBy("hour", "ASC")
      .getRawMany();
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trail_stats',
      actor: `User ${_userId}`,
      details: {},
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trail statistics retrieved successfully',
      data: {
        stats: {
          totalCount,
          todayCount,
          lastWeekCount,
          topActions,
          topActors,
          hourlyActivity
        }
      }
    };
  } catch (error) {
    console.error('Error in getAuditTrailStats:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trail statistics: ${error.message}`,
      data: null
    };
  }
};