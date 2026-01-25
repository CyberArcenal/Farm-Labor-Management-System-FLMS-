// ipc/payment/get/by_pitak.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const Pitak = require("../../../../entities/Pitak");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPaymentsByPitak(params = {}) {
  try {
    const { 
      // @ts-ignore
      pitakId, 
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
    
    if (!pitakId) {
      return {
        status: false,
        message: 'Pitak ID is required',
        data: null
      };
    }

    // Check if pitak exists
    const pitakRepository = AppDataSource.getRepository(Pitak);
    const pitak = await pitakRepository.findOne({
      where: { id: pitakId }
    });

    if (!pitak) {
      return {
        status: false,
        message: 'Pitak not found',
        data: null
      };
    }

    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .where('payment.pitakId = :pitakId', { pitakId });

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

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    // Get paginated results
    const payments = await queryBuilder
      .orderBy(`payment.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    // Calculate pitak-specific summary
    const summary = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'SUM(payment.grossPay) as totalGross',
        'SUM(payment.netPay) as totalNet',
        'SUM(payment.totalDebtDeduction) as totalDebtDeductions',
        'COUNT(payment.id) as paymentCount',
        'COUNT(DISTINCT payment.workerId) as uniqueWorkers'
      ])
      .where('payment.pitakId = :pitakId', { pitakId })
      .getRawOne();

    // Get payment timeline
    const timeline = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'EXTRACT(YEAR FROM payment.createdAt) as year',
        'EXTRACT(MONTH FROM payment.createdAt) as month',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as totalAmount'
      ])
      .where('payment.pitakId = :pitakId', { pitakId })
      .groupBy('EXTRACT(YEAR FROM payment.createdAt), EXTRACT(MONTH FROM payment.createdAt)')
      .orderBy('year', 'DESC')
      .addOrderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    return {
      status: true,
      message: 'Payments by pitak retrieved successfully',
      data: {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          totalLuwang: pitak.totalLuwang,
          status: pitak.status
        },
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalGross: parseFloat(summary.totalGross || 0),
          totalNet: parseFloat(summary.totalNet || 0),
          totalDebtDeductions: parseFloat(summary.totalDebtDeductions || 0),
          paymentCount: parseInt(summary.paymentCount || 0),
          uniqueWorkers: parseInt(summary.uniqueworkers || 0)
        },
        timeline: timeline.map(item => ({
          year: parseInt(item.year),
          month: parseInt(item.month),
          period: `${item.year}-${String(item.month).padStart(2, '0')}`,
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalamount || 0)
        }))
      }
    };
  } catch (error) {
    console.error('Error in getPaymentsByPitak:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payments by pitak: ${error.message}`,
      data: null
    };
  }
};