// ipc/payment/import_csv.ipc.js
//@ts-check

const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require('../../db/dataSource');

module.exports = async function importPaymentsFromCSV(params = {}, queryRunner = null) {
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
    const { filePath, _userId } = params;
    
    if (!filePath) {
      return {
        status: false,
        message: 'File path is required',
        data: null
      };
    }

    // Validate file exists and is CSV
    const fileExt = path.extname(filePath).toLowerCase();
    if (fileExt !== '.csv') {
      return {
        status: false,
        message: 'File must be a CSV file',
        data: null
      };
    }

    // Read and parse CSV file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rows = await parseCSV(fileContent);

    if (rows.length === 0) {
      return {
        status: false,
        message: 'CSV file is empty',
        data: null
      };
    }

    // Limit import size
    const MAX_IMPORT_SIZE = 1000;
    if (rows.length > MAX_IMPORT_SIZE) {
      return {
        status: false,
        message: `Cannot import more than ${MAX_IMPORT_SIZE} records at once`,
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    // @ts-ignore
    const paymentHistoryRepo = queryRunner.manager.getRepository(PaymentHistory);

    const results = {
      success: [],
      failed: [],
      total: rows.length,
      successCount: 0,
      failedCount: 0,
      validationErrors: []
    };

    // Validate CSV headers and structure
    const requiredHeaders = ['worker_name', 'gross_pay'];
    // @ts-ignore
    const optionalHeaders = [
      'worker_id', 'pitak_id', 'manual_deduction', 'other_deductions',
      'period_start', 'period_end', 'notes', 'payment_method', 'status'
    ];

    const headers = Object.keys(rows[0] || {});
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return {
        status: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`,
        data: null
      };
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because CSV has header and 0-index

      try {
        // Validate required fields
        if (!row.worker_name || !row.worker_name.trim()) {
          throw new Error('Worker name is required');
        }

        const grossPay = parseFloat(row.gross_pay);
        if (isNaN(grossPay) || grossPay <= 0) {
          throw new Error(`Invalid gross pay: ${row.gross_pay}`);
        }

        // Find worker by name or ID
        let worker;
        if (row.worker_id) {
          worker = await workerRepository.findOne({
            where: { id: parseInt(row.worker_id) }
          });
        }

        if (!worker && row.worker_name) {
          // Try to find by name
          worker = await workerRepository.findOne({
            where: { name: row.worker_name.trim() }
          });
        }

        if (!worker) {
          throw new Error(`Worker not found: ${row.worker_name}`);
        }

        // Parse other fields
        const manualDeduction = row.manual_deduction ? parseFloat(row.manual_deduction) : 0;
        const otherDeductions = row.other_deductions ? parseFloat(row.other_deductions) : 0;
        
        if (manualDeduction < 0 || otherDeductions < 0) {
          throw new Error('Deductions cannot be negative');
        }

        // Calculate net pay
        const netPay = Math.max(0, grossPay - manualDeduction - otherDeductions);

        // Parse dates
        let periodStart = null;
        let periodEnd = null;
        
        if (row.period_start) {
          periodStart = new Date(row.period_start);
          if (isNaN(periodStart.getTime())) {
            throw new Error(`Invalid period start date: ${row.period_start}`);
          }
        }

        if (row.period_end) {
          periodEnd = new Date(row.period_end);
          if (isNaN(periodEnd.getTime())) {
            throw new Error(`Invalid period end date: ${row.period_end}`);
          }
        }

        // Validate status if provided
        let status = 'pending';
        if (row.status) {
          const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'partially_paid'];
          if (!validStatuses.includes(row.status.toLowerCase())) {
            throw new Error(`Invalid status: ${row.status}. Must be one of: ${validStatuses.join(', ')}`);
          }
          status = row.status.toLowerCase();
        }

        // Create payment
        const payment = paymentRepository.create({
          worker: { id: worker.id },
          pitak: row.pitak_id ? { id: parseInt(row.pitak_id) } : null,
          grossPay: grossPay,
          manualDeduction: manualDeduction,
          otherDeductions: otherDeductions,
          netPay: netPay,
          periodStart: periodStart,
          periodEnd: periodEnd,
          paymentMethod: row.payment_method || null,
          status: status,
          notes: row.notes || null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Save payment
        const savedPayment = await paymentRepository.save(payment);

        // Create payment history
        const paymentHistory = paymentHistoryRepo.create({
          payment: savedPayment,
          actionType: 'create',
          changedField: 'status',
          oldValue: null,
          newValue: status,
          notes: 'Payment imported from CSV',
          performedBy: _userId,
          changeDate: new Date()
        });

        await paymentHistoryRepo.save(paymentHistory);

        // @ts-ignore
        results.success.push({
          rowNumber,
          paymentId: savedPayment.id,
          workerName: worker.name,
          grossPay: grossPay,
          netPay: netPay
        });
        results.successCount++;

      } catch (error) {
        // @ts-ignore
        results.failed.push({
          rowNumber,
          // @ts-ignore
          error: error.message,
          data: row
        });
        results.failedCount++;
      }
    }

    // Log activity
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'import_payments_csv',
      description: `Imported ${results.successCount} payments from CSV (${results.failedCount} failed)`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      if (results.successCount > 0) {
        // @ts-ignore
        await queryRunner.commitTransaction();
      } else {
        // @ts-ignore
        await queryRunner.rollbackTransaction();
      }
    }

    // Generate summary report
    const summary = {
      fileInfo: {
        path: filePath,
        name: path.basename(filePath),
        size: fileContent.length,
        rows: rows.length
      },
      importResults: {
        total: results.total,
        success: results.successCount,
        failed: results.failedCount,
        successRate: results.total > 0 ? (results.successCount / results.total) * 100 : 0
      },
      financialSummary: {
        // @ts-ignore
        totalGross: results.success.reduce((sum, item) => sum + item.grossPay, 0),
        // @ts-ignore
        totalNet: results.success.reduce((sum, item) => sum + item.netPay, 0),
        // @ts-ignore
        averageGross: results.successCount > 0 ? results.success.reduce((sum, item) => sum + item.grossPay, 0) / results.successCount : 0
      }
    };

    return {
      status: true,
      message: `CSV import completed: ${results.successCount} successful, ${results.failedCount} failed`,
      data: {
        summary,
        success: results.successCount,
        failed: results.failedCount,
        errors: results.failed,
        importedPayments: results.success.map(s => ({
          // @ts-ignore
          rowNumber: s.rowNumber,
          // @ts-ignore
          paymentId: s.paymentId,
          // @ts-ignore
          workerName: s.workerName,
          // @ts-ignore
          amount: s.netPay
        }))
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in importPaymentsFromCSV:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to import payments from CSV: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};

// @ts-ignore
async function parseCSV(csvContent) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    const rows = [];
    const stream = Readable.from(csvContent);
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        // Clean up the row data
        const cleanedRow = {};
        Object.keys(row).forEach(key => {
          // @ts-ignore
          cleanedRow[key.trim().toLowerCase()] = row[key] ? row[key].trim() : '';
        });
        rows.push(cleanedRow);
      })
      .on('end', () => {
        // @ts-ignore
        resolve(rows);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}