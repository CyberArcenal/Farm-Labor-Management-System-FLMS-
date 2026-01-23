// src/entities/Payment.js
const { EntitySchema } = require("typeorm");

const Payment = new EntitySchema({
  name: "Payment",
  tableName: "payments",
  columns: {
    id: { type: Number, primary: true, generated: true },
    grossPay: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    manualDeduction: { 
      type: "decimal", 
      precision: 10, 
      scale: 2, 
      nullable: true,
      default: 0.00
    },
    netPay: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    // status: "pending", "processing", "completed", "cancelled", "partially_paid"
    status: { 
      type: String, 
      default: "pending" 
    },
    paymentDate: { type: Date, nullable: true },
    paymentMethod: { type: String, nullable: true },
    referenceNumber: { type: String, nullable: true, unique: true },
    periodStart: { type: Date, nullable: true },
    periodEnd: { type: Date, nullable: true },
    // Track debt deductions from this payment
    totalDebtDeduction: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    // Other deductions (non-debt)
    otherDeductions: { 
      type: "decimal", 
      precision: 10, 
      scale: 2,
      default: 0.00
    },
    // Breakdown of deductions (could be JSON)
    deductionBreakdown: { type: "json", nullable: true },
    notes: { type: String, nullable: true },
    createdAt: { type: Date, createDate: true },
    updatedAt: { type: Date, updateDate: true }
  },
  relations: {
    worker: { 
      target: "Worker", 
      type: "many-to-one", 
      joinColumn: true, 
      inverseSide: "payments",
      onDelete: "CASCADE" 
    },
    pitak: { 
      target: "Pitak", 
      type: "many-to-one", 
      joinColumn: true, 
      inverseSide: "payments",
      onDelete: "CASCADE" 
    },
    history: { 
      target: "PaymentHistory", 
      type: "one-to-many", 
      inverseSide: "payment" 
    },
    debtPayments: { 
      target: "DebtHistory", 
      type: "one-to-many", 
      inverseSide: "payment" 
    }
  },
  indices: [
    {
      name: "IDX_PAYMENT_STATUS",
      columns: ["status"]
    },
    {
      name: "IDX_PAYMENT_DATE",
      columns: ["paymentDate"]
    },
    {
      name: "IDX_PAYMENT_WORKER",
      columns: ["workerId"]
    }
  ]
});

module.exports = Payment;