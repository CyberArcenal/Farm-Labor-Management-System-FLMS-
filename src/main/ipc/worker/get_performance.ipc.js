// ipc/worker/get_performance.ipc.js
//@ts-check

// @ts-ignore
// @ts-ignore
const Worker = require("../../../entities/Worker");
// @ts-ignore
// @ts-ignore
// @ts-ignore
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");
const Payment = require("../../../entities/Payment");
// @ts-ignore
// @ts-ignore
const Debt = require("../../../entities/Debt");
const Assignment = require("../../../entities/Assignment");

module.exports = async function getWorkerPerformance(params = {}) {
  try {
    // @ts-ignore
    // @ts-ignore
    const { workerId, period = 'month', compareToPrevious = true, _userId } = params;

    if (!workerId) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Determine date ranges
      const now = new Date();
      let currentStart, currentEnd, previousStart, previousEnd;

      if (period === 'week') {
        // Current week (Monday to Sunday)
        const currentDay = now.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() + diff);
        currentStart.setHours(0, 0, 0, 0);
        
        currentEnd = new Date(currentStart);
        currentEnd.setDate(currentStart.getDate() + 6);
        currentEnd.setHours(23, 59, 59, 999);

        // Previous week
        previousStart = new Date(currentStart);
        previousStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentEnd);
        previousEnd.setDate(currentEnd.getDate() - 7);

      } else if (period === 'month') {
        // Current month
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        currentEnd.setHours(23, 59, 59, 999);

        // Previous month
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        previousEnd.setHours(23, 59, 59, 999);

      } else if (period === 'quarter') {
        // Current quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        currentEnd = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0);
        currentEnd.setHours(23, 59, 59, 999);

        // Previous quarter
        previousStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
        previousEnd.setHours(23, 59, 59, 999);

      } else if (period === 'year') {
        // Current year
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = new Date(now.getFullYear(), 11, 31);
        currentEnd.setHours(23, 59, 59, 999);

        // Previous year
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        previousEnd.setHours(23, 59, 59, 999);
      }

      // Get current period assignments
      const assignmentRepository = queryRunner.manager.getRepository(Assignment);
      const currentAssignments = await assignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.workerId = :workerId', { workerId: parseInt(workerId) })
        .andWhere('assignment.assignmentDate BETWEEN :start AND :end', {
          start: currentStart,
          end: currentEnd
        })
        .getMany();

      // Get current period payments
      const paymentRepository = queryRunner.manager.getRepository(Payment);
      const currentPayments = await paymentRepository
        .createQueryBuilder('payment')
        .where('payment.workerId = :workerId', { workerId: parseInt(workerId) })
        .andWhere('payment.paymentDate BETWEEN :start AND :end', {
          start: currentStart,
          end: currentEnd
        })
        .getMany();

      // Calculate current period metrics
      const currentPeriod = {
        assignments: {
          total: currentAssignments.length,
          // @ts-ignore
          completed: currentAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length,
          // @ts-ignore
          active: currentAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'active').length,
          totalLuwang: currentAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => 
            sum + parseFloat(a.luwangCount || 0), 0
          ),
          completionRate: currentAssignments.length > 0 ? 
            // @ts-ignore
            (currentAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length / 
             currentAssignments.length) * 100 : 0
        },
        payments: {
          total: currentPayments.length,
          totalNetPay: currentPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ p) => 
            sum + parseFloat(p.netPay || 0), 0
          ),
          averageNetPay: currentPayments.length > 0 ? 
            currentPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ p) => sum + parseFloat(p.netPay || 0), 0) / 
            currentPayments.length : 0
        },
        productivity: {
          luwangPerDay: currentAssignments.length > 0 ? 
            currentAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0) / 
            (currentAssignments.length || 1) : 0,
          earningsPerLuwang: currentAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => 
            sum + parseFloat(a.luwangCount || 0), 0) > 0 ? 
            currentPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ p) => sum + parseFloat(p.netPay || 0), 0) / 
            currentAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => sum + parseFloat(a.luwangCount || 0), 0) : 0
        }
      };

      let previousPeriod = null;
      let comparison = null;

      // Get previous period data if requested
      if (compareToPrevious) {
        const previousAssignments = await assignmentRepository
          .createQueryBuilder('assignment')
          .where('assignment.workerId = :workerId', { workerId: parseInt(workerId) })
          .andWhere('assignment.assignmentDate BETWEEN :start AND :end', {
            start: previousStart,
            end: previousEnd
          })
          .getMany();

        const previousPayments = await paymentRepository
          .createQueryBuilder('payment')
          .where('payment.workerId = :workerId', { workerId: parseInt(workerId) })
          .andWhere('payment.paymentDate BETWEEN :start AND :end', {
            start: previousStart,
            end: previousEnd
          })
          .getMany();

        previousPeriod = {
          assignments: {
            total: previousAssignments.length,
            // @ts-ignore
            completed: previousAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length,
            totalLuwang: previousAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ a) => 
              sum + parseFloat(a.luwangCount || 0), 0
            ),
            completionRate: previousAssignments.length > 0 ? 
              // @ts-ignore
              (previousAssignments.filter((/** @type {{ status: string; }} */ a) => a.status === 'completed').length / 
               previousAssignments.length) * 100 : 0
          },
          payments: {
            total: previousPayments.length,
            totalNetPay: previousPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: any; }} */ p) => 
              sum + parseFloat(p.netPay || 0), 0
            )
          }
        };

        // Calculate comparison metrics
        comparison = {
          assignments: {
            totalChange: calculatePercentageChange(
              previousPeriod.assignments.total,
              currentPeriod.assignments.total
            ),
            luwangChange: calculatePercentageChange(
              previousPeriod.assignments.totalLuwang,
              currentPeriod.assignments.totalLuwang
            ),
            completionRateChange: calculatePercentageChange(
              previousPeriod.assignments.completionRate,
              currentPeriod.assignments.completionRate
            )
          },
          payments: {
            totalChange: calculatePercentageChange(
              previousPeriod.payments.total,
              currentPeriod.payments.total
            ),
            netPayChange: calculatePercentageChange(
              previousPeriod.payments.totalNetPay,
              currentPeriod.payments.totalNetPay
            )
          },
          trends: {
            improving: currentPeriod.assignments.completionRate > 
                      previousPeriod.assignments.completionRate,
            declining: currentPeriod.assignments.completionRate < 
                      previousPeriod.assignments.completionRate,
            stable: Math.abs(currentPeriod.assignments.completionRate - 
                    previousPeriod.assignments.completionRate) < 5
          }
        };
      }

      // Calculate performance score (0-100)
      const performanceScore = calculatePerformanceScore(currentPeriod);

      // Generate recommendations
      const recommendations = generatePerformanceRecommendations(
        currentPeriod, 
        previousPeriod, 
        comparison
      );

      await queryRunner.release();

      return {
        status: true,
        message: 'Worker performance retrieved successfully',
        data: {
          period: {
            type: period,
            current: {
              start: currentStart,
              end: currentEnd,
              label: formatPeriodLabel(period, currentStart)
            },
            previous: previousPeriod ? {
              start: previousStart,
              end: previousEnd,
              label: formatPeriodLabel(period, previousStart)
            } : null
          },
          currentPeriod,
          previousPeriod,
          comparison,
          performance: {
            score: performanceScore,
            grade: getPerformanceGrade(performanceScore),
            metrics: {
              attendance: currentPeriod.assignments.total > 0 ? 'Good' : 'Needs Improvement',
              quality: currentPeriod.assignments.completionRate >= 90 ? 'Excellent' : 
                      currentPeriod.assignments.completionRate >= 75 ? 'Good' : 'Needs Improvement',
              productivity: currentPeriod.productivity.luwangPerDay > 10 ? 'High' : 
                           currentPeriod.productivity.luwangPerDay > 5 ? 'Average' : 'Low'
            }
          },
          recommendations,
          highlights: {
            bestMetric: getBestMetric(currentPeriod),
            areaForImprovement: getAreaForImprovement(currentPeriod, previousPeriod)
          }
        }
      };
    } catch (error) {
      await queryRunner.release();
      throw error;
    }
  } catch (error) {
    console.error('Error in getWorkerPerformance:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker performance: ${error.message}`,
      data: null
    };
  }
};

