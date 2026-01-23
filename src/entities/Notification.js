// src/entities/Notification.js
const { EntitySchema } = require("typeorm");

const Notification = new EntitySchema({
  name: "Notification",
  tableName: "notifications",
  columns: {
    id: { type: Number, primary: true, generated: true },
    type: { type: String },
    context: { type: "json", nullable: true },
    timestamp: { type: Date, createDate: true }
  },
  indices: [
    {
      name: "IDX_NOTIFICATION_TYPE",
      columns: ["type"]
    }
  ]
});

module.exports = Notification;