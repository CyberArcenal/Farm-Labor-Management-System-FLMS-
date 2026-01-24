// ipc/payment/get_history.ipc.js
//@ts-check

const PaymentHistory = require("../../../entities/PaymentHistory");
const { AppDataSource } = require("../../db/dataSource");


module.exports = async function getPaymentHistory(params = {}) {
  try {
    // @ts-ignore
    const { paymentId, actionType, startDate, endDate, limit = 100, page = 1 } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    const historyRepository = AppDataSource.getRepository(PaymentHistory);
    const queryBuilder = historyRepository.createQueryBuilder('history')
      .leftJoinAndSelect('history.payment', 'payment')
      .where('history.paymentId = :paymentId', { paymentId })
      .orderBy('history.changeDate', 'DESC');

    // Apply filters
    if (actionType) {
      queryBuilder.andWhere('history.actionType = :actionType', { actionType });
    }

    if (startDate) {
      queryBuilder.andWhere('history.changeDate >= :startDate', { 
        startDate: new Date(startDate) 
      });
    }

    if (endDate) {
      queryBuilder.andWhere('history.changeDate <= :endDate', { 
        endDate: new Date(endDate) 
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await queryBuilder.getCount();

    // Get paginated results
    const history = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    // Format history for display
    const formattedHistory = history.map((/** @type {{ id: any; changeDate: any; actionType: any; changedField: any; oldValue: any; newValue: any; oldAmount: string; newAmount: string; performedBy: any; notes: any; }} */ record) => ({
      id: record.id,
      timestamp: record.changeDate,
      action: record.actionType,
      field: record.changedField,
      changes: {
        oldValue: record.oldValue,
        newValue: record.newValue,
        oldAmount: record.oldAmount ? parseFloat(record.oldAmount) : null,
        newAmount: record.newAmount ? parseFloat(record.newAmount) : null
      },
      performedBy: record.performedBy,
      notes: record.notes
    }));

    // Get activity summary
    const activitySummary = await historyRepository
      .createQueryBuilder('history')
      .select([
        'history.actionType',
        'COUNT(history.id) as count'
      ])
      .where('history.paymentId = :paymentId', { paymentId })
      .groupBy('history.actionType')
      .getRawMany();

    return {
      status: true,
      message: 'Payment history retrieved successfully',
      data: {
        history: formattedHistory,
        summary: {
          totalRecords: total,
          activitySummary,
          firstChange: history.length > 0 ? history[history.length - 1].changeDate : null,
          lastChange: history.length > 0 ? history[0].changeDate : null
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve payment history: ${error.message}`,
      data: null
    };
  }
};