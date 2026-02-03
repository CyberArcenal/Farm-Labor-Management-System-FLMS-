// ipc/payment/get_worker_summary.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Retrieve payment summary for a worker with optional date range filters.
 * startDate and endDate are accepted as strings (ISO date) or Date objects.
 *
 * @param {Object} params
 * @param {number} params.workerId
 * @param {number} [params.year]
 * @param {number} [params.month] - 1-12
 * @param {string|Date} [params.startDate]
 * @param {string|Date} [params.endDate]
 */
// @ts-ignore
module.exports = async function getWorkerPaymentSummary(params = {}) {
  try {
    const {
      workerId,
      year,
      month,
      startDate: startDateParam,
      endDate: endDateParam,
    } = params;

    if (!workerId) {
      return {
        status: false,
        message: "Worker ID is required",
        data: null,
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);
    const worker = await workerRepository.findOne({
      where: { id: workerId },
    });

    if (!worker) {
      return {
        status: false,
        message: "Worker not found",
        data: null,
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const qb = paymentRepository
      .createQueryBuilder("payment")
      .where("payment.workerId = :workerId", { workerId });

    // Helpers to normalize dates to start/end of day
    // @ts-ignore
    const toStartOfDay = (d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt;
    };
    // @ts-ignore
    const toEndOfDay = (d) => {
      const dt = new Date(d);
      dt.setHours(23, 59, 59, 999);
      return dt;
    };

    // Determine applied date range (precedence: explicit start/end > month+year > year)
    let appliedStart = null;
    let appliedEnd = null;

    if (startDateParam || endDateParam) {
      if (startDateParam) {
        appliedStart = toStartOfDay(startDateParam);
      }
      if (endDateParam) {
        appliedEnd = toEndOfDay(endDateParam);
      }
    } else if (month && year) {
      const monthNum = Number(month);
      const yearNum = Number(year);
      appliedStart = toStartOfDay(new Date(yearNum, monthNum - 1, 1));
      appliedEnd = toEndOfDay(new Date(yearNum, monthNum, 0));
    } else if (year) {
      const yearNum = Number(year);
      appliedStart = toStartOfDay(new Date(yearNum, 0, 1));
      appliedEnd = toEndOfDay(new Date(yearNum, 11, 31));
    }

    // Apply date filters to query builder.
    // Use overlap semantics: payment overlaps the requested range
    // (payment.periodEnd >= appliedStart) AND (payment.periodStart <= appliedEnd)
    if (appliedStart && appliedEnd) {
      qb.andWhere("payment.periodEnd >= :appliedStart", { appliedStart });
      qb.andWhere("payment.periodStart <= :appliedEnd", { appliedEnd });
    } else if (appliedStart && !appliedEnd) {
      // Only start provided: payments that end on/after start
      qb.andWhere("payment.periodEnd >= :appliedStart", { appliedStart });
    } else if (!appliedStart && appliedEnd) {
      // Only end provided: payments that start on/before end
      qb.andWhere("payment.periodStart <= :appliedEnd", { appliedEnd });
    }

    // Fetch payments
    const payments = await qb.orderBy("payment.periodStart", "DESC").getMany();

    // Summarize
    const summary = payments.reduce(
      (acc, payment) => {
        // @ts-ignore
        acc.totalGross += parseFloat(payment.grossPay || 0);
        // @ts-ignore
        acc.totalNet += parseFloat(payment.netPay || 0);
        // @ts-ignore
        acc.totalDebtDeductions += parseFloat(payment.totalDebtDeduction || 0);
        // @ts-ignore
        acc.totalManualDeductions += parseFloat(payment.manualDeduction || 0);
        // @ts-ignore
        acc.totalOtherDeductions += parseFloat(payment.otherDeductions || 0);
        acc.paymentCount++;

        // @ts-ignore
        acc.statusCounts[payment.status] =
          // @ts-ignore
          (acc.statusCounts[payment.status] || 0) + 1;

        return acc;
      },
      {
        totalGross: 0,
        totalNet: 0,
        totalDebtDeductions: 0,
        totalManualDeductions: 0,
        totalOtherDeductions: 0,
        paymentCount: 0,
        statusCounts: {},
      },
    );

    // Monthly breakdown keyed by YYYY-MM (based on periodStart)
    const monthlyBreakdown = payments.reduce((acc, payment) => {
      if (payment.periodStart) {
        // @ts-ignore
        const ps = new Date(payment.periodStart);
        const monthYear = `${ps.getFullYear()}-${String(ps.getMonth() + 1).padStart(2, "0")}`;

        // @ts-ignore
        if (!acc[monthYear]) {
          // @ts-ignore
          acc[monthYear] = {
            period: ps.toLocaleString("default", {
              month: "long",
              year: "numeric",
            }),
            grossPay: 0,
            netPay: 0,
            deductions: 0,
            paymentCount: 0,
          };
        }

        // @ts-ignore
        acc[monthYear].grossPay += parseFloat(payment.grossPay || 0);
        // @ts-ignore
        acc[monthYear].netPay += parseFloat(payment.netPay || 0);
        // @ts-ignore
        acc[monthYear].deductions +=
          // @ts-ignore
          parseFloat(payment.totalDebtDeduction || 0) +
          // @ts-ignore
          parseFloat(payment.manualDeduction || 0) +
          // @ts-ignore
          parseFloat(payment.otherDeductions || 0);
        // @ts-ignore
        acc[monthYear].paymentCount++;
      }
      return acc;
    }, {});

    const formattedMonthlyBreakdown = Object.entries(monthlyBreakdown)
      .map(([key, data]) => ({
        monthYear: key,
        ...data,
        grossPay: data.grossPay.toFixed(2),
        netPay: data.netPay.toFixed(2),
        deductions: data.deductions.toFixed(2),
      }))
      .sort((a, b) => b.monthYear.localeCompare(a.monthYear));

    // Recent payments (last 5)
    const recentPayments = payments.slice(0, 5).map((payment) => ({
      id: payment.id,
      period:
        payment.periodStart && payment.periodEnd
          // @ts-ignore
          ? `${new Date(payment.periodStart).toISOString().split("T")[0]} to ${
              // @ts-ignore
              new Date(payment.periodEnd).toISOString().split("T")[0]
            }`
          : "N/A",
      // @ts-ignore
      grossPay: parseFloat(payment.grossPay || 0).toFixed(2),
      // @ts-ignore
      netPay: parseFloat(payment.netPay || 0).toFixed(2),
      status: payment.status,
      paymentDate: payment.paymentDate
        // @ts-ignore
        ? new Date(payment.paymentDate).toISOString().split("T")[0]
        : "Pending",
    }));

    const averagePayment =
      summary.paymentCount > 0 ? summary.totalNet / summary.paymentCount : 0;
    const averageDeduction =
      summary.paymentCount > 0
        ? (summary.totalDebtDeductions +
            summary.totalManualDeductions +
            summary.totalOtherDeductions) /
          summary.paymentCount
        : 0;

    // Build timePeriod info for response
    const timePeriod = {};
    if (appliedStart)
      timePeriod.startDate = appliedStart.toISOString().split("T")[0];
    if (appliedEnd) timePeriod.endDate = appliedEnd.toISOString().split("T")[0];
    if (!appliedStart && !appliedEnd) {
      // @ts-ignore
      timePeriod.year = year || "All";
      // @ts-ignore
      timePeriod.month = month
        ? new Date(2000, month - 1).toLocaleString("default", { month: "long" })
        : "All";
    }

    return {
      status: true,
      message: "Worker payment summary retrieved successfully",
      data: {
        worker: {
          id: worker.id,
          name: worker.name,
          status: worker.status,
          hireDate: worker.hireDate,
        },
        summary: {
          totalPayments: summary.paymentCount,
          totalGross: summary.totalGross.toFixed(2),
          totalNet: summary.totalNet.toFixed(2),
          totalDeductions: (
            summary.totalDebtDeductions +
            summary.totalManualDeductions +
            summary.totalOtherDeductions
          ).toFixed(2),
          breakdown: {
            debt: summary.totalDebtDeductions.toFixed(2),
            manual: summary.totalManualDeductions.toFixed(2),
            other: summary.totalOtherDeductions.toFixed(2),
          },
          averages: {
            payment: averagePayment.toFixed(2),
            deduction: averageDeduction.toFixed(2),
          },
          statusDistribution: summary.statusCounts,
        },
        monthlyBreakdown: formattedMonthlyBreakdown,
        recentPayments,
        timePeriod,
      },
    };
  } catch (error) {
    console.error("Error in getWorkerPaymentSummary:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker payment summary: ${error.message}`,
      data: null,
    };
  }
};
