// src/entities/Bukid.js
const { EntitySchema } = require("typeorm");

const Bukid = new EntitySchema({
  name: "Bukid",
  tableName: "bukids",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String },
    status: { type: String, default: 'active' },
    location: { type: String, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true }
  },
  relations: {
    kabisilya: { 
      target: "Kabisilya", 
      type: "many-to-one", 
      joinColumn: true, 
      inverseSide: "bukids",
      onDelete: "SET NULL" 
    },
    pitaks: { 
      target: "Pitak", 
      type: "one-to-many", 
      inverseSide: "bukid" 
    }
  }
});

module.exports = Bukid;