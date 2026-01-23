// src/ipc/assignment/export_csv.ipc.js
//@ts-check
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const { AppDataSource } = require('../../db/dataSource');
const Assignment = require('../../../entities/Assignment');

/**
 * Export assignments to CSV file
 * @param {Object} params - Export parameters
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params) => {
  try {
    const { 
      // @ts-ignore
      filters = {}, 
      // @ts-ignore
      fields = [], 
      // @ts-ignore
      outputPath,
      // @ts-ignore
      _userId 
    } = params;

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    // Build query
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak");

    // Apply filters
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.where("assignment.assignmentDate BETWEEN :dateFrom AND :dateTo", {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
    }

    if (filters.status) {
      queryBuilder.andWhere("assignment.status = :status", { status: filters.status });
    }

    if (filters.workerId) {
      queryBuilder.andWhere("assignment.workerId = :workerId", { workerId: filters.workerId });
    }

    if (filters.pitakId) {
      queryBuilder.andWhere("assignment.pitakId = :pitakId", { pitakId: filters.pitakId });
    }

    const assignments = await queryBuilder.getMany();

    if (assignments.length === 0) {
      return {
        status: false,
        message: "No assignments found to export",
        data: null
      };
    }

    // Prepare data for CSV
    const csvData = assignments.map((/** @type {{ id: any; assignmentDate: { toISOString: () => string; }; luwangCount: string; status: any; notes: any; createdAt: { toISOString: () => any; }; updatedAt: { toISOString: () => any; }; worker: { id: any; code: any; name: any; contactNumber: string; }; pitak: { id: any; code: any; name: any; location: string; }; }} */ assignment) => {
      const baseData = {
        id: assignment.id,
        assignment_date: assignment.assignmentDate.toISOString().split('T')[0],
        luwang_count: parseFloat(assignment.luwangCount).toFixed(2),
        status: assignment.status,
        notes: assignment.notes || '',
        created_at: assignment.createdAt.toISOString(),
        updated_at: assignment.updatedAt.toISOString()
      };

      // Add worker information
      if (assignment.worker) {
        // @ts-ignore
        baseData.worker_id = assignment.worker.id;
        // @ts-ignore
        baseData.worker_code = assignment.worker.code;
        // @ts-ignore
        baseData.worker_name = assignment.worker.name;
        // @ts-ignore
        baseData.worker_contact = assignment.worker.contactNumber || '';
      }

      // Add pitak information
      if (assignment.pitak) {
        // @ts-ignore
        baseData.pitak_id = assignment.pitak.id;
        // @ts-ignore
        baseData.pitak_code = assignment.pitak.code;
        // @ts-ignore
        baseData.pitak_name = assignment.pitak.name;
        // @ts-ignore
        baseData.pitak_location = assignment.pitak.location || '';
      }

      return baseData;
    });

    // Define fields for CSV
    let csvFields = fields.length > 0 ? fields : [
      'id',
      'assignment_date',
      'worker_code',
      'worker_name',
      'pitak_code',
      'pitak_name',
      'luwang_count',
      'status',
      'notes',
      'created_at',
      'updated_at'
    ];

    // Create CSV parser
    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    // Determine output path
    let finalOutputPath = outputPath;
    if (!finalOutputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      finalOutputPath = path.join(process.cwd(), `assignments_export_${timestamp}.csv`);
    }

    // Ensure directory exists
    const dir = path.dirname(finalOutputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write CSV file
    fs.writeFileSync(finalOutputPath, csv);

    // Generate summary
    const summary = {
      totalExported: assignments.length,
      fileSize: fs.statSync(finalOutputPath).size,
      filePath: finalOutputPath,
      dateRange: filters.dateFrom && filters.dateTo ? {
        from: filters.dateFrom,
        to: filters.dateTo
      } : null,
      statusBreakdown: assignments.reduce((/** @type {{ [x: string]: any; }} */ acc, /** @type {{ status: string | number; }} */ assignment) => {
        acc[assignment.status] = (acc[assignment.status] || 0) + 1;
        return acc;
      }, {})
    };

    return {
      status: true,
      message: "Assignments exported successfully",
      data: {
        csvData: csvData.slice(0, 10), // Return first 10 rows as sample
        fileInfo: {
          path: finalOutputPath,
          size: summary.fileSize,
          rowCount: summary.totalExported
        },
        summary
      }
    };

  } catch (error) {
    console.error("Error exporting assignments to CSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: `CSV export failed: ${error.message}`,
      data: null
    };
  }
};