// ipc/payment/get/all.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getAllPayments(params = {}) {
  try {
    const { 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      status, 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate,
      // @ts-ignore
      workerId,
      // @ts-ignore
      pitakId,
      // @ts-ignore
      sortBy = 'createdAt',
      // @ts-ignore
      sortOrder = 'DESC'
    } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('payment.status = :status', { status });
    }

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

    if (pitakId) {
      queryBuilder.andWhere('payment.pitakId = :pitakId', { pitakId });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    // Get paginated results with sorting
    const payments = await queryBuilder
      .orderBy(`payment.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    // Calculate summary statistics
    const summary = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'SUM(payment.totalDebtDeduction) as totalDebtDeductions',
        'SUM(payment.manualDeduction) as totalManualDeductions',
        'SUM(payment.otherDeductions) as totalOtherDeductions',
        'COUNT(payment.id) as totalCount'
      ])
      .getRawOne();

    // Get status distribution
    const statusDistribution = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'payment.status',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as totalAmount'
      ])
      .groupBy('payment.status')
      .getRawMany();

    return {
      status: true,
      message: 'Payments retrieved successfully',
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalGross: parseFloat(summary.totalGross || 0),
          totalNet: parseFloat(summary.totalNet || 0),
          totalDebtDeductions: parseFloat(summary.totalDebtDeductions || 0),
          totalManualDeductions: parseFloat(summary.totalManualDeductions || 0),
          totalOtherDeductions: parseFloat(summary.totalOtherDeductions || 0),
          totalCount: parseInt(summary.totalCount || 0)
        },
        statusDistribution: statusDistribution.map(item => ({
          status: item.payment_status,
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalamount || 0)
        }))
      }
    };
  } catch (error) {
    console.error('Error in getAllPayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payments: ${error.message}`,
      data: null
    };
  }
};