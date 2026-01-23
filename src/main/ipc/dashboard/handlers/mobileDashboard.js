// dashboard/handlers/mobileDashboard.js
//@ts-check
class MobileDashboard {
  /**
     * @param {{ worker: any; assignment: any; debt: any; payment: any; pitak: any; }} repositories
     * @param {any} params
     */
  async getMobileDashboard(repositories, params) {
    const { 
      worker: workerRepo, 
      assignment: assignmentRepo, 
      debt: debtRepo,
      payment: paymentRepo,
      pitak: pitakRepo
    } = repositories;
    
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      // Get key metrics for mobile display
      const activeWorkers = await workerRepo.count({ where: { status: 'active' } });
      const todayAssignments = await assignmentRepo.count({ 
        where: { assignmentDate: { $gte: todayStart } } 
      });
      const activeAssignments = await assignmentRepo.count({ where: { status: 'active' } });
      const activePitaks = await pitakRepo.count({ where: { status: 'active' } });
      
      // Get today's completed assignments
      const todayCompleted = await assignmentRepo.count({
        where: {
          assignmentDate: { $gte: todayStart },
          status: 'completed'
        }
      });
      
      // Get today's payments
      const todayPayments = await paymentRepo
        .createQueryBuilder("payment")
        .select("SUM(payment.netPay)", "total")
        .where("payment.paymentDate >= :today", { today: todayStart })
        .andWhere("payment.status = :status", { status: 'completed' })
        .getRawOne();
      
      // Get pending debts
      const pendingDebts = await debtRepo.count({ 
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
      
      // Get recent activities (last 3 hours)
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      
      const recentActivities = await assignmentRepo.find({
        where: {
          updatedAt: { $gte: threeHoursAgo }
        },
        relations: ['worker'],
        order: { updatedAt: 'DESC' },
        take: 5
      });
      
      // Format activities for mobile
      const formattedActivities = recentActivities.map((/** @type {{ id: any; worker: { name: any; }; status: string; luwangCount: string; updatedAt: any; }} */ activity) => ({
        id: activity.id,
        type: 'assignment',
        workerName: activity.worker?.name || 'Unknown',
        action: activity.status === 'completed' ? 'completed assignment' : 
                activity.status === 'active' ? 'started assignment' : 
                'updated assignment',
        luwangCount: parseFloat(activity.luwangCount),
        status: activity.status,
        time: this.formatTimeAgo(activity.updatedAt)
      }));
      
      // Get workers with upcoming assignments today
      const workersWithTodayAssignments = await assignmentRepo
        .createQueryBuilder("assignment")
        .leftJoin("assignment.worker", "worker")
        .select([
          "worker.name as workerName",
          "COUNT(assignment.id) as assignmentCount",
          "SUM(assignment.luwangCount) as totalLuwang"
        ])
        .where("assignment.assignmentDate >= :today", { today: todayStart })
        .groupBy("worker.name")
        .orderBy("assignmentCount", "DESC")
        .limit(5)
        .getRawMany();
      
      // Calculate quick stats
      const completionRate = todayAssignments > 0 
        ? (todayCompleted / todayAssignments) * 100 
        : 0;
      
      const averagePayment = parseInt(todayPayments?.paymentCount) > 0 
        ? parseFloat(todayPayments?.total) / parseInt(todayPayments?.paymentCount) 
        : 0;
      
      // Prepare mobile-optimized response
      return {
        status: true,
        message: "Mobile dashboard data retrieved",
        data: {
          timestamp: now.toISOString(),
          overviewCards: [
            {
              title: "Active Workers",
              value: activeWorkers,
              icon: "workers",
              color: "blue",
              trend: null
            },
            {
              title: "Today's Assignments",
              value: todayAssignments,
              icon: "assignments",
              color: "green",
              subValue: `${todayCompleted} completed`,
              trend: completionRate >= 70 ? 'good' : completionRate >= 40 ? 'average' : 'poor'
            },
            {
              title: "Active Pitaks",
              value: activePitaks,
              icon: "pitaks",
              color: "orange",
              trend: null
            },
            {
              title: "Today's Payments",
              value: parseFloat(todayPayments?.total) || 0,
              icon: "payments",
              color: "purple",
              format: "currency",
              trend: null
            }
          ],
          quickStats: {
            completionRate: completionRate,
            activeAssignments: activeAssignments,
            pendingDebts: pendingDebts,
            totalDebtBalance: parseFloat(totalDebtBalance?.total) || 0,
            averagePayment: averagePayment
          },
          recentActivities: formattedActivities,
          todaysTopWorkers: workersWithTodayAssignments.map((/** @type {{ workerName: any; assignmentCount: string; totalLuwang: string; }} */ worker) => ({
            workerName: worker.workerName,
            assignmentCount: parseInt(worker.assignmentCount),
            totalLuwang: parseFloat(worker.totalLuwang)
          })),
          alerts: await this.getMobileAlerts(repositories),
          lastUpdated: this.formatTimeAgo(now)
        }
      };
    } catch (error) {
      console.error("getMobileDashboard error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ worker: any; assignment: any; debt: any; }} repositories
     * @param {any} params
     */
  async getQuickStats(repositories, params) {
    const { worker: workerRepo, assignment: assignmentRepo, debt: debtRepo } = repositories;
    
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      
      // Get worker statistics
      const totalWorkers = await workerRepo.count();
      const activeWorkers = await workerRepo.count({ where: { status: 'active' } });
      const inactiveWorkers = await workerRepo.count({ where: { status: 'inactive' } });
      
      // Get assignment statistics
      const todayAssignments = await assignmentRepo.count({ 
        where: { assignmentDate: { $gte: todayStart } } 
      });
      
      const weekAssignments = await assignmentRepo.count({ 
        where: { assignmentDate: { $gte: weekStart } } 
      });
      
      const activeAssignments = await assignmentRepo.count({ where: { status: 'active' } });
      const completedAssignments = await assignmentRepo.count({ where: { status: 'completed' } });
      
      // Get debt statistics
      const totalDebts = await debtRepo.count();
      const pendingDebts = await debtRepo.count({ where: { status: 'pending' } });
      const paidDebts = await debtRepo.count({ where: { status: 'paid' } });
      
      const debtStats = await debtRepo
        .createQueryBuilder("debt")
        .select([
          "SUM(debt.amount) as totalAmount",
          "SUM(debt.balance) as totalBalance",
          "SUM(debt.totalPaid) as totalPaid"
        ])
        .getRawOne();
      
      // Get today's completion rate
      const todayCompleted = await assignmentRepo.count({
        where: {
          assignmentDate: { $gte: todayStart },
          status: 'completed'
        }
      });
      
      const todayCompletionRate = todayAssignments > 0 
        ? (todayCompleted / todayAssignments) * 100 
        : 0;
      
      // Calculate worker debt averages
      const averageDebtPerWorker = activeWorkers > 0 
        ? parseFloat(debtStats?.totalBalance) / activeWorkers 
        : 0;
      
      // Get assignment completion rate
      const overallCompletionRate = (todayAssignments + weekAssignments) > 0 
        ? (completedAssignments / (todayAssignments + weekAssignments)) * 100 
        : 0;
      
      return {
        status: true,
        message: "Quick stats retrieved",
        data: {
          timestamp: now.toISOString(),
          workers: {
            total: totalWorkers,
            active: activeWorkers,
            inactive: inactiveWorkers,
            activePercentage: totalWorkers > 0 ? (activeWorkers / totalWorkers) * 100 : 0
          },
          assignments: {
            today: todayAssignments,
            week: weekAssignments,
            active: activeAssignments,
            completed: completedAssignments,
            todayCompletionRate: todayCompletionRate,
            overallCompletionRate: overallCompletionRate
          },
          debts: {
            total: totalDebts,
            pending: pendingDebts,
            paid: paidDebts,
            totalAmount: parseFloat(debtStats?.totalAmount) || 0,
            totalBalance: parseFloat(debtStats?.totalBalance) || 0,
            totalPaid: parseFloat(debtStats?.totalPaid) || 0,
            collectionRate: parseFloat(debtStats?.totalAmount) > 0 
              ? (parseFloat(debtStats?.totalPaid) / parseFloat(debtStats?.totalAmount)) * 100 
              : 0,
            averagePerWorker: averageDebtPerWorker
          },
          performance: {
            workerUtilization: activeWorkers > 0 ? (todayAssignments / activeWorkers) * 100 : 0,
            debtHealth: parseFloat(debtStats?.totalBalance) < parseFloat(debtStats?.totalAmount) * 0.3 
              ? 'good' 
              : parseFloat(debtStats?.totalBalance) < parseFloat(debtStats?.totalAmount) * 0.6 
                ? 'fair' 
                : 'poor'
          },
          summary: {
            overallHealth: this.calculateOverallHealth(
              todayCompletionRate, 
              parseFloat(debtStats?.totalBalance),
              parseFloat(debtStats?.totalAmount)
            ),
            priorityActions: this.getPriorityActions(
              pendingDebts, 
              activeAssignments, 
              todayCompletionRate
            )
          }
        }
      };
    } catch (error) {
      console.error("getQuickStats error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ worker: any; assignment: any; debt: any; payment: any; }} repositories
     * @param {{ workerId: any; }} params
     */
  async getWorkerQuickView(repositories, params) {
    const { workerId } = params;
    
    if (!workerId) {
      return {
        status: false,
        message: "Worker ID is required",
        data: null
      };
    }
    
    const { 
      worker: workerRepo, 
      assignment: assignmentRepo, 
      debt: debtRepo,
      payment: paymentRepo 
    } = repositories;
    
    try {
      // Get worker details
      const worker = await workerRepo.findOne({
        where: { id: workerId },
        relations: ['kabisilya']
      });
      
      if (!worker) {
        return {
          status: false,
          message: "Worker not found",
          data: null
        };
      }
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 30); // Last 30 days
      
      // Get worker's assignments
      const assignments = await assignmentRepo.find({
        where: { worker: { id: workerId } },
        order: { assignmentDate: 'DESC' },
        take: 10
      });
      
      // Get worker's debts
      const debts = await debtRepo.find({
        where: { worker: { id: workerId } },
        order: { dateIncurred: 'DESC' }
      });
      
      // Get worker's payments
      const payments = await paymentRepo.find({
        where: { worker: { id: workerId } },
        order: { paymentDate: 'DESC' },
        take: 10
      });
      
      // Calculate assignment statistics
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length;
      const activeAssignments = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'active').length;
      
      const totalLuwang = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => 
        sum + parseFloat(a.luwangCount || 0), 0);
      
      const completedLuwang = assignments
        .filter((/** @type {{ status: string; }} */ a) => a.status === 'completed')
        .reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0);
      
      // Calculate debt statistics
      const totalDebts = debts.length;
      const pendingDebts = debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'pending').length;
      const paidDebts = debts.filter((/** @type {{ status: string; }} */ d) => d.status === 'paid').length;
      
      const totalDebtAmount = debts.reduce((/** @type {number} */ sum, /** @type {{ amount: any; }} */ d) => 
        sum + parseFloat(d.amount || 0), 0);
      
      const totalDebtBalance = debts.reduce((/** @type {number} */ sum, /** @type {{ balance: any; }} */ d) => 
        sum + parseFloat(d.balance || 0), 0);
      
      const totalDebtPaid = debts.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: any; }} */ d) => 
        sum + parseFloat(d.totalPaid || 0), 0);
      
      // Calculate payment statistics
      const totalPayments = payments.length;
      const totalPaymentAmount = payments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ p) => 
        sum + parseFloat(p.netPay || 0), 0);
      
      // Calculate recent performance (last 7 days)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const recentAssignments = assignments.filter((/** @type {{ assignmentDate: string | number | Date; }} */ a) => 
        new Date(a.assignmentDate) >= sevenDaysAgo
      );
      
      const recentCompleted = recentAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length;
      const recentCompletionRate = recentAssignments.length > 0 
        ? (recentCompleted / recentAssignments.length) * 100 
        : 0;
      
      // Calculate averages
      const averageLuwangPerAssignment = totalAssignments > 0 
        ? totalLuwang / totalAssignments 
        : 0;
      
      const averagePayment = totalPayments > 0 
        ? totalPaymentAmount / totalPayments 
        : 0;
      
      const debtCollectionRate = totalDebtAmount > 0 
        ? (totalDebtPaid / totalDebtAmount) * 100 
        : 0;
      
      // Format assignments for display
      const formattedAssignments = assignments.slice(0, 5).map((/** @type {{ id: any; luwangCount: string; status: string; assignmentDate: any; }} */ assignment) => ({
        id: assignment.id,
        luwangCount: parseFloat(assignment.luwangCount),
        status: assignment.status,
        assignmentDate: assignment.assignmentDate,
        statusColor: assignment.status === 'completed' ? 'green' : 
                    assignment.status === 'active' ? 'blue' : 'gray'
      }));
      
      // Format debts for display
      const formattedDebts = debts.slice(0, 5).map((/** @type {{ id: any; amount: string; balance: string; status: string; dateIncurred: any; dueDate: string | number | Date; }} */ debt) => ({
        id: debt.id,
        amount: parseFloat(debt.amount),
        balance: parseFloat(debt.balance),
        status: debt.status,
        dateIncurred: debt.dateIncurred,
        dueDate: debt.dueDate,
        isOverdue: debt.dueDate && new Date(debt.dueDate) < new Date() && 
                  ['pending', 'partially_paid'].includes(debt.status)
      }));
      
      // Format payments for display
      const formattedPayments = payments.slice(0, 5).map((/** @type {{ id: any; netPay: string; grossPay: string; paymentDate: any; status: any; }} */ payment) => ({
        id: payment.id,
        netPay: parseFloat(payment.netPay),
        grossPay: parseFloat(payment.grossPay),
        paymentDate: payment.paymentDate,
        status: payment.status
      }));
      
      // Calculate worker performance score
      const performanceScore = this.calculateWorkerPerformance(
        recentCompletionRate,
        averageLuwangPerAssignment,
        debtCollectionRate
      );
      
      return {
        status: true,
        message: "Worker quick view retrieved",
        data: {
          worker: {
            id: worker.id,
            name: worker.name,
            contact: worker.contact,
            email: worker.email,
            status: worker.status,
            hireDate: worker.hireDate,
            kabisilyaName: worker.kabisilya?.name || 'Unassigned'
          },
          overview: {
            assignments: {
              total: totalAssignments,
              completed: completedAssignments,
              active: activeAssignments,
              completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0
            },
            luwang: {
              total: totalLuwang,
              completed: completedLuwang,
              averagePerAssignment: averageLuwangPerAssignment
            },
            debts: {
              total: totalDebts,
              pending: pendingDebts,
              paid: paidDebts,
              totalAmount: totalDebtAmount,
              currentBalance: totalDebtBalance,
              collectionRate: debtCollectionRate
            },
            payments: {
              total: totalPayments,
              totalAmount: totalPaymentAmount,
              average: averagePayment
            }
          },
          performance: {
            score: performanceScore,
            recentCompletionRate: recentCompletionRate,
            category: performanceScore >= 80 ? 'Excellent' :
                     performanceScore >= 60 ? 'Good' :
                     performanceScore >= 40 ? 'Average' : 'Needs Improvement'
          },
          recentActivity: {
            assignments: formattedAssignments,
            debts: formattedDebts,
            payments: formattedPayments
          },
          alerts: this.getWorkerAlerts(
            pendingDebts,
            activeAssignments,
            recentCompletionRate
          ),
          summary: {
            lastUpdated: now.toISOString(),
            overallStatus: this.getWorkerOverallStatus(
              worker.status,
              pendingDebts,
              activeAssignments
            )
          }
        }
      };
    } catch (error) {
      console.error("getWorkerQuickView error:", error);
      throw error;
    }
  }
  
  // Helper methods
  /**
     * @param {{ debt: any; assignment: any; }} repositories
     */
  async getMobileAlerts(repositories) {
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
          message: `${overdueDebts} overdue debts need attention`,
          priority: 'high'
        });
      }
      
      // Check for assignments due today
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const assignmentsDueToday = await assignmentRepo.count({
        where: {
          assignmentDate: { $gte: today, $lt: tomorrow },
          status: 'active'
        }
      });
      
      if (assignmentsDueToday > 0) {
        alerts.push({
          type: 'info',
          title: 'Today\'s Assignments',
          message: `${assignmentsDueToday} assignments due today`,
          priority: 'medium'
        });
      }
      
    } catch (error) {
      console.error("getMobileAlerts error:", error);
    }
    
    return alerts.slice(0, 3); // Limit to 3 alerts for mobile
  }
  
  /**
     * @param {string | number | Date} date
     */
  formatTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    // @ts-ignore
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  }
  
  /**
     * @param {number} completionRate
     * @param {number} debtBalance
     * @param {number} totalDebt
     */
  calculateOverallHealth(completionRate, debtBalance, totalDebt) {
    let healthScore = 0;
    
    // Completion rate component (40%)
    healthScore += Math.min(completionRate, 100) * 0.4;
    
    // Debt health component (40%)
    const debtRatio = totalDebt > 0 ? debtBalance / totalDebt : 0;
    const debtHealth = (1 - debtRatio) * 100;
    healthScore += Math.min(debtHealth, 100) * 0.4;
    
    // Base component (20%)
    healthScore += 20;
    
    if (healthScore >= 80) return 'excellent';
    if (healthScore >= 60) return 'good';
    if (healthScore >= 40) return 'fair';
    return 'needs_attention';
  }
  
  /**
     * @param {number} pendingDebts
     * @param {number} activeAssignments
     * @param {number} completionRate
     */
  getPriorityActions(pendingDebts, activeAssignments, completionRate) {
    const actions = [];
    
    if (pendingDebts > 5) {
      actions.push('Review pending debts');
    }
    
    if (activeAssignments > 10) {
      actions.push('Monitor active assignments');
    }
    
    if (completionRate < 50) {
      actions.push('Improve assignment completion');
    }
    
    if (actions.length === 0) {
      actions.push('All systems normal');
    }
    
    return actions.slice(0, 3);
  }
  
  /**
     * @param {number} completionRate
     * @param {number} averageLuwang
     * @param {number} debtCollectionRate
     */
  calculateWorkerPerformance(completionRate, averageLuwang, debtCollectionRate) {
    let score = 0;
    
    // Completion rate component (50%)
    score += Math.min(completionRate, 100) * 0.5;
    
    // Luwang productivity component (30%)
    const luwangScore = Math.min((averageLuwang / 10) * 100, 100); // Assuming 10 is good average
    score += luwangScore * 0.3;
    
    // Debt management component (20%)
    score += Math.min(debtCollectionRate, 100) * 0.2;
    
    return Math.round(score);
  }
  
  /**
     * @param {number} pendingDebts
     * @param {number} activeAssignments
     * @param {number} completionRate
     */
  getWorkerAlerts(pendingDebts, activeAssignments, completionRate) {
    const alerts = [];
    
    if (pendingDebts > 0) {
      alerts.push({
        type: 'debt',
        message: `${pendingDebts} pending debt${pendingDebts > 1 ? 's' : ''}`,
        priority: pendingDebts > 3 ? 'high' : 'medium'
      });
    }
    
    if (activeAssignments > 5) {
      alerts.push({
        type: 'assignment',
        message: `${activeAssignments} active assignment${activeAssignments > 1 ? 's' : ''}`,
        priority: 'medium'
      });
    }
    
    if (completionRate < 50) {
      alerts.push({
        type: 'performance',
        message: 'Low completion rate',
        priority: 'low'
      });
    }
    
    return alerts;
  }
  
  /**
     * @param {string} status
     * @param {number} pendingDebts
     * @param {number} activeAssignments
     */
  getWorkerOverallStatus(status, pendingDebts, activeAssignments) {
    if (status !== 'active') return 'inactive';
    
    if (pendingDebts > 5) return 'needs_attention';
    if (activeAssignments > 10) return 'busy';
    if (activeAssignments > 0) return 'active';
    
    return 'available';
  }
}

module.exports = new MobileDashboard();