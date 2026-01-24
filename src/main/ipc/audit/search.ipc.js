// ipc/auditTrail/search.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");

module.exports = async function searchAuditTrails(params = {}) {
  try {
    const { 
      // @ts-ignore
      query, 
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
    
    if (!query) {
      return {
        status: false,
        message: 'Search query is required',
        data: null
      };
    }
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const skip = (page - 1) * limit;
    
    // Search in action, actor, and details
    const [auditTrails, total] = await auditRepo.findAndCount({
      where: [
        { action: { $like: `%${query}%` } },
        { actor: { $like: `%${query}%` } }
      ],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });
    
    // Log search activity
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'search_audit_trails',
      actor: `User ${_userId}`,
      details: { query, page, limit, resultsCount: auditTrails.length },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trails search completed successfully',
      data: {
        auditTrails,
        query,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in searchAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search audit trails: ${error.message}`,
      data: null
    };
  }
};