// dashboard/handlers/realTimeDashboard.js
//@ts-check
class RealTimeDashboard {
  /**
     * @param {{ assignment: any; worker: any; debt: any; payment: any; pitak: any; }} repositories
     * @param {any} params
     */
  // @ts-ignore
  async getLiveDashboard(repositories, params) {
    const { 
      assignment: assignmentRepo, 
      worker: workerRepo, 
      debt: debtRepo, 
      payment: paymentRepo,
      pitak: pitakRepo 
    } = repositories;
    
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      // Get today's assignments
      const todayAssignments = await assignmentRepo.count({
        where: {
          assignmentDate: { $gte: todayStart }
        }
      });
      
      const todayCompleted = await assignmentRepo.count({
        where: {
          assignmentDate: { $gte: todayStart },
          status: 'completed'
        }
      });
      
      // Get active workers
      const activeWorkers = await workerRepo.count({
        where: { status: 'active' }
      });
      
      // Get workers with assignments today
      const workersWithAssignments = await assignmentRepo
        .createQueryBuilder("assignment")
        .select("COUNT(DISTINCT assignment.workerId)", "count")
        .where("assignment.assignmentDate >= :today", { today: todayStart })
        .getRawOne();
      
      // Get today's payments
      const todayPayments = await paymentRepo
        .createQueryBuilder("payment")
        .select([
          "SUM(payment.netPay) as totalNet",
          "COUNT(payment.id) as paymentCount"
        ])
        .where("payment.paymentDate >= :today", { today: todayStart })
        .andWhere("payment.status = :status", { status: 'completed' })
        .getRawOne();
      
      // Get active debts
      const activeDebts = await debtRepo.count({
        where: { status: 'pending' }
      });
      
      // Get total debt balance
      const totalDebtBalance = await debtRepo
        .createQueryBuilder("debt")
        .select("SUM(debt.balance)", "total")
        .where("debt.status IN (:...statuses)", { 
          statuses: ['pending', 'partially_paid'] 
        })
        .getRawOne();
      
      // Get active pitaks
      const activePitaks = await pitakRepo.count({
        where: { status: 'active' }
      });
      
      // Get recent activities (last 2 hours)
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      const recentAssignments = await assignmentRepo.find({
        where: {
          createdAt: { $gte: twoHoursAgo }
        },
        relations: ['worker', 'pitak'],
        order: { createdAt: 'DESC' },
        take: 10
      });
      
      const recentPayments = await paymentRepo.find({
        where: {
          createdAt: { $gte: twoHoursAgo }
        },
        relations: ['worker'],
        order: { createdAt: 'DESC' },
        take: 10
      });
      
      // Calculate assignment completion rate for today
      const todayCompletionRate = todayAssignments > 0 
        ? (todayCompleted / todayAssignments) * 100 
        : 0;
      
      // Calculate worker utilization for today
      const workerUtilization = activeWorkers > 0 
        ? (parseInt(workersWithAssignments?.count) / activeWorkers) * 100 
        : 0;
      
      // Format recent activities
      const recentActivities = [
        ...recentAssignments.map((/** @type {{ id: any; worker: { name: any; }; pitak: { location: any; }; luwangCount: string; status: any; createdAt: any; }} */ assignment) => ({
          type: 'assignment',
          id: assignment.id,
          workerName: assignment.worker?.name || 'Unknown',
          pitakLocation: assignment.pitak?.location || 'Unknown',
          luwangCount: parseFloat(assignment.luwangCount),
          status: assignment.status,
          timestamp: assignment.createdAt,
          action: `Assignment ${assignment.status}`
        })),
        ...recentPayments.map((/** @type {{ id: any; worker: { name: any; }; netPay: string; status: any; createdAt: any; }} */ payment) => ({
          type: 'payment',
          id: payment.id,
          workerName: payment.worker?.name || 'Unknown',
          netPay: parseFloat(payment.netPay),
          status: payment.status,
          timestamp: payment.createdAt,
          action: `Payment ${payment.status}`
        }))
      ].sort((a, b) => b.timestamp - a.timestamp)
       .slice(0, 15);
      
      // Get system alerts
      const alerts = await this.getSystemAlerts(repositories);
      
      return {
        status: true,
        message: "Live dashboard data retrieved",
        data: {
          timestamp: now.toISOString(),
          overview: {
            assignments: {
              today: todayAssignments,
              completed: todayCompleted,
              active: todayAssignments - todayCompleted,
              completionRate: todayCompletionRate
            },
            workers: {
              totalActive: activeWorkers,
              withAssignments: parseInt(workersWithAssignments?.count) || 0,
              utilizationRate: workerUtilization
            },
            financial: {
              todayPayments: parseFloat(todayPayments?.totalNet) || 0,
              todayPaymentCount: parseInt(todayPayments?.paymentCount) || 0,
              activeDebts: activeDebts,
              totalDebtBalance: parseFloat(totalDebtBalance?.total) || 0
            },
            resources: {
              activePitaks: activePitaks
            }
          },
          recentActivities: recentActivities,
          alerts: alerts,
          quickStats: {
            averageAssignmentTime: await this.calculateAverageAssignmentTime(assignmentRepo),
            averagePaymentAmount: parseInt(todayPayments?.paymentCount) > 0 
              ? parseFloat(todayPayments?.totalNet) / parseInt(todayPayments?.paymentCount) 
              : 0,
            debtCollectionRate: await this.calculateDebtCollectionRate(debtRepo)
          }
        }
      };
    } catch (error) {
      console.error("getLiveDashboard error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ assignment: any; payment: any; debtHistory: any; worker: any; }} repositories
     * @param {any} params
     */
  // @ts-ignore
  async getTodayStats(repositories, params) {
    const { 
      assignment: assignmentRepo, 
      payment: paymentRepo,
      debtHistory: debtHistoryRepo,
      // @ts-ignore
      worker: workerRepo
    } = repositories;
    
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      // Get assignments comparison
      const todayAssignments = await assignmentRepo.count({
        where: { assignmentDate: { $gte: todayStart } }
      });
      
      const yesterdayAssignments = await assignmentRepo.count({
        where: { 
          assignmentDate: { 
            $gte: yesterdayStart,
            $lt: todayStart
          } 
        }
      });
      
      const assignmentChange = yesterdayAssignments > 0 
        ? ((todayAssignments - yesterdayAssignments) / yesterdayAssignments) * 100 
        : (todayAssignments > 0 ? 100 : 0);
      
      // Get payments comparison
      const todayPayments = await paymentRepo
        .createQueryBuilder("payment")
        .select("SUM(payment.netPay)", "total")
        .where("payment.paymentDate >= :today", { today: todayStart })
        .andWhere("payment.status = :status", { status: 'completed' })
        .getRawOne();
      
      const yesterdayPayments = await paymentRepo
        .createQueryBuilder("payment")
        .select("SUM(payment.netPay)", "total")
        .where("payment.paymentDate BETWEEN :start AND :end", {
          start: yesterdayStart,
          end: todayStart
        })
        .andWhere("payment.status = :status", { status: 'completed' })
        .getRawOne();
      
      const todayPaymentTotal = parseFloat(todayPayments?.total) || 0;
      const yesterdayPaymentTotal = parseFloat(yesterdayPayments?.total) || 0;
      
      const paymentChange = yesterdayPaymentTotal > 0 
        ? ((todayPaymentTotal - yesterdayPaymentTotal) / yesterdayPaymentTotal) * 100 
        : (todayPaymentTotal > 0 ? 100 : 0);
      
      // Get debt collections today
      const todayCollections = await debtHistoryRepo
        .createQueryBuilder("history")
        .select("SUM(history.amountPaid)", "total")
        .where("history.transactionDate >= :today", { today: todayStart })
        .andWhere("history.transactionType = :type", { type: 'payment' })
        .getRawOne();
      
      // Get active workers today
      const workersWithActivity = await assignmentRepo
        .createQueryBuilder("assignment")
        .select("COUNT(DISTINCT assignment.workerId)", "count")
        .where("assignment.assignmentDate >= :today", { today: todayStart })
        .getRawOne();
      
      // Get completed assignments today
      const completedToday = await assignmentRepo.count({
        where: {
          assignmentDate: { $gte: todayStart },
          status: 'completed'
        }
      });
      
      // Get assignment status breakdown for today
      const statusBreakdown = await assignmentRepo
        .createQueryBuilder("assignment")
        .select([
          "assignment.status",
          "COUNT(assignment.id) as count"
        ])
        .where("assignment.assignmentDate >= :today", { today: todayStart })
        .groupBy("assignment.status")
        .getRawMany();
      
      const statusSummary = statusBreakdown.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ assignment_status: string | number; count: string; }} */ item) => {
        acc[item.assignment_status] = parseInt(item.count);
        return acc;
      }, { active: 0, completed: 0, cancelled: 0 });
      
      // Calculate hourly distribution for today
      const hourlyData = await this.getHourlyDistribution(assignmentRepo, paymentRepo, todayStart);
      
      return {
        status: true,
        message: "Today's statistics retrieved",
        data: {
          date: now.toISOString().split('T')[0],
          comparisons: {
            assignments: {
              today: todayAssignments,
              yesterday: yesterdayAssignments,
              change: assignmentChange,
              trend: assignmentChange >= 0 ? 'up' : 'down'
            },
            payments: {
              today: todayPaymentTotal,
              yesterday: yesterdayPaymentTotal,
              change: paymentChange,
              trend: paymentChange >= 0 ? 'up' : 'down'
            }
          },
          todaySummary: {
            assignments: {
              total: todayAssignments,
              completed: completedToday,
              active: statusSummary.active,
              cancelled: statusSummary.cancelled,
              completionRate: todayAssignments > 0 ? (completedToday / todayAssignments) * 100 : 0
            },
            financial: {
              payments: todayPaymentTotal,
              collections: parseFloat(todayCollections?.total) || 0
            },
            workforce: {
              activeWorkers: parseInt(workersWithActivity?.count) || 0,
              productivity: todayAssignments > 0 ? (completedToday / todayAssignments) * 100 : 0
            }
          },
          hourlyDistribution: hourlyData,
          statusBreakdown: statusSummary,
          recommendations: this.getDailyRecommendations(
            todayAssignments, 
            completedToday, 
            todayPaymentTotal
          )
        }
      };
    } catch (error) {
      console.error("getTodayStats error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ assignment: any; }} repositories
     * @param {{ status: any; limit?: 20 | undefined; }} params
     */
  async getRealTimeAssignments(repositories, params) {
    const { assignment: assignmentRepo } = repositories;
    const { status, limit = 20 } = params;
    
    try {
      // Get active assignments (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      let query = assignmentRepo
        .createQueryBuilder("assignment")
        .leftJoin("assignment.worker", "worker")
        .leftJoin("assignment.pitak", "pitak")
        .leftJoin("pitak.bukid", "bukid")
        .select([
          "assignment.id",
          "assignment.luwangCount",
          "assignment.status",
          "assignment.assignmentDate",
          "assignment.createdAt",
          "assignment.updatedAt",
          "worker.name as workerName",
          "worker.id as workerId",
          "pitak.location as pitakLocation",
          "bukid.name as bukidName"
        ])
        .where("assignment.updatedAt >= :recent", { recent: twentyFourHoursAgo })
        .orderBy("assignment.updatedAt", "DESC");
      
      if (status) {
        query.andWhere("assignment.status = :status", { status });
      }
      
      if (limit) {
        query.limit(limit);
      }
      
      const assignments = await query.getRawMany();
      
      // Calculate time metrics
      const assignmentsWithMetrics = assignments.map((/** @type {{ assignment_createdAt: string | number | Date; assignment_updatedAt: string | number | Date; assignment_status: string; assignment_id: any; workerName: any; workerId: any; pitakLocation: any; bukidName: any; assignment_luwangCount: string; assignment_assignmentDate: any; }} */ assignment) => {
        const createdAt = new Date(assignment.assignment_createdAt);
        const updatedAt = new Date(assignment.assignment_updatedAt);
        const now = new Date();
        
        // @ts-ignore
        const ageInHours = Math.floor((now - createdAt) / (1000 * 60 * 60));
        // @ts-ignore
        const lastUpdateInMinutes = Math.floor((now - updatedAt) / (1000 * 60));
        
        let statusColor;
        switch(assignment.assignment_status) {
          case 'completed': statusColor = 'green'; break;
          case 'active': statusColor = 'blue'; break;
          case 'cancelled': statusColor = 'red'; break;
          default: statusColor = 'gray';
        }
        
        return {
          id: assignment.assignment_id,
          workerName: assignment.workerName,
          workerId: assignment.workerId,
          pitakLocation: assignment.pitakLocation,
          bukidName: assignment.bukidName,
          luwangCount: parseFloat(assignment.assignment_luwangCount),
          status: assignment.assignment_status,
          statusColor: statusColor,
          assignmentDate: assignment.assignment_assignmentDate,
          age: {
            hours: ageInHours,
            minutes: lastUpdateInMinutes,
            lastUpdated: assignment.assignment_updatedAt
          },
          progress: assignment.assignment_status === 'completed' ? 100 : 
                   assignment.assignment_status === 'active' ? 50 : 0
        };
      });
      
      // Group by status
      const byStatus = assignments.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ assignment_status: any; }} */ assignment) => {
        const status = assignment.assignment_status;
        if (!acc[status]) {
          acc[status] = 0;
        }
        acc[status]++;
        return acc;
      }, {});
      
      // Group by worker
      const byWorker = assignments.reduce((/** @type {{ [x: string]: { totalLuwang: number; }; }} */ acc, /** @type {{ workerName: any; assignment_luwangCount: string; }} */ assignment) => {
        const workerName = assignment.workerName;
        if (!acc[workerName]) {
          // @ts-ignore
          acc[workerName] = { count: 0, totalLuwang: 0 };
        }
        // @ts-ignore
        acc[workerName].count++;
        acc[workerName].totalLuwang += parseFloat(assignment.assignment_luwangCount);
        return acc;
      }, {});
      
      // Calculate statistics
      const totalAssignments = assignments.length;
      const activeAssignments = assignments.filter((/** @type {{ assignment_status: string; }} */ a) => a.assignment_status === 'active').length;
      const completedAssignments = assignments.filter((/** @type {{ assignment_status: string; }} */ a) => a.assignment_status === 'completed').length;
      
      const totalLuwang = assignments.reduce((/** @type {number} */ sum, /** @type {{ assignment_luwangCount: string; }} */ a) => 
        sum + parseFloat(a.assignment_luwangCount), 0);
      
      const averageLuwang = totalAssignments > 0 ? totalLuwang / totalAssignments : 0;
      
      // Get workers with most assignments
      const topWorkers = Object.entries(byWorker)
        .map(([workerName, data]) => ({
          workerName,
          assignmentCount: data.count,
          totalLuwang: data.totalLuwang
        }))
        .sort((a, b) => b.assignmentCount - a.assignmentCount)
        .slice(0, 5);
      
      return {
        status: true,
        message: "Real-time assignments retrieved",
        data: {
          assignments: assignmentsWithMetrics,
          summary: {
            total: totalAssignments,
            active: activeAssignments,
            completed: completedAssignments,
            totalLuwang: totalLuwang,
            averageLuwang: averageLuwang,
            completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0
          },
          distribution: {
            byStatus: Object.keys(byStatus).map(status => ({
              status: status,
              count: byStatus[status],
              percentage: (byStatus[status] / totalAssignments) * 100
            })),
            byWorker: Object.keys(byWorker).map(workerName => ({
              workerName: workerName,
              count: byWorker[workerName].count,
              totalLuwang: byWorker[workerName].totalLuwang
            }))
          },
          topWorkers: topWorkers,
          filters: {
            status: status,
            limit: limit
          },
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("getRealTimeAssignments error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ payment: any; debtHistory: any; }} repositories
     * @param {{ limit?: 20 | undefined; includeDebtPayments?: true | undefined; }} params
     */
  async getRecentPayments(repositories, params) {
    const { payment: paymentRepo, debtHistory: debtHistoryRepo } = repositories;
    const { limit = 20, includeDebtPayments = true } = params;
    
    try {
      // Get recent payments
      const payments = await paymentRepo.find({
        relations: ['worker'],
        order: { paymentDate: 'DESC' },
        take: limit
      });
      
      // Get recent debt payments if requested
      let debtPayments = [];
      if (includeDebtPayments) {
        debtPayments = await debtHistoryRepo.find({
          where: { transactionType: 'payment' },
          relations: ['debt', 'debt.worker'],
          order: { transactionDate: 'DESC' },
          take: limit
        });
      }
      
      // Format payment data
      const formattedPayments = payments.map((/** @type {{ id: any; worker: { name: any; id: any; }; netPay: string; grossPay: string; totalDebtDeduction: string; otherDeductions: any; status: any; paymentDate: any; paymentMethod: any; referenceNumber: any; }} */ payment) => ({
        type: 'salary',
        id: payment.id,
        workerName: payment.worker?.name || 'Unknown',
        workerId: payment.worker?.id,
        amount: parseFloat(payment.netPay),
        grossAmount: parseFloat(payment.grossPay),
        deductions: parseFloat(payment.totalDebtDeduction) + parseFloat(payment.otherDeductions || 0),
        status: payment.status,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber
      }));
      
      // Format debt payment data
      const formattedDebtPayments = debtPayments.map((/** @type {{ id: any; debt: { worker: { name: any; id: any; }; id: any; }; amountPaid: string; previousBalance: string; newBalance: string; paymentMethod: any; referenceNumber: any; transactionDate: any; }} */ payment) => ({
        type: 'debt',
        id: payment.id,
        workerName: payment.debt?.worker?.name || 'Unknown',
        workerId: payment.debt?.worker?.id,
        amount: parseFloat(payment.amountPaid),
        previousBalance: parseFloat(payment.previousBalance),
        newBalance: parseFloat(payment.newBalance),
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber,
        transactionDate: payment.transactionDate,
        debtId: payment.debt?.id
      }));
      
      // Combine and sort by date
      const allPayments = [...formattedPayments, ...formattedDebtPayments]
        .sort((a, b) => {
          const dateA = a.type === 'salary' ? a.paymentDate : a.transactionDate;
          const dateB = b.type === 'salary' ? b.paymentDate : b.transactionDate;
          // @ts-ignore
          return new Date(dateB) - new Date(dateA);
        })
        .slice(0, limit);
      
      // Calculate summary statistics
      const totalSalaryPayments = formattedPayments.length;
      const totalDebtPayments = formattedDebtPayments.length;
      
      const totalSalaryAmount = formattedPayments.reduce((/** @type {any} */ sum, /** @type {{ amount: any; }} */ p) => sum + p.amount, 0);
      const totalDebtAmount = formattedDebtPayments.reduce((/** @type {any} */ sum, /** @type {{ amount: any; }} */ p) => sum + p.amount, 0);
      const totalAmount = totalSalaryAmount + totalDebtAmount;
      
      // Group by payment method
      const byMethod = allPayments.reduce((acc, payment) => {
        const method = payment.paymentMethod || 'Unknown';
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count++;
        acc[method].amount += payment.amount;
        return acc;
      }, {});
      
      // Group by worker
      const byWorker = allPayments.reduce((acc, payment) => {
        const workerName = payment.workerName;
        if (!acc[workerName]) {
          acc[workerName] = { count: 0, amount: 0 };
        }
        acc[workerName].count++;
        acc[workerName].amount += payment.amount;
        return acc;
      }, {});
      
      // Get top payees
      const topPayees = Object.entries(byWorker)
        .map(([workerName, data]) => ({
          workerName,
          paymentCount: data.count,
          totalAmount: data.amount
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5);
      
      // Calculate average payment
      const averagePayment = allPayments.length > 0 
        ? totalAmount / allPayments.length 
        : 0;
      
      return {
        status: true,
        message: "Recent payments retrieved",
        data: {
          payments: allPayments,
          summary: {
            totalPayments: allPayments.length,
            salaryPayments: totalSalaryPayments,
            debtPayments: totalDebtPayments,
            totalAmount: totalAmount,
            salaryAmount: totalSalaryAmount,
            debtAmount: totalDebtAmount,
            averagePayment: averagePayment
          },
          distribution: {
            byType: {
              salary: {
                count: totalSalaryPayments,
                amount: totalSalaryAmount,
                percentage: totalAmount > 0 ? (totalSalaryAmount / totalAmount) * 100 : 0
              },
              debt: {
                count: totalDebtPayments,
                amount: totalDebtAmount,
                percentage: totalAmount > 0 ? (totalDebtAmount / totalAmount) * 100 : 0
              }
            },
            byMethod: Object.keys(byMethod).map(method => ({
              method: method,
              count: byMethod[method].count,
              amount: byMethod[method].amount,
              percentage: totalAmount > 0 ? (byMethod[method].amount / totalAmount) * 100 : 0
            })),
            byWorker: Object.keys(byWorker).map(workerName => ({
              workerName: workerName,
              count: byWorker[workerName].count,
              amount: byWorker[workerName].amount
            }))
          },
          topPayees: topPayees,
          filters: {
            limit: limit,
            includeDebtPayments: includeDebtPayments
          },
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("getRecentPayments error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ debt: any; }} repositories
     * @param {{ status?: "pending" | undefined; limit?: 20 | undefined; overdueOnly?: false | undefined; }} params
     */
  async getPendingDebts(repositories, params) {
    const { debt: debtRepo } = repositories;
    const { status = 'pending', limit = 20, overdueOnly = false } = params;
    
    try {
      // Build query for pending debts
      let query = debtRepo
        .createQueryBuilder("debt")
        .leftJoin("debt.worker", "worker")
        .select([
          "debt.id",
          "debt.originalAmount",
          "debt.amount",
          "debt.balance",
          "debt.status",
          "debt.dateIncurred",
          "debt.dueDate",
          "debt.interestRate",
          "debt.totalPaid",
          "debt.lastPaymentDate",
          "worker.name as workerName",
          "worker.id as workerId",
          "worker.contact as workerContact"
        ])
        .orderBy("debt.dueDate", "ASC");
      
      // Apply filters
      if (status) {
        query.where("debt.status = :status", { status });
      }
      
      if (overdueOnly) {
        query.andWhere("debt.dueDate IS NOT NULL")
          .andWhere("debt.dueDate < :today", { today: new Date() });
      }
      
      if (limit) {
        query.limit(limit);
      }
      
      const debts = await query.getRawMany();
      
      // Calculate additional metrics
      const debtsWithMetrics = debts.map((/** @type {{ debt_dueDate: string | number | Date; debt_amount: string; debt_balance: string; debt_totalPaid: string; debt_id: any; workerName: any; workerId: any; workerContact: any; debt_originalAmount: string; debt_status: any; debt_dateIncurred: string | number | Date; debt_interestRate: string; debt_lastPaymentDate: any; }} */ debt) => {
        const dueDate = debt.debt_dueDate ? new Date(debt.debt_dueDate) : null;
        const today = new Date();
        let overdueDays = 0;
        let isOverdue = false;
        
        if (dueDate && dueDate < today) {
          // @ts-ignore
          overdueDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
          isOverdue = true;
        }
        
        const amount = parseFloat(debt.debt_amount) || 0;
        const balance = parseFloat(debt.debt_balance) || 0;
        const paid = parseFloat(debt.debt_totalPaid) || 0;
        const paymentRate = amount > 0 ? (paid / amount) * 100 : 0;
        
        // Calculate urgency level
        let urgency = 'low';
        if (isOverdue) {
          if (overdueDays > 30) urgency = 'critical';
          else if (overdueDays > 15) urgency = 'high';
          else urgency = 'medium';
        } else if (dueDate) {
          // @ts-ignore
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 7) urgency = 'medium';
        }
        
        return {
          id: debt.debt_id,
          workerName: debt.workerName,
          workerId: debt.workerId,
          workerContact: debt.workerContact,
          originalAmount: parseFloat(debt.debt_originalAmount) || 0,
          amount: amount,
          balance: balance,
          paid: paid,
          paymentRate: paymentRate,
          status: debt.debt_status,
          dateIncurred: debt.debt_dateIncurred,
          dueDate: debt.debt_dueDate,
          interestRate: parseFloat(debt.debt_interestRate) || 0,
          lastPaymentDate: debt.debt_lastPaymentDate,
          overdue: {
            isOverdue: isOverdue,
            days: overdueDays
          },
          urgency: urgency,
          // @ts-ignore
          ageInDays: Math.ceil((today - new Date(debt.debt_dateIncurred)) / (1000 * 60 * 60 * 24))
        };
      });
      
      // Sort by urgency (critical first)
      debtsWithMetrics.sort((/** @type {{ urgency: string | number; }} */ a, /** @type {{ urgency: string | number; }} */ b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        // @ts-ignore
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
      
      // Calculate summary statistics
      const totalDebts = debtsWithMetrics.length;
      const totalAmount = debtsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ amount: any; }} */ debt) => sum + debt.amount, 0);
      const totalBalance = debtsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ balance: any; }} */ debt) => sum + debt.balance, 0);
      const totalPaid = debtsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ paid: any; }} */ debt) => sum + debt.paid, 0);
      
      const overdueDebts = debtsWithMetrics.filter((/** @type {{ overdue: { isOverdue: any; }; }} */ d) => d.overdue.isOverdue);
      const totalOverdueAmount = overdueDebts.reduce((/** @type {any} */ sum, /** @type {{ balance: any; }} */ debt) => sum + debt.balance, 0);
      
      const averageDebt = totalDebts > 0 ? totalAmount / totalDebts : 0;
      const averageBalance = totalDebts > 0 ? totalBalance / totalDebts : 0;
      const averageAge = totalDebts > 0 
        ? debtsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ ageInDays: any; }} */ debt) => sum + debt.ageInDays, 0) / totalDebts 
        : 0;
      
      // Group by worker
      const byWorker = debtsWithMetrics.reduce((/** @type {{ [x: string]: { debts: any[]; }; }} */ acc, /** @type {{ workerName: any; balance: any; id: any; }} */ debt) => {
        const workerName = debt.workerName;
        if (!acc[workerName]) {
          // @ts-ignore
          acc[workerName] = { count: 0, totalBalance: 0, debts: [] };
        }
        // @ts-ignore
        acc[workerName].count++;
        // @ts-ignore
        acc[workerName].totalBalance += debt.balance;
        acc[workerName].debts.push(debt.id);
        return acc;
      }, {});
      
      // Get workers with highest debt
      const topDebtors = Object.entries(byWorker)
        .map(([workerName, data]) => ({
          workerName,
          debtCount: data.count,
          totalBalance: data.totalBalance
        }))
        .sort((a, b) => b.totalBalance - a.totalBalance)
        .slice(0, 5);
      
      // Group by urgency
      const byUrgency = debtsWithMetrics.reduce((/** @type {{ [x: string]: number; }} */ acc, /** @type {{ urgency: string | number; }} */ debt) => {
        if (!acc[debt.urgency]) {
          acc[debt.urgency] = 0;
        }
        acc[debt.urgency]++;
        return acc;
      }, {});
      
      return {
        status: true,
        message: "Pending debts retrieved",
        data: {
          debts: debtsWithMetrics,
          summary: {
            totalDebts: totalDebts,
            totalAmount: totalAmount,
            totalBalance: totalBalance,
            totalPaid: totalPaid,
            collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
            overdueDebts: overdueDebts.length,
            totalOverdueAmount: totalOverdueAmount,
            averageDebt: averageDebt,
            averageBalance: averageBalance,
            averageAge: averageAge
          },
          distribution: {
            byUrgency: Object.keys(byUrgency).map(urgency => ({
              urgency: urgency,
              count: byUrgency[urgency],
              percentage: (byUrgency[urgency] / totalDebts) * 100
            })),
            byWorker: Object.keys(byWorker).map(workerName => ({
              workerName: workerName,
              count: byWorker[workerName].count,
              totalBalance: byWorker[workerName].totalBalance
            }))
          },
          topDebtors: topDebtors,
          filters: {
            status: status,
            overdueOnly: overdueOnly,
            limit: limit
          },
          recommendations: overdueDebts.length > 0 ? [
            "Follow up on overdue debts immediately",
            "Consider payment plans for large balances",
            "Review debt collection procedures"
          ] : [
            "Debt collection is on track",
            "Continue monitoring upcoming due dates",
            "Maintain current collection practices"
          ],
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error("getPendingDebts error:", error);
      throw error;
    }
  }
  
  // Helper methods
  /**
     * @param {{ debt: any; assignment: any; }} repositories
     */
  async getSystemAlerts(repositories) {
    const { debt: debtRepo, assignment: assignmentRepo } = repositories;
    const alerts = [];
    
    try {
      // Check for overdue debts
      const overdueDebts = await debtRepo.count({
        where: {
          dueDate: { $lt: new Date() },
          status: { $in: ['pending', 'partially_paid'] }
        }
      });
      
      if (overdueDebts > 0) {
        alerts.push({
          type: 'warning',
          title: 'Overdue Debts',
          message: `${overdueDebts} debts are overdue`,
          priority: 'high',
          timestamp: new Date()
        });
      }
      
      // Check for assignments without updates in 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const staleAssignments = await assignmentRepo.count({
        where: {
          status: 'active',
          updatedAt: { $lt: threeDaysAgo }
        }
      });
      
      if (staleAssignments > 0) {
        alerts.push({
          type: 'info',
          title: 'Stale Assignments',
          message: `${staleAssignments} assignments haven't been updated in 3+ days`,
          priority: 'medium',
          timestamp: new Date()
        });
      }
      
      // Check for high debt workers
      const highDebtWorkers = await debtRepo
        .createQueryBuilder("debt")
        .leftJoin("debt.worker", "worker")
        .select([
          "worker.name",
          "SUM(debt.balance) as totalDebt"
        ])
        .where("debt.status IN (:...statuses)", { 
          statuses: ['pending', 'partially_paid'] 
        })
        .groupBy("worker.name")
        .having("SUM(debt.balance) > 10000") // Threshold for high debt
        .getRawMany();
      
      if (highDebtWorkers.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'High Debt Workers',
          message: `${highDebtWorkers.length} workers have debt over 10,000`,
          priority: 'medium',
          details: highDebtWorkers.map((/** @type {{ worker_name: any; }} */ w) => w.worker_name),
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error("getSystemAlerts error:", error);
    }
    
    return alerts;
  }
  
  /**
     * @param {{ find: (arg0: { where: { status: string; }; select: string[]; }) => any; }} assignmentRepo
     */
  async calculateAverageAssignmentTime(assignmentRepo) {
    try {
      const completedAssignments = await assignmentRepo.find({
        where: { status: 'completed' },
        select: ['createdAt', 'updatedAt']
      });
      
      if (completedAssignments.length === 0) return 0;
      
      const totalTime = completedAssignments.reduce((/** @type {number} */ sum, /** @type {{ createdAt: string | number | Date; updatedAt: string | number | Date; }} */ assignment) => {
        const start = new Date(assignment.createdAt);
        const end = new Date(assignment.updatedAt);
        // @ts-ignore
        return sum + (end - start);
      }, 0);
      
      return totalTime / completedAssignments.length / (1000 * 60 * 60); // Return in hours
    } catch (error) {
      return 0;
    }
  }
  
  /**
     * @param {{ createQueryBuilder: (arg0: string) => { (): any; new (): any; select: { (arg0: string[]): { (): any; new (): any; getRawOne: { (): any; new (): any; }; }; new (): any; }; }; }} debtRepo
     */
  async calculateDebtCollectionRate(debtRepo) {
    try {
      const debtStats = await debtRepo
        .createQueryBuilder("debt")
        .select([
          "SUM(debt.amount) as totalAmount",
          "SUM(debt.totalPaid) as totalPaid"
        ])
        .getRawOne();
      
      const totalAmount = parseFloat(debtStats?.totalAmount) || 0;
      const totalPaid = parseFloat(debtStats?.totalPaid) || 0;
      
      return totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    } catch (error) {
      return 0;
    }
  }
  
  /**
     * @param {{ count: (arg0: { where: { assignmentDate: { $gte: Date; $lt: Date; }; }; }) => any; }} assignmentRepo
     * @param {{ createQueryBuilder: (arg0: string) => { (): any; new (): any; select: { (arg0: string, arg1: string): { (): any; new (): any; where: { (arg0: string, arg1: { start: Date; end: Date; }): { (): any; new (): any; andWhere: { (arg0: string, arg1: { status: string; }): { (): any; new (): any; getRawOne: { (): any; new (): any; }; }; new (): any; }; }; new (): any; }; }; new (): any; }; }; }} paymentRepo
     * @param {string | number | Date} startDate
     */
  async getHourlyDistribution(assignmentRepo, paymentRepo, startDate) {
    try {
      const hourlyAssignments = [];
      const hourlyPayments = [];
      
      // Get hourly assignments
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(startDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(startDate);
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        const assignments = await assignmentRepo.count({
          where: {
            assignmentDate: { $gte: hourStart, $lt: hourEnd }
          }
        });
        
        hourlyAssignments.push({
          hour: hour,
          assignments: assignments
        });
      }
      
      // Get hourly payments
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(startDate);
        hourStart.setHours(hour, 0, 0, 0);
        const hourEnd = new Date(startDate);
        hourEnd.setHours(hour + 1, 0, 0, 0);
        
        const payments = await paymentRepo
          .createQueryBuilder("payment")
          .select("SUM(payment.netPay)", "total")
          .where("payment.paymentDate >= :start AND payment.paymentDate < :end", {
            start: hourStart,
            end: hourEnd
          })
          .andWhere("payment.status = :status", { status: 'completed' })
          .getRawOne();
        
        hourlyPayments.push({
          hour: hour,
          amount: parseFloat(payments?.total) || 0
        });
      }
      
      return {
        assignments: hourlyAssignments,
        payments: hourlyPayments
      };
    } catch (error) {
      return { assignments: [], payments: [] };
    }
  }
  
  /**
     * @param {number} assignments
     * @param {number} completed
     * @param {number} payments
     */
  getDailyRecommendations(assignments, completed, payments) {
    const recommendations = [];
    
    if (assignments === 0) {
      recommendations.push("No assignments today. Consider scheduling new assignments.");
    }
    
    if (assignments > 0 && completed / assignments < 0.5) {
      recommendations.push("Low completion rate today. Check on active assignments.");
    }
    
    if (payments === 0) {
      recommendations.push("No payments processed today. Review payment schedule.");
    }
    
    if (assignments > 20 && completed < 10) {
      recommendations.push("High volume of incomplete assignments. Consider reassigning or providing support.");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Good progress today. Keep up the good work!");
    }
    
    return recommendations;
  }
}

module.exports = new RealTimeDashboard();