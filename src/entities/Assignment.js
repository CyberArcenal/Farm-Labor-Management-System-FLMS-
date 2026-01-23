// src/entities/Assignment.js
const { EntitySchema } = require("typeorm");
const AssignmentStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};
const Assignment = new EntitySchema({
  name: "Assignment",
  tableName: "assignments",
  columns: {
    id: { type: Number, primary: true, generated: true },
    luwangCount: { 
      type: "decimal", 
      precision: 5, 
      scale: 2,
      default: 0.00
    },
    assignmentDate: { type: Date }, // Business date for the assignment
    // status: "active", "completed", "cancelled" (application-level validation)
    status: { 
      type: String, 
      default: "active" 
    },
    notes: { type: String, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true }
  },
  relations: {
    worker: { 
      target: "Worker", 
      type: "many-to-one", 
      joinColumn: true, 
      inverseSide: "assignments",
      onDelete: "CASCADE" 
    },
    pitak: { 
      target: "Pitak", 
      type: "many-to-one", 
      joinColumn: true, 
      inverseSide: "assignments",
      onDelete: "CASCADE" 
    }
  },
  indices: [
    {
      name: "IDX_ASSIGNMENT_DATE",
      columns: ["assignmentDate"]
    },
    {
      name: "IDX_ASSIGNMENT_STATUS",
      columns: ["status"]
    }
  ]
});

module.exports = Assignment;