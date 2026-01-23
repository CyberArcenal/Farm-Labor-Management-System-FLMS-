// src/ipc/assignment/import_csv.ipc.js
//@ts-check
// @ts-ignore
const csv = require('csv-parser');
const fs = require('fs');
const Assignment = require('../../../entities/Assignment');
const Pitak = require('../../../entities/Pitak');

/**
 * Import assignments from CSV file
 * @param {Object} params - Import parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    // @ts-ignore
    const { filePath, mapping, options = {}, _userId } = params;

    if (!filePath || !fs.existsSync(filePath)) {
      return {
        status: false,
        message: "CSV file not found",
        data: null
      };
    }

    // Default column mapping
    const defaultMapping = {
      workerId: 'worker_id',
      workerCode: 'worker_code',
      workerName: 'worker_name',
      pitakId: 'pitak_id',
      pitakCode: 'pitak_code',
      pitakName: 'pitak_name',
      assignmentDate: 'date',
      luwangCount: 'luwang',
      status: 'status',
      notes: 'notes'
    };

    const columnMapping = { ...defaultMapping, ...mapping };
    const importOptions = {
      skipDuplicates: options.skipDuplicates || true,
      updateExisting: options.updateExisting || false,
      dateFormat: options.dateFormat || 'YYYY-MM-DD',
      ...options
    };

    const results = {
      totalRows: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      duplicates: [],
      assignments: []
    };

    const workerRepo = queryRunner.manager.getRepository(Worker);
    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const assignmentRepo = queryRunner.manager.getRepository(Assignment);

    // Cache for workers and pitaks
    // @ts-ignore
    const workerCache = new Map();
    // @ts-ignore
    const pitakCache = new Map();

    // Read CSV file
    /**
       * @type {any[]}
       */
    const csvData = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (/** @type {any} */ row) => {
          csvData.push(row);
          results.totalRows++;
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Process each row
    for (const [index, row] of csvData.entries()) {
      try {
        // Extract data using mapping
        const assignmentData = {
          workerId: row[columnMapping.workerId],
          workerCode: row[columnMapping.workerCode],
          workerName: row[columnMapping.workerName],
          pitakId: row[columnMapping.pitakId],
          pitakCode: row[columnMapping.pitakCode],
          pitakName: row[columnMapping.pitakName],
          assignmentDate: row[columnMapping.assignmentDate],
          luwangCount: row[columnMapping.luwangCount],
          status: row[columnMapping.status] || 'active',
          notes: row[columnMapping.notes]
        };

        // Validate required fields
        if (!assignmentData.assignmentDate) {
          throw new Error("Missing assignment date");
        }

        // Parse date
        let assignmentDate;
        try {
          assignmentDate = new Date(assignmentData.assignmentDate);
          if (isNaN(assignmentDate.getTime())) {
            throw new Error("Invalid date format");
          }
        } catch (error) {
          throw new Error(`Invalid date: ${assignmentData.assignmentDate}`);
        }

        // Find or create worker
        let worker;
        if (assignmentData.workerId) {
          // @ts-ignore
          worker = await workerRepo.findOne({ where: { id: assignmentData.workerId } });
        } else if (assignmentData.workerCode) {
          // @ts-ignore
          worker = await workerRepo.findOne({ where: { code: assignmentData.workerCode } });
        }

        if (!worker) {
          // @ts-ignore
          results.errors.push({
            row: index + 1,
            error: `Worker not found: ${assignmentData.workerId || assignmentData.workerCode || assignmentData.workerName}`,
            data: assignmentData
          });
          results.failed++;
          continue;
        }

        // Find or create pitak
        let pitak;
        if (assignmentData.pitakId) {
          pitak = await pitakRepo.findOne({ where: { id: assignmentData.pitakId } });
        } else if (assignmentData.pitakCode) {
          // @ts-ignore
          pitak = await pitakRepo.findOne({ where: { code: assignmentData.pitakCode } });
        }

        if (!pitak) {
          // @ts-ignore
          results.errors.push({
            row: index + 1,
            error: `Pitak not found: ${assignmentData.pitakId || assignmentData.pitakCode || assignmentData.pitakName}`,
            data: assignmentData
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
          if (importOptions.skipDuplicates) {
            // @ts-ignore
            results.duplicates.push({
              row: index + 1,
              existingAssignmentId: existingAssignment.id,
              data: assignmentData
            });
            results.skipped++;
            continue;
          } else if (importOptions.updateExisting) {
            // Update existing assignment
            // @ts-ignore
            existingAssignment.pitakId = pitak.id;
            existingAssignment.luwangCount = assignmentData.luwangCount || existingAssignment.luwangCount;
            existingAssignment.status = assignmentData.status || existingAssignment.status;
            existingAssignment.updatedAt = new Date();
            
            if (assignmentData.notes) {
              existingAssignment.notes = existingAssignment.notes 
                ? `${existingAssignment.notes}\n[Imported Update]: ${assignmentData.notes}`
                : `[Imported Update]: ${assignmentData.notes}`;
            }

            const updatedAssignment = await assignmentRepo.save(existingAssignment);
            // @ts-ignore
            results.assignments.push({
              action: 'updated',
              assignment: updatedAssignment
            });
            results.imported++;
          }
        } else {
          // Create new assignment
          const newAssignment = assignmentRepo.create({
            // @ts-ignore
            workerId: worker.id,
            pitakId: pitak.id,
            luwangCount: assignmentData.luwangCount || 0.00,
            assignmentDate: assignmentDate,
            status: assignmentData.status || 'active',
            notes: assignmentData.notes || null
          });

          const savedAssignment = await assignmentRepo.save(newAssignment);
          // @ts-ignore
          results.assignments.push({
            action: 'created',
            assignment: savedAssignment
          });
          results.imported++;
        }

      } catch (error) {
        // @ts-ignore
        results.errors.push({
          row: index + 1,
          // @ts-ignore
          error: error.message,
          data: row
        });
        results.failed++;
      }
    }

    // Calculate summary
    const summary = {
      totalRows: results.totalRows,
      imported: results.imported,
      skipped: results.skipped,
      failed: results.failed,
      successRate: results.totalRows > 0 
        ? ((results.imported / results.totalRows) * 100).toFixed(2) + '%'
        : '0%'
    };

    return {
      status: true,
      message: "CSV import completed",
      data: {
        results,
        summary
      }
    };

  } catch (error) {
    console.error("Error importing assignments from CSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: `CSV import failed: ${error.message}`,
      data: null
    };
  }
};