// Helper functions
/**
 * @param {number} previous
 * @param {number} current
 */
function calculatePercentageChange(previous, current) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * @param {{ assignments: any; payments?: { total: any; totalNetPay: any; averageNetPay: number; }; productivity: any; }} period
 */
function calculatePerformanceScore(period) {
  let score = 0;
  
  // Assignment completion (40 points)
  score += period.assignments.completionRate * 0.4;
  
  // Productivity (30 points)
  const productivityScore = Math.min(period.productivity.luwangPerDay * 2, 30);
  score += productivityScore;
  
  // Earnings efficiency (20 points)
  const efficiencyScore = Math.min(period.productivity.earningsPerLuwang * 5, 20);
  score += efficiencyScore;
  
  // Attendance consistency (10 points)
  const attendanceScore = period.assignments.total > 10 ? 10 : 
                         period.assignments.total * 1;
  score += attendanceScore;
  
  return Math.min(score, 100);
}

/**
 * @param {number} score
 */
function getPerformanceGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'C+';
  if (score >= 65) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * @param {string} period
 * @param {string | number | Date | undefined} date
 */
function formatPeriodLabel(period, date) {
  if (period === 'week') {
    // @ts-ignore
    const end = new Date(date);
    // @ts-ignore
    end.setDate(date.getDate() + 6);
    // @ts-ignore
    return `Week of ${date.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  } else if (period === 'month') {
    // @ts-ignore
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (period === 'quarter') {
    // @ts-ignore
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    // @ts-ignore
    return `Q${quarter} ${date.getFullYear()}`;
  } else if (period === 'year') {
    // @ts-ignore
    return date.getFullYear().toString();
  }
  return 'Unknown Period';
}

/**
 * @param {{ assignments: any; payments?: { total: any; totalNetPay: any; averageNetPay: number; }; productivity: any; }} current
 * @param {{ assignments: { total: any; completed: any; totalLuwang: any; completionRate: number; }; payments: { total: any; totalNetPay: any; }; } | null} previous
 * @param {{ assignments: { totalChange: number; luwangChange: number; completionRateChange: number; }; payments: { totalChange: number; netPayChange: number; }; trends: { improving: boolean; declining: boolean; stable: boolean; }; } | null} comparison
 */
// @ts-ignore
// @ts-ignore
function generatePerformanceRecommendations(current, previous, comparison) {
  const recommendations = [];
  
  if (current.assignments.completionRate < 75) {
    recommendations.push({
      type: 'improvement',
      area: 'Completion Rate',
      current: `${current.assignments.completionRate.toFixed(1)}%`,
      target: '85%',
      suggestion: 'Focus on completing assigned tasks before taking new ones'
    });
  }
  
  if (current.productivity.luwangPerDay < 5) {
    recommendations.push({
      type: 'improvement',
      area: 'Productivity',
      current: `${current.productivity.luwangPerDay.toFixed(1)} luwang/day`,
      target: '8 luwang/day',
      suggestion: 'Consider training or equipment upgrade to improve efficiency'
    });
  }
  
  if (comparison && comparison.trends.declining) {
    recommendations.push({
      type: 'warning',
      area: 'Performance Trend',
      message: 'Performance is declining compared to previous period',
      suggestion: 'Schedule performance review meeting'
    });
  }
  
  if (current.assignments.completionRate >= 90 && current.productivity.luwangPerDay >= 8) {
    recommendations.push({
      type: 'recognition',
      area: 'Outstanding Performance',
      message: 'Worker is exceeding performance expectations',
      suggestion: 'Consider for bonus or recognition'
    });
  }
  
  return recommendations;
}

/**
 * @param {{ assignments: any; payments?: { total: any; totalNetPay: any; averageNetPay: number; }; productivity: any; }} current
 */
function getBestMetric(current) {
  const metrics = [
    { name: 'Completion Rate', value: current.assignments.completionRate },
    { name: 'Productivity', value: current.productivity.luwangPerDay },
    { name: 'Earnings Efficiency', value: current.productivity.earningsPerLuwang }
  ];
  
  metrics.sort((a, b) => b.value - a.value);
  return metrics[0];
}

/**
 * @param {{ assignments: any; payments: any; productivity?: { luwangPerDay: number; earningsPerLuwang: number; }; }} current
 * @param {{ assignments: { total: any; completed: any; totalLuwang: any; completionRate: number; }; payments: { total: any; totalNetPay: any; }; } | null} previous
 */
function getAreaForImprovement(current, previous) {
  if (!previous) return 'Insufficient data for comparison';
  
  const areas = [];
  
  if (current.assignments.completionRate < previous.assignments.completionRate) {
    areas.push('Assignment Completion');
  }
  
  if (current.assignments.totalLuwang < previous.assignments.totalLuwang) {
    areas.push('Productivity (Luwang)');
  }
  
  if (current.payments.totalNetPay < previous.payments.totalNetPay) {
    areas.push('Earnings');
  }
  
  return areas.length > 0 ? areas.join(', ') : 'No significant areas for improvement';
}