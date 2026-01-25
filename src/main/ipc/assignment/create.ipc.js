// src/ipc/assignment/create/create.ipc.js
//@ts-check
const Assignment = require("../../../entities/Assignment");
const Worker = require("../../../entities/Worker");
const Pitak = require("../../../entities/Pitak");

/**
 * Create a new assignment
 * @param {Object} params - Assignment data
 * @param {import("typeorm").QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params, queryRunner) => {
  try {
    const { 
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

    // Validate required fields
    if (!workerId || !pitakId || !assignmentDate) {
      return {
        status: false,
        message: "Missing required fields: workerId, pitakId, and assignmentDate are required",
        data: null
      };
    }

    // Validate worker exists
    const workerRepo = queryRunner.manager.getRepository(Worker);
    const worker = await workerRepo.findOne({ where: { id: workerId } });
    
    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null
      };
    }

    // Validate pitak exists
    const pitakRepo = queryRunner.manager.getRepository(Pitak);
    const pitak = await pitakRepo.findOne({ where: { id: pitakId } });
    
    if (!pitak) {
      return {
        status: false,
        message: "Pitak not found",
        data: null
      };
    }

    // Validate assignment date is not in the future (optional business rule)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const assignmentDateObj = new Date(assignmentDate);
    if (assignmentDateObj > today) {
      return {
        status: false,
        message: "Assignment date cannot be in the future",
        data: null
      };
    }

    // Check if worker already has an active assignment for this date
    const assignmentRepo = queryRunner.manager.getRepository(Assignment);
    const existingAssignment = await assignmentRepo.findOne({
      where: {
        // @ts-ignore
        workerId,
        assignmentDate: assignmentDateObj,
        status: 'active'
      }
    });

    if (existingAssignment) {
      return {
        status: false,
        message: "Worker already has an active assignment for this date",
        data: existingAssignment
      };
    }

    // Create new assignment
    const newAssignment = assignmentRepo.create({
      // @ts-ignore
      workerId,
      pitakId,
      luwangCount: luwangCount || 0.00,
      assignmentDate: assignmentDateObj,
      status: 'active',
      notes: notes || null
    });

    const savedAssignment = await assignmentRepo.save(newAssignment);

    return {
      status: true,
      message: "Assignment created successfully",
      data: {
        // @ts-ignore
        id: savedAssignment.id,
        // @ts-ignore
        workerId: savedAssignment.workerId,
        // @ts-ignore
        pitakId: savedAssignment.pitakId,
        // @ts-ignore
        luwangCount: parseFloat(savedAssignment.luwangCount),
        // @ts-ignore
        assignmentDate: savedAssignment.assignmentDate,
        // @ts-ignore
        status: savedAssignment.status,
        // @ts-ignore
        notes: savedAssignment.notes
      }
    };

  } catch (error) {
    console.error("Error creating assignment:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to create assignment: ${error.message}`,
      data: null
    };
  }
};