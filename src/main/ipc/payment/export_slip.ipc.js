// ipc/payment/export_slip.ipc.js
//@ts-check

const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');
const Payment = require("../../../entities/Payment");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require('../../db/dataSource');

module.exports = async function exportPaymentSlip(params = {}) {
  try {
    // @ts-ignore
    const { paymentId, format = 'pdf', _userId } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    
    // Get payment with all details
    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['worker', 'pitak', 'pitak.bukid', 'debtPayments', 'debtPayments.debt']
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    if (format.toLowerCase() !== 'pdf') {
      return {
        status: false,
        message: 'Only PDF format is supported for payment slips',
        data: null
      };
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Payment Slip #${payment.id}`,
        Author: 'Kabisilya Management System',
        Subject: 'Payment Receipt',
        Keywords: 'payment, slip, receipt, kabisilya',
        Creator: 'Kabisilya Management System',
        CreationDate: new Date()
      }
    });

    // Create buffer for PDF content
    /**
       * @type {any[] | readonly Uint8Array<ArrayBufferLike>[]}
       */
    const chunks = [];
    // @ts-ignore
    doc.on('data', chunk => chunks.push(chunk));
    
    // Generate PDF content
    generatePaymentSlipContent(doc, payment);

    // Finalize PDF
    doc.end();

    // Wait for PDF to finish
    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Generate filename
    // @ts-ignore
    const fileName = `payment_slip_${payment.id}_${payment.worker.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save to temporary file (optional)
    const tempDir = path.join(__dirname, '../../../../temp');
    const filePath = path.join(tempDir, fileName);
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(filePath, pdfBuffer);
    } catch (error) {
      // @ts-ignore
      console.warn('Could not save PDF to file:', error.message);
      // Continue even if file save fails
    }

    // Log activity
    const activityRepo = AppDataSource.getRepository(UserActivity);
    // @ts-ignore
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'export_payment_slip',
      description: `Exported payment slip for payment #${paymentId}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    return {
      status: true,
      message: 'Payment slip generated successfully',
      data: {
        format: 'pdf',
        content: pdfBuffer,
        fileName,
        filePath: filePath,
        contentType: 'application/pdf',
        paymentDetails: {
          id: payment.id,
          // @ts-ignore
          workerName: payment.worker.name,
          // @ts-ignore
          amount: parseFloat(payment.netPay),
          status: payment.status,
          // @ts-ignore
          paymentDate: payment.paymentDate ? payment.paymentDate.toISOString().split('T')[0] : 'Pending'
        }
      }
    };
  } catch (error) {
    console.error('Error in exportPaymentSlip:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to export payment slip: ${error.message}`,
      data: null
    };
  }
};

/**
 * @param {PDFKit.PDFDocument} doc
 * @param {{ id?: any; status?: any; paymentDate?: any; periodStart?: any; periodEnd?: any; grossPay?: any; totalDebtDeduction?: any; manualDeduction?: any; otherDeductions?: any; netPay?: any; paymentMethod?: any; referenceNumber?: any; notes?: any; worker?: any; pitak?: any; }} payment
 */
