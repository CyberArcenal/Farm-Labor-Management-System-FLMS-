// dashboard/handlers/workerAnalytics.js
//@ts-check
class WorkerAnalytics {
  /**
     * @param {{ worker: any;  bukid?: any; pitak?: any; assignment: any; debt?: any; debtHistory?: any; payment?: any; paymentHistory?: any; auditTrail?: any; notification?: any; }} repositories
     * @param {{}} params
     */
  async getWorkersOverview(repositories, params) {
    const { worker: workerRepo, assignment: assignmentRepo } = repositories;
    
    try {
      // Get total workers
      const totalWorkers = await workerRepo.count();
      
      // Get workers by status
      const activeWorkers = await workerRepo.count({ 
        where: { status: 'active' } 
      });
      
      const inactiveWorkers = await workerRepo.count({ 
        where: { status: 'inactive' } 
      });
      
      const onLeaveWorkers = await workerRepo.count({ 
        where: { status: 'on-leave' } 
      });
      
      // Get total debt
      const totalDebtResult = await workerRepo
        .createQueryBuilder("worker")
        .select("SUM(worker.totalDebt)", "total")
        .getRawOne();
      
      const totalDebt = parseFloat(totalDebtResult?.total) || 0;
      
      // Get average debt per worker
      const averageDebt = totalWorkers > 0 ? totalDebt / totalWorkers : 0;
      
      // Get workers with highest debt
      const topDebtors = await workerRepo.find({
        select: ['id', 'name', 'totalDebt', 'currentBalance'],
        where: { totalDebt: { $gt: 0 } },
        order: { totalDebt: 'DESC' },
        take: 5
      });
      
      // Get active assignments count
      const activeAssignments = await assignmentRepo.count({
        where: { status: 'active' }
      });
      
      // Get average assignments per worker
      const avgAssignments = totalWorkers > 0 ? activeAssignments / totalWorkers : 0;
      
      return {
        status: true,
        message: "Workers overview retrieved successfully",
        data: {
          summary: {
            total: totalWorkers,
            active: activeWorkers,
            inactive: inactiveWorkers,
            onLeave: onLeaveWorkers,
            activePercentage: totalWorkers > 0 ? (activeWorkers / totalWorkers * 100) : 0
          },
          financial: {
            totalDebt: totalDebt,
            averageDebt: averageDebt,
            topDebtors: topDebtors
          },
          assignments: {
            active: activeAssignments,
            averagePerWorker: avgAssignments
          },
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error("getWorkersOverview error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ worker: any; bukid?: any; pitak?: any; assignment: any; debt?: any; debtHistory?: any; payment: any; paymentHistory?: any; auditTrail?: any; notification?: any; }} repositories
     * @param {{ period?: any; limit?: any; }} params
     */
  async getWorkerPerformance(repositories, params) {
    const { worker: workerRepo, assignment: assignmentRepo, payment: paymentRepo } = repositories;
    const { period = 'month', limit = 10 } = params;
    
    try {
      // Calculate performance based on assignments completed and payments received
      const date = new Date();
      let startDate;
      
      switch(period) {
        case 'week':
          startDate = new Date(date.setDate(date.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(date.setMonth(date.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(date.setMonth(date.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(date.setFullYear(date.getFullYear() - 1));
          break;
        default:
          startDate = new Date(date.setMonth(date.getMonth() - 1));
      }
      
      // Get assignments completed in period
      const completedAssignments = await assignmentRepo
        .createQueryBuilder("assignment")
        .select([
          "assignment.workerId",
          "worker.name",
          "COUNT(assignment.id) as assignmentCount",
          "SUM(assignment.luwangCount) as totalLuwang"
        ])
        .leftJoin("assignment.worker", "worker")
        .where("assignment.status = :status", { status: 'completed' })
        .andWhere("assignment.updatedAt >= :startDate", { startDate })
        .groupBy("assignment.workerId")
        .addGroupBy("worker.name")
        .orderBy("assignmentCount", "DESC")
        .limit(limit)
        .getRawMany();
      
      // Get payments received in period
      const workerPayments = await paymentRepo
        .createQueryBuilder("payment")
        .select([
          "payment.workerId",
          "SUM(payment.grossPay) as totalGross",
          "SUM(payment.netPay) as totalNet",
          "COUNT(payment.id) as paymentCount"
        ])
        .where("payment.paymentDate >= :startDate", { startDate })
        .groupBy("payment.workerId")
        .getRawMany();
      
      // Combine data
      const performanceData = completedAssignments.map((/** @type {{ assignment_workerId: any; worker_name: any; assignmentCount: string; totalLuwang: string; }} */ item) => {
        const payment = workerPayments.find((/** @type {{ payment_workerId: any; }} */ p) => p.payment_workerId === item.assignment_workerId);
        return {
          workerId: item.assignment_workerId,
          workerName: item.worker_name,
          assignmentsCompleted: parseInt(item.assignmentCount),
          totalLuwang: parseFloat(item.totalLuwang),
          totalGrossPay: payment ? parseFloat(payment.totalGross) : 0,
          totalNetPay: payment ? parseFloat(payment.totalNet) : 0,
          paymentCount: payment ? parseInt(payment.paymentCount) : 0,
          productivityScore: parseFloat(item.totalLuwang) / (parseInt(item.assignmentCount) || 1)
        };
      });
      
      return {
        status: true,
        message: "Worker performance data retrieved",
        data: {
          period: {
            start: startDate,
            end: new Date(),
            type: period
          },
          performance: performanceData,
          metrics: {
            totalWorkers: performanceData.length,
            totalAssignments: performanceData.reduce((/** @type {any} */ sum, /** @type {{ assignmentsCompleted: any; }} */ item) => sum + item.assignmentsCompleted, 0),
            totalLuwang: performanceData.reduce((/** @type {any} */ sum, /** @type {{ totalLuwang: any; }} */ item) => sum + item.totalLuwang, 0),
            averageProductivity: performanceData.length > 0 
              ? performanceData.reduce((/** @type {any} */ sum, /** @type {{ productivityScore: any; }} */ item) => sum + item.productivityScore, 0) / performanceData.length 
              : 0
          }
        }
      };
    } catch (error) {
      console.error("getWorkerPerformance error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ worker: any; bukid?: any; pitak?: any; assignment?: any; debt?: any; debtHistory?: any; payment?: any; paymentHistory?: any; auditTrail?: any; notification?: any; }} repositories
     * @param {{}} params
     */
  async getWorkerStatusSummary(repositories, params) {
    const { worker: workerRepo } = repositories;
    
    try {
      // Get workers grouped by status
      const statusSummary = await workerRepo
        .createQueryBuilder("worker")
        .select([
          "worker.status",
          "COUNT(worker.id) as count",
          "SUM(worker.totalDebt) as totalDebt",
          "AVG(worker.totalDebt) as avgDebt"
        ])
        .groupBy("worker.status")
        .getRawMany();
      
      // Get recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentHires = await workerRepo.find({
        where: {
          hireDate: { $gte: thirtyDaysAgo }
        },
        order: { hireDate: 'DESC' },
        take: 10
      });
      
      return {
        status: true,
        message: "Worker status summary retrieved",
        data: {
          statusDistribution: statusSummary.map((/** @type {{ worker_status: any; count: string; totalDebt: string; avgDebt: string; }} */ item) => ({
            status: item.worker_status,
            count: parseInt(item.count),
            totalDebt: parseFloat(item.totalDebt) || 0,
            averageDebt: parseFloat(item.avgDebt) || 0
          })),
          recentHires: recentHires,
        }
      };
    } catch (error) {
      console.error("getWorkerStatusSummary error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ worker: any; bukid?: any; pitak?: any; assignment: any; debt?: any; debtHistory?: any; payment: any; paymentHistory?: any; auditTrail?: any; notification?: any; }} repositories
     * @param {{ timeFrame?: any; category?: any; limit?: any; }} params
     */
  async getTopPerformers(repositories, params) {
    const { worker: workerRepo, assignment: assignmentRepo, payment: paymentRepo } = repositories;
    const { timeFrame = 'month', category = 'productivity', limit = 5 } = params;
    
    try {
      let performers = [];
      
      if (category === 'productivity') {
        // Top performers by assignments completed
        performers = await assignmentRepo
          .createQueryBuilder("assignment")
          .select([
            "worker.id as workerId",
            "worker.name as workerName",
            "COUNT(assignment.id) as completedAssignments",
            "SUM(assignment.luwangCount) as totalLuwang",
            "AVG(assignment.luwangCount) as avgLuwangPerAssignment"
          ])
          .leftJoin("assignment.worker", "worker")
          .where("assignment.status = :status", { status: 'completed' })
          .groupBy("worker.id")
          .addGroupBy("worker.name")
          .orderBy("completedAssignments", "DESC")
          .limit(limit)
          .getRawMany();
          
        performers = performers.map((/** @type {{ workerId: any; workerName: any; completedAssignments: string; totalLuwang: string; }} */ item) => ({
          workerId: item.workerId,
          workerName: item.workerName,
          metric: 'Assignments Completed',
          value: parseInt(item.completedAssignments),
          secondaryValue: parseFloat(item.totalLuwang),
          secondaryLabel: 'Total Luwang'
        }));
        
      } else if (category === 'lowest_debt') {
        // Workers with lowest debt
        performers = await workerRepo
          .createQueryBuilder("worker")
          .select([
            "worker.id",
            "worker.name",
            "worker.totalDebt",
            "worker.currentBalance"
          ])
          .where("worker.totalDebt > 0")
          .orderBy("worker.totalDebt", "ASC")
          .limit(limit)
          .getMany();
          
        performers = performers.map((/** @type {{ id: any; name: any; totalDebt: string; currentBalance: string; }} */ item) => ({
          workerId: item.id,
          workerName: item.name,
          metric: 'Debt Balance',
          value: parseFloat(item.totalDebt),
          secondaryValue: parseFloat(item.currentBalance),
          secondaryLabel: 'Current Balance'
        }));
        
      } else if (category === 'highest_earning') {
        // Workers with highest earnings
        performers = await paymentRepo
          .createQueryBuilder("payment")
          .select([
            "worker.id as workerId",
            "worker.name as workerName",
            "SUM(payment.netPay) as totalNetPay",
            "COUNT(payment.id) as paymentCount"
          ])
          .leftJoin("payment.worker", "worker")
          .where("payment.status = :status", { status: 'completed' })
          .groupBy("worker.id")
          .addGroupBy("worker.name")
          .orderBy("totalNetPay", "DESC")
          .limit(limit)
          .getRawMany();
          
        performers = performers.map((/** @type {{ workerId: any; workerName: any; totalNetPay: string; paymentCount: string; }} */ item) => ({
          workerId: item.workerId,
          workerName: item.workerName,
          metric: 'Total Earnings',
          value: parseFloat(item.totalNetPay),
          secondaryValue: parseInt(item.paymentCount),
          secondaryLabel: 'Payments Received'
        }));
      }
      
      return {
        status: true,
        message: `Top performers by ${category} retrieved`,
        data: {
          category: category,
          timeFrame: timeFrame,
          performers: performers,
          summary: {
            count: performers.length,
            averageValue: performers.length > 0 
              ? performers.reduce((/** @type {any} */ sum, /** @type {{ value: any; }} */ p) => sum + p.value, 0) / performers.length 
              : 0
          }
        }
      };
    } catch (error) {
      console.error("getTopPerformers error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ worker?: any; bukid?: any; pitak?: any; assignment: any; debt?: any; debtHistory?: any; payment?: any; paymentHistory?: any; auditTrail?: any; notification?: any; }} repositories
     * @param {{ startDate?: any; endDate?: any; workerId?: any; }} params
     */
  async getWorkerAttendance(repositories, params) {
    const { assignment: assignmentRepo } = repositories;
    const { startDate, endDate, workerId } = params;
    
    try {
      let query = assignmentRepo
        .createQueryBuilder("assignment")
        .select([
          "DATE(assignment.assignmentDate) as date",
          "COUNT(assignment.id) as totalAssignments",
          "SUM(CASE WHEN assignment.status = 'completed' THEN 1 ELSE 0 END) as completedAssignments",
          "SUM(CASE WHEN assignment.status = 'active' THEN 1 ELSE 0 END) as activeAssignments"
        ])
        .groupBy("DATE(assignment.assignmentDate)")
        .orderBy("date", "DESC");
      
      if (startDate && endDate) {
        query.where("assignment.assignmentDate BETWEEN :start AND :end", {
          start: new Date(startDate),
          end: new Date(endDate)
        });
      }
      
      if (workerId) {
        query.andWhere("assignment.workerId = :workerId", { workerId });
      }
      
      const attendanceData = await query.getRawMany();
      
      // Calculate attendance metrics
      const totalDays = attendanceData.length;
      const daysWithAssignments = attendanceData.filter((/** @type {{ totalAssignments: string; }} */ d) => parseInt(d.totalAssignments) > 0).length;
      const completionRate = attendanceData.length > 0 
        ? attendanceData.reduce((/** @type {number} */ sum, /** @type {{ completedAssignments: string; totalAssignments: any; }} */ d) => sum + (parseInt(d.completedAssignments) / parseInt(d.totalAssignments || 1)), 0) / attendanceData.length * 100
        : 0;
      
      return {
        status: true,
        message: "Worker attendance data retrieved",
        data: {
          attendanceRecords: attendanceData.map((/** @type {{ date: any; totalAssignments: string; completedAssignments: string; activeAssignments: string; }} */ item) => ({
            date: item.date,
            totalAssignments: parseInt(item.totalAssignments),
            completedAssignments: parseInt(item.completedAssignments),
            activeAssignments: parseInt(item.activeAssignments),
            completionRate: parseInt(item.totalAssignments) > 0 
              ? (parseInt(item.completedAssignments) / parseInt(item.totalAssignments)) * 100 
              : 0
          })),
          summary: {
            totalDays: totalDays,
            daysWithAssignments: daysWithAssignments,
            attendanceRate: totalDays > 0 ? (daysWithAssignments / totalDays) * 100 : 0,
            averageCompletionRate: completionRate,
            period: {
              start: startDate || attendanceData[attendanceData.length - 1]?.date,
              end: endDate || attendanceData[0]?.date
            }
          }
        }
      };
    } catch (error) {
      console.error("getWorkerAttendance error:", error);
      throw error;
    }
  }
}

module.exports = new WorkerAnalytics();