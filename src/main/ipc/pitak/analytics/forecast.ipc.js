// src/ipc/pitak/analytics/forecast.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (/** @type {any} */ bukidId, period = '30d', /** @type {any} */ userId) => {
  try {
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Parse period
    const periodDays = parseInt(period) || 30;
    const forecastDays = Math.min(periodDays, 365); // Max 1 year forecast

    // Get active pitaks in bukid
    const pitaks = await pitakRepo.find({
      where: { 
        bukidId: bukidId || undefined,
        status: 'active'
      },
      relations: ['bukid']
    });

    if (pitaks.length === 0) {
      return {
        status: true,
        message: "No active pitaks found for forecasting",
        data: {
          period: `${forecastDays} days`,
          pitaks: [],
          forecasts: []
        }
      };
    }

    // Get historical assignment data for the past 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const forecasts = await Promise.all(pitaks.map(async (/** @type {{ id: any; totalLuwang: string; location: any; bukid: { id: any; name: any; }; }} */ pitak) => {
      // Get historical assignments
      const historicalAssignments = await assignmentRepo.find({
        where: {
          pitakId: pitak.id,
          assignmentDate: {
            between: [startDate, endDate]
          },
          status: 'completed'
        },
        order: { assignmentDate: 'ASC' }
      });

      // Group assignments by day
      const dailyData = {};
      historicalAssignments.forEach((/** @type {{ assignmentDate: { toISOString: () => string; }; luwangCount: string; }} */ assignment) => {
        const dateStr = assignment.assignmentDate.toISOString().split('T')[0];
        // @ts-ignore
        if (!dailyData[dateStr]) {
          // @ts-ignore
          dailyData[dateStr] = {
            date: dateStr,
            assignments: 0,
            totalLuWang: 0
          };
        }
        // @ts-ignore
        dailyData[dateStr].assignments++;
        // @ts-ignore
        dailyData[dateStr].totalLuWang += parseFloat(assignment.luwangCount);
      });

      const dailyArray = Object.values(dailyData).sort((a, b) => 
        // @ts-ignore
        new Date(a.date) - new Date(b.date)
      );

      // Calculate statistics
      const totalDays = dailyArray.length;
      const totalLuWang = dailyArray.reduce((sum, day) => sum + day.totalLuWang, 0);
      const avgDailyLuWang = totalDays > 0 ? totalLuWang / totalDays : 0;
      const maxDailyLuWang = Math.max(...dailyArray.map(d => d.totalLuWang), 0);

      // Simple forecasting (could be enhanced with more sophisticated algorithms)
      const forecast = [];
      const today = new Date();
      
      for (let i = 1; i <= forecastDays; i++) {
        const forecastDate = new Date(today);
        forecastDate.setDate(forecastDate.getDate() + i);
        
        // Adjust for day of week patterns
        const dayOfWeek = forecastDate.getDay(); // 0 = Sunday, 6 = Saturday
        let dailyForecast = avgDailyLuWang;
        
        // Apply day of week adjustments (example: weekends might have different patterns)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dailyForecast *= 0.7; // 30% reduction on weekends
        }

        // Apply seasonal adjustment (simplified)
        const month = forecastDate.getMonth();
        const seasonalFactor = getSeasonalFactor(month);
        dailyForecast *= seasonalFactor;

        // Calculate capacity utilization
        const totalLuWangCapacity = parseFloat(pitak.totalLuwang);
        const projectedUtilization = (dailyForecast / totalLuWangCapacity) * 100;

        forecast.push({
          date: forecastDate.toISOString().split('T')[0],
          dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          forecastedLuWang: dailyForecast,
          projectedUtilization,
          capacityRemaining: totalLuWangCapacity - dailyForecast,
          riskLevel: projectedUtilization > 90 ? 'high' : projectedUtilization > 70 ? 'medium' : 'low'
        });
      }

      // Calculate forecast accuracy metrics (if we had actuals to compare)
      const forecastMetrics = {
        basedOnDays: totalDays,
        averageDailyLuWang: avgDailyLuWang,
        maxDailyLuWang,
        confidenceScore: calculateConfidenceScore(totalDays, avgDailyLuWang, maxDailyLuWang),
        assumptions: [
          `Based on ${totalDays} days of historical data`,
          `Average daily LuWang: ${avgDailyLuWang.toFixed(2)}`,
          `Maximum daily LuWang: ${maxDailyLuWang.toFixed(2)}`,
          `Seasonal adjustments applied`,
          `Day of week patterns considered`
        ]
      };

      return {
        pitak: {
          id: pitak.id,
          location: pitak.location,
          totalLuWang: parseFloat(pitak.totalLuwang),
          bukid: pitak.bukid ? {
            id: pitak.bukid.id,
            name: pitak.bukid.name
          } : null
        },
        historicalData: {
          daysAnalyzed: totalDays,
          totalLuWangAssigned: totalLuWang,
          dailyAverage: avgDailyLuWang,
          dailyMax: maxDailyLuWang,
          utilizationRate: (totalLuWang / (parseFloat(pitak.totalLuwang) * totalDays)) * 100
        },
        forecast: forecast,
        metrics: forecastMetrics,
        recommendations: generateRecommendations(forecast, parseFloat(pitak.totalLuwang))
      };
    }));

    // Generate bukid-level forecast
    const bukidForecast = {
      totalActivePitaks: pitaks.length,
      totalCapacity: pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: string; }} */ p) => sum + parseFloat(p.totalLuwang), 0),
      forecastPeriod: `${forecastDays} days`,
      dailyForecastSummary: generateDailySummary(forecasts, forecastDays),
      overallRiskAssessment: assessOverallRisk(forecasts)
    };

    return {
      status: true,
      message: "Forecast generated successfully",
      data: {
        period: `${forecastDays} days`,
        bukidForecast,
        pitakForecasts: forecasts,
        generatedAt: new Date(),
        assumptions: [
          "Based on 90 days of historical data",
          "Considers day-of-week patterns",
          "Includes seasonal adjustments",
          "Assumes similar future conditions"
        ]
      }
    };

  } catch (error) {
    console.error("Error generating forecast:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate forecast: ${error.message}`,
      data: null
    };
  }
};

