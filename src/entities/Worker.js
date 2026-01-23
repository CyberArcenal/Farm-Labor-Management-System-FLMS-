// src/entities/Worker.js
const { EntitySchema } = require("typeorm");

const Worker = new EntitySchema({
  name: "Worker",
  tableName: "workers",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    contact: { type: String, nullable: true },
    email: { type: String, nullable: true, unique: true },
    address: { type: String, nullable: true },
    // status: "active", "inactive", "on-leave", "terminated"
    status: { 
      type: String, 
      default: "active" 
    },
    hireDate: { type: Date, nullable: true },
    // Summary fields for quick access
    totalDebt: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    totalPaid: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    currentBalance: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true }
  },
  relations: {
    kabisilya: { 
      target: "Kabisilya", 
      type: "many-to-one", 
      joinColumn: true, 
      inverseSide: "workers",
      onDelete: "SET NULL" 
    },
    debts: { 
      target: "Debt", 
      type: "one-to-many", 
      inverseSide: "worker" 
    },
    payments: { 
      target: "Payment", 
      type: "one-to-many", 
      inverseSide: "worker" 
    },
    assignments: { 
      target: "Assignment", 
      type: "one-to-many", 
      inverseSide: "worker" 
    }
  },
  indices: [
    {
      name: "IDX_WORKER_STATUS",
      columns: ["status"]
    },
    {
      name: "IDX_WORKER_NAME",
      columns: ["name"]
    }
  ]
});

module.exports = Worker;