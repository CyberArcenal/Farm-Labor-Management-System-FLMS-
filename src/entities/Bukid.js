// src/entities/Bukid.js
const { EntitySchema } = require("typeorm");

const Bukid = new EntitySchema({
  name: "Bukid",
  tableName: "bukids",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    status: { type: String, default: "active" }, // active | inactive | archived
    location: { type: String, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true },
  },
  relations: {
    // Tie bukid to session (many-to-one)
    session: {
      target: "Session",
      type: "many-to-one",
      joinColumn: true,
      inverseSide: "bukids",
      onDelete: "CASCADE", // kapag na-delete ang session, kasama ang bukid
    },
    pitaks: {
      target: "Pitak",
      type: "one-to-many",
      inverseSide: "bukid",
      cascade: true,
    },
  },
});

module.exports = Bukid;