// Helper functions
/**
 * @param {number} month
 */
function getSeasonalFactor(month) {
  // Simplified seasonal factors (could be based on actual historical patterns)
  const factors = {
    0: 0.9,  // January
    1: 0.95, // February
    2: 1.0,  // March
    3: 1.1,  // April
    4: 1.2,  // May
    5: 1.3,  // June
    6: 1.2,  // July
    7: 1.1,  // August
    8: 1.0,  // September
    9: 0.9,  // October
    10: 0.8, // November
    11: 0.7  // December
  };
  // @ts-ignore
  return factors[month] || 1.0;
}

/**
 * @param {number} days
 * @param {number} avg
 * @param {number} max
 */
// @ts-ignore
function calculateConfidenceScore(days, avg, max) {
  if (days < 7) return 0.3;
  if (days < 30) return 0.6;
  if (days < 90) return 0.8;
  return 0.9;
}

/**
 * @param {{ date: string; dayOfWeek: string; forecastedLuWang: number; projectedUtilization: number; capacityRemaining: number; riskLevel: string; }[]} forecast
 * @param {number} capacity
 */
// @ts-ignore
function generateRecommendations(forecast, capacity) {
  const recommendations = [];
  const highUtilizationDays = forecast.filter((/** @type {{ projectedUtilization: number; }} */ f) => f.projectedUtilization > 90).length;
  const mediumUtilizationDays = forecast.filter((/** @type {{ projectedUtilization: number; }} */ f) => f.projectedUtilization > 70 && f.projectedUtilization <= 90).length;

  if (highUtilizationDays > 0) {
    recommendations.push({
      type: 'capacity_warning',
      message: `${highUtilizationDays} days projected to exceed 90% capacity`,
      action: 'Consider increasing pitak capacity or redistributing assignments'
    });
  }

  if (mediumUtilizationDays > 5) {
    recommendations.push({
      type: 'scheduling_optimization',
      message: `${mediumUtilizationDays} days projected at 70-90% capacity`,
      action: 'Optimize assignment scheduling to balance load'
    });
  }

  // Check for consecutive high utilization
  let consecutiveHigh = 0;
  let maxConsecutive = 0;
  forecast.forEach((/** @type {{ projectedUtilization: number; }} */ f) => {
    if (f.projectedUtilization > 90) {
      consecutiveHigh++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveHigh);
    } else {
      consecutiveHigh = 0;
    }
  });

  if (maxConsecutive >= 3) {
    recommendations.push({
      type: 'sustained_high_utilization',
      message: `${maxConsecutive} consecutive days of high utilization projected`,
      action: 'Plan for temporary capacity expansion or worker rotation'
    });
  }

  return recommendations;
}

