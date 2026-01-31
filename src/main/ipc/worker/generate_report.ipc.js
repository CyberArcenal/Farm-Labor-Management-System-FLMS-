// ipc/worker/generate_report.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
// @ts-ignore
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const Payment = require("../../../entities/Payment");
const Debt = require("../../../entities/Debt");
const Assignment = require("../../../entities/Assignment");

module.exports = async function generateWorkerReport(params = {}) {
  try {
    const { 
      // @ts-ignore
      workerId, 
      // @ts-ignore
      reportType = 'comprehensive',
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate,
      // @ts-ignore
      format = 'json', // 'json', 'csv', 'pdf'
      // @ts-ignore
      // @ts-ignore
      _userId 
    } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get worker
      const workerRepository = queryRunner.manager.getRepository(Worker);
      const worker = await workerRepository.findOne({
        where: { id: parseInt(workerId) },
      });

      if (!worker) {
        await queryRunner.release();
        return {
          status: false,
          message: 'Worker not found',
          data: null
        };
      }

      // Get data based on report type
      let reportData = {
        worker: {
          id: worker.id,
          name: worker.name,
          contact: worker.contact,
          email: worker.email,
          address: worker.address,
          status: worker.status,
          hireDate: worker.hireDate,
          totalDebt: worker.totalDebt,
          totalPaid: worker.totalPaid,
          currentBalance: worker.currentBalance
        },
        generatedAt: new Date(),
        period: startDate && endDate ? { startDate, endDate } : 'All time'
      };

      // Add specific data based on report type
      if (reportType === 'financial' || reportType === 'comprehensive') {
        const debtRepository = queryRunner.manager.getRepository(Debt);
        const paymentRepository = queryRunner.manager.getRepository(Payment);

        // Get debts
        const debtQuery = debtRepository
          .createQueryBuilder('debt')
          .where('debt.workerId = :workerId', { workerId: parseInt(workerId) });
        
        if (startDate && endDate) {
          debtQuery.andWhere('debt.dateIncurred BETWEEN :start AND :end', {
            start: new Date(startDate),
            end: new Date(endDate)
          });
        }

        const debts = await debtQuery.orderBy('debt.dateIncurred', 'DESC').getMany();

        // Get payments
        const paymentQuery = paymentRepository
          .createQueryBuilder('payment')
          .where('payment.workerId = :workerId', { workerId: parseInt(workerId) });
        
        if (startDate && endDate) {
          paymentQuery.andWhere('payment.paymentDate BETWEEN :start AND :end', {
            start: new Date(startDate),
            end: new Date(endDate)
          });
        }

        const payments = await paymentQuery.orderBy('payment.paymentDate', 'DESC').getMany();

        // @ts-ignore
        reportData.financial = {
          debts: {
            total: debts.length,
            items: debts.map((/** @type {{ id: any; amount: any; balance: any; status: any; dateIncurred: any; dueDate: any; reason: any; }} */ debt) => ({
              id: debt.id,
              amount: debt.amount,
              balance: debt.balance,
              status: debt.status,
              dateIncurred: debt.dateIncurred,
              dueDate: debt.dueDate,
              reason: debt.reason
            })),
            summary: {
              totalAmount: debts.reduce((/** @type {number} */ sum, /** @type {{ amount: any; }} */ d) => sum + parseFloat(d.amount || 0), 0),
              totalBalance: debts.reduce((/** @type {number} */ sum, /** @type {{ balance: any; }} */ d) => sum + parseFloat(d.balance || 0), 0),
              byStatus: {
                // @ts-ignore
                pending: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'pending').length,
                // @ts-ignore
                partially_paid: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'partially_paid').length,
                // @ts-ignore
                paid: debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'paid').length
              }
            }
          },
          payments: {
            total: payments.length,
            items: payments.map((/** @type {{ id: any; grossPay: any; netPay: any; status: any; paymentDate: any; paymentMethod: any; }} */ payment) => ({
              id: payment.id,
              grossPay: payment.grossPay,
              netPay: payment.netPay,
              status: payment.status,
              paymentDate: payment.paymentDate,
              paymentMethod: payment.paymentMethod
            })),
            summary: {
              totalGrossPay: payments.reduce((/** @type {number} */ sum, /** @type {{ grossPay: any; }} */ p) => sum + parseFloat(p.grossPay || 0), 0),
              totalNetPay: payments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ p) => sum + parseFloat(p.netPay || 0), 0),
              totalDeductions: payments.reduce((/** @type {number} */ sum, /** @type {{ totalDebtDeduction: any; otherDeductions: any; }} */ p) => 
                sum + parseFloat(p.totalDebtDeduction || 0) + parseFloat(p.otherDeductions || 0), 0
              ),
              byStatus: {
                // @ts-ignore
                completed: payments.filter((/** @type {{ status: string; }} */ p) => p.status === 'completed').length,
                // @ts-ignore
                pending: payments.filter((/** @type {{ status: string; }} */ p) => p.status === 'pending').length
              }
            }
          }
        };
      }

      if (reportType === 'assignment' || reportType === 'comprehensive') {
        const assignmentRepository = queryRunner.manager.getRepository(Assignment);
        
        const assignmentQuery = assignmentRepository
          .createQueryBuilder('assignment')
          .leftJoinAndSelect('assignment.pitak', 'pitak')
          .leftJoinAndSelect('pitak.bukid', 'bukid')
          .where('assignment.workerId = :workerId', { workerId: parseInt(workerId) });
        
        if (startDate && endDate) {
          assignmentQuery.andWhere('assignment.assignmentDate BETWEEN :start AND :end', {
            start: new Date(startDate),
            end: new Date(endDate)
          });
        }

        const assignments = await assignmentQuery
          .orderBy('assignment.assignmentDate', 'DESC')
          .getMany();

        // @ts-ignore
        reportData.assignments = {
          total: assignments.length,
          // @ts-ignore
          items: assignments.map((/** @type {{ id: any; luwangCount: any; status: any; assignmentDate: any; pitak: { bukid: { name: any; }; location: any; }; }} */ assignment) => ({
            id: assignment.id,
            luwangCount: assignment.luwangCount,
            status: assignment.status,
            assignmentDate: assignment.assignmentDate,
            bukid: assignment.pitak?.bukid?.name,
            pitak: assignment.pitak?.location
          })),
          summary: {
            totalLuwang: assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0),
            byStatus: {
              // @ts-ignore
              active: assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'active').length,
              // @ts-ignore
              completed: assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length,
              // @ts-ignore
              cancelled: assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'cancelled').length
            },
            byBukid: {}
          }
        };

        // Group by bukid
        // @ts-ignore
        assignments.forEach((/** @type {{ pitak: { bukid: { name: string; }; }; }} */ assignment) => {
          const bukidName = assignment.pitak?.bukid?.name || 'Unknown';
          // @ts-ignore
          if (!reportData.assignments.summary.byBukid[bukidName]) {
            // @ts-ignore
            reportData.assignments.summary.byBukid[bukidName] = 0;
          }
          // @ts-ignore
          reportData.assignments.summary.byBukid[bukidName]++;
        });
      }

      if (reportType === 'summary' || reportType === 'comprehensive') {
        // Calculate overall summary
        // @ts-ignore
        reportData.overallSummary = {
          workDuration: worker.hireDate ? 
            // @ts-ignore
            Math.floor((new Date() - new Date(worker.hireDate)) / (1000 * 60 * 60 * 24)) + ' days' : 
            'Unknown',
          // @ts-ignore
          averageMonthlyNetPay: reportData.financial?.payments?.summary?.totalNetPay ? 
            // @ts-ignore
            reportData.financial.payments.summary.totalNetPay / 
            // @ts-ignore
            Math.max(1, reportData.financial.payments.total / 12) : 
            0,
          // @ts-ignore
          debtToIncomeRatio: reportData.financial?.debts?.summary?.totalBalance && 
                           // @ts-ignore
                           reportData.financial?.payments?.summary?.totalNetPay ? 
            // @ts-ignore
            (reportData.financial.debts.summary.totalBalance / 
             // @ts-ignore
             reportData.financial.payments.summary.totalNetPay) * 100 : 
            0,
          // @ts-ignore
          assignmentCompletionRate: reportData.assignments?.summary?.byStatus?.completed && 
                                  // @ts-ignore
                                  reportData.assignments?.total ? 
            // @ts-ignore
            (reportData.assignments.summary.byStatus.completed / reportData.assignments.total) * 100 : 
            0
        };

        // Add recommendations
        // @ts-ignore
        reportData.recommendations = generateReportRecommendations(reportData);
      }

      await queryRunner.release();

      // Format the report based on requested format
      let formattedReport = reportData;
      
      if (format === 'csv') {
        // @ts-ignore
        formattedReport = convertToCSV(reportData, reportType);
      } else if (format === 'pdf') {
        // This would require a PDF library like pdfkit
        formattedReport = {
          // @ts-ignore
          message: 'PDF generation not implemented in this example',
          data: reportData
        };
      }

      return {
        status: true,
        message: 'Worker report generated successfully',
        data: {
          report: formattedReport,
          metadata: {
            workerId,
            reportType,
            period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
            generatedAt: new Date(),
            format
          }
        }
      };
    } catch (error) {
      await queryRunner.release();
      throw error;
    }
  } catch (error) {
    console.error('Error in generateWorkerReport:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate worker report: ${error.message}`,
      data: null
    };
  }
};

