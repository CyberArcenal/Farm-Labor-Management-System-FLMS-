// src/ipc/assignment/bulk_create.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");
const Pitak = require("../../../entities/Pitak");

/**
 * Bulk create assignments
 * @param {Object} params - Bulk creation parameters
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    // @ts-ignore
    const { assignments, _userId } = params;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return {
        status: false,
        message: "Assignments array is required and must not be empty",
        data: null
      };
    }

    // Validate each assignment
    const validationErrors = [];
    const validAssignments = [];
    const workerRepo = queryRunner.manager.getRepository(Worker);
    const pitakRepo = queryRunner.manager.getRepository(Pitak);

    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      const errors = [];

      // Required fields
      if (!assignment.workerId) errors.push("workerId is required");
      if (!assignment.pitakId) errors.push("pitakId is required");
      if (!assignment.assignmentDate) errors.push("assignmentDate is required");

      // Validate worker exists
      if (assignment.workerId) {
        const worker = await workerRepo.findOne({ 
          // @ts-ignore
          where: { id: assignment.workerId } 
        });
        if (!worker) errors.push(`Worker with ID ${assignment.workerId} not found`);
      }

      // Validate pitak exists
      if (assignment.pitakId) {
        const pitak = await pitakRepo.findOne({ 
          where: { id: assignment.pitakId } 
        });
        if (!pitak) errors.push(`Pitak with ID ${assignment.pitakId} not found`);
      }

      if (errors.length > 0) {
        validationErrors.push({
          index: i,
          assignment,
          errors
        });
      } else {
        validAssignments.push(assignment);
      }
    }

    if (validationErrors.length > 0 && validAssignments.length === 0) {
      return {
        status: false,
        message: "All assignments failed validation",
        data: { validationErrors },
        meta: { totalFailed: validationErrors.length }
      };
    }

    // Process valid assignments
    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    const createdAssignments = [];
    const skippedAssignments = [];

    for (const assignmentData of validAssignments) {
      try {
        // Check for existing assignment for same worker on same date
        const existing = await assignmentRepo.findOne({
          where: {
            // @ts-ignore
            workerId: assignmentData.workerId,
            assignmentDate: new Date(assignmentData.assignmentDate),
            status: 'active'
          }
        });

        if (existing) {
          skippedAssignments.push({
            assignment: assignmentData,
            reason: "Worker already has active assignment for this date",
            existingAssignmentId: existing.id
          });
          continue;
        }

        // Create assignment
        const newAssignment = assignmentRepo.create({
          // @ts-ignore
          workerId: assignmentData.workerId,
          pitakId: assignmentData.pitakId,
          luwangCount: assignmentData.luwangCount || 0.00,
          assignmentDate: new Date(assignmentData.assignmentDate),
          status: assignmentData.status || 'active',
          notes: assignmentData.notes || null
        });

        const savedAssignment = await assignmentRepo.save(newAssignment);
        createdAssignments.push(savedAssignment);

      } catch (error) {
        skippedAssignments.push({
          assignment: assignmentData,
          // @ts-ignore
          reason: `Error: ${error.message}`
        });
      }
    }

    // Calculate totals
    const totalLuWang = createdAssignments.reduce((sum, assignment) => 
      // @ts-ignore
      sum + parseFloat(assignment.luwangCount || 0), 0);

    return {
      status: true,
      message: "Bulk assignment creation completed",
      data: {
        created: createdAssignments.map(a => ({
          // @ts-ignore
          id: a.id,
          // @ts-ignore
          workerId: a.workerId,
          // @ts-ignore
          pitakId: a.pitakId,
          // @ts-ignore
          luwangCount: parseFloat(a.luwangCount),
          // @ts-ignore
          assignmentDate: a.assignmentDate,
          // @ts-ignore
          status: a.status
        })),
        skipped: skippedAssignments,
        failed: validationErrors
      },
      meta: {
        totalProcessed: assignments.length,
        totalCreated: createdAssignments.length,
        totalSkipped: skippedAssignments.length,
        totalFailed: validationErrors.length,
        totalLuWangCreated: totalLuWang.toFixed(2)
      }
    };

  } catch (error) {
    console.error("Error in bulk assignment creation:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk creation failed: ${error.message}`,
      data: null
    };
  }
};