/**
 * @param {any[]} forecasts
 * @param {number} days
 */
function generateDailySummary(forecasts, days) {
  const dailySummary = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const dateStr = date.toISOString().split('T')[0];
    
    const dailyTotal = forecasts.reduce((/** @type {any} */ sum, /** @type {{ forecast: any[]; }} */ forecast) => {
      const dayForecast = forecast.forecast.find((/** @type {{ date: string; }} */ f) => f.date === dateStr);
      return sum + (dayForecast ? dayForecast.forecastedLuWang : 0);
    }, 0);
    
    const riskLevels = forecasts.map((/** @type {{ forecast: any[]; }} */ f) => {
      const dayForecast = f.forecast.find((/** @type {{ date: string; }} */ df) => df.date === dateStr);
      return dayForecast ? dayForecast.riskLevel : 'low';
    });
    
    const highRiskCount = riskLevels.filter((/** @type {string} */ r) => r === 'high').length;
    const mediumRiskCount = riskLevels.filter((/** @type {string} */ r) => r === 'medium').length;
    
    dailySummary.push({
      date: dateStr,
      totalForecastedLuWang: dailyTotal,
      highRiskPitaks: highRiskCount,
      mediumRiskPitaks: mediumRiskCount,
      overallRisk: highRiskCount > 0 ? 'high' : mediumRiskCount > 0 ? 'medium' : 'low'
    });
  }
  
  return dailySummary;
}

/**
 * @param {any[]} forecasts
 */
function assessOverallRisk(forecasts) {
  let highRiskDays = 0;
  let mediumRiskDays = 0;
  let totalRiskScore = 0;
  
  forecasts.forEach((/** @type {{ forecast: any[]; }} */ forecast) => {
    forecast.forecast.forEach((/** @type {{ riskLevel: string; }} */ day) => {
      if (day.riskLevel === 'high') {
        highRiskDays++;
        totalRiskScore += 3;
      } else if (day.riskLevel === 'medium') {
        mediumRiskDays++;
        totalRiskScore += 2;
      } else {
        totalRiskScore += 1;
      }
    });
  });
  
  const totalDays = forecasts.length > 0 ? forecasts[0].forecast.length : 0;
  const avgRiskScore = totalRiskScore / (forecasts.length * totalDays);
  
  return {
    highRiskDays,
    mediumRiskDays,
    averageRiskScore: avgRiskScore,
    overallRiskLevel: avgRiskScore > 2.5 ? 'high' : avgRiskScore > 1.5 ? 'medium' : 'low',
    recommendations: avgRiskScore > 2.5 
      ? 'Immediate capacity planning needed' 
      : avgRiskScore > 1.5 
        ? 'Monitor closely and plan for adjustments' 
        : 'Current capacity appears adequate'
  };
}