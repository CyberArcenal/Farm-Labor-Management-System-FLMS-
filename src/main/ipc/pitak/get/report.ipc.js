// src/ipc/pitak/get/report.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (dateRange = {}, filters = {}, /** @type {any} */ userId) => {
  try {
    // @ts-ignore
    const { startDate, endDate } = dateRange;
    
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Start date and end date are required for the report",
        data: null
      };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Build base query for pitaks
    const pitakQuery = pitakRepo.createQueryBuilder('pitak')
      .leftJoinAndSelect('pitak.bukid', 'bukid')
      .leftJoin('bukid.kabisilya', 'kabisilya')
      .addSelect(['kabisilya.id', 'kabisilya.name']);

    // Apply filters
    // @ts-ignore
    if (filters.bukidId) {
      // @ts-ignore
      pitakQuery.andWhere('pitak.bukidId = :bukidId', { bukidId: filters.bukidId });
    }
    
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      pitakQuery.andWhere('pitak.status = :status', { status: filters.status });
    }

    const pitaks = await pitakQuery.getMany();

    // Generate detailed report for each pitak
    const reportData = await Promise.all(pitaks.map(async (/** @type {{ id: any; location: any; totalLuwang: string; status: any; bukid: { id: any; name: any; kabisilya: any; }; }} */ pitak) => {
      // Get assignments within date range
      const assignmentsQuery = assignmentRepo.createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.worker', 'worker')
        .where('assignment.pitakId = :pitakId', { pitakId: pitak.id })
        .andWhere('assignment.assignmentDate BETWEEN :startDate AND :endDate', {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        });

      // @ts-ignore
      if (filters.workerId) {
        // @ts-ignore
        assignmentsQuery.andWhere('assignment.workerId = :workerId', { workerId: filters.workerId });
      }

      const assignments = await assignmentsQuery.getMany();

      // Get payments within date range
      const paymentsQuery = paymentRepo.createQueryBuilder('payment')
        .leftJoinAndSelect('payment.worker', 'worker')
        .where('payment.pitakId = :pitakId', { pitakId: pitak.id })
        .andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        });

      // @ts-ignore
      if (filters.workerId) {
        // @ts-ignore
        paymentsQuery.andWhere('payment.workerId = :workerId', { workerId: filters.workerId });
      }

      const payments = await paymentsQuery.getMany();

      // Calculate metrics
      const assignmentStats = assignments.reduce((/** @type {{ totalLuWang: number; completedCount: string | number; activeCount: string | number; cancelledCount: string | number; }} */ stats, /** @type {{ luwangCount: string; status: string; }} */ assignment) => {
        stats.totalLuWang += parseFloat(assignment.luwangCount) || 0;
        // @ts-ignore
        stats.completedCount += assignment.status === 'completed' ? 1 : 0;
        // @ts-ignore
        stats.activeCount += assignment.status === 'active' ? 1 : 0;
        // @ts-ignore
        stats.cancelledCount += assignment.status === 'cancelled' ? 1 : 0;
        return stats;
      }, {
        totalAssignments: assignments.length,
        totalLuWang: 0,
        completedCount: 0,
        activeCount: 0,
        cancelledCount: 0
      });

      const paymentStats = payments.reduce((/** @type {{ totalGrossPay: number; totalNetPay: number; totalDebtDeduction: number; completedCount: string | number; }} */ stats, /** @type {{ grossPay: string; netPay: string; totalDebtDeduction: string; status: string; }} */ payment) => {
        stats.totalGrossPay += parseFloat(payment.grossPay) || 0;
        stats.totalNetPay += parseFloat(payment.netPay) || 0;
        stats.totalDebtDeduction += parseFloat(payment.totalDebtDeduction) || 0;
        // @ts-ignore
        stats.completedCount += payment.status === 'completed' ? 1 : 0;
        return stats;
      }, {
        totalPayments: payments.length,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalDebtDeduction: 0,
        completedCount: 0
      });

      return {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          totalLuwang: parseFloat(pitak.totalLuwang),
          status: pitak.status,
          bukid: pitak.bukid ? {
            id: pitak.bukid.id,
            name: pitak.bukid.name,
            kabisilya: pitak.bukid.kabisilya
          } : null
        },
        assignmentMetrics: assignmentStats,
        paymentMetrics: paymentStats,
        assignments: assignments.map((/** @type {{ id: any; assignmentDate: any; luwangCount: string; status: any; worker: { id: any; name: any; }; }} */ a) => ({
          id: a.id,
          assignmentDate: a.assignmentDate,
          luwangCount: parseFloat(a.luwangCount),
          status: a.status,
          worker: a.worker ? {
            id: a.worker.id,
            name: a.worker.name
          } : null
        })),
        payments: payments.map((/** @type {{ id: any; paymentDate: any; grossPay: string; netPay: string; status: any; worker: { id: any; name: any; }; }} */ p) => ({
          id: p.id,
          paymentDate: p.paymentDate,
          grossPay: parseFloat(p.grossPay),
          netPay: parseFloat(p.netPay),
          status: p.status,
          worker: p.worker ? {
            id: p.worker.id,
            name: p.worker.name
          } : null
        }))
      };
    }));

    // Calculate summary totals
    const summary = reportData.reduce((/** @type {{ totalPitaks: number; totalLuWangCapacity: number; totalAssignments: any; totalLuWangAssigned: any; totalPayments: any; totalGrossPay: any; totalNetPay: any; activePitaks: number; inactivePitaks: number; harvestedPitaks: number; }} */ totals, /** @type {{ pitak: { totalLuwang: string; status: string; }; assignmentMetrics: { totalAssignments: any; totalLuWang: any; }; paymentMetrics: { totalPayments: any; totalGrossPay: any; totalNetPay: any; }; }} */ item) => {
      totals.totalPitaks++;
      totals.totalLuWangCapacity += parseFloat(item.pitak.totalLuwang);
      totals.totalAssignments += item.assignmentMetrics.totalAssignments;
      totals.totalLuWangAssigned += item.assignmentMetrics.totalLuWang;
      totals.totalPayments += item.paymentMetrics.totalPayments;
      totals.totalGrossPay += item.paymentMetrics.totalGrossPay;
      totals.totalNetPay += item.paymentMetrics.totalNetPay;
      
      // Count by status
      if (item.pitak.status === 'active') totals.activePitaks++;
      if (item.pitak.status === 'inactive') totals.inactivePitaks++;
      if (item.pitak.status === 'harvested') totals.harvestedPitaks++;
      
      return totals;
    }, {
      totalPitaks: 0,
      activePitaks: 0,
      inactivePitaks: 0,
      harvestedPitaks: 0,
      totalLuWangCapacity: 0,
      totalAssignments: 0,
      totalLuWangAssigned: 0,
      totalPayments: 0,
      totalGrossPay: 0,
      totalNetPay: 0
    });

    // Calculate utilization rate
    summary.utilizationRate = summary.totalLuWangCapacity > 0 
      ? (summary.totalLuWangAssigned / summary.totalLuWangCapacity) * 100 
      : 0;

    return {
      status: true,
      message: "Pitak report generated successfully",
      data: {
        period: { startDate, endDate },
        filters,
        summary,
        detailedData: reportData,
        generatedAt: new Date()
      }
    };

  } catch (error) {
    console.error("Error generating pitak report:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate pitak report: ${error.message}`,
      data: null
    };
  }
};