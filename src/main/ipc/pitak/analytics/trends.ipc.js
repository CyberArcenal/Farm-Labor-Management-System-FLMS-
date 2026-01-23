// src/ipc/pitak/analytics/trends.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const Payment = require("../../../../entities/Payment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ bukidId, period = '90d', /** @type {any} */ userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Parse period
    const periodDays = parseInt(period) || 90;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get pitaks
    const pitaks = await pitakRepo.find({
      where: bukidId ? { bukidId } : {},
      relations: ['bukid']
    });

    // Get assignments in period
    const assignments = await assignmentRepo
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.pitak', 'pitak')
      .leftJoinAndSelect('assignment.worker', 'worker')
      .where('assignment.assignmentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .andWhere(bukidId ? 'pitak.bukidId = :bukidId' : '1=1', { bukidId })
      .getMany();

    // Get payments in period
    const payments = await paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.pitak', 'pitak')
      .leftJoinAndSelect('payment.worker', 'worker')
      .where('payment.paymentDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .andWhere(bukidId ? 'pitak.bukidId = :bukidId' : '1=1', { bukidId })
      .getMany();

    // Group data by time periods (weekly, monthly)
    const weeklyTrends = analyzeWeeklyTrends(assignments, payments, startDate, endDate);
    const monthlyTrends = analyzeMonthlyTrends(assignments, payments, startDate, endDate);
    const pitakPerformance = analyzePitakPerformance(pitaks, assignments, payments, periodDays);
    const workerTrends = analyzeWorkerTrends(assignments, payments);
    const seasonalPatterns = analyzeSeasonalPatterns(assignments, payments);

    // Calculate key metrics
    const metrics = {
      totalAssignments: assignments.length,
      totalLuWangAssigned: assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0),
      totalPayments: payments.length,
      totalGrossPay: payments.reduce((/** @type {number} */ sum, /** @type {{ grossPay: string; }} */ p) => sum + parseFloat(p.grossPay), 0),
      totalNetPay: payments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0),
      averageLuWangPerAssignment: assignments.length > 0 
        ? assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0) / assignments.length 
        : 0,
      averagePaymentAmount: payments.length > 0 
        ? payments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0) / payments.length 
        : 0,
      utilizationRate: calculateUtilizationRate(pitaks, assignments, periodDays)
    };

    // Calculate growth rates
    const growthRates = calculateGrowthRates(weeklyTrends);

    // Identify trends and patterns
    const identifiedTrends = identifyTrends(weeklyTrends, monthlyTrends, growthRates);

    // Generate insights
    const insights = generateInsights(identifiedTrends, pitakPerformance, metrics);

    return {
      status: true,
      message: "Trend analysis completed",
      data: {
        period: {
          startDate,
          endDate,
          days: periodDays
        },
        scope: bukidId ? `Bukid ID: ${bukidId}` : 'All bukids',
        metrics,
        trends: {
          weekly: weeklyTrends,
          monthly: monthlyTrends,
          growthRates,
          identifiedTrends
        },
        performance: {
          pitaks: pitakPerformance,
          workers: workerTrends,
          seasonal: seasonalPatterns
        },
        insights,
        recommendations: generateRecommendations(insights, identifiedTrends)
      }
    };

  } catch (error) {
    console.error("Error analyzing trends:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to analyze trends: ${error.message}`,
      data: null
    };
  }
};

// Analysis helper functions
/**
 * @param {any[]} assignments
 * @param {any[]} payments
 * @param {string | number | Date} startDate
 * @param {number | Date} endDate
 */
function analyzeWeeklyTrends(assignments, payments, startDate, endDate) {
  const weeklyData = {};
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;
    
    const weekAssignments = assignments.filter((/** @type {{ assignmentDate: string | number | Date; }} */ a) => {
      const assignmentDate = new Date(a.assignmentDate);
      return assignmentDate >= weekStart && assignmentDate <= weekEnd;
    });
    
    const weekPayments = payments.filter((/** @type {{ paymentDate: string | number | Date; }} */ p) => {
      const paymentDate = p.paymentDate ? new Date(p.paymentDate) : null;
      return paymentDate && paymentDate >= weekStart && paymentDate <= weekEnd;
    });
    
    // @ts-ignore
    weeklyData[weekKey] = {
      weekStart,
      weekEnd,
      assignments: weekAssignments.length,
      luWangAssigned: weekAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0),
      payments: weekPayments.length,
      grossPay: weekPayments.reduce((/** @type {number} */ sum, /** @type {{ grossPay: string; }} */ p) => sum + parseFloat(p.grossPay), 0),
      netPay: weekPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0),
      uniqueWorkers: new Set([...weekAssignments.map((/** @type {{ workerId: any; }} */ a) => a.workerId), ...weekPayments.map((/** @type {{ workerId: any; }} */ p) => p.workerId)]).size
    };
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return Object.values(weeklyData).sort((a, b) => a.weekStart - b.weekStart);
}

