// src/ipc/assignment/reassign_worker.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");

/**
 * Reassign worker to another assignment
 * @param {Object} params - Reassignment parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
      // @ts-ignore
      assignmentId, 
      // @ts-ignore
      newWorkerId, 
      // @ts-ignore
      reason,
      // @ts-ignore
      _userId 
    } = params;

    if (!assignmentId || !newWorkerId) {
      return {
        status: false,
        message: "Assignment ID and new worker ID are required",
        data: null
      };
    }

    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    const workerRepo = queryRunner.manager.getRepository(Worker);
    
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

    // Find new worker
    // @ts-ignore
    const newWorker = await workerRepo.findOne({ where: { id: newWorkerId } });
    
    if (!newWorker) {
      return {
        status: false,
        message: "New worker not found",
        data: null
      };
    }

    // Check if assignment can be reassigned
    if (assignment.status !== 'active') {
      return {
        status: false,
        message: `Cannot reassign ${assignment.status} assignment`,
        data: null
      };
    }

    // Check if new worker is available for this date
    const existingAssignment = await assignmentRepo.findOne({
      where: {
        // @ts-ignore
        workerId: newWorkerId,
        assignmentDate: assignment.assignmentDate,
        status: 'active'
      }
    });

    if (existingAssignment) {
      return {
        status: false,
        message: "New worker already has an active assignment for this date",
        data: null
      };
    }

    // @ts-ignore
    const oldWorker = assignment.worker;
    
    // Update assignment
    // @ts-ignore
    assignment.workerId = newWorkerId;
    assignment.updatedAt = new Date();
    
    // Add reassignment note
    // @ts-ignore
    const reassignmentNote = `[Reassignment]: Worker changed from ${oldWorker?.name || 'Unknown'} (ID: ${oldWorker?.id}) to ${newWorker.name} (ID: ${newWorkerId})${reason ? ` - Reason: ${reason}` : ''}`;
    
    assignment.notes = assignment.notes 
      ? `${assignment.notes}\n${reassignmentNote}`
      : reassignmentNote;

    const updatedAssignment = await assignmentRepo.save(assignment);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: "Worker reassigned successfully",
      data: {
        id: updatedAssignment.id,
        oldWorker: oldWorker ? {
          id: oldWorker.id,
          name: oldWorker.name
        } : null,
        newWorker: {
          // @ts-ignore
          id: newWorker.id,
          // @ts-ignore
          name: newWorker.name,
          // @ts-ignore
          code: newWorker.code
        },
        assignmentDate: updatedAssignment.assignmentDate,
        // @ts-ignore
        pitak: updatedAssignment.pitak ? {
          // @ts-ignore
          id: updatedAssignment.pitak.id,
          // @ts-ignore
          name: updatedAssignment.pitak.name
        } : null,
        reassignmentNote
      }
    };

  } catch (error) {
    console.error("Error reassigning worker:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to reassign worker: ${error.message}`,
      data: null
    };
  }
};