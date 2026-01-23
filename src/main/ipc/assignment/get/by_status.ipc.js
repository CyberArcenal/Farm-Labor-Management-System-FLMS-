// src/ipc/assignment/get/by_status.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get assignments by status
 * @param {string} status - Assignment status (active/completed/cancelled)
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (status, filters = {}, userId) => {
  try {
    // Validate status
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: "Invalid status. Must be one of: active, completed, cancelled",
        data: null
      };
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .where("assignment.status = :status", { status })
      .orderBy("assignment.assignmentDate", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.dateFrom && filters.dateTo) {
      queryBuilder.andWhere("assignment.assignmentDate BETWEEN :dateFrom AND :dateTo", {
        // @ts-ignore
        dateFrom: filters.dateFrom,
        // @ts-ignore
        dateTo: filters.dateTo
      });
    }

    // @ts-ignore
    if (filters.workerId) {
      // @ts-ignore
      queryBuilder.andWhere("assignment.workerId = :workerId", { workerId: filters.workerId });
    }

    const assignments = await queryBuilder.getMany();
    
    // Calculate summary
    const totalLuWang = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ assignment) => 
      sum + parseFloat(assignment.luwangCount || 0), 0);

    return {
      status: true,
      message: `Assignments with status '${status}' retrieved successfully`,
      data: assignments.map((/** @type {{ id: any; luwangCount: string; assignmentDate: any; status: any; notes: any; worker: { id: any; name: any; }; pitak: { id: any; name: any; }; }} */ assignment) => ({
        id: assignment.id,
        luwangCount: parseFloat(assignment.luwangCount),
        assignmentDate: assignment.assignmentDate,
        status: assignment.status,
        notes: assignment.notes,
        worker: assignment.worker ? {
          id: assignment.worker.id,
          name: assignment.worker.name
        } : null,
        pitak: assignment.pitak ? {
          id: assignment.pitak.id,
          name: assignment.pitak.name
        } : null
      })),
      meta: {
        total: assignments.length,
        totalLuWang: totalLuWang.toFixed(2),
        // @ts-ignore
        dateRange: filters.dateFrom && filters.dateTo ? {
          // @ts-ignore
          from: filters.dateFrom,
          // @ts-ignore
          to: filters.dateTo
        } : null
      }
    };

  } catch (error) {
    console.error(`Error getting assignments by status (${status}):`, error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve assignments: ${error.message}`,
      data: null
    };
  }
};