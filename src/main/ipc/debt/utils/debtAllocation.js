// src/utils/debtAllocation.js
//@ts-check

const { farmDebtAllocationStrategy } = require("../../../../utils/system");

/**
 * Decide allocations for a given payment amount across worker debts
 * Strategy is configurable via system settings (equal, proportional, auto)
 * @param {{ id: number, balance: number, status: string }[]} debts
 * @param {number} paymentAmount
 * @returns {Promise<{ debtId: number, allocatedAmount: number }[]>}
 */
async function decideDebtAllocations(debts, paymentAmount) {
  const activeDebts = debts.filter(d =>
    ["pending", "partially_paid"].includes(d.status)
  );
  const totalBalance = activeDebts.reduce(
    // @ts-ignore
    (sum, d) => sum + parseFloat(d.balance || 0),
    0
  );

  if (activeDebts.length === 0) return [];

  const strategy = await farmDebtAllocationStrategy();

  // Case 1: enough to pay all (applies to auto/proportional/equal)
  if (paymentAmount >= totalBalance) {
    return activeDebts.map(d => ({
      debtId: d.id,
      // @ts-ignore
      allocatedAmount: parseFloat(d.balance || 0),
    }));
  }

  if (strategy === "equal") {
    const share = paymentAmount / activeDebts.length;
    return activeDebts.map(d => ({
      debtId: d.id,
      // @ts-ignore
      allocatedAmount: Math.min(share, parseFloat(d.balance || 0)),
    }));
  }

  if (strategy === "proportional") {
    return activeDebts.map(d => {
      // @ts-ignore
      const bal = parseFloat(d.balance || 0);
      const share = (bal / totalBalance) * paymentAmount;
      return { debtId: d.id, allocatedAmount: Math.min(share, bal) };
    });
  }

  // Default: auto (proportional if not enough, full if enough)
  return activeDebts.map(d => {
    // @ts-ignore
    const bal = parseFloat(d.balance || 0);
    const share = (bal / totalBalance) * paymentAmount;
    return { debtId: d.id, allocatedAmount: Math.min(share, bal) };
  });
}

module.exports = { decideDebtAllocations };