// src/ipc/assignment/get/pitak_summary.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");
const Pitak = require("../../../../entities/Pitak");

/**
 * Generate pitak summary report
 * @param {number} pitakId - Pitak ID (optional, if not provided, all pitaks)
 * @param {Object} dateRange - Date range for report
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (pitakId, dateRange, userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange || {};
    
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    // Get pitak details if specific pitak is requested
    let pitakDetails = null;
    if (pitakId) {
      pitakDetails = await pitakRepo.findOne({ where: { id: pitakId } });
      if (!pitakDetails) {
        return {
          status: false,
          message: "Pitak not found",
          data: null
        };
      }
    }

    // Build query
    let queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .leftJoinAndSelect("assignment.worker", "worker");

    // Apply date filter
    if (startDate && endDate) {
      queryBuilder.where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate
      });
    }

    // Apply pitak filter
    if (pitakId) {
      queryBuilder.andWhere("assignment.pitakId = :pitakId", { pitakId });
    }

    const assignments = await queryBuilder.getMany();
    
    // Group assignments by pitak
    const pitakSummaries = {};
    
    assignments.forEach((/** @type {{ pitak: any; luwangCount: string; workerId: any; status: string | number; worker: { id: any; name: any; }; assignmentDate: { toISOString: () => string; }; }} */ assignment) => {
      const pitak = assignment.pitak;
      if (!pitak) return;
      
      const pitakId = pitak.id;
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // @ts-ignore
      if (!pitakSummaries[pitakId]) {
        // @ts-ignore
        pitakSummaries[pitakId] = {
          pitak: {
            id: pitak.id,
            name: pitak.name,
            code: pitak.code,
            location: pitak.location
          },
          totalAssignments: 0,
          totalLuWang: 0,
          averageLuWang: 0,
          uniqueWorkers: new Set(),
          assignmentsByDate: {},
          assignmentsByStatus: {
            active: 0,
            completed: 0,
            cancelled: 0
          },
          workerPerformance: {},
          utilizationMetrics: {
            assignmentDays: 0,
            workerDays: 0,
            utilizationRate: 0
          }
        };
      }
      
      // @ts-ignore
      const summary = pitakSummaries[pitakId];
      summary.totalAssignments++;
      summary.totalLuWang += luwang;
      summary.uniqueWorkers.add(assignment.workerId);
      summary.assignmentsByStatus[assignment.status]++;
      
      // Track worker performance for this pitak
      if (assignment.worker) {
        const workerId = assignment.worker.id;
        if (!summary.workerPerformance[workerId]) {
          summary.workerPerformance[workerId] = {
            workerId,
            workerName: assignment.worker.name,
            assignments: 0,
            totalLuWang: 0
          };
        }
        summary.workerPerformance[workerId].assignments++;
        summary.workerPerformance[workerId].totalLuWang += luwang;
      }
      
      // Group by date
      const dateStr = assignment.assignmentDate.toISOString().split('T')[0];
      if (!summary.assignmentsByDate[dateStr]) {
        summary.assignmentsByDate[dateStr] = {
          date: dateStr,
          assignments: 0,
          workers: new Set(),
          totalLuWang: 0
        };
      }
      summary.assignmentsByDate[dateStr].assignments++;
      summary.assignmentsByDate[dateStr].workers.add(assignment.workerId);
      summary.assignmentsByDate[dateStr].totalLuWang += luwang;
    });

    // Calculate metrics for each pitak
    Object.values(pitakSummaries).forEach(summary => {
      // Calculate averages
      if (summary.totalAssignments > 0) {
        summary.averageLuWang = (summary.totalLuWang / summary.totalAssignments).toFixed(2);
      }
      summary.totalLuWang = summary.totalLuWang.toFixed(2);
      summary.uniqueWorkers = summary.uniqueWorkers.size;
      
      // Calculate utilization metrics
      const assignmentDays = Object.keys(summary.assignmentsByDate).length;
      summary.utilizationMetrics.assignmentDays = assignmentDays;
      
      // Calculate total worker days
      let totalWorkerDays = 0;
      Object.values(summary.assignmentsByDate).forEach(day => {
        totalWorkerDays += day.workers.size;
      });
      summary.utilizationMetrics.workerDays = totalWorkerDays;
      
      // Calculate utilization rate
      if (assignmentDays > 0 && summary.uniqueWorkers > 0) {
        const maxPossibleWorkerDays = assignmentDays * summary.uniqueWorkers;
        summary.utilizationMetrics.utilizationRate = 
          ((totalWorkerDays / maxPossibleWorkerDays) * 100).toFixed(2);
      }
      
      // Convert assignmentsByDate to array
      summary.assignmentsByDate = Object.values(summary.assignmentsByDate)
        .map(day => ({
          ...day,
          workers: day.workers.size,
          averageLuWangPerWorker: (day.totalLuWang / day.workers.size).toFixed(2)
        }))
        // @ts-ignore
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Convert workerPerformance to array and get top performers
      summary.workerPerformance = Object.values(summary.workerPerformance)
        .map(worker => ({
          ...worker,
          totalLuWang: worker.totalLuWang.toFixed(2),
          averageLuWang: (worker.totalLuWang / worker.assignments).toFixed(2)
        }))
        .sort((a, b) => parseFloat(b.totalLuWang) - parseFloat(a.totalLuWang))
        .slice(0, 10); // Top 10 workers for this pitak
    });

    // Convert to array and sort by totalLuWang (highest first)
    const summaryArray = Object.values(pitakSummaries)
      .sort((a, b) => parseFloat(b.totalLuWang) - parseFloat(a.totalLuWang));

    // Calculate overall statistics
    const overallStats = {
      totalPitaks: summaryArray.length,
      totalAssignments: assignments.length,
      totalLuWang: assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0).toFixed(2),
      uniqueWorkers: new Set(assignments.map((/** @type {{ workerId: any; }} */ a) => a.workerId)).size,
      mostProductivePitak: summaryArray.length > 0 ? summaryArray[0].pitak.name : 'N/A',
      averageUtilizationRate: summaryArray.length > 0 
        ? (summaryArray.reduce((sum, p) => sum + parseFloat(p.utilizationMetrics.utilizationRate || 0), 0) / summaryArray.length).toFixed(2)
        : '0.00'
    };

    return {
      status: true,
      message: pitakId 
        ? "Pitak summary report generated successfully"
        : "All pitaks summary report generated successfully",
      data: {
        report: summaryArray,
        summary: overallStats
      },
      meta: {
        dateRange: startDate && endDate ? { startDate, endDate } : 'All time',
        pitakFilter: pitakId ? pitakId : 'All pitaks'
      }
    };

  } catch (error) {
    console.error("Error generating pitak summary report:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate pitak summary: ${error.message}`,
      data: null
    };
  }
};