// src/ipc/pitak/export_payments.ipc.js
//@ts-check

const Pitak = require("../../../entities/Pitak");
const Payment = require("../../../entities/Payment");
const { stringify } = require('csv-stringify/sync');
const { AppDataSource } = require("../../db/dataSource");

module.exports = async (/** @type {{ pitakId: any; dateRange?: {} | undefined; _userId: any; }} */ params) => {
  try {
    const { pitakId, dateRange = {}, _userId } = params;

    if (!pitakId) {
      return { status: false, message: "Pitak ID is required", data: null };
    }

    const pitakRepo = AppDataSource.getRepository(Pitak);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Verify pitak exists
    const pitak = await pitakRepo.findOne({ 
      where: { id: pitakId },
      relations: ['bukid']
    });

    if (!pitak) {
      return { status: false, message: "Pitak not found", data: null };
    }

    // Build query for payments
    const query = paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .where('payment.pitakId = :pitakId', { pitakId });

    // Apply date range filter
    // @ts-ignore
    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere('payment.paymentDate BETWEEN :startDate AND :endDate', {
        // @ts-ignore
        startDate: new Date(dateRange.startDate),
        // @ts-ignore
        endDate: new Date(dateRange.endDate)
      });
    }

    // Get payments
    const payments = await query
      .orderBy('payment.paymentDate', 'DESC')
      .getMany();

    // Prepare CSV data
    // @ts-ignore
    const csvData = payments.map((/** @type {{ id: any; paymentDate: { toISOString: () => string; }; grossPay: string; netPay: string; manualDeduction: any; totalDebtDeduction: any; otherDeductions: any; status: any; paymentMethod: any; referenceNumber: any; periodStart: { toISOString: () => string; }; periodEnd: { toISOString: () => string; }; workerId: any; worker: { name: any; }; pitakId: any; pitak: { location: any; }; notes: any; createdAt: { toISOString: () => string; }; updatedAt: { toISOString: () => string; }; }} */ payment) => ({
      'Payment ID': payment.id,
      'Payment Date': payment.paymentDate ? payment.paymentDate.toISOString().split('T')[0] : '',
      'Gross Pay': parseFloat(payment.grossPay).toFixed(2),
      'Net Pay': parseFloat(payment.netPay).toFixed(2),
      'Manual Deduction': parseFloat(payment.manualDeduction || 0).toFixed(2),
      'Debt Deduction': parseFloat(payment.totalDebtDeduction || 0).toFixed(2),
      'Other Deductions': parseFloat(payment.otherDeductions || 0).toFixed(2),
      'Status': payment.status,
      'Payment Method': payment.paymentMethod || '',
      'Reference Number': payment.referenceNumber || '',
      'Period Start': payment.periodStart ? payment.periodStart.toISOString().split('T')[0] : '',
      'Period End': payment.periodEnd ? payment.periodEnd.toISOString().split('T')[0] : '',
      'Worker ID': payment.workerId,
      'Worker Name': payment.worker ? payment.worker.name : '',
      'Pitak ID': payment.pitakId,
      'Pitak Location': payment.pitak ? payment.pitak.location : '',
      'Notes': payment.notes || '',
      'Created Date': payment.createdAt.toISOString().split('T')[0],
      'Updated Date': payment.updatedAt ? payment.updatedAt.toISOString().split('T')[0] : ''
    }));

    // Generate CSV
    const csv = stringify(csvData, {
      header: true,
      quoted: true,
      delimiter: ','
    });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pitakLocation = pitak.location || pitak.id;
    const filename = `pitak_${pitakLocation}_payments_${timestamp}.csv`;

    // Calculate summary
    // @ts-ignore
    const summary = payments.reduce((/** @type {{ totalPayments: number; totalGrossPay: number; totalNetPay: number; totalDeductions: number; completed: number; }} */ sum, /** @type {{ grossPay: string; netPay: string; totalDebtDeduction: string; otherDeductions: string; status: string; }} */ payment) => {
      sum.totalPayments++;
      sum.totalGrossPay += parseFloat(payment.grossPay);
      sum.totalNetPay += parseFloat(payment.netPay);
      sum.totalDeductions += parseFloat(payment.totalDebtDeduction) + 
                            parseFloat(payment.otherDeductions);
      if (payment.status === 'completed') sum.completed++;
      return sum;
    }, {
      totalPayments: 0,
      totalGrossPay: 0,
      totalNetPay: 0,
      totalDeductions: 0,
      completed: 0
    });

    // Log activity
    // @ts-ignore
    await AppDataSource.getRepository(UserActivity).save({
      user_id: _userId,
      action: 'export_pitak_payments',
      entity: 'Pitak',
      entity_id: pitakId,
      details: JSON.stringify({
        dateRange,
        paymentCount: payments.length,
        filename,
        summary
      })
    });

    return {
      status: true,
      message: "Payments export completed",
      data: {
        csv,
        filename,
        pitak: {
          id: pitak.id,
          location: pitak.location,
          // @ts-ignore
          totalLuwang: parseFloat(pitak.totalLuwang)
        },
        summary: {
          // @ts-ignore
          totalPayments: summary.totalPayments,
          // @ts-ignore
          totalGrossPay: summary.totalGrossPay.toFixed(2),
          // @ts-ignore
          totalNetPay: summary.totalNetPay.toFixed(2),
          // @ts-ignore
          totalDeductions: summary.totalDeductions.toFixed(2),
          // @ts-ignore
          completed: summary.completed
        },
        // @ts-ignore
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
      }
    };

  } catch (error) {
    console.error("Error exporting pitak payments:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export payments: ${error.message}`,
      data: null
    };
  }
};