/**
 * @param {any[]} assignments
 * @param {any[]} payments
 * @param {Date} startDate
 * @param {number | Date} endDate
 */
function analyzeMonthlyTrends(assignments, payments, startDate, endDate) {
  const monthlyData = {};
  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const monthKey = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const monthAssignments = assignments.filter((/** @type {{ assignmentDate: string | number | Date; }} */ a) => {
      const assignmentDate = new Date(a.assignmentDate);
      return assignmentDate >= monthStart && assignmentDate <= monthEnd;
    });
    
    const monthPayments = payments.filter((/** @type {{ paymentDate: string | number | Date; }} */ p) => {
      const paymentDate = p.paymentDate ? new Date(p.paymentDate) : null;
      return paymentDate && paymentDate >= monthStart && paymentDate <= monthEnd;
    });
    
    // @ts-ignore
    monthlyData[monthKey] = {
      month: monthKey,
      monthStart,
      monthEnd,
      assignments: monthAssignments.length,
      luWangAssigned: monthAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0),
      payments: monthPayments.length,
      grossPay: monthPayments.reduce((/** @type {number} */ sum, /** @type {{ grossPay: string; }} */ p) => sum + parseFloat(p.grossPay), 0),
      netPay: monthPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0),
      averageLuWangPerAssignment: monthAssignments.length > 0 
        ? monthAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0) / monthAssignments.length 
        : 0,
      averageNetPay: monthPayments.length > 0 
        ? monthPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0) / monthPayments.length 
        : 0
    };
    
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return Object.values(monthlyData).sort((a, b) => a.monthStart - b.monthStart);
}

/**
 * @param {any[]} pitaks
 * @param {any[]} assignments
 * @param {any[]} payments
 * @param {number} periodDays
 */
function analyzePitakPerformance(pitaks, assignments, payments, periodDays) {
  return pitaks.map((/** @type {{ id: any; totalLuwang: string; location: any; status: any; }} */ pitak) => {
    const pitakAssignments = assignments.filter((/** @type {{ pitakId: any; }} */ a) => a.pitakId === pitak.id);
    const pitakPayments = payments.filter((/** @type {{ pitakId: any; }} */ p) => p.pitakId === pitak.id);
    
    const totalLuWangAssigned = pitakAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    const totalLuWangCapacity = parseFloat(pitak.totalLuwang);
    const dailyCapacity = totalLuWangCapacity * periodDays;
    const utilizationRate = dailyCapacity > 0 ? (totalLuWangAssigned / dailyCapacity) * 100 : 0;
    
    // Calculate efficiency (revenue per LuWang)
    const totalNetPay = pitakPayments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0);
    const revenuePerLuWang = totalLuWangAssigned > 0 ? totalNetPay / totalLuWangAssigned : 0;
    
    // Calculate consistency (coefficient of variation)
    const dailyLuWang = {};
    pitakAssignments.forEach((/** @type {{ assignmentDate: { toISOString: () => string; }; luwangCount: string; }} */ a) => {
      const date = a.assignmentDate.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyLuWang[date]) dailyLuWang[date] = 0;
      // @ts-ignore
      dailyLuWang[date] += parseFloat(a.luwangCount);
    });
    
    const dailyValues = Object.values(dailyLuWang);
    const avgDailyLuWang = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b) / dailyValues.length : 0;
    const variance = dailyValues.length > 0 ? dailyValues.reduce((sum, val) => sum + Math.pow(val - avgDailyLuWang, 2), 0) / dailyValues.length : 0;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = avgDailyLuWang > 0 ? (1 - (stdDev / avgDailyLuWang)) * 100 : 0;
    
    return {
      pitakId: pitak.id,
      location: pitak.location,
      status: pitak.status,
      totalLuWangCapacity,
      performance: {
        assignments: pitakAssignments.length,
        totalLuWangAssigned,
        utilizationRate,
        payments: pitakPayments.length,
        totalNetPay,
        revenuePerLuWang,
        consistencyScore,
        efficiencyGrade: revenuePerLuWang > 100 ? 'A' : revenuePerLuWang > 50 ? 'B' : revenuePerLuWang > 25 ? 'C' : 'D'
      },
      trends: {
        // @ts-ignore
        weeklyPattern: analyzeWeeklyPattern(pitakAssignments),
        // @ts-ignore
        monthlyGrowth: calculateMonthlyGrowth(pitakAssignments)
      }
    };
  });
}

