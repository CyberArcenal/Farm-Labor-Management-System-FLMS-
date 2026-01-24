// ipc/auditTrail/filter.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");

module.exports = async function filterAuditTrails(params = {}) {
  try {
    const { 
      // @ts-ignore
      filters = {}, 
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
    
    const whereConditions = {};
    
    // Apply filters
    if (filters.action) {
      // @ts-ignore
      whereConditions.action = filters.action;
    }
    
    if (filters.actor) {
      // @ts-ignore
      whereConditions.actor = filters.actor;
    }
    
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setDate(end.getDate() + 1); // Include entire end day
      
      // @ts-ignore
      whereConditions.timestamp = {
        $gte: start,
        $lte: end
      };
    }
    
    const skip = (page - 1) * limit;
    
    const [auditTrails, total] = await auditRepo.findAndCount({
      where: whereConditions,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });
    
    // Log filter activity
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'filter_audit_trails',
      actor: `User ${_userId}`,
      details: { filters, page, limit, resultsCount: auditTrails.length },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trails filtered successfully',
      data: {
        auditTrails,
        filters,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in filterAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to filter audit trails: ${error.message}`,
      data: null
    };
  }
};