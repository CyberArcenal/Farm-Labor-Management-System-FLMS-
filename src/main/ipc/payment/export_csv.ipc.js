// ipc/payment/export_csv.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const { Parser } = require('json2csv');
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function exportPaymentsToCSV(params = {}) {
  try {
    const { 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate, 
      // @ts-ignore
      status,
      // @ts-ignore
      workerId,
      // @ts-ignore
      format = 'csv' 
    } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak');

    // Apply filters
    if (startDate) {
      queryBuilder.andWhere('payment.createdAt >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.createdAt <= :endDate', { 
        endDate: new Date(endDate) 
      });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (workerId) {
      queryBuilder.andWhere('payment.workerId = :workerId', { workerId });
    }

    const payments = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    // Format data for CSV
    const formattedData = payments.map((/** @type {{ id: any; worker: { name: any; }; grossPay: any; netPay: any; totalDebtDeduction: any; manualDeduction: any; otherDeductions: any; status: any; paymentDate: { toISOString: () => string; }; periodStart: { toISOString: () => string; }; periodEnd: { toISOString: () => string; }; paymentMethod: any; referenceNumber: any; notes: any; createdAt: { toISOString: () => any; }; }} */ payment) => ({
      'Payment ID': payment.id,
      'Worker Name': payment.worker?.name || 'N/A',
      'Gross Pay': payment.grossPay,
      'Net Pay': payment.netPay,
      'Debt Deductions': payment.totalDebtDeduction,
      'Manual Deductions': payment.manualDeduction,
      'Other Deductions': payment.otherDeductions,
      'Status': payment.status,
      'Payment Date': payment.paymentDate ? payment.paymentDate.toISOString().split('T')[0] : 'N/A',
      'Period Start': payment.periodStart ? payment.periodStart.toISOString().split('T')[0] : 'N/A',
      'Period End': payment.periodEnd ? payment.periodEnd.toISOString().split('T')[0] : 'N/A',
      'Payment Method': payment.paymentMethod || 'N/A',
      'Reference Number': payment.referenceNumber || 'N/A',
      'Notes': payment.notes || '',
      'Created At': payment.createdAt.toISOString()
    }));

    // Generate CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(formattedData);

    return {
      status: true,
      message: 'Payments exported successfully',
      data: {
        format,
        content: csv,
        count: payments.length,
        fileName: `payments_export_${new Date().toISOString().split('T')[0]}.csv`
      }
    };
  } catch (error) {
    console.error('Error in exportPaymentsToCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export payments: ${error.message}`,
      data: null
    };
  }
};