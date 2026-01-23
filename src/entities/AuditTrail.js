// src/entities/AuditTrail.js
const { EntitySchema } = require("typeorm");

const AuditTrail = new EntitySchema({
  name: "AuditTrail",
  tableName: "audit_trails",
  columns: {
    id: { type: Number, primary: true, generated: true },
    action: { type: String },
    actor: { type: String },
    details: { type: "json", nullable: true },
    timestamp: { type: Date, createDate: true }
  },
  indices: [
    {
      name: "IDX_AUDIT_ACTION",
      columns: ["action"]
    },
    {
      name: "IDX_AUDIT_TIMESTAMP",
      columns: ["timestamp"]
    }
  ]
});

module.exports = AuditTrail;