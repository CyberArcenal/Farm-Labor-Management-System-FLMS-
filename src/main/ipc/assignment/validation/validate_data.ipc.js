// src/ipc/assignment/validation/validate_data.ipc.js
//@ts-check
const Assignment = require("../../../../entities/Assignment");
const Worker = require("../../../../entities/Worker");
const Pitak = require("../../../../entities/Pitak");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Validate assignment data
 * @param {Object} params - Validation parameters
 * @returns {Promise<Object>} Response object
 */
module.exports = async (params) => {
  try {
    // @ts-ignore
    const { assignmentData, checkExisting = true, _userId } = params;

    if (!assignmentData) {
      return {
        status: false,
        message: "Assignment data is required",
        data: null
      };
    }

    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedData: {},
      suggestions: []
    };

    // Required fields validation
    const requiredFields = ['workerId', 'pitakId', 'assignmentDate'];
    requiredFields.forEach(field => {
      if (!assignmentData[field]) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push(`${field} is required`);
      }
    });

    // Validate worker exists
    if (assignmentData.workerId) {
      const workerRepo = AppDataSource.getRepository(Worker);
      const worker = await workerRepo.findOne({ where: { id: assignmentData.workerId } });
      
      if (!worker) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push(`Worker with ID ${assignmentData.workerId} not found`);
      } else {
        // @ts-ignore
        validationResult.validatedData.worker = {
          id: worker.id,
          name: worker.name,
          code: worker.code
        };
      }
    }

    // Validate pitak exists
    if (assignmentData.pitakId) {
      const pitakRepo = AppDataSource.getRepository(Pitak);
      const pitak = await pitakRepo.findOne({ where: { id: assignmentData.pitakId } });
      
      if (!pitak) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push(`Pitak with ID ${assignmentData.pitakId} not found`);
      } else {
        // @ts-ignore
        validationResult.validatedData.pitak = {
          id: pitak.id,
          name: pitak.name,
          code: pitak.code
        };
      }
    }

    // Validate assignment date
    if (assignmentData.assignmentDate) {
      try {
        const date = new Date(assignmentData.assignmentDate);
        if (isNaN(date.getTime())) {
          validationResult.isValid = false;
          // @ts-ignore
          validationResult.errors.push("Invalid assignment date format");
        } else {
          // Check if date is in the future
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (date > today) {
            // @ts-ignore
            validationResult.warnings.push("Assignment date is in the future");
          }
          
          // @ts-ignore
          validationResult.validatedData.assignmentDate = date;
        }
      } catch (error) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push("Invalid assignment date");
      }
    }

    // Validate luwang count
    if (assignmentData.luwangCount !== undefined) {
      const count = parseFloat(assignmentData.luwangCount);
      if (isNaN(count)) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push("LuWang count must be a number");
      } else if (count < 0) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push("LuWang count cannot be negative");
      } else {
        // @ts-ignore
        validationResult.validatedData.luwangCount = count.toFixed(2);
      }
    }

    // Validate status
    if (assignmentData.status) {
      const validStatuses = ['active', 'completed', 'cancelled'];
      if (!validStatuses.includes(assignmentData.status)) {
        validationResult.isValid = false;
        // @ts-ignore
        validationResult.errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      } else {
        // @ts-ignore
        validationResult.validatedData.status = assignmentData.status;
      }
    }

    // Check for existing assignment (if applicable)
    if (checkExisting && assignmentData.workerId && assignmentData.assignmentDate) {
      try {
        const assignmentRepo = AppDataSource.getRepository(Assignment);
        const existingAssignment = await assignmentRepo.findOne({
          where: {
            workerId: assignmentData.workerId,
            assignmentDate: new Date(assignmentData.assignmentDate),
            status: 'active'
          }
        });

        if (existingAssignment) {
          // @ts-ignore
          validationResult.warnings.push("Worker already has an active assignment for this date");
          // @ts-ignore
          validationResult.suggestions.push({
            action: 'update',
            existingAssignmentId: existingAssignment.id,
            message: "Consider updating the existing assignment instead"
          });
        }
      } catch (error) {
        // Skip this check if there's an error
        console.warn("Error checking existing assignment:", error);
      }
    }

    // Check worker availability for the date
    if (assignmentData.workerId && assignmentData.assignmentDate && !assignmentData.assignmentId) {
      try {
        const assignmentRepo = AppDataSource.getRepository(Assignment);
        const existingAssignment = await assignmentRepo.findOne({
          where: {
            workerId: assignmentData.workerId,
            assignmentDate: new Date(assignmentData.assignmentDate),
            status: 'active'
          }
        });

        if (existingAssignment) {
          // @ts-ignore
          validationResult.warnings.push("Worker is not available for this date");
          // @ts-ignore
          validationResult.suggestions.push({
            action: 'reassign',
            existingAssignmentId: existingAssignment.id,
            message: "Consider assigning a different worker or date"
          });
        }
      } catch (error) {
        // Skip this check if there's an error
        console.warn("Error checking worker availability:", error);
      }
    }

    // Generate suggestions based on validation
    if (validationResult.warnings.length > 0 && validationResult.isValid) {
      // @ts-ignore
      validationResult.suggestions.push({
        action: 'review',
        message: "Please review the warnings before proceeding"
      });
    }

    return {
      status: true,
      message: validationResult.isValid 
        ? "Assignment data is valid" 
        : "Assignment data validation failed",
      data: validationResult
    };

  } catch (error) {
    console.error("Error validating assignment data:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Validation failed: ${error.message}`,
      data: null
    };
  }
};