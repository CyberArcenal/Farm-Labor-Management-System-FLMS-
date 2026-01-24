// ipc/payment/generate_report.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function generatePaymentReport(params = {}) {
  try {
    const { 
      // @ts-ignore
      format = 'pdf', 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate, 
      // @ts-ignore
      workerId,
      // @ts-ignore
      status,
      // @ts-ignore
      reportType = 'summary'
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

    if (workerId) {
      queryBuilder.andWhere('payment.workerId = :workerId', { workerId });
    }

    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    const payments = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .getMany();

    // Calculate totals
    const totals = payments.reduce((/** @type {{ totalGross: number; totalNet: number; totalDebt: number; totalManual: number; totalOther: number; count: number; }} */ acc, /** @type {{ grossPay: string; netPay: string; totalDebtDeduction: string; manualDeduction: any; otherDeductions: any; }} */ payment) => {
      acc.totalGross += parseFloat(payment.grossPay);
      acc.totalNet += parseFloat(payment.netPay);
      acc.totalDebt += parseFloat(payment.totalDebtDeduction);
      acc.totalManual += parseFloat(payment.manualDeduction || 0);
      acc.totalOther += parseFloat(payment.otherDeductions || 0);
      acc.count++;
      return acc;
    }, {
      totalGross: 0,
      totalNet: 0,
      totalDebt: 0,
      totalManual: 0,
      totalOther: 0,
      count: 0
    });

    // Status breakdown
    const statusBreakdown = payments.reduce((/** @type {{ [x: string]: any; }} */ acc, /** @type {{ status: string | number; }} */ payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1;
      return acc;
    }, {});

    const reportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        period: startDate && endDate 
          ? `${startDate} to ${endDate}`
          : 'All time',
        filters: {
          workerId: workerId || 'All',
          status: status || 'All'
        }
      },
      summary: {
        totalPayments: totals.count,
        totalGross: totals.totalGross.toFixed(2),
        totalNet: totals.totalNet.toFixed(2),
        totalDeductions: (totals.totalDebt + totals.totalManual + totals.totalOther).toFixed(2),
        statusBreakdown
      },
      payments: payments.map((/** @type {{ id: any; worker: { name: any; }; grossPay: string; netPay: string; totalDebtDeduction: string; manualDeduction: any; otherDeductions: any; status: any; paymentDate: { toISOString: () => string; }; periodStart: { toISOString: () => string; }; periodEnd: { toISOString: () => string; }; }} */ p) => ({
        id: p.id,
        worker: p.worker.name,
        grossPay: parseFloat(p.grossPay).toFixed(2),
        netPay: parseFloat(p.netPay).toFixed(2),
        deductions: {
          debt: parseFloat(p.totalDebtDeduction).toFixed(2),
          manual: parseFloat(p.manualDeduction || 0).toFixed(2),
          other: parseFloat(p.otherDeductions || 0).toFixed(2)
        },
        status: p.status,
        paymentDate: p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : 'N/A',
        period: p.periodStart && p.periodEnd 
          ? `${p.periodStart.toISOString().split('T')[0]} to ${p.periodEnd.toISOString().split('T')[0]}`
          : 'N/A'
      }))
    };

    let reportContent;
    let fileName;
    let contentType;

    if (format === 'csv') {
      // Generate CSV
      const json2csvParser = new Parser();
      reportContent = json2csvParser.parse(reportData.payments);
      fileName = `payment_report_${new Date().toISOString().split('T')[0]}.csv`;
      contentType = 'text/csv';
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      /**
         * @type {any[] | readonly Uint8Array<ArrayBufferLike>[]}
         */
      const chunks = [];
      
      // @ts-ignore
      doc.on('data', chunk => chunks.push(chunk));
      
      // PDF content
      doc.fontSize(20).text('Payment Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
      doc.text(`Period: ${reportData.metadata.period}`);
      doc.text(`Total Payments: ${reportData.summary.totalPayments}`);
      doc.moveDown();
      
      // Summary table
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10);
      doc.text(`Total Gross: ₱${reportData.summary.totalGross}`);
      doc.text(`Total Net: ₱${reportData.summary.totalNet}`);
      doc.text(`Total Deductions: ₱${reportData.summary.totalDeductions}`);
      doc.moveDown();
      
      // Status breakdown
      doc.fontSize(14).text('Status Breakdown', { underline: true });
      doc.moveDown(0.5);
      
      for (const [status, count] of Object.entries(reportData.summary.statusBreakdown)) {
        doc.text(`${status}: ${count}`);
      }
      doc.moveDown();
      
      // Payment details (first 20)
      if (reportData.payments.length > 0) {
        doc.fontSize(14).text('Payment Details', { underline: true });
        doc.moveDown(0.5);
        
        reportData.payments.slice(0, 20).forEach((/** @type {{ worker: any; netPay: any; status: any; }} */ payment, /** @type {number} */ index) => {
          doc.text(`${index + 1}. ${payment.worker} - ₱${payment.netPay} (${payment.status})`);
        });
        
        if (reportData.payments.length > 20) {
          doc.moveDown();
          doc.text(`... and ${reportData.payments.length - 20} more payments`);
        }
      }
      
      doc.end();
      
      // Wait for PDF to finish
      reportContent = await new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      });
      
      fileName = `payment_report_${new Date().toISOString().split('T')[0]}.pdf`;
      contentType = 'application/pdf';
    } else if (format === 'json') {
      reportContent = JSON.stringify(reportData, null, 2);
      fileName = `payment_report_${new Date().toISOString().split('T')[0]}.json`;
      contentType = 'application/json';
    }

    return {
      status: true,
      message: 'Payment report generated successfully',
      data: {
        format,
        content: reportContent,
        fileName,
        contentType,
        summary: {
          paymentCount: payments.length,
          totals: reportData.summary
        }
      }
    };
  } catch (error) {
    console.error('Error in generatePaymentReport:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate payment report: ${error.message}`,
      data: null
    };
  }
};