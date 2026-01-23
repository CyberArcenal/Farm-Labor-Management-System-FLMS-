// src/ipc/assignment/check_worker_availability.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Check worker availability for a specific date
 * @param {Object} params - Check parameters
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params) => {
  try {
    // @ts-ignore
    const { workerId, date, excludeAssignmentId } = params;

    if (!workerId || !date) {
      return {
        status: false,
        message: "workerId and date are required",
        data: null
      };
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    const queryBuilder = assignmentRepo
      .createQueryBuilder("assignment")
      .where("assignment.workerId = :workerId", { workerId })
      .andWhere("assignment.assignmentDate = :date", { 
        date: new Date(date).toISOString().split('T')[0] 
      })
      .andWhere("assignment.status = :status", { status: 'active' });

    // Exclude current assignment when updating
    if (excludeAssignmentId) {
      queryBuilder.andWhere("assignment.id != :excludeId", { 
        excludeId: excludeAssignmentId 
      });
    }

    const existingAssignment = await queryBuilder.getOne();

    return {
      status: true,
      message: "Availability check completed",
      data: {
        isAvailable: !existingAssignment,
        existingAssignment: existingAssignment ? {
          id: existingAssignment.id,
          pitakId: existingAssignment.pitakId,
          status: existingAssignment.status,
          luwangCount: parseFloat(existingAssignment.luwangCount)
        } : null,
        checkDate: date,
        workerId
      }
    };

  } catch (error) {
    console.error("Error checking worker availability:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Availability check failed: ${error.message}`,
      data: null
    };
  }
};