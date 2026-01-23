// src/ipc/pitak/get/by_id.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async (/** @type {any} */ id, /** @type {any} */ userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    
    const pitak = await pitakRepo.findOne({
      where: { id },
      relations: ['bukid', 'bukid.kabisilya', 'assignments', 'assignments.worker', 'payments']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Get recent assignments
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    const recentAssignments = await assignmentRepo.find({
      where: { pitakId: id },
      relations: ['worker'],
      order: { assignmentDate: 'DESC' },
      take: 10
    });

    // Get recent payments
    const paymentRepo = AppDataSource.getRepository(Payment);
    const recentPayments = await paymentRepo.find({
      where: { pitakId: id },
      relations: ['worker'],
      order: { paymentDate: 'DESC' },
      take: 10
    });

    // Calculate assignment stats
    const assignmentStats = await assignmentRepo
      .createQueryBuilder('assignment')
      .select([
        'COUNT(*) as totalAssignments',
        'SUM(assignment.luwangCount) as totalLuWangAssigned',
        'AVG(assignment.luwangCount) as averageLuWangPerAssignment',
        'SUM(CASE WHEN assignment.status = "completed" THEN 1 ELSE 0 END) as completedAssignments',
        'SUM(CASE WHEN assignment.status = "active" THEN 1 ELSE 0 END) as activeAssignments'
      ])
      .where('assignment.pitakId = :pitakId', { pitakId: id })
      .getRawOne();

    // Calculate payment stats
    const paymentStats = await paymentRepo
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as totalPayments',
        'SUM(payment.grossPay) as totalGrossPay',
        'SUM(payment.netPay) as totalNetPay',
        'AVG(payment.grossPay) as averageGrossPay',
        'SUM(CASE WHEN payment.status = "completed" THEN 1 ELSE 0 END) as completedPayments'
      ])
      .where('payment.pitakId = :pitakId', { pitakId: id })
      .getRawOne();

    return {
      status: true,
      message: "Pitak retrieved successfully",
      data: {
        id: pitak.id,
        location: pitak.location,
        totalLuwang: parseFloat(pitak.totalLuwang),
        status: pitak.status,
        bukid: pitak.bukid ? {
          id: pitak.bukid.id,
          name: pitak.bukid.name,
          location: pitak.bukid.location,
          kabisilya: pitak.bukid.kabisilya
        } : null,
        stats: {
          assignments: {
            total: parseInt(assignmentStats.totalAssignments) || 0,
            totalLuWangAssigned: parseFloat(assignmentStats.totalLuWangAssigned) || 0,
            averageLuWangPerAssignment: parseFloat(assignmentStats.averageLuWangPerAssignment) || 0,
            completed: parseInt(assignmentStats.completedAssignments) || 0,
            active: parseInt(assignmentStats.activeAssignments) || 0
          },
          payments: {
            total: parseInt(paymentStats.totalPayments) || 0,
            totalGrossPay: parseFloat(paymentStats.totalGrossPay) || 0,
            totalNetPay: parseFloat(paymentStats.totalNetPay) || 0,
            averageGrossPay: parseFloat(paymentStats.averageGrossPay) || 0,
            completed: parseInt(paymentStats.completedPayments) || 0
          }
        },
        recentAssignments: recentAssignments.map((/** @type {{ id: any; assignmentDate: any; luwangCount: string; status: any; worker: { id: any; name: any; }; }} */ a) => ({
          id: a.id,
          assignmentDate: a.assignmentDate,
          luwangCount: parseFloat(a.luwangCount),
          status: a.status,
          worker: a.worker ? {
            id: a.worker.id,
            name: a.worker.name
          } : null
        })),
        recentPayments: recentPayments.map((/** @type {{ id: any; paymentDate: any; grossPay: string; netPay: string; status: any; worker: { id: any; name: any; }; }} */ p) => ({
          id: p.id,
          paymentDate: p.paymentDate,
          grossPay: parseFloat(p.grossPay),
          netPay: parseFloat(p.netPay),
          status: p.status,
          worker: p.worker ? {
            id: p.worker.id,
            name: p.worker.name
          } : null
        })),
        createdAt: pitak.createdAt,
        updatedAt: pitak.updatedAt
      }
    };

  } catch (error) {
    console.error("Error retrieving pitak:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pitak: ${error.message}`,
      data: null
    };
  }
};