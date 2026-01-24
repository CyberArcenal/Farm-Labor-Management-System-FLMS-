// ipc/auditTrail/get/by_date_range.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailsByDateRange(params = {}) {
  try {
    const { 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate, 
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
    
    if (!startDate || !endDate) {
      return {
        status: false,
        message: 'Start date and end date are required',
        data: null
      };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Add one day to end date to include the entire day
    end.setDate(end.getDate() + 1);
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const skip = (page - 1) * limit;
    
    const [auditTrails, total] = await auditRepo.findAndCount({
      where: {
        timestamp: {
          $gte: start,
          $lte: end
        }
      },
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trails_by_date_range',
      actor: `User ${_userId}`,
      details: { startDate, endDate, page, limit },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trails retrieved successfully',
      data: {
        auditTrails,
        dateRange: { startDate, endDate },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getAuditTrailsByDateRange:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trails: ${error.message}`,
      data: null
    };
  }
};