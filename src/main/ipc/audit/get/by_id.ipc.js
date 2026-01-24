// ipc/auditTrail/get/by_id.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAuditTrailById(params = {}) {
  try {
    // @ts-ignore
    const { id, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Audit trail ID is required',
        data: null
      };
    }
    
    const auditRepo = AppDataSource.getRepository("AuditTrail");
    
    const auditTrail = await auditRepo.findOne({
      where: { id: parseInt(id) }
    });
    
    if (!auditTrail) {
      return {
        status: false,
        message: 'Audit trail not found',
        data: null
      };
    }
    
    // Log access
    const accessLogRepo = AppDataSource.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'view_audit_trail_by_id',
      actor: `User ${_userId}`,
      details: { audit_trail_id: id },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    return {
      status: true,
      message: 'Audit trail retrieved successfully',
      data: { auditTrail }
    };
  } catch (error) {
    console.error('Error in getAuditTrailById:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve audit trail: ${error.message}`,
      data: null
    };
  }
};