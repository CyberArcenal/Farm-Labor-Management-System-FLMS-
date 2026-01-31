// ipc/worker/get/stats.ipc.js
//@ts-check

// @ts-ignore
const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerStats(params = {}) {
  try {
    // @ts-ignore
    const { _userId } = params;

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get all counts in parallel for performance
      const [
        totalWorkers,
        activeWorkers,
        inactiveWorkers,
        onLeaveWorkers,
        terminatedWorkers,
        workersByStatus,
        averageBalance,
        totalDebt,
        recentHires
      ] = await Promise.all([
        // Total workers
        queryRunner.query('SELECT COUNT(*) as count FROM workers'),
        
        // Active workers
        queryRunner.query('SELECT COUNT(*) as count FROM workers WHERE status = ?', ['active']),
        
        // Inactive workers
        queryRunner.query('SELECT COUNT(*) as count FROM workers WHERE status = ?', ['inactive']),
        
        // On-leave workers
        queryRunner.query('SELECT COUNT(*) as count FROM workers WHERE status = ?', ['on-leave']),
        
        // Terminated workers
        queryRunner.query('SELECT COUNT(*) as count FROM workers WHERE status = ?', ['terminated']),
        
        // Workers by status
        queryRunner.query(`
          SELECT status, COUNT(*) as count
          FROM workers
          GROUP BY status
          ORDER BY count DESC
        `),
        
        // Average balance
        queryRunner.query('SELECT AVG(currentBalance) as avgBalance FROM workers WHERE status = ?', ['active']),
        
        // Total debt
        queryRunner.query('SELECT SUM(totalDebt) as totalDebt FROM workers'),
        
        // Recent hires (last 30 days)
        queryRunner.query(`
          SELECT COUNT(*) as count 
          FROM workers 
          WHERE hireDate >= DATE('now', '-30 days') 
          AND status = 'active'
        `)
      ]);

      await queryRunner.release();

      // Format the results
      const stats = {
        totals: {
          all: parseInt(totalWorkers[0].count),
          active: parseInt(activeWorkers[0].count),
          inactive: parseInt(inactiveWorkers[0].count),
          onLeave: parseInt(onLeaveWorkers[0].count),
          terminated: parseInt(terminatedWorkers[0].count)
        },
        distribution: {
          byStatus: workersByStatus.map((/** @type {{ status: any; count: string; }} */ row) => ({
            status: row.status,
            count: parseInt(row.count)
          }))
        },
        financial: {
          averageBalance: parseFloat(averageBalance[0].avgBalance || 0),
          totalDebt: parseFloat(totalDebt[0].totalDebt || 0)
        },
        trends: {
          recentHires: parseInt(recentHires[0].count),
          hireRate: parseInt(recentHires[0].count) / 30 // hires per day
        },
        percentages: {
          activeRate: (parseInt(activeWorkers[0].count) / parseInt(totalWorkers[0].count) * 100) || 0,
          turnoverRate: (parseInt(terminatedWorkers[0].count) / parseInt(totalWorkers[0].count) * 100) || 0
        }
      };

      return {
        status: true,
        message: 'Worker statistics retrieved successfully',
        data: { stats }
      };
    } catch (error) {
      await queryRunner.release();
      throw error;
    }
  } catch (error) {
    console.error('Error in getWorkerStats:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker statistics: ${error.message}`,
      data: null
    };
  }
};