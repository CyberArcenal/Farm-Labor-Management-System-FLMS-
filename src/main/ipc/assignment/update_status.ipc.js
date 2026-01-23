// src/ipc/assignment/update_status.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");

/**
 * Update assignment status
 * @param {Object} params - Update parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      assignmentId, 
      // @ts-ignore
      status, 
      // @ts-ignore
      notes,
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!assignmentId || !status) {
      return {
        status: false,
        message: "Missing required fields: assignmentId and status are required",
        data: null
      };
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: "Invalid status. Must be one of: active, completed, cancelled",
        data: null
      };
    }

    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    
    // Find assignment
    const assignment = await assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ["worker", "pitak"]
    });

    if (!assignment) {
      return {
        status: false,
        message: "Assignment not found",
        data: null
      };
    }

    // Check if status is already set
    if (assignment.status === status) {
      return {
        status: false,
        message: `Assignment is already ${status}`,
        data: assignment
      };
    }

    // Business rules for status changes
    if (status === 'cancelled' && assignment.status === 'completed') {
      return {
        status: false,
        message: "Cannot cancel a completed assignment",
        data: null
      };
    }

    // Update assignment
    assignment.status = status;
    assignment.updatedAt = new Date();
    
    // Append note if provided
    if (notes) {
      assignment.notes = assignment.notes 
        ? `${assignment.notes}\n[Status Change to ${status.toUpperCase()}]: ${notes}`
        : `[Status Change to ${status.toUpperCase()}]: ${notes}`;
    }

    const updatedAssignment = await assignmentRepo.save(assignment);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: `Assignment status updated to ${status}`,
      data: {
        id: updatedAssignment.id,
        previousStatus: assignment.status,
        newStatus: updatedAssignment.status,
        assignmentDate: updatedAssignment.assignmentDate,
        // @ts-ignore
        worker: updatedAssignment.worker ? {
          // @ts-ignore
          id: updatedAssignment.worker.id,
          // @ts-ignore
          name: updatedAssignment.worker.name
        } : null,
        // @ts-ignore
        pitak: updatedAssignment.pitak ? {
          // @ts-ignore
          id: updatedAssignment.pitak.id,
          // @ts-ignore
          name: updatedAssignment.pitak.name
        } : null
      }
    };

  } catch (error) {
    console.error("Error updating assignment status:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update assignment status: ${error.message}`,
      data: null
    };
  }
};