/**
 * @param {any[]} assignments
 * @param {any[]} payments
 */
function analyzeWorkerTrends(assignments, payments) {
  const workerData = {};
  
  assignments.forEach((/** @type {{ workerId: string | number; worker: { name: any; }; luwangCount: string; assignmentDate: any; }} */ assignment) => {
    if (!assignment.workerId) return;
    
    // @ts-ignore
    if (!workerData[assignment.workerId]) {
      // @ts-ignore
      workerData[assignment.workerId] = {
        workerId: assignment.workerId,
        workerName: assignment.worker ? assignment.worker.name : 'Unknown',
        assignments: 0,
        totalLuWang: 0,
        payments: 0,
        totalEarned: 0,
        assignmentDates: []
      };
    }
    
    // @ts-ignore
    workerData[assignment.workerId].assignments++;
    // @ts-ignore
    workerData[assignment.workerId].totalLuWang += parseFloat(assignment.luwangCount);
    // @ts-ignore
    workerData[assignment.workerId].assignmentDates.push(assignment.assignmentDate);
  });
  
  payments.forEach((/** @type {{ workerId: string | number; netPay: string; }} */ payment) => {
    // @ts-ignore
    if (!payment.workerId || !workerData[payment.workerId]) return;
    
    // @ts-ignore
    workerData[payment.workerId].payments++;
    // @ts-ignore
    workerData[payment.workerId].totalEarned += parseFloat(payment.netPay);
  });
  
  // Calculate additional metrics
  Object.values(workerData).forEach(worker => {
    // Calculate average LuWang per assignment
    worker.averageLuWangPerAssignment = worker.assignments > 0 ? worker.totalLuWang / worker.assignments : 0;
    
    // Calculate earnings per LuWang
    worker.earningsPerLuWang = worker.totalLuWang > 0 ? worker.totalEarned / worker.totalLuWang : 0;
    
    // Calculate assignment frequency
    if (worker.assignmentDates.length > 1) {
      const sortedDates = worker.assignmentDates.sort((/** @type {number} */ a, /** @type {number} */ b) => a - b);
      const timeSpan = sortedDates[sortedDates.length - 1] - sortedDates[0];
      const days = timeSpan / (1000 * 60 * 60 * 24);
      worker.assignmentFrequency = days > 0 ? worker.assignments / days : 0;
    } else {
      worker.assignmentFrequency = 0;
    }
    
    // Determine worker type
    if (worker.assignments >= 20 && worker.assignmentFrequency >= 0.5) {
      worker.type = 'regular';
    } else if (worker.assignments >= 5) {
      worker.type = 'occasional';
    } else {
      worker.type = 'new';
    }
  });
  
  return Object.values(workerData);
}

/**
 * @param {any[]} assignments
 * @param {any} payments
 */
