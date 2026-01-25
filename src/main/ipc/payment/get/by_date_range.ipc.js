// ipc/payment/get/by_date_range.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentsByDateRange(params = {}) {
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
      pitakId,
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      page = 1,
      // @ts-ignore
      groupBy = 'day' // 'day', 'week', 'month', 'year'
    } = params;
    
    if (!startDate || !endDate) {
      return {
        status: false,
        message: 'Start date and end date are required',
        data: null
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date range
    if (start > end) {
      return {
        status: false,
        message: 'Start date must be before end date',
        data: null
      };
    }

    // Limit date range to prevent overwhelming queries
    const maxDays = 365; // 1 year maximum
    // @ts-ignore
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays) {
      return {
        status: false,
        message: `Date range cannot exceed ${maxDays} days`,
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .where('payment.createdAt BETWEEN :start AND :end', { start, end });

    // Apply additional filters
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

    if (workerId) {
      queryBuilder.andWhere('payment.workerId = :workerId', { workerId });
    }

    if (pitakId) {
      queryBuilder.andWhere('payment.pitakId = :pitakId', { pitakId });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    // Get paginated results
    const payments = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Get aggregated data by time period
    let groupByClause;
    let dateFormat;
    
    switch (groupBy) {
      case 'day':
        groupByClause = 'DATE(payment.createdAt)';
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupByClause = 'YEARWEEK(payment.createdAt)';
        dateFormat = '%Y Week %v';
        break;
      case 'month':
        groupByClause = 'DATE_FORMAT(payment.createdAt, "%Y-%m")';
        dateFormat = '%Y-%m';
        break;
      case 'year':
        groupByClause = 'YEAR(payment.createdAt)';
        dateFormat = '%Y';
        break;
      default:
        groupByClause = 'DATE(payment.createdAt)';
        dateFormat = '%Y-%m-%d';
    }

    const aggregatedData = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        `${groupByClause} as period`,
        'COUNT(payment.id) as count',
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'AVG(payment.netPay) as averageNet'
      ])
      .where('payment.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy(groupByClause)
      .orderBy('period', 'DESC')
      .getRawMany();

    // Calculate summary for the date range
    const summary = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(payment.id) as totalPayments',
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'SUM(payment.totalDebtDeduction) as totalDebt',
        'SUM(payment.manualDeduction) as totalManual',
        'SUM(payment.otherDeductions) as totalOther',
        'AVG(payment.netPay) as averagePayment'
      ])
      .where('payment.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // Get top performers in this date range
    const topPerformers = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.worker', 'worker')
      .select([
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(payment.id) as paymentCount',
        'SUM(payment.netPay) as totalEarned'
      ])
      .where('payment.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('worker.id, worker.name')
      .orderBy('totalEarned', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      status: true,
      message: 'Payments by date range retrieved successfully',
      data: {
        dateRange: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          days: diffDays
        },
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        aggregatedData: aggregatedData.map((/** @type {{ period: any; count: string; totalgross: any; totalnet: any; averagenet: any; }} */ item) => ({
          period: item.period,
          count: parseInt(item.count),
          totalGross: parseFloat(item.totalgross || 0),
          totalNet: parseFloat(item.totalnet || 0),
          averageNet: parseFloat(item.averagenet || 0)
        })),
        summary: {
          totalPayments: parseInt(summary.totalpayments || 0),
          totalGross: parseFloat(summary.totalgross || 0),
          totalNet: parseFloat(summary.totalnet || 0),
          totalDeductions: parseFloat(summary.totaldebt || 0) + 
                         parseFloat(summary.totalmanual || 0) + 
                         parseFloat(summary.totalother || 0),
          averagePayment: parseFloat(summary.averagepayment || 0)
        },
        topPerformers: topPerformers.map((/** @type {{ workerid: string; workername: any; paymentcount: string; totalearned: any; }} */ item) => ({
          workerId: parseInt(item.workerid),
          workerName: item.workername,
          paymentCount: parseInt(item.paymentcount),
          totalEarned: parseFloat(item.totalearned || 0)
        })),
        periodAnalysis: {
          groupBy,
          format: dateFormat,
          dataPoints: aggregatedData.length
        }
      }
    };
  } catch (error) {
    console.error('Error in getPaymentsByDateRange:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payments by date range: ${error.message}`,
      data: null
    };
  }
};