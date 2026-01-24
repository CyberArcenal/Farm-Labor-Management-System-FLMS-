// ipc/auditTrail/get/by_action.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailsByAction(params = {}) {
  try {
    const { 
      // @ts-ignore
      action, 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      sortBy = 'timestamp', 
      // @ts-ignore
      sortOrder = 'DESC',
      // @ts-ignore
      _userId 
    } = params;
    
    if (!action) {
      return {
        status: false,
        message: 'Action name is required',
        data: null
      };
    }
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const skip = (page - 1) * limit;
    
    const [auditTrails, total] = await auditRepo.findAndCount({
      where: { action },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trails_by_action',
      actor: `User ${_userId}`,
      details: { action, page, limit },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trails retrieved successfully',
      data: {
        auditTrails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getAuditTrailsByAction:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trails: ${error.message}`,
      data: null
    };
  }
};