// @ts-ignore
function analyzeSeasonalPatterns(assignments, payments) {
  const monthlyPatterns = {};
  
  assignments.forEach((/** @type {{ assignmentDate: string | number | Date; luwangCount: string; workerId: any; }} */ assignment) => {
    const date = new Date(assignment.assignmentDate);
    const month = date.getMonth();
    const year = date.getFullYear();
    const key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    
    // @ts-ignore
    if (!monthlyPatterns[key]) {
      // @ts-ignore
      monthlyPatterns[key] = {
        month: key,
        year,
        monthNumber: month + 1,
        assignments: 0,
        luWang: 0,
        workers: new Set()
      };
    }
    
    // @ts-ignore
    monthlyPatterns[key].assignments++;
    // @ts-ignore
    monthlyPatterns[key].luWang += parseFloat(assignment.luwangCount);
    // @ts-ignore
    monthlyPatterns[key].workers.add(assignment.workerId);
  });
  
  // Convert to array and calculate additional metrics
  const patterns = Object.values(monthlyPatterns).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNumber - b.monthNumber;
  });
  
  // Calculate month-over-month changes
  patterns.forEach((pattern, index) => {
    if (index > 0) {
      const prev = patterns[index - 1];
      pattern.momGrowth = prev.luWang > 0 ? ((pattern.luWang - prev.luWang) / prev.luWang) * 100 : 0;
    }
    
    pattern.averageLuWangPerAssignment = pattern.assignments > 0 ? pattern.luWang / pattern.assignments : 0;
    pattern.uniqueWorkers = pattern.workers.size;
  });
  
  return patterns;
}

/**
 * @param {any[]} pitaks
 * @param {any[]} assignments
 * @param {number} periodDays
 */
function calculateUtilizationRate(pitaks, assignments, periodDays) {
  const totalCapacity = pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: string; }} */ p) => sum + parseFloat(p.totalLuwang), 0);
  const totalAssigned = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
  const availableCapacity = totalCapacity * periodDays;
  
  return availableCapacity > 0 ? (totalAssigned / availableCapacity) * 100 : 0;
}

/**
 * @param {string | any[]} weeklyTrends
 */
function calculateGrowthRates(weeklyTrends) {
  if (weeklyTrends.length < 2) return {};
  
  const recentWeeks = weeklyTrends.slice(-4); // Last 4 weeks
  const olderWeeks = weeklyTrends.slice(0, -4);
  
  const recentAvg = {
    // @ts-ignore
    luWang: recentWeeks.reduce((/** @type {any} */ sum, /** @type {{ luWangAssigned: any; }} */ w) => sum + w.luWangAssigned, 0) / recentWeeks.length,
    // @ts-ignore
    assignments: recentWeeks.reduce((/** @type {any} */ sum, /** @type {{ assignments: any; }} */ w) => sum + w.assignments, 0) / recentWeeks.length
  };
  
  const olderAvg = olderWeeks.length > 0 ? {
    // @ts-ignore
    luWang: olderWeeks.reduce((/** @type {any} */ sum, /** @type {{ luWangAssigned: any; }} */ w) => sum + w.luWangAssigned, 0) / olderWeeks.length,
    // @ts-ignore
    assignments: olderWeeks.reduce((/** @type {any} */ sum, /** @type {{ assignments: any; }} */ w) => sum + w.assignments, 0) / olderWeeks.length
  } : { luWang: 0, assignments: 0 };
  
  return {
    luWangGrowth: olderAvg.luWang > 0 ? ((recentAvg.luWang - olderAvg.luWang) / olderAvg.luWang) * 100 : 0,
    assignmentGrowth: olderAvg.assignments > 0 ? ((recentAvg.assignments - olderAvg.assignments) / olderAvg.assignments) * 100 : 0,
    weeklyCompoundingRate: calculateCompoundingRate(weeklyTrends, 'luWangAssigned')
  };
}

/**
 * @param {string | any[]} data
 * @param {string} field
 */
