// src/ipc/assignment/sync_external.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");
const Pitak = require("../../../entities/Pitak");

/**
 * Sync assignments from external source
 * @param {Object} params - Sync parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      source, 
      // @ts-ignore
      sourceData, 
      // @ts-ignore
      options = {},
      // @ts-ignore
      _userId 
    } = params;

    if (!source || !sourceData) {
      return {
        status: false,
        message: "Source and source data are required",
        data: null
      };
    }

    const syncOptions = {
      conflictResolution: options.conflictResolution || 'skip', // 'skip', 'overwrite', 'merge'
      syncDate: options.syncDate || new Date().toISOString(),
      dryRun: options.dryRun || false,
      ...options
    };

    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    const workerRepo = queryRunner.manager.getRepository(Worker);
    const pitakRepo = queryRunner.manager.getRepository(Pitak);

    const results = {
      totalExternal: sourceData.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      assignments: []
    };

    // Process each external assignment
    for (const [index, externalAssignment] of sourceData.entries()) {
      try {
        // Validate external data structure
        if (!externalAssignment.workerId || !externalAssignment.pitakId || !externalAssignment.assignmentDate) {
          throw new Error("Missing required fields: workerId, pitakId, assignmentDate");
        }

        // Find worker
        const worker = await workerRepo.findOne({ 
          // @ts-ignore
          where: { id: externalAssignment.workerId } 
        });
        
        if (!worker) {
          // @ts-ignore
          results.errors.push({
            index,
            error: `Worker not found: ${externalAssignment.workerId}`,
            data: externalAssignment
          });
          results.failed++;
          continue;
        }

        // Find pitak
        const pitak = await pitakRepo.findOne({ 
          where: { id: externalAssignment.pitakId } 
        });
        
        if (!pitak) {
          // @ts-ignore
          results.errors.push({
            index,
            error: `Pitak not found: ${externalAssignment.pitakId}`,
            data: externalAssignment
          });
          results.failed++;
          continue;
        }

        // Parse date
        let assignmentDate;
        try {
          assignmentDate = new Date(externalAssignment.assignmentDate);
          if (isNaN(assignmentDate.getTime())) {
            throw new Error("Invalid date");
          }
        } catch (error) {
          // @ts-ignore
          results.errors.push({
            index,
            error: `Invalid date: ${externalAssignment.assignmentDate}`,
            data: externalAssignment
          });
          results.failed++;
          continue;
        }

        // Check for existing assignment
        const existingAssignment = await assignmentRepo.findOne({
          where: {
            // @ts-ignore
            workerId: worker.id,
            assignmentDate: assignmentDate,
            status: 'active'
          }
        });

        if (existingAssignment) {
          // Conflict resolution
          switch (syncOptions.conflictResolution) {
            case 'skip':
              results.skipped++;
              // @ts-ignore
              results.assignments.push({
                action: 'skipped',
                reason: 'Conflict - skipped',
                assignmentId: existingAssignment.id
              });
              break;

            case 'overwrite':
              // Update existing assignment with external data
              // @ts-ignore
              existingAssignment.pitakId = pitak.id;
              existingAssignment.luwangCount = externalAssignment.luwangCount || existingAssignment.luwangCount;
              existingAssignment.status = externalAssignment.status || existingAssignment.status;
              existingAssignment.updatedAt = new Date();
              
              // Add sync note
              const overwriteNote = `[External Sync ${syncOptions.syncDate} from ${source}]: Overwritten with external data`;
              existingAssignment.notes = existingAssignment.notes 
                ? `${existingAssignment.notes}\n${overwriteNote}`
                : overwriteNote;

              if (!syncOptions.dryRun) {
                await assignmentRepo.save(existingAssignment);
              }
              
              results.updated++;
              // @ts-ignore
              results.assignments.push({
                action: 'updated',
                assignmentId: existingAssignment.id
              });
              break;

            case 'merge':
              // Merge external data with existing assignment
              const mergeNote = `[External Sync ${syncOptions.syncDate} from ${source}]: Merged with external data`;
              
              // Update fields only if they have values
              if (externalAssignment.luwangCount !== undefined) {
                existingAssignment.luwangCount = externalAssignment.luwangCount;
              }
              
              if (externalAssignment.status) {
                existingAssignment.status = externalAssignment.status;
              }
              
              if (externalAssignment.notes) {
                existingAssignment.notes = existingAssignment.notes 
                  ? `${existingAssignment.notes}\n${mergeNote}: ${externalAssignment.notes}`
                  : `${mergeNote}: ${externalAssignment.notes}`;
              } else {
                existingAssignment.notes = existingAssignment.notes 
                  ? `${existingAssignment.notes}\n${mergeNote}`
                  : mergeNote;
              }
              
              existingAssignment.updatedAt = new Date();

              if (!syncOptions.dryRun) {
                await assignmentRepo.save(existingAssignment);
              }
              
              results.updated++;
              // @ts-ignore
              results.assignments.push({
                action: 'merged',
                assignmentId: existingAssignment.id
              });
              break;
          }
        } else {
          // Create new assignment from external data
          const newAssignment = assignmentRepo.create({
            // @ts-ignore
            workerId: worker.id,
            pitakId: pitak.id,
            luwangCount: externalAssignment.luwangCount || 0.00,
            assignmentDate: assignmentDate,
            status: externalAssignment.status || 'active',
            notes: externalAssignment.notes 
              ? `[External Sync ${syncOptions.syncDate} from ${source}]: ${externalAssignment.notes}`
              : `[External Sync ${syncOptions.syncDate} from ${source}]`
          });

          if (!syncOptions.dryRun) {
            await assignmentRepo.save(newAssignment);
          }
          
          results.created++;
          // @ts-ignore
          results.assignments.push({
            action: 'created',
            assignmentId: newAssignment.id
          });
        }

      } catch (error) {
        // @ts-ignore
        results.errors.push({
          index,
          // @ts-ignore
          error: error.message,
          data: externalAssignment
        });
        results.failed++;
      }
    }

    // Generate sync summary
    const summary = {
      source,
      syncDate: syncOptions.syncDate,
      totalProcessed: results.totalExternal,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      failed: results.failed,
      successRate: results.totalExternal > 0 
        ? (((results.created + results.updated) / results.totalExternal) * 100).toFixed(2) + '%'
        : '0%',
      dryRun: syncOptions.dryRun,
      conflictResolution: syncOptions.conflictResolution
    };

    return {
      status: true,
      message: syncOptions.dryRun 
        ? "External sync dry run completed"
        : "External sync completed",
      data: {
        results,
        summary
      }
    };

  } catch (error) {
    console.error("Error syncing assignments from external source:", error);
    return {
      status: false,
      // @ts-ignore
      message: `External sync failed: ${error.message}`,
      data: null
    };
  }
};