// src/services/DebtManager.js
//@ts-check

const { AppDataSource } = require("../main/db/dataSource");

class DebtManager {
  constructor() {
    this.debtRepository = AppDataSource.getRepository("Debt");
    this.debtHistoryRepository = AppDataSource.getRepository("DebtHistory");
    this.workerRepository = AppDataSource.getRepository("Worker");
    this.paymentRepository = AppDataSource.getRepository("Payment");
    this.auditTrailRepository = AppDataSource.getRepository("AuditTrail");
  }

  /**
     * Create a new debt for a worker
     * @param {{ workerId: any; amount: string; interestRate: string; reason: any; dueDate: string | number | Date; paymentTerm: any; }} debtData
     */
  async createDebt(debtData, actor = "system") {
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Check if worker exists
      const worker = await queryRunner.manager.findOne("Worker", {
        where: { id: debtData.workerId }
      });

      if (!worker) {
        throw new Error(`Worker with ID ${debtData.workerId} not found`);
      }

      // Calculate initial values
      const amount = parseFloat(debtData.amount) || 0;
      const interestRate = parseFloat(debtData.interestRate) || 0;
      const totalInterest = interestRate > 0 ? (amount * interestRate) / 100 : 0;
      const totalAmount = amount + totalInterest;

      // Create debt
      const debt = this.debtRepository.create({
        worker: { id: debtData.workerId },
        originalAmount: amount,
        amount: totalAmount,
        balance: totalAmount,
        reason: debtData.reason,
        status: "pending",
        dueDate: debtData.dueDate ? new Date(debtData.dueDate) : null,
        paymentTerm: debtData.paymentTerm,
        interestRate: interestRate,
        totalInterest: totalInterest,
        totalPaid: 0,
        dateIncurred: new Date()
      });

      const savedDebt = await queryRunner.manager.save(debt);

      // Create initial debt history record
      const debtHistory = this.debtHistoryRepository.create({
        debt: savedDebt,
        amountPaid: 0,
        previousBalance: 0,
        newBalance: totalAmount,
        transactionType: "create",
        paymentMethod: "n/a",
        notes: "Initial debt creation",
        transactionDate: new Date()
      });

      await queryRunner.manager.save(debtHistory);

      // Update worker's debt summary
      await this._updateWorkerDebtSummary(queryRunner, debtData.workerId);

      // Log to audit trail
      await this._logAudit(
        queryRunner,
        "DEBT_CREATED",
        actor,
        {
          debtId: savedDebt.id,
          workerId: debtData.workerId,
          amount: totalAmount,
          reason: debtData.reason
        }
      );

      await queryRunner.commitTransaction();
      return savedDebt;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error creating debt:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
     * Record a partial or full payment towards a debt
     * @param {{ debtId: any; amountPaid: any; paymentMethod: any; notes: any; referenceNumber: any; paymentId?: any; }} paymentData
     */
  async recordPayment(paymentData, actor = "system") {
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const {
        debtId,
        amountPaid,
        paymentMethod = "cash",
        notes = "",
        paymentId = null,
        referenceNumber = null
      } = paymentData;

      // Get debt with worker relationship
      const debt = await queryRunner.manager.findOne("Debt", {
        where: { id: debtId },
        relations: ["worker"]
      });

      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      if (parseFloat(amountPaid) <= 0) {
        throw new Error("Payment amount must be greater than 0");
      }

      const previousBalance = parseFloat(debt.balance);
      const paymentAmount = parseFloat(amountPaid);
      
      if (paymentAmount > previousBalance) {
        throw new Error(`Payment amount (${paymentAmount}) exceeds debt balance (${previousBalance})`);
      }

      const newBalance = previousBalance - paymentAmount;

      // Create debt history record
      const debtHistory = this.debtHistoryRepository.create({
        debt: { id: debtId },
        amountPaid: paymentAmount,
        previousBalance: previousBalance,
        newBalance: newBalance,
        transactionType: "payment",
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber,
        notes: notes,
        payment: paymentId ? { id: paymentId } : null,
        transactionDate: new Date()
      });

      await queryRunner.manager.save(debtHistory);

      // Update debt
      debt.balance = newBalance;
      debt.totalPaid = parseFloat(debt.totalPaid) + paymentAmount;
      debt.lastPaymentDate = new Date();

      // Update status based on balance
      if (newBalance <= 0) {
        debt.status = "paid";
      } else if (newBalance < parseFloat(debt.amount)) {
        debt.status = "partially_paid";
      }

      // Check if overdue
      if (debt.dueDate && new Date() > new Date(debt.dueDate) && newBalance > 0) {
        debt.status = "overdue";
      }

      await queryRunner.manager.save(debt);

      // Update worker's debt summary
      await this._updateWorkerDebtSummary(queryRunner, debt.worker.id);

      // Log to audit trail
      await this._logAudit(
        queryRunner,
        "DEBT_PAYMENT",
        actor,
        {
          debtId: debtId,
          amountPaid: paymentAmount,
          previousBalance: previousBalance,
          newBalance: newBalance,
          paymentMethod: paymentMethod
        }
      );

      await queryRunner.commitTransaction();

      return {
        debt: debt,
        paymentRecord: debtHistory
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error recording payment:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
     * Adjust debt amount (increase or decrease)
     * @param {any} debtId
     * @param {{ adjustmentType: any; amount: any; reason: any; }} adjustmentData
     */
  async adjustDebt(debtId, adjustmentData, actor = "system") {
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const { adjustmentType, amount, reason } = adjustmentData;
      
      if (!["increase", "decrease", "write_off"].includes(adjustmentType)) {
        throw new Error("Invalid adjustment type");
      }

      const debt = await queryRunner.manager.findOne("Debt", {
        where: { id: debtId },
        relations: ["worker"]
      });

      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      const adjustmentAmount = parseFloat(amount) || 0;
      const previousBalance = parseFloat(debt.balance);

      let newBalance = previousBalance;
      let transactionType = "adjustment";

      switch (adjustmentType) {
        case "increase":
          newBalance = previousBalance + adjustmentAmount;
          debt.amount = parseFloat(debt.amount) + adjustmentAmount;
          break;
        case "decrease":
          newBalance = previousBalance - adjustmentAmount;
          if (newBalance < 0) newBalance = 0;
          break;
        case "write_off":
          newBalance = 0;
          debt.status = "cancelled";
          transactionType = "write_off";
          break;
      }

      // Create debt history record
      const debtHistory = this.debtHistoryRepository.create({
        debt: { id: debtId },
        amountPaid: adjustmentType === "decrease" ? adjustmentAmount : 0,
        previousBalance: previousBalance,
        newBalance: newBalance,
        transactionType: transactionType,
        paymentMethod: "adjustment",
        notes: `${adjustmentType}: ${reason || "No reason provided"}`,
        transactionDate: new Date()
      });

      await queryRunner.manager.save(debtHistory);

      // Update debt
      debt.balance = newBalance;
      
      if (adjustmentType === "decrease") {
        debt.totalPaid = parseFloat(debt.totalPaid) + adjustmentAmount;
      }

      if (newBalance <= 0 && debt.status !== "cancelled") {
        debt.status = "paid";
      }

      await queryRunner.manager.save(debt);

      // Update worker's debt summary
      await this._updateWorkerDebtSummary(queryRunner, debt.worker.id);

      // Log to audit trail
      await this._logAudit(
        queryRunner,
        "DEBT_ADJUSTED",
        actor,
        {
          debtId: debtId,
          adjustmentType: adjustmentType,
          amount: adjustmentAmount,
          reason: reason,
          previousBalance: previousBalance,
          newBalance: newBalance
        }
      );

      await queryRunner.commitTransaction();

      return {
        debt: debt,
        adjustmentRecord: debtHistory
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error adjusting debt:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
     * Get debt with its payment history
     * @param {any} debtId
     */
  async getDebtWithHistory(debtId) {
    try {
      const debt = await this.debtRepository.findOne({
        where: { id: debtId },
        relations: ["worker", "history", "history.payment"]
      });

      if (!debt) {
        throw new Error(`Debt with ID ${debtId} not found`);
      }

      return debt;
    } catch (error) {
      console.error("Error getting debt:", error);
      throw error;
    }
  }

  /**
     * Get all debts for a worker with pagination
     * @param {any} workerId
     */
  async getWorkerDebts(workerId, options = {}) {
    try {
      // @ts-ignore
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const where = { worker: { id: workerId } };
      // @ts-ignore
      if (status) where.status = status;

      const [debts, total] = await this.debtRepository.findAndCount({
        where: where,
        relations: ["history"],
        order: { dateIncurred: "DESC" },
        skip: skip,
        take: limit
      });

      return {
        debts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error("Error getting worker debts:", error);
      throw error;
    }
  }

  /**
   * Get overdue debts
   */
  async getOverdueDebts() {
    try {
      const today = new Date();
      
      const debts = await this.debtRepository
        .createQueryBuilder("debt")
        .leftJoinAndSelect("debt.worker", "worker")
        .where("debt.balance > 0")
        .andWhere("debt.dueDate IS NOT NULL")
        .andWhere("debt.dueDate < :today", { today })
        .andWhere("debt.status != :status", { status: "paid" })
        .orderBy("debt.dueDate", "ASC")
        .getMany();

      return debts;
    } catch (error) {
      console.error("Error getting overdue debts:", error);
      throw error;
    }
  }

  /**
   * Get debt summary statistics
   */
  async getDebtSummary() {
    try {
      const result = await this.debtRepository
        .createQueryBuilder("debt")
        .select([
          "COUNT(debt.id) as totalDebts",
          "SUM(debt.amount) as totalAmount",
          "SUM(debt.balance) as totalBalance",
          "SUM(debt.totalPaid) as totalPaid",
          "SUM(CASE WHEN debt.status = 'paid' THEN 1 ELSE 0 END) as paidCount",
          "SUM(CASE WHEN debt.status = 'pending' THEN 1 ELSE 0 END) as pendingCount",
          "SUM(CASE WHEN debt.status = 'partially_paid' THEN 1 ELSE 0 END) as partiallyPaidCount",
          "SUM(CASE WHEN debt.status = 'overdue' THEN 1 ELSE 0 END) as overdueCount"
        ])
        .getRawOne();

      return {
        totalDebts: parseInt(result.totalDebts) || 0,
        totalAmount: parseFloat(result.totalAmount) || 0,
        totalBalance: parseFloat(result.totalBalance) || 0,
        totalPaid: parseFloat(result.totalPaid) || 0,
        paidCount: parseInt(result.paidCount) || 0,
        pendingCount: parseInt(result.pendingCount) || 0,
        partiallyPaidCount: parseInt(result.partiallyPaidCount) || 0,
        overdueCount: parseInt(result.overdueCount) || 0
      };
    } catch (error) {
      console.error("Error getting debt summary:", error);
      throw error;
    }
  }

  /**
     * Process salary payment with automatic debt deduction
     * @param {{ workerId: any; grossPay: any; manualDeduction?: 0 | undefined; periodStart: any; periodEnd: any; }} paymentData
     */
  async processSalaryWithDebtDeduction(paymentData, actor = "system") {
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const { workerId, grossPay, manualDeduction = 0, periodStart, periodEnd } = paymentData;

      // Get worker with active debts
      const worker = await queryRunner.manager.findOne("Worker", {
        where: { id: workerId }
      });

      if (!worker) {
        throw new Error(`Worker with ID ${workerId} not found`);
      }

      // Get worker's pending and overdue debts
      const debts = await queryRunner.manager.find("Debt", {
        where: {
          worker: { id: workerId },
          status: ["pending", "partially_paid", "overdue"],
          balance: { $gt: 0 }
        },
        order: { dueDate: "ASC", dateIncurred: "ASC" }
      });

      let totalDebtDeduction = 0;
      const debtPayments = [];
      // @ts-ignore
      let remainingForDebts = parseFloat(grossPay) - parseFloat(manualDeduction);

      // Process each debt until no money left or all debts paid
      for (const debt of debts) {
        if (remainingForDebts <= 0) break;

        const debtBalance = parseFloat(debt.balance);
        const amountToPay = Math.min(debtBalance, remainingForDebts);

        if (amountToPay > 0) {
          // Record payment for this debt
          const paymentResult = await this.recordPayment(
            {
              debtId: debt.id,
              amountPaid: amountToPay,
              paymentMethod: "salary_deduction",
              notes: `Automatic deduction from salary payment`,
              referenceNumber: `SAL-${Date.now()}`
            },
            actor
          );

          debtPayments.push(paymentResult);
          totalDebtDeduction += amountToPay;
          remainingForDebts -= amountToPay;
        }
      }

      // Calculate net pay
      // @ts-ignore
      const netPay = parseFloat(grossPay) - parseFloat(manualDeduction) - totalDebtDeduction;

      // Create payment record
      const payment = this.paymentRepository.create({
        worker: { id: workerId },
        grossPay: grossPay,
        manualDeduction: manualDeduction,
        totalDebtDeduction: totalDebtDeduction,
        netPay: netPay,
        status: "completed",
        paymentDate: new Date(),
        paymentMethod: "salary",
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        deductionBreakdown: {
          manualDeduction: manualDeduction,
          debtDeductions: debtPayments.map(dp => ({
            debtId: dp.debt.id,
            amount: dp.paymentRecord.amountPaid,
            debtBalanceBefore: dp.paymentRecord.previousBalance,
            debtBalanceAfter: dp.paymentRecord.newBalance
          }))
        }
      });

      const savedPayment = await queryRunner.manager.save(payment);

      // Link debt payments to this payment record
      for (const dp of debtPayments) {
        await queryRunner.manager.update("DebtHistory", dp.paymentRecord.id, {
          payment: { id: savedPayment.id }
        });
      }

      // Log to audit trail
      await this._logAudit(
        queryRunner,
        "SALARY_PAID_WITH_DEBT_DEDUCTION",
        actor,
        {
          workerId: workerId,
          paymentId: savedPayment.id,
          grossPay: grossPay,
          totalDebtDeduction: totalDebtDeduction,
          netPay: netPay,
          debtsPaid: debtPayments.length
        }
      );

      await queryRunner.commitTransaction();

      return {
        payment: savedPayment,
        debtPayments: debtPayments,
        totalDebtDeduction: totalDebtDeduction,
        netPay: netPay
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Error processing salary with debt deduction:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
     * Private method to update worker's debt summary
     * @param {{ manager: { createQueryBuilder: (arg0: string, arg1: string) => { (): any; new (): any; select: { (arg0: string[]): { (): any; new (): any; where: { (arg0: string, arg1: { workerId: any; }): { (): any; new (): any; getRawOne: { (): any; new (): any; }; }; new (): any; }; }; new (): any; }; }; update: (arg0: string, arg1: any, arg2: { totalDebt: number; totalPaid: number; currentBalance: number; }) => any; }; }} queryRunner
     * @param {any} workerId
     */
  async _updateWorkerDebtSummary(queryRunner, workerId) {
    const summary = await queryRunner.manager
      .createQueryBuilder("Debt", "debt")
      .select([
        "SUM(debt.amount) as totalDebt",
        "SUM(debt.totalPaid) as totalPaid",
        "SUM(debt.balance) as currentBalance"
      ])
      .where("debt.workerId = :workerId", { workerId })
      .getRawOne();

    await queryRunner.manager.update("Worker", workerId, {
      totalDebt: parseFloat(summary.totalDebt) || 0,
      totalPaid: parseFloat(summary.totalPaid) || 0,
      currentBalance: parseFloat(summary.currentBalance) || 0
    });
  }

  /**
     * Private method to log audit trail
     * @param {{ manager: { save: (arg0: any) => any; }; }} queryRunner
     * @param {string} action
     * @param {string} actor
     * @param {{ debtId?: any; workerId?: any; amount?: number; reason?: any; amountPaid?: number; previousBalance?: number; newBalance?: number; paymentMethod?: any; adjustmentType?: any; paymentId?: any; grossPay?: any; totalDebtDeduction?: number; netPay?: number; debtsPaid?: number; }} details
     */
  async _logAudit(queryRunner, action, actor, details) {
    const auditTrail = this.auditTrailRepository.create({
      action: action,
      actor: actor,
      details: details,
      timestamp: new Date()
    });

    await queryRunner.manager.save(auditTrail);
  }
}

module.exports = new DebtManager();