/**
 * Generate recommendations based on report data
 * @param {{ worker?: { id: any; name: any; contact: any; email: any; address: any; status: any; hireDate: any; totalDebt: any; totalPaid: any; currentBalance: any; }; generatedAt?: Date; period?: string | { startDate: any; endDate: any; }; financial?: any; assignments?: any; overallSummary?: any; }} reportData
 */
function generateReportRecommendations(reportData) {
  const recommendations = [];
  
  // Financial recommendations
  if (reportData.financial) {
    const totalDebt = reportData.financial.debts.summary.totalBalance;
    const totalNetPay = reportData.financial.payments.summary.totalNetPay;
    
    if (totalDebt > 0 && totalNetPay > 0) {
      const debtRatio = (totalDebt / totalNetPay) * 100;
      
      if (debtRatio > 50) {
        recommendations.push({
          category: 'financial',
          severity: 'high',
          title: 'High Debt Load',
          description: `Worker's debt is ${debtRatio.toFixed(1)}% of their total net pay`,
          suggestion: 'Consider debt restructuring or payment assistance program'
        });
      }
      
      const overdueDebts = reportData.financial.debts.items.filter((/** @type {{ status: string; dueDate: string | number | Date; }} */ debt) => 
        debt.status === 'pending' && debt.dueDate && new Date(debt.dueDate) < new Date()
      );
      
      if (overdueDebts.length > 0) {
        recommendations.push({
          category: 'financial',
          severity: 'medium',
          title: 'Overdue Debts',
          description: `${overdueDebts.length} debt(s) are overdue`,
          suggestion: 'Schedule payment plan for overdue debts'
        });
      }
    }
  }
  
  // Assignment recommendations
  if (reportData.assignments) {
    const completionRate = reportData.overallSummary?.assignmentCompletionRate || 0;
    
    if (completionRate < 80) {
      recommendations.push({
        category: 'performance',
        severity: 'medium',
        title: 'Low Assignment Completion Rate',
        description: `Only ${completionRate.toFixed(1)}% of assignments are completed`,
        suggestion: 'Review assignment workload and provide additional training if needed'
      });
    }
    
    const activeAssignments = reportData.assignments.summary.byStatus.active || 0;
    if (activeAssignments > 5) {
      recommendations.push({
        category: 'workload',
        severity: 'low',
        title: 'High Active Assignment Count',
        description: `${activeAssignments} active assignments`,
        suggestion: 'Consider redistributing workload'
      });
    }
  }
  
  return recommendations;
}

