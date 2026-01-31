// src/ipc/debt/bulk_update_status.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const UserActivity = require("../../../entities/UserActivity");

// @ts-ignore
module.exports = async (params, queryRunner) => {
  try {
    const { debt_ids, status, notes, _userId, forceOverride = false } = params;

    if (!Array.isArray(debt_ids) || debt_ids.length === 0) {
      return { status: false, message: "Debt IDs array is required", data: null };
    }

    const debtRepo = queryRunner.manager.getRepository(Debt);
    const debtHistoryRepo = queryRunner.manager.getRepository(DebtHistory);
    const activityRepo = queryRunner.manager.getRepository(UserActivity);

    const debts = await debtRepo.findByIds(debt_ids);

    if (!debts || debts.length === 0) {
      return { status: false, message: "No debts found for given IDs", data: null };
    }

    const validStatuses = ["active", "settled", "cancelled", "paid", "partially_paid"];
    if (!validStatuses.includes(status)) {
      return { status: false, message: `Invalid status '${status}'`, data: null };
    }

    let updatedCount = 0;
    const results = [];

    for (const debt of debts) {
      const oldStatus = debt.status;
      const oldBalance = parseFloat(debt.balance || 0.0);

      // Prevent rollback unless forceOverride
      if (oldStatus === "settled" && status === "active" && !forceOverride) {
        results.push({ id: debt.id, skipped: true, reason: "Cannot revert settled debt to active" });
        continue;
      }

      // Auto-settle logic
      if (status === "settled") {
        debt.balance = 0.0;
        debt.status = "settled";
        debt.updatedAt = new Date();

        const history = debtHistoryRepo.create({
          debt,
          amountPaid: oldBalance,
          previousBalance: oldBalance,
          newBalance: 0.0,
          transactionType: "payment",
          notes: notes || `Auto-settled in bulk update`,
          transactionDate: new Date(),
          performedBy: _userId ? String(_userId) : null,
          changeReason: "bulk_auto_settle",
        });
        await debtHistoryRepo.save(history);
      } else {
        debt.status = status;
        debt.updatedAt = new Date();
        if (notes) {
          debt.notes =
            (debt.notes ? debt.notes + "\n" : "") +
            `[${new Date().toISOString()}] Bulk status changed to ${status}: ${notes}`;
        }
      }

      const updatedDebt = await debtRepo.save(debt);

      // Log activity
      await activityRepo.save({
        user_id: _userId,
        action: "bulk_update_debt_status",
        entity: "Debt",
        entity_id: updatedDebt.id,
        description: `Bulk changed debt #${debt.id} status from ${oldStatus} to ${status}`,
        ip_address: "127.0.0.1",
        user_agent: "Kabisilya-Management-System",
        created_at: new Date(),
      });

      updatedCount++;
      results.push({
        id: updatedDebt.id,
        oldStatus,
        newStatus: updatedDebt.status,
        oldBalance,
        newBalance: updatedDebt.balance,
      });
    }

    return {
      status: true,
      message: `Bulk update completed. ${updatedCount} debts updated to '${status}'.`,
      data: results,
    };
  } catch (error) {
    console.error("Error in bulk update status:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};