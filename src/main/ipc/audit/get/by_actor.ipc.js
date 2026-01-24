// ipc/auditTrail/get/by_actor.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailsByActor(params = {}) {
  try {
    const { 
      // @ts-ignore
      actor, 
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
    
    if (!actor) {
      return {
        status: false,
        message: 'Actor name is required',
        data: null
      };
    }
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const skip = (page - 1) * limit;
    
    const [auditTrails, total] = await auditRepo.findAndCount({
      where: { actor },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trails_by_actor',
      actor: `User ${_userId}`,
      details: { actor, page, limit },
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
    console.error('Error in getAuditTrailsByActor:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trails: ${error.message}`,
      data: null
    };
  }
};