function calculateCompoundingRate(data, field) {
  if (data.length < 2) return 0;
  
  const firstValue = data[0][field];
  const lastValue = data[data.length - 1][field];
  const periods = data.length - 1;
  
  if (firstValue <= 0) return 0;
  
  return (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
}

/**
 * @param {string | any[]} weeklyTrends
 * @param {any[]} monthlyTrends
 * @param {{ luWangGrowth?: undefined; assignmentGrowth?: undefined; weeklyCompoundingRate?: undefined; } | { luWangGrowth: number; assignmentGrowth: number; weeklyCompoundingRate: number; }} growthRates
 */
function identifyTrends(weeklyTrends, monthlyTrends, growthRates) {
  const trends = [];
  
  // Analyze weekly trends
  if (weeklyTrends.length >= 4) {
    const recentWeeks = weeklyTrends.slice(-4);
    // @ts-ignore
    const luWangTrend = analyzeLinearTrend(recentWeeks.map((/** @type {{ luWangAssigned: any; }} */ w) => w.luWangAssigned));
    // @ts-ignore
    const assignmentTrend = analyzeLinearTrend(recentWeeks.map((/** @type {{ assignments: any; }} */ w) => w.assignments));
    
    if (luWangTrend.slope > 0.1) {
      trends.push({
        type: 'increasing_luwang',
        strength: Math.abs(luWangTrend.slope),
        confidence: luWangTrend.r2,
        description: 'LuWang assignments showing upward trend'
      });
    } else if (luWangTrend.slope < -0.1) {
      trends.push({
        type: 'decreasing_luwang',
        strength: Math.abs(luWangTrend.slope),
        confidence: luWangTrend.r2,
        description: 'LuWang assignments showing downward trend'
      });
    }
  }
  
  // Analyze monthly trends
  if (monthlyTrends.length >= 3) {
    const revenueTrend = analyzeLinearTrend(monthlyTrends.map((/** @type {{ netPay: any; }} */ m) => m.netPay));
    if (revenueTrend.r2 > 0.7) {
      trends.push({
        type: revenueTrend.slope > 0 ? 'revenue_growth' : 'revenue_decline',
        strength: Math.abs(revenueTrend.slope),
        confidence: revenueTrend.r2,
        description: `Net payments ${revenueTrend.slope > 0 ? 'increasing' : 'decreasing'} consistently`
      });
    }
  }
  
  // Analyze growth rates
  // @ts-ignore
  if (Math.abs(growthRates.luWangGrowth) > 10) {
    trends.push({
      // @ts-ignore
      type: growthRates.luWangGrowth > 0 ? 'accelerating_growth' : 'decelerating_growth',
      // @ts-ignore
      strength: Math.abs(growthRates.luWangGrowth) / 100,
      // @ts-ignore
      description: `LuWang assignments ${growthRates.luWangGrowth > 0 ? 'growing' : 'declining'} at ${Math.abs(growthRates.luWangGrowth).toFixed(1)}% rate`
    });
  }
  
  // Identify patterns in weekly data
  // @ts-ignore
  const weekdayPatterns = analyzeWeekdayPatterns(weeklyTrends);
  if (weekdayPatterns.variation > 20) {
    trends.push({
      type: 'weekday_pattern',
      strength: weekdayPatterns.variation / 100,
      description: 'Significant variation between weekdays'
    });
  }
  
  return trends;
}

/**
 * @param {string | any[]} data
 */
function analyzeLinearTrend(data) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  let ssTot = 0, ssRes = 0;
  const meanY = sumY / n;
  
  for (let i = 0; i < n; i++) {
    ssTot += Math.pow(data[i] - meanY, 2);
    const predicted = slope * i + intercept;
    ssRes += Math.pow(data[i] - predicted, 2);
  }
  
  const r2 = 1 - (ssRes / ssTot);
  
  return { slope, intercept, r2 };
}

/**
 * @param {any[]} weeklyTrends
 */
function analyzeWeekdayPatterns(weeklyTrends) {
  // Simplified version - in reality would analyze daily data
  const variances = weeklyTrends.map((/** @type {{ luWangAssigned: any; }} */ w) => w.luWangAssigned);
  const mean = variances.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b) / variances.length;
  const variance = variances.reduce((/** @type {number} */ sum, /** @type {number} */ val) => sum + Math.pow(val - mean, 2), 0) / variances.length;
  
  return {
    variation: (Math.sqrt(variance) / mean) * 100,
    peakDay: 'Friday', // Simplified
    lowDay: 'Sunday'   // Simplified
  };
}

/**
 * @param {any[]} trends
 * @param {any[]} pitakPerformance
 * @param {{ totalAssignments?: any; totalLuWangAssigned?: any; totalPayments?: any; totalGrossPay?: any; totalNetPay?: any; averageLuWangPerAssignment?: number; averagePaymentAmount?: number; utilizationRate?: number; revenuePerLuWang?: any; }} metrics
 */
