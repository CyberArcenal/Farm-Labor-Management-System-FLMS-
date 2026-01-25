// ipc/payment/get/pending.ipc.js
//@ts-check

const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getPendingPayments(params = {}) {
  try {
    const { 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      startDate, 
      // @ts-ignore
      endDate,
      // @ts-ignore
      workerId,
      // @ts-ignore
      pitakId,
      // @ts-ignore
      overdueOnly = false,
      // @ts-ignore
      sortBy = 'createdAt',
      // @ts-ignore
      sortOrder = 'ASC' // ASC so oldest payments come first
    } = params;
    
    const paymentRepository = AppDataSource.getRepository(Payment);
    const queryBuilder = paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.worker', 'worker')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .where('payment.status = :status', { status: 'pending' });

    // Apply additional filters
    if (overdueOnly) {
      // Assuming we have a dueDate field or we can calculate based on periodEnd
      queryBuilder.andWhere('payment.periodEnd < :today', { 
        today: new Date() 
      });
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

    // Get paginated results
    const payments = await queryBuilder
      .orderBy(`payment.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    // Calculate pending payment statistics
    const stats = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(payment.id) as totalPending',
        'SUM(payment.grossPay) as totalGrossPending',
        'SUM(payment.netPay) as totalNetPending',
        'AVG(payment.netPay) as averagePendingAmount',
        'MIN(payment.createdAt) as oldestPendingDate'
      ])
      .where('payment.status = :status', { status: 'pending' })
      .getRawOne();

    // Calculate overdue statistics (if periodEnd is past today)
    const overdueStats = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(payment.id) as totalOverdue',
        'SUM(payment.netPay) as totalOverdueAmount'
      ])
      .where('payment.status = :status', { status: 'pending' })
      .andWhere('payment.periodEnd < :today', { today: new Date() })
      .getRawOne();

    // Get workers with most pending payments
    const topWorkersPending = await paymentRepository
      .createQueryBuilder('payment')
      .leftJoin('payment.worker', 'worker')
      .select([
        'worker.id as workerId',
        'worker.name as workerName',
        'COUNT(payment.id) as pendingCount',
        'SUM(payment.netPay) as pendingAmount'
      ])
      .where('payment.status = :status', { status: 'pending' })
      .groupBy('worker.id, worker.name')
      .orderBy('pendingAmount', 'DESC')
      .limit(10)
      .getRawMany();

    // Get aging analysis (how long payments have been pending)
    const agingAnalysis = await paymentRepository
      .createQueryBuilder('payment')
      .select([
        'CASE ' +
        'WHEN DATEDIFF(CURDATE(), payment.createdAt) <= 7 THEN "0-7 days" ' +
        'WHEN DATEDIFF(CURDATE(), payment.createdAt) <= 30 THEN "8-30 days" ' +
        'WHEN DATEDIFF(CURDATE(), payment.createdAt) <= 90 THEN "31-90 days" ' +
        'ELSE "90+ days" ' +
        'END as agingBucket',
        'COUNT(payment.id) as count',
        'SUM(payment.netPay) as totalAmount'
      ])
      .where('payment.status = :status', { status: 'pending' })
      .groupBy('agingBucket')
      .getRawMany();

    // Format payments with additional info
    const formattedPayments = payments.map(payment => {
      const daysPending = Math.ceil(
        // @ts-ignore
        (new Date() - payment.createdAt) / (1000 * 60 * 60 * 24)
      );
      
      const isOverdue = payment.periodEnd && 
                       // @ts-ignore
                       new Date(payment.periodEnd) < new Date();
      
      const overdueDays = isOverdue && payment.periodEnd 
        // @ts-ignore
        ? Math.ceil((new Date() - new Date(payment.periodEnd)) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...payment,
        // @ts-ignore
        grossPay: parseFloat(payment.grossPay),
        // @ts-ignore
        netPay: parseFloat(payment.netPay),
        daysPending,
        isOverdue,
        overdueDays,
        agingBucket: daysPending <= 7 ? '0-7 days' : 
                    daysPending <= 30 ? '8-30 days' : 
                    daysPending <= 90 ? '31-90 days' : '90+ days'
      };
    });

    return {
      status: true,
      message: 'Pending payments retrieved successfully',
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        statistics: {
          totalPending: parseInt(stats.totalpending || 0),
          totalGrossPending: parseFloat(stats.totalgrosspending || 0),
          totalNetPending: parseFloat(stats.totalnetpending || 0),
          averagePendingAmount: parseFloat(stats.averagependingamount || 0),
          oldestPendingDate: stats.oldestpendingdate,
          totalOverdue: parseInt(overdueStats.totaloverdue || 0),
          totalOverdueAmount: parseFloat(overdueStats.totaloverdueamount || 0)
        },
        topWorkersPending: topWorkersPending.map(item => ({
          workerId: parseInt(item.workerid),
          workerName: item.workername,
          pendingCount: parseInt(item.pendingcount),
          pendingAmount: parseFloat(item.pendingamount || 0)
        })),
        agingAnalysis: agingAnalysis.map(item => ({
          agingBucket: item.agingbucket,
          count: parseInt(item.count),
          totalAmount: parseFloat(item.totalamount || 0)
        })),
        filters: {
          overdueOnly,
          startDate: startDate || 'All',
          endDate: endDate || 'All'
        }
      }
    };
  } catch (error) {
    console.error('Error in getPendingPayments:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pending payments: ${error.message}`,
      data: null
    };
  }
};