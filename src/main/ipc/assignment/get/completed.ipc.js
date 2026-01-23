// src/ipc/assignment/get/completed.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get completed assignments
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (filters = {}, userId) => {
  try {
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .where("assignment.status = :status", { status: 'completed' })
      .orderBy("assignment.assignmentDate", "DESC");

    // Apply date filters
    // @ts-ignore
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere("assignment.assignmentDate BETWEEN :dateFrom AND :dateTo", {
        // @ts-ignore
        dateFrom: filters.dateFrom,
        // @ts-ignore
        dateTo: filters.dateTo
      });
    }

    // Apply worker filter
    // @ts-ignore
    if (filters.workerId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.workerId = :workerId", { workerId: filters.workerId });
    }

    // Apply pitak filter
    // @ts-ignore
    if (filters.pitakId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.pitakId = :pitakId", { pitakId: filters.pitakId });
    }

    const assignments = await queryBuilder.getMany();
    
    // Calculate statistics
    const stats = {
      totalAssignments: assignments.length,
      totalLuWang: 0,
      averageLuWang: 0,
      byMonth: {},
      topWorkers: {},
      topPitaks: {}
    };

    // @ts-ignore
    const formattedAssignments = assignments.map(assignment => {
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // Update stats
      stats.totalLuWang += luwang;
      
      // Group by month
      const month = assignment.assignmentDate.toISOString().substring(0, 7); // YYYY-MM
      // @ts-ignore
      if (!stats.byMonth[month]) {
        // @ts-ignore
        stats.byMonth[month] = { count: 0, totalLuWang: 0 };
      }
      // @ts-ignore
      stats.byMonth[month].count++;
      // @ts-ignore
      stats.byMonth[month].totalLuWang += luwang;
      
      // Track top workers
      if (assignment.worker) {
        const workerId = assignment.worker.id;
        // @ts-ignore
        if (!stats.topWorkers[workerId]) {
          // @ts-ignore
          stats.topWorkers[workerId] = {
            id: workerId,
            name: assignment.worker.name,
            assignments: 0,
            totalLuWang: 0
          };
        }
        // @ts-ignore
        stats.topWorkers[workerId].assignments++;
        // @ts-ignore
        stats.topWorkers[workerId].totalLuWang += luwang;
      }
      
      // Track top pitaks
      if (assignment.pitak) {
        const pitakId = assignment.pitak.id;
        // @ts-ignore
        if (!stats.topPitaks[pitakId]) {
          // @ts-ignore
          stats.topPitaks[pitakId] = {
            id: pitakId,
            name: assignment.pitak.name,
            assignments: 0,
            totalLuWang: 0
          };
        }
        // @ts-ignore
        stats.topPitaks[pitakId].assignments++;
        // @ts-ignore
        stats.topPitaks[pitakId].totalLuWang += luwang;
      }

      return {
        id: assignment.id,
        luwangCount: luwang.toFixed(2),
        assignmentDate: assignment.assignmentDate,
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
        notes: assignment.notes,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      };
    });

    // Calculate averages
    if (stats.totalAssignments > 0) {
      // @ts-ignore
      stats.averageLuWang = (stats.totalLuWang / stats.totalAssignments).toFixed(2);
    }
    // @ts-ignore
    stats.totalLuWang = stats.totalLuWang.toFixed(2);
    
    // Convert byMonth to array
    stats.byMonth = Object.entries(stats.byMonth)
      .map(([month, data]) => ({
        month,
        ...data,
        averageLuWang: (data.totalLuWang / data.count).toFixed(2)
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
    
    // Get top 5 workers by totalLuWang
    stats.topWorkers = Object.values(stats.topWorkers)
      .sort((a, b) => b.totalLuWang - a.totalLuWang)
      .slice(0, 5)
      .map(worker => ({
        ...worker,
        totalLuWang: worker.totalLuWang.toFixed(2),
        averageLuWang: (worker.totalLuWang / worker.assignments).toFixed(2)
      }));
    
    // Get top 5 pitaks by totalLuWang
    stats.topPitaks = Object.values(stats.topPitaks)
      .sort((a, b) => b.totalLuWang - a.totalLuWang)
      .slice(0, 5)
      .map(pitak => ({
        ...pitak,
        totalLuWang: pitak.totalLuWang.toFixed(2),
        averageLuWang: (pitak.totalLuWang / pitak.assignments).toFixed(2)
      }));

    return {
      status: true,
      message: "Completed assignments retrieved successfully",
      data: formattedAssignments,
      meta: {
        summary: stats,
        // @ts-ignore
        dateRange: filters.dateFrom && filters.dateTo ? {
          // @ts-ignore
          from: filters.dateFrom,
          // @ts-ignore
          to: filters.dateTo
        } : 'All time'
      }
    };

  } catch (error) {
    console.error("Error getting completed assignments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve completed assignments: ${error.message}`,
      data: null
    };
  }
};