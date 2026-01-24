// ipc/auditTrail/cleanup_old.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");

module.exports = async function cleanupOldAuditTrails(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    const { 
      // @ts-ignore
      daysToKeep = 365, // Default: keep 1 year
      // @ts-ignore
      dryRun = true, // Default: dry run (don't actually delete)
      // @ts-ignore
      _userId 
    } = params;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // @ts-ignore
    const auditRepo = queryRunner.manager.getRepository("AuditTrail");
    
    // Count records that would be deleted
    const countToDelete = await auditRepo.count({
      where: {
        timestamp: {
          $lt: cutoffDate
        }
      }
    });
    
    let deletedCount = 0;
    
    if (!dryRun && countToDelete > 0) {
      // Actually delete the records
      const deleteResult = await auditRepo.createQueryBuilder()
        .delete()
        .where("timestamp < :cutoffDate", { cutoffDate })
        .execute();
      
      deletedCount = deleteResult.affected || 0;
    }
    
    // Log cleanup activity
    // @ts-ignore
    const accessLogRepo = queryRunner.manager.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'cleanup_old_audit_trails',
      actor: `User ${_userId}`,
      details: { 
        daysToKeep, 
        cutoffDate, 
        dryRun, 
        wouldDelete: countToDelete,
        actuallyDeleted: deletedCount 
      },
      timestamp: new Date()
    });
    await accessLogRepo.save(accessLog);
    
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }
    
    return {
      status: true,
      message: dryRun 
        ? 'Cleanup simulation completed successfully' 
        : 'Cleanup completed successfully',
      data: {
        cutoffDate,
        daysToKeep,
        dryRun,
        wouldDelete: countToDelete,
        actuallyDeleted: deletedCount
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in cleanupOldAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to cleanup old audit trails: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};