function generatePaymentSlipContent(doc, payment) {
  const { worker, pitak } = payment;
  
  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('PAYMENT SLIP', { align: 'center' });
  doc.moveDown();
  
  // Company Info
  doc.fontSize(10).font('Helvetica').text('Kabisilya Management System', { align: 'center' });
  doc.text('Payment Receipt', { align: 'center' });
  doc.moveDown(2);
  
  // Payment Details
  doc.fontSize(12).font('Helvetica-Bold').text('Payment Details', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica');
  doc.text(`Payment ID: ${payment.id}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.text(`Status: ${payment.status.toUpperCase()}`);
  if (payment.paymentDate) {
    doc.text(`Payment Date: ${payment.paymentDate.toLocaleDateString()}`);
  }
  doc.moveDown();
  
  // Worker Information
  doc.fontSize(12).font('Helvetica-Bold').text('Worker Information', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(10).font('Helvetica');
  doc.text(`Name: ${worker.name}`);
  if (worker.contact) doc.text(`Contact: ${worker.contact}`);
  if (worker.address) doc.text(`Address: ${worker.address}`);
  doc.moveDown();
  
  // Work Information
  if (pitak) {
    doc.fontSize(12).font('Helvetica-Bold').text('Work Information', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Pitak: ${pitak.location || 'Not specified'}`);
    if (pitak.bukid) {
      doc.text(`Bukid: ${pitak.bukid.name}`);
    }
    doc.moveDown();
  }
  
  // Period Information
  if (payment.periodStart && payment.periodEnd) {
    doc.fontSize(12).font('Helvetica-Bold').text('Period Covered', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`From: ${payment.periodStart.toLocaleDateString()}`);
    doc.text(`To: ${payment.periodEnd.toLocaleDateString()}`);
    doc.moveDown();
  }
  
  // Payment Breakdown
  doc.fontSize(12).font('Helvetica-Bold').text('Payment Breakdown', { underline: true });
  doc.moveDown(0.5);
  
  // Create table for payment breakdown
  const tableTop = doc.y;
  const tableLeft = 50;
  const columnWidth = 120;
  
  // Table headers
  doc.font('Helvetica-Bold');
  doc.text('Description', tableLeft, tableTop);
  doc.text('Amount', tableLeft + columnWidth, tableTop, { width: 100, align: 'right' });
  
  doc.moveDown(0.5);
  const contentTop = doc.y;
  
  // Table content
  doc.font('Helvetica');
  doc.text('Gross Pay', tableLeft, contentTop);
  doc.text(`₱${parseFloat(payment.grossPay).toFixed(2)}`, tableLeft + columnWidth, contentTop, { width: 100, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Debt Deductions', tableLeft, doc.y);
  doc.text(`-₱${parseFloat(payment.totalDebtDeduction || 0).toFixed(2)}`, tableLeft + columnWidth, doc.y, { width: 100, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Manual Deductions', tableLeft, doc.y);
  doc.text(`-₱${parseFloat(payment.manualDeduction || 0).toFixed(2)}`, tableLeft + columnWidth, doc.y, { width: 100, align: 'right' });
  
  doc.moveDown(0.5);
  doc.text('Other Deductions', tableLeft, doc.y);
  doc.text(`-₱${parseFloat(payment.otherDeductions || 0).toFixed(2)}`, tableLeft + columnWidth, doc.y, { width: 100, align: 'right' });
  
  doc.moveDown(1);
  
  // Total line
  doc.moveTo(tableLeft, doc.y).lineTo(tableLeft + 250, doc.y).stroke();
  doc.moveDown(0.5);
  
  doc.font('Helvetica-Bold');
  doc.text('NET PAY', tableLeft, doc.y);
  doc.text(`₱${parseFloat(payment.netPay).toFixed(2)}`, tableLeft + columnWidth, doc.y, { width: 100, align: 'right' });
  
  doc.moveDown(2);
  
  // Payment Method
  if (payment.paymentMethod) {
    doc.fontSize(10).font('Helvetica');
    doc.text(`Payment Method: ${payment.paymentMethod}`);
    if (payment.referenceNumber) {
      doc.text(`Reference Number: ${payment.referenceNumber}`);
    }
    doc.moveDown();
  }
  
  // Notes
  if (payment.notes) {
    doc.fontSize(12).font('Helvetica-Bold').text('Notes', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(payment.notes, { width: 500 });
    doc.moveDown();
  }
  
  // Footer
  const footerY = 750;
  doc.moveTo(50, footerY).lineTo(550, footerY).stroke();
  doc.moveDown(0.5);
  
  doc.fontSize(8).font('Helvetica');
  doc.text('This is an electronically generated document and does not require a signature.', { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.text(`Document ID: PAY-${payment.id}-${Date.now()}`, { align: 'center' });
  
  // Add page border
  doc.rect(25, 25, 550, 800).stroke();
}

// Helper function for other formats if needed
/**
 * @param {{ id?: any; status?: any; grossPay?: any; totalDebtDeduction?: any; manualDeduction?: any; otherDeductions?: any; netPay?: any; worker?: any; pitak?: any; }} payment
 */
// @ts-ignore
function generatePaymentSlipText(payment) {
  // @ts-ignore
  const { worker, pitak } = payment;
  
  let text = '';
  text += '========================================\n';
  text += '          PAYMENT SLIP\n';
  text += '========================================\n\n';
  text += `Payment ID: ${payment.id}\n`;
  text += `Date: ${new Date().toLocaleDateString()}\n`;
  text += `Status: ${payment.status.toUpperCase()}\n\n`;
  text += 'Worker Information:\n';
  text += `  Name: ${worker.name}\n`;
  if (worker.contact) text += `  Contact: ${worker.contact}\n`;
  text += '\n';
  text += 'Payment Breakdown:\n';
  text += `  Gross Pay: ₱${parseFloat(payment.grossPay).toFixed(2)}\n`;
  text += `  Debt Deductions: -₱${parseFloat(payment.totalDebtDeduction || 0).toFixed(2)}\n`;
  text += `  Manual Deductions: -₱${parseFloat(payment.manualDeduction || 0).toFixed(2)}\n`;
  text += `  Other Deductions: -₱${parseFloat(payment.otherDeductions || 0).toFixed(2)}\n`;
  text += '  ---------------------------------\n';
  text += `  NET PAY: ₱${parseFloat(payment.netPay).toFixed(2)}\n\n`;
  text += '========================================\n';
  text += 'End of Payment Slip\n';
  text += '========================================\n';
  
  return text;
}