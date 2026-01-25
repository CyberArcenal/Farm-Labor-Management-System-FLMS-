// src/ipc/assignment/delete/delete.ipc.js\
//@ts-check
const Assignment = require("../../../../entities/Assignment");

/**
 * Delete an assignment
 * @param {Object} params - Delete parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    // @ts-ignore
    const { assignmentId, reason, _userId } = params;

    if (!assignmentId) {
      return {
        status: false,
        message: "Assignment ID is required",
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

    // Check if assignment can be deleted (business rules)
    if (assignment.status === 'completed') {
      return {
        status: false,
        message: "Cannot delete a completed assignment",
        data: null
      };
    }

    // Store assignment data for response before deletion
    const deletedAssignment = {
      id: assignment.id,
      // @ts-ignore
      workerId: assignment.workerId,
      // @ts-ignore
      pitakId: assignment.pitakId,
      // @ts-ignore
      luwangCount: parseFloat(assignment.luwangCount),
      assignmentDate: assignment.assignmentDate,
      status: assignment.status,
      notes: assignment.notes,
      // @ts-ignore
      worker: assignment.worker ? {
        // @ts-ignore
        id: assignment.worker.id,
        // @ts-ignore
        name: assignment.worker.name
      } : null,
      // @ts-ignore
      pitak: assignment.pitak ? {
        // @ts-ignore
        id: assignment.pitak.id,
        // @ts-ignore
        name: assignment.pitak.name
      } : null
    };

    // Add deletion reason to notes before deletion (for audit trail)
    if (reason) {
      assignment.notes = assignment.notes 
        ? `${assignment.notes}\n[DELETED on ${new Date().toISOString()}]: ${reason}`
        : `[DELETED on ${new Date().toISOString()}]: ${reason}`;
      
      // Save the updated notes before deletion
      await assignmentRepo.save(assignment);
    }

    // Soft delete (update status to cancelled) or hard delete?
    // For this implementation, we'll do a hard delete
    await assignmentRepo.remove(assignment);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: "Assignment deleted successfully",
      data: {
        deletedAssignment,
        deletionDetails: {
          timestamp: new Date(),
          reason: reason || "No reason provided",
          deletedByUserId: _userId
        }
      }
    };

  } catch (error) {
    console.error("Error deleting assignment:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to delete assignment: ${error.message}`,
      data: null
    };
  }
};