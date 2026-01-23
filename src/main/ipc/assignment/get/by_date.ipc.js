// src/ipc/assignment/get/by_date.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get assignments by date
 * @param {string|Date} date - Date to filter assignments
 * @param {Object} filters - Additional filters
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
// @ts-ignore
module.exports = async (date, filters = {}, userId) => {
  try {
    if (!date) {
      return {
        status: false,
        message: "Date parameter is required",
        data: null
      };
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    // Parse date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.worker", "worker")
      .leftJoinAndSelect("assignment.pitak", "pitak")
      .where("assignment.assignmentDate >= :startDate", { startDate: targetDate })
      .andWhere("assignment.assignmentDate < :endDate", { endDate: nextDay })
      .orderBy("assignment.workerId", "ASC");

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

    const assignments = await queryBuilder.getMany();
    
    // Calculate summary for the day
    const summary = {
      totalAssignments: assignments.length,
      totalLuWang: 0,
      activeAssignments: 0,
      completedAssignments: 0,
      cancelledAssignments: 0,
      uniqueWorkers: new Set(),
      uniquePitaks: new Set()
    };

    const formattedAssignments = assignments.map((/** @type {{ luwangCount: string; workerId: any; pitakId: any; status: string; id: any; assignmentDate: any; notes: any; worker: { id: any; name: any; code: any; }; pitak: { id: any; name: any; code: any; }; }} */ assignment) => {
      const luwang = parseFloat(assignment.luwangCount) || 0;
      
      // Update summary
      summary.totalLuWang += luwang;
      summary.uniqueWorkers.add(assignment.workerId);
      summary.uniquePitaks.add(assignment.pitakId);
      
      if (assignment.status === 'active') summary.activeAssignments++;
      if (assignment.status === 'completed') summary.completedAssignments++;
      if (assignment.status === 'cancelled') summary.cancelledAssignments++;

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
        } : null,
        pitak: assignment.pitak ? {
          id: assignment.pitak.id,
          name: assignment.pitak.name,
          code: assignment.pitak.code
        } : null
      };
    });

    // @ts-ignore
    summary.totalLuWang = summary.totalLuWang.toFixed(2);
    // @ts-ignore
    summary.uniqueWorkers = summary.uniqueWorkers.size;
    // @ts-ignore
    summary.uniquePitaks = summary.uniquePitaks.size;

    return {
      status: true,
      message: `Assignments for ${targetDate.toLocaleDateString()} retrieved successfully`,
      data: formattedAssignments,
      meta: {
        date: targetDate.toISOString().split('T')[0],
        summary
      }
    };

  } catch (error) {
    console.error("Error getting assignments by date:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve assignments: ${error.message}`,
      data: null
    };
  }
};