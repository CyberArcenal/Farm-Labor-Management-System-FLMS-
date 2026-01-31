// src/entities/Pitak.js
const { EntitySchema } = require("typeorm");

const Pitak = new EntitySchema({
  name: "Pitak",
  tableName: "pitaks",
  columns: {
    id: { type: Number, primary: true, generated: true },
    location: { type: String, nullable: true },
    totalLuwang: {
      type: "decimal",
      precision: 5,
      scale: 2,
      default: 0.0,
    },
    // status: "active", "inactive", "completed"
    status: {
      type: String,
      default: "active",
    },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    bukid: {
      target: "Bukid",
      type: "many-to-one",
      joinColumn: true,
      inverseSide: "pitaks",
      onDelete: "CASCADE",
    },
    assignments: {
      target: "Assignment",
      type: "one-to-many",
      inverseSide: "pitak",
      cascade: true,
    },
    payments: {
      target: "Payment",
      type: "one-to-many",
      inverseSide: "pitak",
      cascade: true,
    },
  },
  indices: [
    { name: "IDX_PITAK_STATUS", columns: ["status"] },
    { name: "IDX_PITAK_LOCATION", columns: ["location"] },
  ],
  uniques: [
    {
      name: "UQ_BUKID_LOCATION",
      columns: ["bukid", "location"], // ✅ unique pitak per bukid
    },
  ],
});

module.exports = Pitak;