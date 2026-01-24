// ipc/auditTrail/get/all.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAllAuditTrails(params = {}) {
  try {
    const { 
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
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const skip = (page - 1) * limit;
    
    const [auditTrails, total] = await auditRepo.findAndCount({
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_all_audit_trails',
      actor: `User ${_userId}`,
      details: { page, limit, sortBy, sortOrder },
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
    console.error('Error in getAllAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trails: ${error.message}`,
      data: null
    };
  }
};