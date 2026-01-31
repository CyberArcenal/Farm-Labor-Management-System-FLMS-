//@ts-check
const { DataSource } = require("typeorm");
const Assignment = require("../../entities/Assignment");
const AuditTrail = require("../../entities/AuditTrail");
const Bukid = require("../../entities/Bukid");
const Debt = require("../../entities/Debt");
const DebtHistory = require("../../entities/DebtHistory");
const LicenseCache = require("../../entities/LicenseCache");
const Notification = require("../../entities/Notification");
const Payment = require("../../entities/Payment");
const PaymentHistory = require("../../entities/PaymentHistory");
const Pitak = require("../../entities/Pitak");
const User = require("../../entities/User");
const UserActivity = require("../../entities/UserActivity");
const Worker = require("../../entities/Worker");
const { getDatabaseConfig } = require("./database");
const { SystemSetting } = require("../../entities/systemSettings");
const Session = require("../../entities/Session");

const config = getDatabaseConfig();

const entities = [
  Session,
  Assignment,
  AuditTrail,
  Bukid,
  Debt,
  DebtHistory,
  LicenseCache,
  Notification,
  Payment,
  PaymentHistory,
  Pitak,
  User,
  UserActivity,
  Worker,
  SystemSetting,
];

// @ts-ignore
const AppDataSource = new DataSource({
  ...config,
  entities: entities,
});


AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

module.exports = { AppDataSource };
