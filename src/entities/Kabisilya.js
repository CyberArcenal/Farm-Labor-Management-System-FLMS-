// // src/entities/Kabisilya.js
// const { EntitySchema } = require("typeorm");

// const Kabisilya = new EntitySchema({
//   name: "Kabisilya",
//   tableName: "kabisilyas",
//   columns: {
//     id: { type: Number, primary: true, generated: true },
//     name: { type: String },
//     createdAt: { type: Date, createDate: true },
//     updatedAt: { type: Date, updateDate: true }
//   },
//   relations: {
//     workers: { 
//       target: "Worker", 
//       type: "one-to-many", 
//       inverseSide: "kabisilya" 
//     },
//     bukids: { 
//       target: "Bukid", 
//       type: "one-to-many", 
//       inverseSide: "kabisilya" 
//     }
//   }
// });

// module.exports = Kabisilya;