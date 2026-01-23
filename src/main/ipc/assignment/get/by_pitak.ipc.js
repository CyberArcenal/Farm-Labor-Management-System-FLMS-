// src/ipc/assignment/get/by_pitak.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");
const Pitak = require("../../../../entities/Pitak");

/**
 * Get assignments by pitak
 * @param {number} pitakId - Pitak ID
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (pitakId, filters = {}, userId) => {
  try {
    if (!pitakId) {
      return {
        status: false,
        message: "Pitak ID is required",
        data: null
      };
    }

    // Validate pitak exists
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const pitak = await pitakRepo.findOne({ where: { id: pitakId } });
    
    if (!pitak) {
      return {
        status: false,
        message: "Pitak not found",
        data: null
      };
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .where("assignment.pitakId = :pitakId", { pitakId })
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

    // Apply status filter
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.status = :status", { status: filters.status });
    }

    const assignments = await queryBuilder.getMany();
    
    // Calculate pitak statistics
    const stats = {
      totalAssignments: assignments.length,
      totalLuWang: 0,
      averageLuWang: 0,
      uniqueWorkers: new Set(),
      byStatus: {
        active: 0,
        completed: 0,
        cancelled: 0
      },
      workerPerformance: {}
    };

    // @ts-ignore
    const formattedAssignments = assignments.map(assignment => {
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // Update stats
      stats.totalLuWang += luwang;
      stats.uniqueWorkers.add(assignment.workerId);
      // @ts-ignore
      stats.byStatus[assignment.status]++;
      
      // Track worker performance
      // @ts-ignore
      if (!stats.workerPerformance[assignment.workerId]) {
        // @ts-ignore
        stats.workerPerformance[assignment.workerId] = {
          workerId: assignment.workerId,
          workerName: assignment.worker?.name || 'Unknown',
          assignments: 0,
          totalLuWang: 0
        };
      }
      // @ts-ignore
      stats.workerPerformance[assignment.workerId].assignments++;
      // @ts-ignore
      stats.workerPerformance[assignment.workerId].totalLuWang += luwang;

      return {
        id: assignment.id,
        luwangCount: luwang.toFixed(2),
        assignmentDate: assignment.assignmentDate,
        status: assignment.status,
        notes: assignment.notes,
        worker: assignment.worker ? {
          id: assignment.worker.id,
          name: assignment.worker.name,
          code: assignment.worker.code
        } : null
      };
    });

    // Calculate averages
    if (stats.totalAssignments > 0) {
      // @ts-ignore
      stats.averageLuWang = (stats.totalLuWang / stats.totalAssignments).toFixed(2);
    }
    // @ts-ignore
    stats.totalLuWang = stats.totalLuWang.toFixed(2);
    // @ts-ignore
    stats.uniqueWorkers = stats.uniqueWorkers.size;
    
    // Convert workerPerformance to array and sort by totalLuWang
    stats.workerPerformance = Object.values(stats.workerPerformance)
      .map(worker => ({
        ...worker,
        totalLuWang: worker.totalLuWang.toFixed(2),
        averageLuWang: (worker.totalLuWang / worker.assignments).toFixed(2)
      }))
      .sort((a, b) => b.totalLuWang - a.totalLuWang);

    return {
      status: true,
      message: `Assignments for pitak '${pitak.name}' retrieved successfully`,
      data: {
        pitak: {
          id: pitak.id,
          name: pitak.name,
          code: pitak.code,
          location: pitak.location
        },
        assignments: formattedAssignments,
        statistics: stats
      }
    };

  } catch (error) {
    console.error("Error getting assignments by pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve assignments: ${error.message}`,
      data: null
    };
  }
};