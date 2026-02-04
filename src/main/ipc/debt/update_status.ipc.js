// src/ipc/debt/update_status.ipc.js
//@ts-check

const Debt = require("../../../entities/Debt");
const DebtHistory = require("../../../entities/DebtHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function updateDebtStatus(params = {}, queryRunner = null) {
  let shouldRelease = false;

  if (!queryRunner) {
    // @ts-ignore
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { id, status, notes, _userId } = params;

    if (!id || !status) {
      return { status: false, message: "Debt ID and status are required", data: null };
    }

    // @ts-ignore
    const debtRepo = queryRunner.manager.getRepository(Debt);
    // @ts-ignore
    const debtHistoryRepo = queryRunner.manager.getRepository(DebtHistory);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);

    const debt = await debtRepo.findOne({ where: { id } });
    if (!debt) {
      return { status: false, message: "Debt not found", data: null };
    }

    const validStatuses = ["active", "cancelled", "partially_paid", "paid"];
    if (!validStatuses.includes(status)) {
      return { status: false, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`, data: null };
    }

    if (debt.status === status) {
      return { status: false, message: `Debt is already ${status}`, data: debt };
    }

    // Prevent rollback: once settled, cannot go back to active
    if (debt.status === "settled" && status === "active") {
      return { status: false, message: "Cannot revert a settled debt back to active", data: null };
    }

    const oldStatus = debt.status;
    const oldBalance = parseFloat(debt.balance || 0.0);

    if (status === "settled" || status === "paid") {
      // Auto-settle: set balance to zero
      debt.balance = 0.0;
      debt.status = "paid";
      debt.updatedAt = new Date();

      // Log DebtHistory entry
      const history = debtHistoryRepo.create({
        debt,
        amountPaid: oldBalance,
        previousBalance: oldBalance,
        newBalance: 0.0,
        transactionType: "payment",
        notes: notes || "Auto-settled by status update",
        transactionDate: new Date(),
        performedBy: _userId ? String(_userId) : null,
        changeReason: "auto_settle",
      });
      await debtHistoryRepo.save(history);
    } else {
      // Normal status update
      debt.status = status;
      debt.updatedAt = new Date();
      if (notes) {
        debt.notes = (debt.notes ? debt.notes + "\n" : "") +
          `[${new Date().toISOString()}] Status changed to ${status}: ${notes}`;
      }
    }

    const updatedDebt = await debtRepo.save(debt);

    // Log UserActivity
    await activityRepo.save({
      user_id: _userId,
      action: "update_debt_status",
      entity: "Debt",
      entity_id: updatedDebt.id,
      description: `Changed debt #${id} status from ${oldStatus} to ${status}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date(),
    });

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: `Debt #${id} status updated from '${oldStatus}' to '${status}'`,
      data: {
        id: updatedDebt.id,
        oldStatus,
        newStatus: updatedDebt.status,
        oldBalance,
        newBalance: updatedDebt.balance,
        updatedAt: updatedDebt.updatedAt,
        notes: updatedDebt.notes,
      },
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error("Error updating debt status:", error);
    // @ts-ignore
    return { status: false, message: `Failed to update debt status: ${error.message}`, data: null };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};