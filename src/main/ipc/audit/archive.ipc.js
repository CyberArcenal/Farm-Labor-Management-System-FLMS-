// ipc/auditTrail/archive.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

module.exports = async function archiveAuditTrails(params = {}, queryRunner = null) {
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
      monthsOld = 12, // Archive records older than X months
      // @ts-ignore
      archiveFormat = 'zip', // 'zip' or 'tar'
      // @ts-ignore
      compress = true,
      // @ts-ignore
      _userId 
    } = params;
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
    
    // @ts-ignore
    const auditRepo = queryRunner.manager.getRepository("AuditTrail");
    
    // Get records to archive
    const recordsToArchive = await auditRepo.find({
      where: {
        timestamp: {
          $lt: cutoffDate
        }
      },
      order: { timestamp: 'ASC' },
      take: 100000 // Safety limit
    });
    
    if (recordsToArchive.length === 0) {
      return {
        status: false,
        message: 'No audit trails found to archive',
        data: null
      };
    }
    
    // Create archive directory
    const archiveDir = path.join(__dirname, '../../../../exports/audit_archives');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    
    // Create metadata
    const archiveMetadata = {
      archiveDate: new Date().toISOString(),
      archivedBy: `User ${_userId}`,
      cutoffDate: cutoffDate.toISOString(),
      monthsOld,
      recordCount: recordsToArchive.length,
      originalRecordIds: recordsToArchive.map((/** @type {{ id: any; }} */ r) => r.id)
    };
    
    // Prepare data for export
    const exportData = {
      metadata: archiveMetadata,
      auditTrails: recordsToArchive.map((/** @type {{ id: any; action: any; actor: any; details: any; timestamp: { toISOString: () => any; }; }} */ record) => ({
        id: record.id,
        action: record.action,
        actor: record.actor,
        details: record.details,
        timestamp: record.timestamp.toISOString()
      }))
    };
    
    // Generate archive filename
    const archiveDate = new Date().toISOString().split('T')[0];
    const archiveId = `audit_archive_${cutoffDate.toISOString().split('T')[0]}_to_${archiveDate}`;
    const archiveFilename = `${archiveId}.${archiveFormat}`;
    const archivePath = path.join(archiveDir, archiveFilename);
    
    // Create archive
    const output = fs.createWriteStream(archivePath);
    const archive = archiver(archiveFormat, {
      zlib: { level: compress ? 9 : 0 }
    });
    
    return new Promise((resolve, reject) => {
      output.on('close', async () => {
        try {
          const archiveSize = archive.pointer();
          
          // Save metadata file
          const metadataPath = path.join(archiveDir, `${archiveId}_metadata.json`);
          fs.writeFileSync(metadataPath, JSON.stringify(archiveMetadata, null, 2));
          
          // Move records to archive table (optional) or delete them
          // For now, we'll just delete them after successful archive
          if (recordsToArchive.length > 0) {
            const deleteResult = await auditRepo.createQueryBuilder()
              .delete()
              .where("id IN (:...ids)", { 
                ids: recordsToArchive.map((/** @type {{ id: any; }} */ r) => r.id) 
              })
              .execute();
            
            const deletedCount = deleteResult.affected || 0;
            
            // Log archive activity
            // @ts-ignore
            const accessLogRepo = queryRunner.manager.getRepository("AuditTrail");
            const accessLog = accessLogRepo.create({
              action: 'archive_audit_trails',
              actor: `User ${_userId}`,
              details: { 
                monthsOld, 
                cutoffDate, 
                archiveFormat,
                compress,
                archivedRecords: recordsToArchive.length,
                deletedRecords: deletedCount,
                archiveFilename,
                archiveSize 
              },
              timestamp: new Date()
            });
            await accessLogRepo.save(accessLog);
            
            if (shouldRelease) {
              // @ts-ignore
              await queryRunner.commitTransaction();
            }
            
            resolve({
              status: true,
              message: 'Audit trails archived successfully',
              data: {
                archiveId,
                archiveFilename,
                archivePath,
                metadataPath,
                archiveSize,
                recordsArchived: recordsToArchive.length,
                recordsDeleted: deletedCount,
                dateRange: {
                  oldest: recordsToArchive[0].timestamp,
                  newest: recordsToArchive[recordsToArchive.length - 1].timestamp
                },
                downloadUrl: `/exports/audit_archives/${archiveFilename}`
              }
            });
          }
        } catch (error) {
          reject(error);
        }
      });
      
      archive.on('error', (error) => {
        reject(error);
      });
      
      archive.pipe(output);
      
      // Add audit trails as JSON
      const auditData = JSON.stringify(exportData, null, 2);
      archive.append(auditData, { name: 'audit_trails.json' });
      
      // Add summary report
      const summary = {
        summary: `Audit Trail Archive - ${recordsToArchive.length} records`,
        dateRange: `${recordsToArchive[0].timestamp.toISOString()} to ${recordsToArchive[recordsToArchive.length - 1].timestamp.toISOString()}`,
        actionsSummary: calculateActionsSummary(recordsToArchive),
        actorsSummary: calculateActorsSummary(recordsToArchive)
      };
      
      archive.append(JSON.stringify(summary, null, 2), { name: 'summary.json' });
      
      archive.finalize();
    });
    
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in archiveAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to archive audit trails: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};

/**
 * @param {any[]} records
 */
function calculateActionsSummary(records) {
  const actionCounts = {};
  records.forEach((/** @type {{ action: string | number; }} */ record) => {
    // @ts-ignore
    actionCounts[record.action] = (actionCounts[record.action] || 0) + 1;
  });
  
  return Object.keys(actionCounts)
    // @ts-ignore
    .map(action => ({ action, count: actionCounts[action] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 actions
}

/**
 * @param {any[]} records
 */
function calculateActorsSummary(records) {
  const actorCounts = {};
  records.forEach((/** @type {{ actor: string | number; }} */ record) => {
    // @ts-ignore
    actorCounts[record.actor] = (actorCounts[record.actor] || 0) + 1;
  });
  
  return Object.keys(actorCounts)
    // @ts-ignore
    .map(actor => ({ actor, count: actorCounts[actor] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 actors
}