// src/entities/User.js
const { EntitySchema } = require("typeorm");

const User = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: { type: Number, primary: true, generated: true },
    username: { 
      type: String, 
      unique: true,
      nullable: false 
    },
    email: { 
      type: String, 
      unique: true,
      nullable: false 
    },
    password: { 
      type: String,
      nullable: false 
    },
    // role: "admin", "manager", "user"
    role: { 
      type: String, 
      default: "user" 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    lastLogin: { type: Date, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true }
  },
  indices: [
    {
      name: "IDX_USER_USERNAME",
      columns: ["username"],
      unique: true
    },
    {
      name: "IDX_USER_EMAIL",
      columns: ["email"],
      unique: true
    }
  ]
});

module.exports = User;