function generateInsights(trends, pitakPerformance, metrics) {
  const insights = [];
  
  // Capacity insights
  const highUtilizationPitaks = pitakPerformance.filter((/** @type {{ performance: { utilizationRate: number; }; }} */ p) => p.performance.utilizationRate > 80);
  if (highUtilizationPitaks.length > 0) {
    insights.push({
      type: 'capacity_constraint',
      severity: 'high',
      description: `${highUtilizationPitaks.length} pitaks operating above 80% utilization`,
      impact: 'Potential bottlenecks in assignment scheduling'
    });
  }
  
  // Revenue insights
  if (metrics.revenuePerLuWang > 0) {
    const highRevenuePitaks = pitakPerformance.filter((/** @type {{ performance: { revenuePerLuWang: number; }; }} */ p) => p.performance.revenuePerLuWang > metrics.revenuePerLuWang * 1.5);
    const lowRevenuePitaks = pitakPerformance.filter((/** @type {{ performance: { revenuePerLuWang: number; }; }} */ p) => p.performance.revenuePerLuWang < metrics.revenuePerLuWang * 0.5);
    
    if (highRevenuePitaks.length > 0) {
      insights.push({
        type: 'high_performance',
        severity: 'info',
        description: `${highRevenuePitaks.length} pitaks generating significantly above average revenue`,
        impact: 'Consider replicating their success factors'
      });
    }
    
    if (lowRevenuePitaks.length > 0) {
      insights.push({
        type: 'low_performance',
        severity: 'medium',
        description: `${lowRevenuePitaks.length} pitaks generating significantly below average revenue`,
        impact: 'May need optimization or reallocation'
      });
    }
  }
  
  // Trend-based insights
  trends.forEach((/** @type {{ strength: number; type: string; }} */ trend) => {
    // @ts-ignore
    if (trent.type === 'increasing_luwang' && trend.strength > 0.3) {
      insights.push({
        type: 'growing_demand',
        severity: 'info',
        description: 'Strong growth in LuWang assignments detected',
        impact: 'May need to increase overall capacity'
      });
    }
    
    if (trend.type === 'decreasing_luwang' && trend.strength > 0.3) {
      insights.push({
        type: 'declining_demand',
        severity: 'medium',
        description: 'Significant decline in LuWang assignments',
        impact: 'Consider marketing or operational adjustments'
      });
    }
  });
  
  // Worker insights from pitak performance
  const consistentPitaks = pitakPerformance.filter((/** @type {{ performance: { consistencyScore: number; }; }} */ p) => p.performance.consistencyScore > 80);
  if (consistentPitaks.length > 0) {
    insights.push({
      type: 'consistent_performance',
      severity: 'info',
      description: `${consistentPitaks.length} pitaks showing high consistency`,
      impact: 'Reliable for planning and forecasting'
    });
  }
  
  return insights;
}

/**
 * @param {any[]} insights
 * @param {any[]} trends
 */
function generateRecommendations(insights, trends) {
  const recommendations = [];
  
  insights.forEach((/** @type {{ type: any; }} */ insight) => {
    switch (insight.type) {
      case 'capacity_constraint':
        recommendations.push({
          priority: 'high',
          action: 'Increase capacity in high-utilization pitaks',
          timeframe: 'Immediate',
          impact: 'High',
          details: 'Consider adding more LuWang capacity or redistributing assignments'
        });
        break;
        
      case 'growing_demand':
        recommendations.push({
          priority: 'medium',
          action: 'Scale operations to match demand growth',
          timeframe: '1-2 weeks',
          impact: 'Medium',
          details: 'Plan for additional workers and pitak capacity'
        });
        break;
        
      case 'low_performance':
        recommendations.push({
          priority: 'medium',
          action: 'Optimize underperforming pitaks',
          timeframe: '2-4 weeks',
          impact: 'Medium',
          details: 'Analyze causes of low revenue and implement improvements'
        });
        break;
    }
  });
  
  // Add trend-based recommendations
  const growthTrend = trends.find((/** @type {{ type: string; }} */ t) => t.type === 'accelerating_growth');
  if (growthTrend && growthTrend.strength > 0.5) {
    recommendations.push({
      priority: 'high',
      action: 'Capitalize on growth momentum',
      timeframe: 'Immediate',
      impact: 'High',
      details: 'Expand marketing and operations to sustain growth'
    });
  }
  
  const declineTrend = trends.find((/** @type {{ type: string; }} */ t) => t.type === 'decelerating_growth');
  if (declineTrend && declineTrend.strength > 0.5) {
    recommendations.push({
      priority: 'high',
      action: 'Address declining performance',
      timeframe: 'Immediate',
      impact: 'High',
      details: 'Investigate causes and implement corrective measures'
    });
  }
  
  return recommendations;
}