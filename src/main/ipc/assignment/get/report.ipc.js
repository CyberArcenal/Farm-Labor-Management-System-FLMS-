// src/ipc/assignment/get/report.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");
// @ts-ignore
const Worker = require("../../../../entities/Worker");
// @ts-ignore
const Pitak = require("../../../../entities/Pitak");

/**
 * Generate assignment report
 * @param {Object} dateRange - Date range for report
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (dateRange, filters = {}, userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange || {};
    
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Date range (startDate and endDate) is required for report",
        data: null
      };
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    // Build base query
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate
      });

    // Apply additional filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.status = :status", { status: filters.status });
    }

    // @ts-ignore
    if (filters.workerId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.workerId = :workerId", { workerId: filters.workerId });
    }

    // @ts-ignore
    if (filters.pitakId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.pitakId = :pitakId", { pitakId: filters.pitakId });
    }

    const assignments = await queryBuilder
      .orderBy("assignment.assignmentDate", "DESC")
      .addOrderBy("worker.name", "ASC")
      .getMany();

    // Calculate summary statistics
    const summary = {
      totalAssignments: assignments.length,
      totalLuWang: 0,
      byStatus: {
        active: 0,
        completed: 0,
        cancelled: 0
      },
      byWorker: {},
      byPitak: {}
    };

    // Process assignments for report
    // @ts-ignore
    const reportData = assignments.map(assignment => {
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // Update summary
      summary.totalLuWang += luwang;
      // @ts-ignore
      summary.byStatus[assignment.status] = (summary.byStatus[assignment.status] || 0) + 1;
      
      // Worker summary
      if (assignment.worker) {
        const workerId = assignment.worker.id;
        // @ts-ignore
        if (!summary.byWorker[workerId]) {
          // @ts-ignore
          summary.byWorker[workerId] = {
            name: assignment.worker.name,
            totalAssignments: 0,
            totalLuWang: 0
          };
        }
        // @ts-ignore
        summary.byWorker[workerId].totalAssignments++;
        // @ts-ignore
        summary.byWorker[workerId].totalLuWang += luwang;
      }
      
      // Pitak summary
      if (assignment.pitak) {
        const pitakId = assignment.pitak.id;
        // @ts-ignore
        if (!summary.byPitak[pitakId]) {
          // @ts-ignore
          summary.byPitak[pitakId] = {
            name: assignment.pitak.name,
            totalAssignments: 0,
            totalLuWang: 0
          };
        }
        // @ts-ignore
        summary.byPitak[pitakId].totalAssignments++;
        // @ts-ignore
        summary.byPitak[pitakId].totalLuWang += luwang;
      }

      return {
        id: assignment.id,
        date: assignment.assignmentDate,
        luwangCount: luwang.toFixed(2),
        status: assignment.status,
        worker: assignment.worker ? {
          id: assignment.worker.id,
          name: assignment.worker.name,
          code: assignment.worker.code
        } : null,
        pitak: assignment.pitak ? {
          id: assignment.pitak.id,
          name: assignment.pitak.name,
          code: assignment.pitak.code
        } : null,
        notes: assignment.notes
      };
    });

    // Convert summary objects to arrays
    summary.byWorker = Object.values(summary.byWorker)
      .sort((a, b) => b.totalLuWang - a.totalLuWang);
    
    summary.byPitak = Object.values(summary.byPitak)
      .sort((a, b) => b.totalLuWang - a.totalLuWang);

    // @ts-ignore
    summary.totalLuWang = summary.totalLuWang.toFixed(2);

    return {
      status: true,
      message: "Assignment report generated successfully",
      data: {
        report: reportData,
        summary: summary,
        dateRange: {
          startDate,
          endDate,
          duration: `${reportData.length} days`
        }
      }
    };

  } catch (error) {
    console.error("Error generating assignment report:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate report: ${error.message}`,
      data: null
    };
  }
};