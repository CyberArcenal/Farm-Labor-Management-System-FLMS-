// ipc/payment/get/with_details.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const PaymentHistory = require("../../../../entities/PaymentHistory");
const DebtHistory = require("../../../../entities/DebtHistory");
const Worker = require("../../../../entities/Worker");
const Debt = require("../../../../entities/Debt");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentWithDetails(params = {}) {
  try {
    // @ts-ignore
    const { paymentId } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Get payment with all related data
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: [
        'worker',
        'pitak',
        'pitak.bukid',
        'history',
        'debtPayments',
        'debtPayments.debt'
      ]
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    // Get additional worker information
    const workerRepository = AppDataSource.getRepository(Worker);
    const worker = await workerRepository.findOne({
      // @ts-ignore
      where: { id: payment.worker.id },
      relations: ['kabisilya']
    });

    // Get worker's active debts for context
    const debtRepository = AppDataSource.getRepository(Debt);
    const workerDebts = await debtRepository.find({
      where: { 
        // @ts-ignore
        worker: { id: payment.worker.id },
        status: ['pending', 'partially_paid']
      },
      order: { dueDate: 'ASC' }
    });

    // Get detailed payment history
    const paymentHistoryRepository = AppDataSource.getRepository(PaymentHistory);
    const paymentHistory = await paymentHistoryRepository.find({
      // @ts-ignore
      where: { payment: { id: paymentId } },
      order: { changeDate: 'DESC' }
    });

    // Get all debt payments linked to this payment
    const debtHistoryRepository = AppDataSource.getRepository(DebtHistory);
    const linkedDebtPayments = await debtHistoryRepository.find({
      // @ts-ignore
      where: { payment: { id: paymentId } },
      relations: ['debt'],
      order: { transactionDate: 'DESC' }
    });

    // Calculate deduction breakdown
    const deductionBreakdown = {
      // @ts-ignore
      total: parseFloat(payment.totalDebtDeduction) + 
             // @ts-ignore
             parseFloat(payment.manualDeduction || 0) + 
             // @ts-ignore
             parseFloat(payment.otherDeductions || 0),
      byCategory: {
        // @ts-ignore
        debt: parseFloat(payment.totalDebtDeduction),
        // @ts-ignore
        manual: parseFloat(payment.manualDeduction || 0),
        // @ts-ignore
        other: parseFloat(payment.otherDeductions || 0)
      },
      detailed: payment.deductionBreakdown || {}
    };

    // Calculate worker payment statistics
    const workerStats = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(payment.id) as totalPayments',
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'AVG(payment.netPay) as averagePayment'
      ])
      // @ts-ignore
      .where('payment.workerId = :workerId', { workerId: payment.worker.id })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    // Calculate pitak payment statistics (if applicable)
    let pitakStats = null;
    // @ts-ignore
    if (payment.pitak) {
      pitakStats = await paymentRepository
        .createQueryBuilder('payment')
        .select([
          'COUNT(payment.id) as totalPayments',
          'SUM(payment.netPay) as totalPaid',
          'COUNT(DISTINCT payment.workerId) as uniqueWorkers'
        ])
        // @ts-ignore
        .where('payment.pitakId = :pitakId', { pitakId: payment.pitak.id })
        .getRawOne();
    }

    // Format the detailed response
    const detailedPayment = {
      payment: {
        ...payment,
        // @ts-ignore
        grossPay: parseFloat(payment.grossPay),
        // @ts-ignore
        netPay: parseFloat(payment.netPay),
        // @ts-ignore
        totalDebtDeduction: parseFloat(payment.totalDebtDeduction),
        // @ts-ignore
        manualDeduction: parseFloat(payment.manualDeduction || 0),
        // @ts-ignore
        otherDeductions: parseFloat(payment.otherDeductions || 0),
        // @ts-ignore
        createdAt: payment.createdAt.toISOString(),
        // @ts-ignore
        updatedAt: payment.updatedAt.toISOString(),
        // @ts-ignore
        paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : null,
        // @ts-ignore
        periodStart: payment.periodStart ? payment.periodStart.toISOString() : null,
        // @ts-ignore
        periodEnd: payment.periodEnd ? payment.periodEnd.toISOString() : null
      },
      worker: {
        ...worker,
        // @ts-ignore
        totalDebt: parseFloat(worker.totalDebt),
        // @ts-ignore
        totalPaid: parseFloat(worker.totalPaid),
        // @ts-ignore
        currentBalance: parseFloat(worker.currentBalance),
        // @ts-ignore
        hireDate: worker.hireDate ? worker.hireDate.toISOString() : null,
        // @ts-ignore
        createdAt: worker.createdAt.toISOString(),
        // @ts-ignore
        updatedAt: worker.updatedAt.toISOString()
      },
      // @ts-ignore
      pitak: payment.pitak ? {
        // @ts-ignore
        ...payment.pitak,
        // @ts-ignore
        totalLuwang: parseFloat(payment.pitak.totalLuwang),
        // @ts-ignore
        createdAt: payment.pitak.createdAt.toISOString(),
        // @ts-ignore
        updatedAt: payment.pitak.updatedAt.toISOString()
      } : null,
      // @ts-ignore
      bukid: payment.pitak && payment.pitak.bukid ? payment.pitak.bukid : null,
      // @ts-ignore
      kabisilya: worker.kabisilya || null,
      deductionBreakdown,
      history: paymentHistory.map(record => ({
        id: record.id,
        actionType: record.actionType,
        changedField: record.changedField,
        oldValue: record.oldValue,
        newValue: record.newValue,
        // @ts-ignore
        oldAmount: record.oldAmount ? parseFloat(record.oldAmount) : null,
        // @ts-ignore
        newAmount: record.newAmount ? parseFloat(record.newAmount) : null,
        notes: record.notes,
        performedBy: record.performedBy,
        // @ts-ignore
        changeDate: record.changeDate.toISOString()
      })),
      linkedDebtPayments: linkedDebtPayments.map(dp => ({
        id: dp.id,
        // @ts-ignore
        amountPaid: parseFloat(dp.amountPaid),
        // @ts-ignore
        previousBalance: parseFloat(dp.previousBalance),
        // @ts-ignore
        newBalance: parseFloat(dp.newBalance),
        transactionType: dp.transactionType,
        paymentMethod: dp.paymentMethod,
        referenceNumber: dp.referenceNumber,
        notes: dp.notes,
        // @ts-ignore
        transactionDate: dp.transactionDate.toISOString(),
        debt: {
          // @ts-ignore
          id: dp.debt.id,
          // @ts-ignore
          originalAmount: parseFloat(dp.debt.originalAmount),
          // @ts-ignore
          amount: parseFloat(dp.debt.amount),
          // @ts-ignore
          balance: parseFloat(dp.debt.balance),
          // @ts-ignore
          reason: dp.debt.reason,
          // @ts-ignore
          status: dp.debt.status
        }
      })),
      workerDebts: workerDebts.map(debt => ({
        id: debt.id,
        // @ts-ignore
        originalAmount: parseFloat(debt.originalAmount),
        // @ts-ignore
        amount: parseFloat(debt.amount),
        // @ts-ignore
        balance: parseFloat(debt.balance),
        reason: debt.reason,
        status: debt.status,
        // @ts-ignore
        dueDate: debt.dueDate ? debt.dueDate.toISOString() : null,
        // @ts-ignore
        interestRate: parseFloat(debt.interestRate),
        // @ts-ignore
        totalInterest: parseFloat(debt.totalInterest),
        // @ts-ignore
        totalPaid: parseFloat(debt.totalPaid)
      })),
      statistics: {
        worker: {
          totalPayments: parseInt(workerStats.totalpayments || 0),
          totalGross: parseFloat(workerStats.totalgross || 0),
          totalNet: parseFloat(workerStats.totalnet || 0),
          averagePayment: parseFloat(workerStats.averagepayment || 0)
        },
        pitak: pitakStats ? {
          totalPayments: parseInt(pitakStats.totalpayments || 0),
          totalPaid: parseFloat(pitakStats.totalpaid || 0),
          uniqueWorkers: parseInt(pitakStats.uniqueworkers || 0)
        } : null
      },
      timeline: {
        // @ts-ignore
        created: payment.createdAt.toISOString(),
        // @ts-ignore
        lastUpdated: payment.updatedAt.toISOString(),
        // @ts-ignore
        paymentDate: payment.paymentDate ? payment.paymentDate.toISOString() : null,
        period: payment.periodStart && payment.periodEnd 
          // @ts-ignore
          ? `${payment.periodStart.toISOString().split('T')[0]} to ${payment.periodEnd.toISOString().split('T')[0]}`
          : null
      }
    };

    return {
      status: true,
      message: 'Payment with details retrieved successfully',
      data: detailedPayment
    };
  } catch (error) {
    console.error('Error in getPaymentWithDetails:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payment with details: ${error.message}`,
      data: null
    };
  }
};