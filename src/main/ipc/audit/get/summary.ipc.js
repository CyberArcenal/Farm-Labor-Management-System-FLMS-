// ipc/auditTrail/get/summary.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailSummary(params = {}) {
  try {
    // @ts-ignore
    const { days = 30, _userId } = params;
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    // Get summary by action
    const actionSummary = await auditRepo.createQueryBuilder("audit")
      .select("audit.action", "action")
      .addSelect("COUNT(*)", "count")
      .where("audit.timestamp >= :dateThreshold", { dateThreshold })
      .groupBy("audit.action")
      .orderBy("count", "DESC")
      .getRawMany();
    
    // Get summary by actor
    const actorSummary = await auditRepo.createQueryBuilder("audit")
      .select("audit.actor", "actor")
      .addSelect("COUNT(*)", "count")
      .where("audit.timestamp >= :dateThreshold", { dateThreshold })
      .groupBy("audit.actor")
      .orderBy("count", "DESC")
      .limit(20)
      .getRawMany();
    
    // Get daily activity
    const dailyActivity = await auditRepo.createQueryBuilder("audit")
      .select("DATE(audit.timestamp)", "date")
      .addSelect("COUNT(*)", "count")
      .where("audit.timestamp >= :dateThreshold", { dateThreshold })
      .groupBy("DATE(audit.timestamp)")
      .orderBy("date", "ASC")
      .getRawMany();
    
    // Get busiest hours
    const busiestHours = await auditRepo.createQueryBuilder("audit")
      .select("HOUR(audit.timestamp)", "hour")
      .addSelect("COUNT(*)", "count")
      .where("audit.timestamp >= :dateThreshold", { dateThreshold })
      .groupBy("HOUR(audit.timestamp)")
      .orderBy("count", "DESC")
      .limit(5)
      .getRawMany();
    
    // Get total count
    const totalCount = await auditRepo.count({
      where: {
        timestamp: {
          $gte: dateThreshold
        }
      }
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trail_summary',
      actor: `User ${_userId}`,
      details: { days },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trail summary retrieved successfully',
      data: {
        summary: {
          periodDays: days,
          totalCount,
          actionSummary,
          actorSummary,
          dailyActivity,
          busiestHours
        }
      }
    };
  } catch (error) {
    console.error('Error in getAuditTrailSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trail summary: ${error.message}`,
      data: null
    };
  }
};