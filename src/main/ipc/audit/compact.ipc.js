// ipc/auditTrail/compact.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");

module.exports = async function compactAuditTrails(params = {}, queryRunner = null) {
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
      monthsOld = 6, // Compact records older than X months
      // @ts-ignore
      compactMethod = 'summarize', // 'summarize', 'aggregate', or 'sample'
      // @ts-ignore
      sampleRate = 0.1, // For 'sample' method: keep 10% of records
      // @ts-ignore
      _userId 
    } = params;
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);
    
    // @ts-ignore
    const auditRepo = queryRunner.manager.getRepository("AuditTrail");
    
    // Get records to compact
    const recordsToCompact = await auditRepo.find({
      where: {
        timestamp: {
          $lt: cutoffDate
        }
      },
      order: { timestamp: 'ASC' },
      take: 50000 // Safety limit
    });
    
    if (recordsToCompact.length === 0) {
      return {
        status: false,
        message: 'No audit trails found to compact',
        data: null
      };
    }
    
    let compactionResult;
    // @ts-ignore
    let compactedRecords = [];
    
    switch (compactMethod) {
      case 'summarize':
        compactionResult = await compactBySummarization(recordsToCompact, auditRepo, queryRunner);
        break;
      
      case 'aggregate':
        compactionResult = await compactByAggregation(recordsToCompact, auditRepo, queryRunner);
        break;
      
      case 'sample':
        compactionResult = await compactBySampling(recordsToCompact, auditRepo, queryRunner, sampleRate);
        break;
      
      default:
        return {
          status: false,
          message: `Unknown compaction method: ${compactMethod}`,
          data: null
        };
    }
    
    // Log compaction activity
    // @ts-ignore
    const accessLogRepo = queryRunner.manager.getRepository("AuditTrail");
    const accessLog = accessLogRepo.create({
      action: 'compact_audit_trails',
      actor: `User ${_userId}`,
      details: { 
        monthsOld, 
        cutoffDate, 
        compactMethod,
        sampleRate,
        originalCount: recordsToCompact.length,
        compactedCount: compactionResult.compactedRecords.length,
        retainedCount: compactionResult.retainedRecords.length,
        spaceSaved: recordsToCompact.length - compactionResult.retainedRecords.length
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
      message: 'Audit trails compacted successfully',
      data: {
        compaction: {
          method: compactMethod,
          originalCount: recordsToCompact.length,
          compactedCount: compactionResult.compactedRecords.length,
          retainedCount: compactionResult.retainedRecords.length,
          spaceSaved: recordsToCompact.length - compactionResult.retainedRecords.length,
          spaceSavedPercentage: ((recordsToCompact.length - compactionResult.retainedRecords.length) / recordsToCompact.length * 100).toFixed(2),
          dateRange: {
            oldest: recordsToCompact[0].timestamp,
            newest: recordsToCompact[recordsToCompact.length - 1].timestamp
          }
        },
        details: compactionResult.details
      }
    };
    
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in compactAuditTrails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to compact audit trails: ${error.message}`,
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
 * @param {{ createQueryBuilder: () => { (): any; new (): any; delete: { (): { (): any; new (): any; where: { (arg0: string, arg1: { ids: any; }): { (): any; new (): any; execute: { (): any; new (): any; }; }; new (): any; }; }; new (): any; }; }; create: (arg0: { action: string; actor: string; details: { originalAction: any; date: any; totalOccurrences: any; uniqueActors: any[]; timeRange: { start: any; end: any; }; sampleDetails: any; }; timestamp: any; }) => any; }} auditRepo
 * @param {{ manager: { save: (arg0: any) => any; }; } | null} queryRunner
 */
async function compactBySummarization(records, auditRepo, queryRunner) {
  // Group by day and action, create summary records
  const recordsByDay = {};
  
  records.forEach((/** @type {{ timestamp: number; action: any; details: any; actor: any; }} */ record) => {
    // @ts-ignore
    const dateKey = record.timestamp.toISOString().split('T')[0];
    const actionKey = record.action;
    const key = `${dateKey}|${actionKey}`;
    
    // @ts-ignore
    if (!recordsByDay[key]) {
      // @ts-ignore
      recordsByDay[key] = {
        date: dateKey,
        action: actionKey,
        count: 0,
        firstTimestamp: record.timestamp,
        lastTimestamp: record.timestamp,
        actors: new Set(),
        sampleDetails: record.details // Keep sample details
      };
    }
    
    // @ts-ignore
    recordsByDay[key].count++;
    // @ts-ignore
    recordsByDay[key].actors.add(record.actor);
    // @ts-ignore
    if (record.timestamp < recordsByDay[key].firstTimestamp) {
      // @ts-ignore
      recordsByDay[key].firstTimestamp = record.timestamp;
    }
    // @ts-ignore
    if (record.timestamp > recordsByDay[key].lastTimestamp) {
      // @ts-ignore
      recordsByDay[key].lastTimestamp = record.timestamp;
    }
  });
  
  // Create summary records
  const summaryRecords = Object.values(recordsByDay).map(summary => ({
    action: `summary_${summary.action}`,
    actor: 'System',
    details: {
      originalAction: summary.action,
      date: summary.date,
      totalOccurrences: summary.count,
      uniqueActors: Array.from(summary.actors),
      timeRange: {
        start: summary.firstTimestamp.toISOString(),
        end: summary.lastTimestamp.toISOString()
      },
      sampleDetails: summary.sampleDetails
    },
    timestamp: summary.lastTimestamp
  }));
  
  // Delete original records
  const originalIds = records.map((/** @type {{ id: any; }} */ r) => r.id);
  await auditRepo.createQueryBuilder()
    .delete()
    .where("id IN (:...ids)", { ids: originalIds })
    .execute();
  
  // Save summary records
  const savedSummaries = [];
  for (const summary of summaryRecords) {
    const newRecord = auditRepo.create(summary);
    // @ts-ignore
    const saved = await queryRunner.manager.save(newRecord);
    savedSummaries.push(saved);
  }
  
  return {
    compactedRecords: summaryRecords,
    retainedRecords: savedSummaries,
    details: {
      summaryCount: summaryRecords.length,
      compressionRatio: (records.length / summaryRecords.length).toFixed(2)
    }
  };
}

/**
 * @param {any[]} records
 * @param {{ createQueryBuilder: () => { (): any; new (): any; delete: { (): { (): any; new (): any; where: { (arg0: string, arg1: { ids: any; }): { (): any; new (): any; execute: { (): any; new (): any; }; }; new (): any; }; }; new (): any; }; }; create: (arg0: { action: string; actor: string; details: { month: any; totalActivities: any; uniqueActors: number; actionBreakdown: any; timeRange: { start: any; end: any; }; }; timestamp: any; }) => any; }} auditRepo
 * @param {{ manager: { save: (arg0: any) => any; }; } | null} queryRunner
 */
async function compactByAggregation(records, auditRepo, queryRunner) {
  // Group by month and create aggregated records
  const recordsByMonth = {};
  
  records.forEach((/** @type {{ timestamp: string | number | Date; actor: any; action: string | number; }} */ record) => {
    const date = new Date(record.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // @ts-ignore
    if (!recordsByMonth[monthKey]) {
      // @ts-ignore
      recordsByMonth[monthKey] = {
        month: monthKey,
        actions: {},
        actors: new Set(),
        total: 0,
        firstTimestamp: record.timestamp,
        lastTimestamp: record.timestamp
      };
    }
    
    // @ts-ignore
    const monthData = recordsByMonth[monthKey];
    monthData.total++;
    monthData.actors.add(record.actor);
    
    // Count actions
    monthData.actions[record.action] = (monthData.actions[record.action] || 0) + 1;
    
    if (record.timestamp < monthData.firstTimestamp) {
      monthData.firstTimestamp = record.timestamp;
    }
    if (record.timestamp > monthData.lastTimestamp) {
      monthData.lastTimestamp = record.timestamp;
    }
  });
  
  // Create aggregated records
  const aggregatedRecords = Object.values(recordsByMonth).map(monthData => ({
    action: 'monthly_aggregate',
    actor: 'System',
    details: {
      month: monthData.month,
      totalActivities: monthData.total,
      uniqueActors: Array.from(monthData.actors).length,
      actionBreakdown: monthData.actions,
      timeRange: {
        start: monthData.firstTimestamp.toISOString(),
        end: monthData.lastTimestamp.toISOString()
      }
    },
    timestamp: monthData.lastTimestamp
  }));
  
  // Delete original records
  const originalIds = records.map((/** @type {{ id: any; }} */ r) => r.id);
  await auditRepo.createQueryBuilder()
    .delete()
    .where("id IN (:...ids)", { ids: originalIds })
    .execute();
  
  // Save aggregated records
  const savedAggregates = [];
  for (const aggregate of aggregatedRecords) {
    const newRecord = auditRepo.create(aggregate);
    // @ts-ignore
    const saved = await queryRunner.manager.save(newRecord);
    savedAggregates.push(saved);
  }
  
  return {
    compactedRecords: aggregatedRecords,
    retainedRecords: savedAggregates,
    details: {
      aggregateCount: aggregatedRecords.length,
      compressionRatio: (records.length / aggregatedRecords.length).toFixed(2)
    }
  };
}

/**
 * @param {any[]} records
 * @param {{ createQueryBuilder: () => { (): any; new (): any; delete: { (): { (): any; new (): any; where: { (arg0: string, arg1: { ids: any; }): { (): any; new (): any; execute: { (): any; new (): any; }; }; new (): any; }; }; new (): any; }; }; create: (arg0: { action: string; actor: string; details: { samplingRate: any; originalCount: any; sampledCount: number; dateRange: { start: any; end: any; }; sampleInfo: string; }; timestamp: Date; }) => any; }} auditRepo
 * @param {{ manager: { save: (arg0: any) => any; }; } | null} queryRunner
 * @param {number} sampleRate
 */
async function compactBySampling(records, auditRepo, queryRunner, sampleRate) {
  // Keep a sample of records
  const sampleSize = Math.max(1, Math.floor(records.length * sampleRate));
  
  // Simple random sampling
  const sampledIndices = new Set();
  while (sampledIndices.size < sampleSize) {
    sampledIndices.add(Math.floor(Math.random() * records.length));
  }
  
  const sampledRecords = Array.from(sampledIndices).map(idx => records[idx]);
  
  // Sort sampled records by timestamp
  sampledRecords.sort((a, b) => a.timestamp - b.timestamp);
  
  // Delete non-sampled records
  const recordsToDelete = records.filter((/** @type {any} */ _, /** @type {any} */ idx) => !sampledIndices.has(idx));
  const deleteIds = recordsToDelete.map((/** @type {{ id: any; }} */ r) => r.id);
  
  if (deleteIds.length > 0) {
    await auditRepo.createQueryBuilder()
      .delete()
      .where("id IN (:...ids)", { ids: deleteIds })
      .execute();
  }
  
  // Create a summary record about the sampling
  const summaryRecord = {
    action: 'sampling_summary',
    actor: 'System',
    details: {
      samplingRate: sampleRate,
      originalCount: records.length,
      sampledCount: sampledRecords.length,
      dateRange: {
        start: records[0].timestamp.toISOString(),
        end: records[records.length - 1].timestamp.toISOString()
      },
      sampleInfo: 'Random sampling of audit trails'
    },
    timestamp: new Date()
  };
  
  const newSummary = auditRepo.create(summaryRecord);
  // @ts-ignore
  const savedSummary = await queryRunner.manager.save(newSummary);
  
  return {
    compactedRecords: [summaryRecord],
    retainedRecords: [...sampledRecords, savedSummary],
    details: {
      sampleRate,
      sampledCount: sampledRecords.length,
      summaryAdded: true
    }
  };
}