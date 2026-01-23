// src/ipc/assignment/update/update.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
// @ts-ignore
const { AppDataSource } = require("../../../db/dataSource");
const Worker = require("../../../../entities/Worker");
const Pitak = require("../../../../entities/Pitak");

/**
 * Update assignment details
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
      workerId,
      // @ts-ignore
      pitakId,
      // @ts-ignore
      luwangCount,
      // @ts-ignore
      assignmentDate,
      // @ts-ignore
      notes,
      // @ts-ignore
      _userId 
    } = params;

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

    // Track changes
    const changes = [];
    const originalValues = {
      // @ts-ignore
      workerId: assignment.workerId,
      // @ts-ignore
      pitakId: assignment.pitakId,
      // @ts-ignore
      luwangCount: parseFloat(assignment.luwangCount),
      assignmentDate: assignment.assignmentDate,
      notes: assignment.notes
    };

    // Validate and update worker if changed
    // @ts-ignore
    if (workerId && workerId !== assignment.workerId) {
      const workerRepo = queryRunner.manager.getRepository(Worker);
      const newWorker = await workerRepo.findOne({ where: { id: workerId } });
      
      if (!newWorker) {
        return {
          status: false,
          message: "New worker not found",
          data: null
        };
      }

      // Check if new worker is available for this date
      const existingAssignment = await assignmentRepo.findOne({
        where: {
          // @ts-ignore
          workerId,
          assignmentDate: assignment.assignmentDate,
          status: 'active',
          id: assignmentId // Exclude current assignment
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
      changes.push(`Worker changed from ${assignment.worker?.name || 'Unknown'} to ${newWorker.name}`);
      // @ts-ignore
      assignment.workerId = workerId;
    }

    // Validate and update pitak if changed
    // @ts-ignore
    if (pitakId && pitakId !== assignment.pitakId) {
      const pitakRepo = queryRunner.manager.getRepository(Pitak);
      const newPitak = await pitakRepo.findOne({ where: { id: pitakId } });
      
      if (!newPitak) {
        return {
          status: false,
          message: "New pitak not found",
          data: null
        };
      }

      // @ts-ignore
      changes.push(`Pitak changed from ${assignment.pitak?.name || 'Unknown'} to ${newPitak.name}`);
      // @ts-ignore
      assignment.pitakId = pitakId;
    }

    // Update luwang count if changed
    if (luwangCount !== undefined) {
      const newCount = parseFloat(luwangCount);
      if (isNaN(newCount) || newCount < 0) {
        return {
          status: false,
          message: "LuWang count must be a non-negative number",
          data: null
        };
      }

      // @ts-ignore
      const oldCount = parseFloat(assignment.luwangCount);
      if (newCount !== oldCount) {
        changes.push(`LuWang count changed from ${oldCount.toFixed(2)} to ${newCount.toFixed(2)}`);
        assignment.luwangCount = newCount.toFixed(2);
      }
    }

    // Update assignment date if changed
    if (assignmentDate) {
      const newDate = new Date(assignmentDate);
      // @ts-ignore
      const oldDate = new Date(assignment.assignmentDate);
      
      if (newDate.toDateString() !== oldDate.toDateString()) {
        // Check if worker is available on new date
        // @ts-ignore
        const workerIdToCheck = workerId || assignment.workerId;
        const existingAssignment = await assignmentRepo.findOne({
          where: {
            // @ts-ignore
            workerId: workerIdToCheck,
            assignmentDate: newDate,
            status: 'active',
            id: assignmentId // Exclude current assignment
          }
        });

        if (existingAssignment) {
          return {
            status: false,
            message: "Worker already has an active assignment for the new date",
            data: null
          };
        }

        changes.push(`Date changed from ${oldDate.toDateString()} to ${newDate.toDateString()}`);
        assignment.assignmentDate = newDate;
      }
    }

    // Update notes if provided
    if (notes !== undefined) {
      if (notes !== assignment.notes) {
        changes.push("Notes updated");
        assignment.notes = notes;
      }
    }

    // If no changes were made
    if (changes.length === 0) {
      return {
        status: false,
        message: "No changes detected",
        data: {
          assignment: {
            id: assignment.id,
            // @ts-ignore
            worker: assignment.worker,
            // @ts-ignore
            pitak: assignment.pitak,
            // @ts-ignore
            luwangCount: parseFloat(assignment.luwangCount),
            assignmentDate: assignment.assignmentDate,
            status: assignment.status
          }
        }
      };
    }

    // Update timestamp and save
    assignment.updatedAt = new Date();
    
    // Append change log to notes
    const changeLog = `[Update ${new Date().toISOString()}]: ${changes.join(', ')}`;
    assignment.notes = assignment.notes 
      ? `${assignment.notes}\n${changeLog}`
      : changeLog;

    const updatedAssignment = await assignmentRepo.save(assignment);

    // Log activity (called from main handler)
    
    return {
      status: true,
      message: "Assignment updated successfully",
      data: {
        id: updatedAssignment.id,
        changes,
        originalValues,
        newValues: {
          // @ts-ignore
          workerId: updatedAssignment.workerId,
          // @ts-ignore
          pitakId: updatedAssignment.pitakId,
          // @ts-ignore
          luwangCount: parseFloat(updatedAssignment.luwangCount),
          assignmentDate: updatedAssignment.assignmentDate
        },
        assignment: await assignmentRepo.findOne({
          where: { id: assignmentId },
          relations: ["worker", "pitak"]
        })
      }
    };

  } catch (error) {
    console.error("Error updating assignment:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to update assignment: ${error.message}`,
      data: null
    };
  }
};