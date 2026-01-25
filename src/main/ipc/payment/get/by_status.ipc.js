// ipc/payment/get/by_status.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentsByStatus(params = {}) {
  try {
    const { 
      // @ts-ignore
      status, 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      page = 1,
      // @ts-ignore
      sortBy = 'createdAt',
      // @ts-ignore
      sortOrder = 'DESC'
    } = params;
    
    if (!status) {
      return {
        status: false,
        message: 'Status is required',
        data: null
      };
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'partially_paid'];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .where('payment.status = :status', { status });

    // Apply date filters
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

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    // Get paginated results
    const payments = await queryBuilder
      .orderBy(`payment.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    // Get status-specific insights
    const insights = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(payment.id) as totalCount',
        'SUM(payment.netPay) as totalAmount',
        'AVG(payment.netPay) as averageAmount',
        'MIN(payment.createdAt) as earliestPayment',
        'MAX(payment.createdAt) as latestPayment'
      ])
      .where('payment.status = :status', { status })
      .getRawOne();

    // Get worker distribution for this status
    const workerDistribution = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.worker', 'worker')
      .select([
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(payment.id) as paymentCount',
        'SUM(payment.netPay) as totalPaid'
      ])
      .where('payment.status = :status', { status })
      .groupBy('worker.id, worker.name')
      .orderBy('totalPaid', 'DESC')
      .limit(10)
      .getRawMany();

    // Get monthly trend for this status
    const monthlyTrend = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'EXTRACT(YEAR FROM payment.createdAt) as year',
        'EXTRACT(MONTH FROM payment.createdAt) as month',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as amount'
      ])
      .where('payment.status = :status', { status })
      .groupBy('EXTRACT(YEAR FROM payment.createdAt), EXTRACT(MONTH FROM payment.createdAt)')
      .orderBy('year', 'DESC')
      .addOrderBy('month', 'DESC')
      .limit(6)
      .getRawMany();

    return {
      status: true,
      message: `Payments with status '${status}' retrieved successfully`,
      data: {
        status,
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        insights: {
          totalCount: parseInt(insights.totalcount || 0),
          totalAmount: parseFloat(insights.totalamount || 0),
          averageAmount: parseFloat(insights.averageamount || 0),
          earliestPayment: insights.earliestpayment,
          latestPayment: insights.latestpayment
        },
        workerDistribution: workerDistribution.map((/** @type {{ workerid: string; workername: any; paymentcount: string; totalpaid: any; }} */ item) => ({
          workerId: parseInt(item.workerid),
          workerName: item.workername,
          paymentCount: parseInt(item.paymentcount),
          totalPaid: parseFloat(item.totalpaid || 0)
        })),
        monthlyTrend: monthlyTrend.map((/** @type {{ year: string; month: string; count: string; amount: any; }} */ item) => ({
          year: parseInt(item.year),
          month: parseInt(item.month),
          period: `${item.year}-${String(item.month).padStart(2, '0')}`,
          count: parseInt(item.count),
          amount: parseFloat(item.amount || 0)
        }))
      }
    };
  } catch (error) {
    console.error('Error in getPaymentsByStatus:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payments by status: ${error.message}`,
      data: null
    };
  }
};