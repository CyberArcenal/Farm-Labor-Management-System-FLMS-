// src/ipc/debt/bulk_make_payment.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const Worker = require("../../../entities/Worker");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { debt_ids, payment_data, _userId } = params; 
    // payment_data: { amount, paymentMethod, referenceNumber, notes }

    const debtRepository = queryRunner.manager.getRepository(Debt);
    const debtHistoryRepository = queryRunner.manager.getRepository(DebtHistory);
    const workerRepository = queryRunner.manager.getRepository(Worker);

    const results = { success: [], failed: [] };

    for (const debt_id of debt_ids) {
      try {
        const debt = await debtRepository.findOne({
          where: { id: debt_id },
          relations: ["worker"],
        });

        if (!debt) {
          // @ts-ignore
          results.failed.push({ debt_id, error: "Debt not found" });
          continue;
        }

        // 🚫 Prevent payments on closed debts
        const lockedStatuses = ["paid", "settled", "cancelled"];
        if (lockedStatuses.includes(debt.status)) {
          // @ts-ignore
          results.failed.push({ debt_id, error: `Cannot make payment on debt with status '${debt.status}'` });
          continue;
        }

        const previousBalance = parseFloat(debt.balance || 0);
        const paymentAmount = parseFloat(payment_data.amount || 0);

        // Integrity checks
        if (paymentAmount <= 0) {
          // @ts-ignore
          results.failed.push({ debt_id, error: "Payment amount must be greater than 0" });
          continue;
        }
        if (paymentAmount > previousBalance) {
          // @ts-ignore
          results.failed.push({ debt_id, error: "Payment amount exceeds debt balance" });
          continue;
        }
        if (!payment_data.paymentMethod || !payment_data.referenceNumber) {
          // @ts-ignore
          results.failed.push({ debt_id, error: "Payment method and reference number are required" });
          continue;
        }

        const newBalance = previousBalance - paymentAmount;

        // Update debt
        debt.balance = newBalance;
        debt.totalPaid = parseFloat(debt.totalPaid || 0) + paymentAmount;
        debt.lastPaymentDate = new Date();
        debt.updatedAt = new Date();

        // Update status
        if (newBalance <= 0) {
          debt.status = "paid";
        } else if (newBalance < parseFloat(debt.amount)) {
          debt.status = "partially_paid";
        } else {
          debt.status = "active";
        }

        await debtRepository.save(debt);

        // Create debt history record
        const debtHistory = debtHistoryRepository.create({
          debt: { id: debt_id },
          amountPaid: paymentAmount,
          previousBalance,
          newBalance,
          transactionType: "payment",
          paymentMethod: payment_data.paymentMethod,
          referenceNumber: payment_data.referenceNumber,
          notes: payment_data.notes || `[${new Date().toISOString()}] Bulk payment`,
          transactionDate: new Date(),
          performedBy: _userId ? String(_userId) : null,
          changeReason: "bulk_payment",
        });

        await debtHistoryRepository.save(debtHistory);

        // Update worker summary
        const worker = debt.worker;
        worker.totalPaid = parseFloat(worker.totalPaid || 0) + paymentAmount;
        worker.currentBalance = parseFloat(worker.currentBalance || 0) - paymentAmount;
        await workerRepository.save(worker);

        // @ts-ignore
        results.success.push({ debt_id, payment: debtHistory });
      } catch (error) {
        // @ts-ignore
        results.failed.push({ debt_id, error: error.message });
      }
    }

    return {
      status: true,
      message: `Bulk payment processed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      data: results,
    };
  } catch (error) {
    console.error("Error processing bulk payment:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};