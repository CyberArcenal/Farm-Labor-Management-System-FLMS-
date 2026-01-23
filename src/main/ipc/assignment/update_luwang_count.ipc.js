// src/ipc/assignment/update_luwang_count.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");

/**
 * Update luwang count for an assignment
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
      luwangCount, 
      // @ts-ignore
      notes,
      // @ts-ignore
      _userId 
    } = params;

    // Validate required fields
    if (!assignmentId || luwangCount === undefined) {
      return {
        status: false,
        message: "Missing required fields: assignmentId and luwangCount are required",
        data: null
      };
    }

    // Validate luwang count is a number and non-negative
    const count = parseFloat(luwangCount);
    if (isNaN(count) || count < 0) {
      return {
        status: false,
        message: "LuWang count must be a non-negative number",
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

    // Check if assignment is active (only allow updates for active assignments)
    if (assignment.status !== 'active') {
      return {
        status: false,
        message: `Cannot update LuWang count for ${assignment.status} assignment`,
        data: null
      };
    }

    // @ts-ignore
    const previousCount = parseFloat(assignment.luwangCount);
    
    // Update assignment
    assignment.luwangCount = count.toFixed(2); // Store with 2 decimal places
    assignment.updatedAt = new Date();
    
    // Append note if provided
    if (notes) {
      assignment.notes = assignment.notes 
        ? `${assignment.notes}\n[LuWang Update ${previousCount.toFixed(2)} → ${count.toFixed(2)}]: ${notes}`
        : `[LuWang Update ${previousCount.toFixed(2)} → ${count.toFixed(2)}]: ${notes}`;
    }

    const updatedAssignment = await assignmentRepo.save(assignment);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: "LuWang count updated successfully",
      data: {
        id: updatedAssignment.id,
        previousLuWang: previousCount.toFixed(2),
        // @ts-ignore
        newLuWang: parseFloat(updatedAssignment.luwangCount).toFixed(2),
        difference: (count - previousCount).toFixed(2),
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
    console.error("Error updating luwang count:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update LuWang count: ${error.message}`,
      data: null
    };
  }
};