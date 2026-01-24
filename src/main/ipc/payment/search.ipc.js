// ipc/payment/search.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
// @ts-ignore
const Worker = require("../../../entities/Worker");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function searchPayments(params = {}) {
  try {
    const { 
      // @ts-ignore
      query, 
      // @ts-ignore
      status, 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate,
      // @ts-ignore
      workerName,
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      page = 1 
    } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak');

    // Apply search filters
    if (query) {
      queryBuilder.andWhere(
        '(payment.referenceNumber LIKE :query OR worker.name LIKE :query OR payment.notes LIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (workerName) {
      queryBuilder.andWhere('worker.name LIKE :workerName', { 
        workerName: `%${workerName}%` 
      });
    }

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
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      status: true,
      message: 'Payments searched successfully',
      data: {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in searchPayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search payments: ${error.message}`,
      data: null
    };
  }
};