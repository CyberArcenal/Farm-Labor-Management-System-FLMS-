// dataSource.js placeholder
//@ts-check

const Assignment = require("../../entities/Assignment");
const AuditTrail = require("../../entities/AuditTrail");
const Bukid = require("../../entities/Bukid");
const Debt = require("../../entities/Debt");
const DebtHistory = require("../../entities/DebtHistory");
const Kabisilya = require("../../entities/Kabisilya");
const Notification = require("../../entities/Notification");
const Payment = require("../../entities/Payment");
const PaymentHistory = require("../../entities/PaymentHistory");
const Pitak = require("../../entities/Pitak");
const Worker = require("../../entities/Worker");
const { getDatabaseConfig } = require("./database");

const config = getDatabaseConfig();

const entities = [
  Assignment,
  AuditTrail,
  Bukid,
  Debt,
  DebtHistory,
  Kabisilya,
  Notification,
  Payment,
  PaymentHistory,
  Pitak,
  Worker,
];

// @ts-ignore
const AppDataSource = new DataSource({
  ...config,
  entities: entities,
});

module.exports = { AppDataSource };