/**
 * Convert report data to CSV format
 * @param {{ worker: any; generatedAt?: Date; period?: string | { startDate: any; endDate: any; }; financial?: any; assignments?: any; }} reportData
 * @param {string} reportType
 */
function convertToCSV(reportData, reportType) {
  let csvContent = '';
  
  // Basic worker info
  csvContent += `Worker Report\n`;
  csvContent += `Name,${reportData.worker.name}\n`;
  csvContent += `Contact,${reportData.worker.contact || ''}\n`;
  csvContent += `Status,${reportData.worker.status}\n`;
  csvContent += `Current Balance,${reportData.worker.currentBalance}\n`;
  csvContent += `\n`;
  
  if (reportData.financial && (reportType === 'financial' || reportType === 'comprehensive')) {
    csvContent += `Financial Summary\n`;
    csvContent += `Total Debts,${reportData.financial.debts.total}\n`;
    csvContent += `Total Debt Amount,${reportData.financial.debts.summary.totalAmount}\n`;
    csvContent += `Total Debt Balance,${reportData.financial.debts.summary.totalBalance}\n`;
    csvContent += `Total Payments,${reportData.financial.payments.total}\n`;
    csvContent += `Total Net Pay,${reportData.financial.payments.summary.totalNetPay}\n`;
    csvContent += `\n`;
    
    if (reportData.financial.debts.items.length > 0) {
      csvContent += `Debt Details\n`;
      csvContent += `ID,Amount,Balance,Status,Date Incurred,Due Date,Reason\n`;
      reportData.financial.debts.items.forEach((/** @type {{ id: any; amount: any; balance: any; status: any; dateIncurred: any; dueDate: any; reason: any; }} */ debt) => {
        csvContent += `${debt.id},${debt.amount},${debt.balance},${debt.status},${debt.dateIncurred},${debt.dueDate || ''},"${debt.reason || ''}"\n`;
      });
      csvContent += `\n`;
    }
  }
  
  if (reportData.assignments && (reportType === 'assignment' || reportType === 'comprehensive')) {
    csvContent += `Assignment Summary\n`;
    csvContent += `Total Assignments,${reportData.assignments.total}\n`;
    csvContent += `Total Luwang,${reportData.assignments.summary.totalLuwang}\n`;
    csvContent += `\n`;
    
    if (reportData.assignments.items.length > 0) {
      csvContent += `Assignment Details\n`;
      csvContent += `ID,Luwang Count,Status,Assignment Date,Bukid,Pitak\n`;
      reportData.assignments.items.forEach((/** @type {{ id: any; luwangCount: any; status: any; assignmentDate: any; bukid: any; pitak: any; }} */ assignment) => {
        csvContent += `${assignment.id},${assignment.luwangCount},${assignment.status},${assignment.assignmentDate},${assignment.bukid || ''},${assignment.pitak || ''}\n`;
      });
    }
  }
  
  return csvContent;
}