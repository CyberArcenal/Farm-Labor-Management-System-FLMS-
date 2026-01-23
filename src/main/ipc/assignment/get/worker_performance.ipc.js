// src/ipc/assignment/get/worker_performance.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");
const Worker = require("../../../../entities/Worker");

/**
 * Generate worker performance report
 * @param {number} workerId - Worker ID (optional, if not provided, all workers)
 * @param {Object} dateRange - Date range for report
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (workerId, dateRange, userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange || {};
    
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    const workerRepo = AppDataSource.getRepository(Worker);
    
    // Build base query
    let queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak");

    // Apply date filter if provided
    if (startDate && endDate) {
      queryBuilder.where("assignment.assignmentDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate
      });
    }

    // Apply worker filter if provided
    if (workerId) {
      queryBuilder.andWhere("assignment.workerId = :workerId", { workerId });
      
      // Get worker details
      const worker = await workerRepo.findOne({ where: { id: workerId } });
      if (!worker) {
        return {
          status: false,
          message: "Worker not found",
          data: null
        };
      }
    }

    const assignments = await queryBuilder.getMany();
    
    // Group assignments by worker
    const workerPerformance = {};
    
    assignments.forEach((/** @type {{ worker: any; luwangCount: string; pitakId: any; status: string; assignmentDate: { toISOString: () => string; }; }} */ assignment) => {
      const worker = assignment.worker;
      if (!worker) return;
      
      const workerId = worker.id;
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // @ts-ignore
      if (!workerPerformance[workerId]) {
        // @ts-ignore
        workerPerformance[workerId] = {
          worker: {
            id: worker.id,
            name: worker.name,
            code: worker.code,
            contactNumber: worker.contactNumber
          },
          totalAssignments: 0,
          activeAssignments: 0,
          completedAssignments: 0,
          cancelledAssignments: 0,
          totalLuWang: 0,
          averageLuWang: 0,
          assignmentsByDate: {},
          pitaksWorked: new Set(),
          performanceMetrics: {
            completionRate: 0,
            averageLuWangPerDay: 0,
            consistencyScore: 0
          }
        };
      }
      
      // @ts-ignore
      const performance = workerPerformance[workerId];
      performance.totalAssignments++;
      performance.totalLuWang += luwang;
      performance.pitaksWorked.add(assignment.pitakId);
      
      // Count by status
      if (assignment.status === 'active') performance.activeAssignments++;
      if (assignment.status === 'completed') performance.completedAssignments++;
      if (assignment.status === 'cancelled') performance.cancelledAssignments++;
      
      // Group by date
      const dateStr = assignment.assignmentDate.toISOString().split('T')[0];
      if (!performance.assignmentsByDate[dateStr]) {
        performance.assignmentsByDate[dateStr] = {
          date: dateStr,
          assignments: 0,
          totalLuWang: 0
        };
      }
      performance.assignmentsByDate[dateStr].assignments++;
      performance.assignmentsByDate[dateStr].totalLuWang += luwang;
    });

    // Calculate performance metrics for each worker
    Object.values(workerPerformance).forEach(performance => {
      // Calculate averages
      if (performance.totalAssignments > 0) {
        performance.averageLuWang = (performance.totalLuWang / performance.totalAssignments).toFixed(2);
      }
      performance.totalLuWang = performance.totalLuWang.toFixed(2);
      performance.pitaksWorked = performance.pitaksWorked.size;
      
      // Calculate completion rate (excluding active assignments)
      // @ts-ignore
      const totalClosedAssignments = performance.completedAssignments + performance.cancelledAssignments;
      if (performance.totalAssignments > 0) {
        performance.performanceMetrics.completionRate = 
          ((performance.completedAssignments / performance.totalAssignments) * 100).toFixed(2);
      }
      
      // Calculate average LuWang per working day
      const workingDays = Object.keys(performance.assignmentsByDate).length;
      if (workingDays > 0) {
        performance.performanceMetrics.averageLuWangPerDay = 
          (parseFloat(performance.totalLuWang) / workingDays).toFixed(2);
      }
      
      // Calculate consistency score (standard deviation of daily LuWang)
      const dailyAverages = Object.values(performance.assignmentsByDate)
        .map(day => day.totalLuWang / day.assignments);
      
      if (dailyAverages.length > 1) {
        const mean = dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length;
        const variance = dailyAverages.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / dailyAverages.length;
        performance.performanceMetrics.consistencyScore = (Math.sqrt(variance) / mean * 100).toFixed(2);
      }
      
      // Convert assignmentsByDate to array
      performance.assignmentsByDate = Object.values(performance.assignmentsByDate)
        // @ts-ignore
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // Convert to array and sort by totalLuWang (highest first)
    const performanceArray = Object.values(workerPerformance)
      .sort((a, b) => parseFloat(b.totalLuWang) - parseFloat(a.totalLuWang));

    // Calculate overall statistics
    // @ts-ignore
    const overallStats = {
      totalWorkers: performanceArray.length,
      totalAssignments: assignments.length,
      totalLuWang: assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0).toFixed(2),
      averageLuWangPerWorker: performanceArray.length > 0 
        // @ts-ignore
        ? (parseFloat(overallStats.totalLuWang) / performanceArray.length).toFixed(2)
        : '0.00',
      topPerformers: performanceArray.slice(0, 5).map(w => ({
        name: w.worker.name,
        totalLuWang: w.totalLuWang,
        completionRate: w.performanceMetrics.completionRate
      }))
    };

    return {
      status: true,
      message: workerId 
        ? "Worker performance report generated successfully"
        : "All workers performance report generated successfully",
      data: {
        report: performanceArray,
        summary: overallStats
      },
      meta: {
        dateRange: startDate && endDate ? { startDate, endDate } : 'All time',
        workerFilter: workerId ? workerId : 'All workers'
      }
    };

  } catch (error) {
    console.error("Error generating worker performance report:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate performance report: ${error.message}`,
      data: null
    };
  }
};