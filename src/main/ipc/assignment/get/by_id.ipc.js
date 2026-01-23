// src/ipc/assignment/get/by_id.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get assignment by ID
 * @param {number} id - Assignment ID
 * @param {number} userId - User ID for logging
 * @returns {Promise<Object>} Response object
 */
module.exports = async (id, userId) => {
  try {
    if (!id) {
      return {
        status: false,
        message: "Assignment ID is required",
        data: null
      };
    }

    const assignmentRepo = AppDataSource.getRepository(Assignment);
    
    const assignment = await assignmentRepo.findOne({
      where: { id },
      relations: ["worker", "pitak"]
    });

    if (!assignment) {
      return {
        status: false,
        message: "Assignment not found",
        data: null
      };
    }

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      luwangCount: parseFloat(assignment.luwangCount),
      assignmentDate: assignment.assignmentDate,
      status: assignment.status,
      notes: assignment.notes,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      worker: assignment.worker ? {
        id: assignment.worker.id,
        name: assignment.worker.name,
        code: assignment.worker.code,
        contactNumber: assignment.worker.contactNumber
      } : null,
      pitak: assignment.pitak ? {
        id: assignment.pitak.id,
        name: assignment.pitak.name,
        code: assignment.pitak.code,
        location: assignment.pitak.location
      } : null
    };

    return {
      status: true,
      message: "Assignment retrieved successfully",
      data: formattedAssignment
    };

  } catch (error) {
    console.error("Error getting assignment by ID:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve assignment: ${error.message}`,
      data: null
    };
  }
};