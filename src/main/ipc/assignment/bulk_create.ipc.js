// src/ipc/assignment/bulk_create.ipc.js
//@ts-check

const Assignment = require("../../../entities/Assignment");
const Worker = require("../../../entities/Worker");
const Pitak = require("../../../entities/Pitak");
const {
  validateWorkers,
  validatePitak,
  findAlreadyAssigned,
} = require("./utils/assignmentUtils");
const { farmSessionDefaultSessionId } = require("../../../utils/system");

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
        data: null,
      };
    }

    // ✅ Always require default session
    const sessionId = await farmSessionDefaultSessionId();
    if (!sessionId || sessionId === 0) {
      return {
        status: false,
        message: "No default session configured. Please set one in Settings.",
        data: null,
      };
    }

    const validationErrors = [];
    const validAssignments = [];
    const workerRepo = queryRunner.manager.getRepository(Worker);
    const pitakRepo = queryRunner.manager.getRepository(Pitak);

    // Validate each assignment
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      const errors = [];

      if (!assignment.workerId) errors.push("workerId is required");
      if (!assignment.pitakId) errors.push("pitakId is required");
      if (!assignment.assignmentDate) errors.push("assignmentDate is required");

      // Validate worker
      if (assignment.workerId) {
        const workerCheck = await validateWorkers(workerRepo, [
          assignment.workerId,
        ]);
        if (!workerCheck.valid) errors.push(workerCheck.message);
      }

      // Validate pitak
      if (assignment.pitakId) {
        const pitakCheck = await validatePitak(pitakRepo, assignment.pitakId);
        if (!pitakCheck.valid) errors.push(pitakCheck.message);
      }

      if (errors.length > 0) {
        validationErrors.push({ index: i, assignment, errors });
      } else {
        validAssignments.push(assignment);
      }
    }

    if (validationErrors.length > 0 && validAssignments.length === 0) {
      return {
        status: false,
        message: "All assignments failed validation",
        data: { validationErrors },
        meta: { totalFailed: validationErrors.length },
      };
    }

    // Process valid assignments
    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    const createdAssignments = [];
    const skippedAssignments = [];

    for (const assignmentData of validAssignments) {
      try {
        // 🔑 Skip if worker already assigned to pitak
        const skippedWorkers = await findAlreadyAssigned(
          assignmentRepo,
          [assignmentData.workerId],
          assignmentData.pitakId,
        );

        if (skippedWorkers.length > 0) {
          skippedAssignments.push({
            assignment: assignmentData,
            reason: "Worker already assigned to this pitak",
            existingAssignmentId: skippedWorkers[0],
          });
          continue;
        }

        // ✅ Create assignment with sessionId
        const newAssignment = assignmentRepo.create({
          // @ts-ignore
          worker: { id: assignmentData.workerId },
          pitak: { id: assignmentData.pitakId },
          session: { id: sessionId }, // 🔑 tie to default session
          luwangCount: assignmentData.luwangCount || 0.0,
          assignmentDate: new Date(assignmentData.assignmentDate),
          status: assignmentData.status || "active",
          notes: assignmentData.notes || null,
        });

        const savedAssignment = await assignmentRepo.save(newAssignment);
        createdAssignments.push(savedAssignment);
      } catch (error) {
        skippedAssignments.push({
          assignment: assignmentData,
          // @ts-ignore
          reason: `Error: ${error.message}`,
        });
      }
    }

    // Calculate totals
    const totalLuWang = createdAssignments.reduce(
      // @ts-ignore
      (sum, assignment) => sum + parseFloat(assignment.luwangCount || 0),
      0,
    );

    return {
      status: true,
      message: "Bulk assignment creation completed",
      data: {
        created: createdAssignments.map((a) => ({
          // @ts-ignore
          id: a.id,
          // @ts-ignore
          workerId: a.worker?.id ?? a.workerId,
          // @ts-ignore
          pitakId: a.pitak?.id ?? a.pitakId,
          // @ts-ignore
          sessionId: a.session?.id ?? sessionId,
          // @ts-ignore
          luwangCount: parseFloat(a.luwangCount),
          // @ts-ignore
          assignmentDate: a.assignmentDate,
          // @ts-ignore
          status: a.status,
        })),
        skipped: skippedAssignments,
        failed: validationErrors,
      },
      meta: {
        totalProcessed: assignments.length,
        totalCreated: createdAssignments.length,
        totalSkipped: skippedAssignments.length,
        totalFailed: validationErrors.length,
        totalLuWangCreated: totalLuWang.toFixed(2),
        sessionId,
      },
    };
  } catch (error) {
    console.error("Error in bulk assignment creation:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Bulk creation failed: ${error.message}`,
      data: null,
    };
  }
};
