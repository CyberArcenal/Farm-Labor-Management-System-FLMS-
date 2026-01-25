// dashboard/handlers/pitakProductivity.js
// @ts-check

const { logger } = require("../../../../utils/logger");

class PitakProductivityHandler {
  /**
   * Get overall pitak productivity summary
   * @param {Object} repositories - All repositories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Pitak productivity overview
   */
  async getPitakProductivityOverview(repositories, params) {
    try {
      // @ts-ignore
      const { pitak, assignment, payment } = repositories;
      // @ts-ignore
      const { bukidId, kabisilyaId, status = "active" } = params;
      
      let query = pitak.createQueryBuilder("p")
        .leftJoin("p.assignments", "a")
        .leftJoin("p.bukid", "b")
        .leftJoin("b.kabisilya", "k")
        .select([
          "p.id",
          "p.location",
          "p.status",
          "p.totalLuwang",
          "b.name as bukidName",
          "k.name as kabisilyaName"
        ])
        .addSelect("COUNT(a.id)", "assignmentCount")
        .addSelect("SUM(CASE WHEN a.status = 'completed' THEN a.luwangCount ELSE 0 END)", "totalCompletedLuwang")
        .addSelect("SUM(CASE WHEN a.status = 'active' THEN a.luwangCount ELSE 0 END)", "totalActiveLuwang")
        .groupBy("p.id");

      // Apply filters
      if (bukidId) {
        query.andWhere("b.id = :bukidId", { bukidId });
      }
      
      if (kabisilyaId) {
        query.andWhere("k.id = :kabisilyaId", { kabisilyaId });
      }
      
      if (status) {
        query.andWhere("p.status = :status", { status });
      }

      const pitaks = await query.getRawMany();

      // Calculate productivity metrics
      const productivityData = pitaks.map((/** @type {{ totalCompletedLuwang: string; totalActiveLuwang: string; assignmentCount: string; p_id: any; p_location: any; p_status: any; p_total_luwang: string; bukidName: any; kabisilyaName: any; }} */ p) => {
        const completedLuwang = parseFloat(p.totalCompletedLuwang) || 0;
        const activeLuwang = parseFloat(p.totalActiveLuwang) || 0;
        const totalAssignments = parseInt(p.assignmentCount) || 0;
        const efficiency = totalAssignments > 0 ? (completedLuwang / (completedLuwang + activeLuwang)) * 100 : 0;
        
        return {
          pitakId: p.p_id,
          location: p.p_location,
          status: p.p_status,
          totalLuwang: parseFloat(p.p_total_luwang) || 0,
          bukidName: p.bukidName,
          kabisilyaName: p.kabisilyaName,
          metrics: {
            completedLuwang,
            activeLuwang,
            totalAssignments,
            completionRate: efficiency,
            averageLuwangPerAssignment: totalAssignments > 0 ? completedLuwang / totalAssignments : 0,
            utilization: (completedLuwang / parseFloat(p.p_total_luwang)) * 100 || 0,
          }
        };
      });

      // Get payment data for financial productivity
      const financialProductivity = await this.getPitakFinancialProductivity(repositories, params);

      return {
        status: true,
        message: "Pitak productivity overview retrieved",
        data: {
          summary: {
            totalPitaks: pitaks.length,
            activePitaks: pitaks.filter((/** @type {{ p_status: string; }} */ p) => p.p_status === "active").length,
            harvestedPitaks: pitaks.filter((/** @type {{ p_status: string; }} */ p) => p.p_status === "harvested").length,
            totalCompletedLuwang: productivityData.reduce((/** @type {any} */ sum, /** @type {{ metrics: { completedLuwang: any; }; }} */ p) => sum + p.metrics.completedLuwang, 0),
            averageCompletionRate: productivityData.reduce((/** @type {any} */ sum, /** @type {{ metrics: { completionRate: any; }; }} */ p) => sum + p.metrics.completionRate, 0) / productivityData.length || 0,
            averageUtilization: productivityData.reduce((/** @type {any} */ sum, /** @type {{ metrics: { utilization: any; }; }} */ p) => sum + p.metrics.utilization, 0) / productivityData.length || 0,
          },
          pitaks: productivityData,
          financial: financialProductivity.data?.summary || {},
          topPerformers: this.identifyTopPerformers(productivityData),
        },
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error in getPitakProductivityOverview:", error);
      throw error;
    }
  }

  /**
   * Get detailed productivity analysis for a specific pitak
   * @param {Object} repositories - All repositories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Detailed pitak productivity
   */
  async getPitakProductivityDetails(repositories, params) {
    try {
      // @ts-ignore
      const { pitakId } = params;
      if (!pitakId) {
        throw new Error("pitakId is required");
      }

      // @ts-ignore
      const { pitak, assignment, payment, worker } = repositories;
      
      // Get pitak information
      const pitakInfo = await pitak.findOne({
        where: { id: pitakId },
        relations: ["bukid", "bukid.kabisilya", "assignments", "assignments.worker"],
      });

      if (!pitakInfo) {
        throw new Error("Pitak not found");
      }

      // Get assignments for this pitak
      const assignments = pitakInfo.assignments || [];
      
      // Calculate assignment productivity
      const assignmentProductivity = this.calculateAssignmentProductivity(assignments);
      
      // Get worker performance for this pitak
      const workerPerformance = await this.getWorkerPerformanceForPitak(repositories, pitakId);
      
      // Get production timeline
      const productionTimeline = await this.getPitakProductionTimeline(repositories, { pitakId });
      
      // Get financial productivity
      const financialProductivity = await this.getPitakFinancialProductivity(repositories, { pitakId });
      
      // Calculate KPIs
      const kpis = this.calculatePitakKPIs(assignments, pitakInfo);

      return {
        status: true,
        message: "Pitak productivity details retrieved",
        data: {
          pitakInfo: {
            id: pitakInfo.id,
            location: pitakInfo.location,
            status: pitakInfo.status,
            totalLuwang: pitakInfo.totalLuwang,
            bukid: pitakInfo.bukid?.name,
            kabisilya: pitakInfo.bukid?.kabisilya?.name,
            createdAt: pitakInfo.createdAt,
            updatedAt: pitakInfo.updatedAt,
          },
          productivity: {
            assignments: assignmentProductivity,
            workers: workerPerformance,
            // @ts-ignore
            timeline: productionTimeline.data?.timeline || [],
            kpis,
          },
          financial: financialProductivity.data || {},
          recommendations: this.generateProductivityRecommendations(kpis, assignmentProductivity),
        },
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error in getPitakProductivityDetails:", error);
      throw error;
    }
  }

  /**
   * Get pitak production trend over time
   * @param {Object} repositories - All repositories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Production trend data
   */
  async getPitakProductionTimeline(repositories, params) {
    try {
      // @ts-ignore
      const { pitakId, period = "monthly", limit = 12 } = params;
      // @ts-ignore
      const { assignment } = repositories;
      
      const query = assignment.createQueryBuilder("a")
        .select(this.getDateGrouping(period, "a.assignmentDate", "period"))
        .addSelect("SUM(a.luwangCount)", "totalLuwang")
        .addSelect("COUNT(a.id)", "assignmentCount")
        .addSelect("AVG(a.luwangCount)", "avgLuwangPerAssignment")
        .addSelect("SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END)", "completedAssignments")
        .addSelect("SUM(CASE WHEN a.status = 'active' THEN 1 ELSE 0 END)", "activeAssignments")
        .where("a.pitak = :pitakId", { pitakId: pitakId || null })
        .groupBy(this.getDateGrouping(period, "a.assignmentDate", "period"))
        .orderBy("period", "DESC")
        .limit(limit);

      const timelineData = await query.getRawMany();

      // Calculate productivity trends
      const timeline = timelineData.map((/** @type {{ totalLuwang: string; assignmentCount: string; completedAssignments: string; period: any; activeAssignments: string; avgLuwangPerAssignment: string; }} */ periodData) => {
        const totalLuwang = parseFloat(periodData.totalLuwang) || 0;
        const assignmentCount = parseInt(periodData.assignmentCount) || 0;
        const completedAssignments = parseInt(periodData.completedAssignments) || 0;
        
        return {
          period: periodData.period,
          metrics: {
            totalLuwang,
            assignmentCount,
            completedAssignments,
            activeAssignments: parseInt(periodData.activeAssignments) || 0,
            avgLuwangPerAssignment: parseFloat(periodData.avgLuwangPerAssignment) || 0,
            completionRate: assignmentCount > 0 ? (completedAssignments / assignmentCount) * 100 : 0,
            productivityIndex: totalLuwang / assignmentCount || 0,
          }
        };
      }).reverse(); // Reverse to show oldest to newest

      // Calculate trend analysis
      const trendAnalysis = this.analyzeProductionTrend(timeline);

      return {
        status: true,
        message: "Production timeline retrieved",
        data: {
          timeline,
          trendAnalysis,
          summary: {
            totalPeriods: timeline.length,
            averageLuwangPerPeriod: timeline.reduce((/** @type {any} */ sum, /** @type {{ metrics: { totalLuwang: any; }; }} */ p) => sum + p.metrics.totalLuwang, 0) / timeline.length || 0,
            averageProductivityIndex: timeline.reduce((/** @type {any} */ sum, /** @type {{ metrics: { productivityIndex: any; }; }} */ p) => sum + p.metrics.productivityIndex, 0) / timeline.length || 0,
            trendDirection: trendAnalysis.overallTrend > 0 ? "improving" : trendAnalysis.overallTrend < 0 ? "declining" : "stable",
          },
        },
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error in getPitakProductionTimeline:", error);
      throw error;
    }
  }

  /**
   * Get worker productivity comparison for pitak
   * @param {Object} repositories - All repositories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Worker productivity data
   */
  async getPitakWorkerProductivity(repositories, params) {
    try {
      // @ts-ignore
      const { pitakId, period } = params;
      if (!pitakId) {
        throw new Error("pitakId is required");
      }

      // @ts-ignore
      const { assignment, worker } = repositories;
      
      // Get worker productivity data
      const workerProductivity = await assignment
        .createQueryBuilder("a")
        .leftJoin("a.worker", "w")
        .select([
          "w.id as workerId",
          "w.name as workerName",
          "w.status as workerStatus",
          "COUNT(a.id) as totalAssignments",
          "SUM(a.luwangCount) as totalLuwang",
          "SUM(CASE WHEN a.status = 'completed' THEN a.luwangCount ELSE 0 END) as completedLuwang",
          "SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completedAssignments",
          "AVG(a.luwangCount) as avgLuwangPerAssignment",
          "MIN(a.assignmentDate) as firstAssignment",
          "MAX(a.assignmentDate) as lastAssignment",
        ])
        .where("a.pitak = :pitakId", { pitakId })
        .groupBy("w.id")
        .orderBy("totalLuwang", "DESC")
        .getRawMany();

      // Calculate productivity metrics
      const productivityMetrics = workerProductivity.map((/** @type {{ totalLuwang: string; completedLuwang: string; totalAssignments: string; completedAssignments: string; workerId: any; workerName: any; workerStatus: any; avgLuwangPerAssignment: string; firstAssignment: string | number | Date; lastAssignment: string | number | Date; }} */ w) => {
        const totalLuwang = parseFloat(w.totalLuwang) || 0;
        const completedLuwang = parseFloat(w.completedLuwang) || 0;
        const totalAssignments = parseInt(w.totalAssignments) || 0;
        const completedAssignments = parseInt(w.completedAssignments) || 0;
        
        return {
          workerId: w.workerId,
          workerName: w.workerName,
          workerStatus: w.workerStatus,
          assignments: {
            total: totalAssignments,
            completed: completedAssignments,
            active: totalAssignments - completedAssignments,
            completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
          },
          luwang: {
            total: totalLuwang,
            completed: completedLuwang,
            pending: totalLuwang - completedLuwang,
            avgPerAssignment: parseFloat(w.avgLuwangPerAssignment) || 0,
            completionRate: totalLuwang > 0 ? (completedLuwang / totalLuwang) * 100 : 0,
          },
          timeline: {
            firstAssignment: w.firstAssignment,
            lastAssignment: w.lastAssignment,
            daysActive: w.firstAssignment && w.lastAssignment ? 
              // @ts-ignore
              Math.ceil((new Date(w.lastAssignment) - new Date(w.firstAssignment)) / (1000 * 60 * 60 * 24)) : 0,
          },
          productivityScore: this.calculateWorkerProductivityScore(w),
        };
      });

      // Get productivity distribution
      const productivityDistribution = this.calculateProductivityDistribution(productivityMetrics);

      return {
        status: true,
        message: "Worker productivity data retrieved",
        data: {
          workers: productivityMetrics,
          summary: {
            totalWorkers: productivityMetrics.length,
            averageCompletionRate: productivityMetrics.reduce((/** @type {any} */ sum, /** @type {{ assignments: { completionRate: any; }; }} */ w) => sum + w.assignments.completionRate, 0) / productivityMetrics.length || 0,
            averageLuwangPerWorker: productivityMetrics.reduce((/** @type {any} */ sum, /** @type {{ luwang: { total: any; }; }} */ w) => sum + w.luwang.total, 0) / productivityMetrics.length || 0,
            topPerformer: productivityMetrics.length > 0 ? productivityMetrics[0] : null,
            efficiencyDistribution: productivityDistribution,
          },
          benchmarks: {
            highEfficiency: productivityMetrics.filter((/** @type {{ productivityScore: number; }} */ w) => w.productivityScore >= 80).length,
            mediumEfficiency: productivityMetrics.filter((/** @type {{ productivityScore: number; }} */ w) => w.productivityScore >= 60 && w.productivityScore < 80).length,
            lowEfficiency: productivityMetrics.filter((/** @type {{ productivityScore: number; }} */ w) => w.productivityScore < 60).length,
          },
        },
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error in getPitakWorkerProductivity:", error);
      throw error;
    }
  }

  /**
   * Get pitak efficiency analysis
   * @param {Object} repositories - All repositories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Efficiency analysis
   */
  async getPitakEfficiencyAnalysis(repositories, params) {
    try {
      // @ts-ignore
      const { pitakId, comparisonPeriods = 3 } = params;
      if (!pitakId) {
        throw new Error("pitakId is required");
      }

      // @ts-ignore
      const { pitak, assignment, payment } = repositories;
      
      // Get pitak information
      const pitakInfo = await pitak.findOne({ where: { id: pitakId } });
      
      if (!pitakInfo) {
        throw new Error("Pitak not found");
      }

      // Get assignments for efficiency calculation
      const assignments = await assignment.find({
        where: { pitak: { id: pitakId } },
        relations: ["worker"],
        order: { assignmentDate: "DESC" },
      });

      // Get payments for this pitak
      const payments = await payment.find({
        where: { pitak: { id: pitakId } },
        relations: ["worker"],
      });

      // Calculate efficiency metrics
      const efficiencyMetrics = this.calculateEfficiencyMetrics(assignments, payments, pitakInfo);
      
      // Get historical efficiency trends
      const historicalTrends = await this.getHistoricalEfficiencyTrends(repositories, {
        pitakId,
        periods: comparisonPeriods,
      });

      // Calculate productivity benchmarks
      const benchmarks = await this.calculateProductivityBenchmarks(repositories, { pitakId });

      // Generate efficiency insights
      const insights = this.generateEfficiencyInsights(efficiencyMetrics, historicalTrends, benchmarks);

      return {
        status: true,
        message: "Pitak efficiency analysis retrieved",
        data: {
          pitakInfo: {
            id: pitakInfo.id,
            location: pitakInfo.location,
            totalLuwang: pitakInfo.totalLuwang,
            status: pitakInfo.status,
          },
          efficiencyMetrics,
          historicalTrends,
          benchmarks,
          insights,
          recommendations: this.generateEfficiencyRecommendations(efficiencyMetrics, insights),
          score: this.calculateOverallEfficiencyScore(efficiencyMetrics),
        },
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error in getPitakEfficiencyAnalysis:", error);
      throw error;
    }
  }

  /**
   * Compare multiple pitaks productivity
   * @param {Object} repositories - All repositories
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Pitak comparison data
   */
  async comparePitaksProductivity(repositories, params) {
    try {
      // @ts-ignore
      const { pitakIds = [], metrics = [], period = "monthly" } = params;
      
      if (!pitakIds.length) {
        throw new Error("At least one pitakId is required");
      }

      const comparisonResults = await Promise.all(
        pitakIds.map(async (/** @type {any} */ pitakId) => {
          // Get pitak info
          // @ts-ignore
          const pitakInfo = await repositories.pitak.findOne({
            where: { id: pitakId },
            relations: ["bukid", "bukid.kabisilya"],
          });

          // Get productivity data
          const productivity = await this.getPitakProductivityOverview(repositories, { pitakId });
          
          // Get efficiency data
          const efficiency = await this.getPitakEfficiencyAnalysis(repositories, { pitakId });
          
          // Get financial productivity
          const financial = await this.getPitakFinancialProductivity(repositories, { pitakId });

          return {
            pitakId,
            info: {
              location: pitakInfo?.location,
              status: pitakInfo?.status,
              bukid: pitakInfo?.bukid?.name,
              kabisilya: pitakInfo?.bukid?.kabisilya?.name,
            },
            // @ts-ignore
            productivity: productivity.data?.summary || {},
            // @ts-ignore
            efficiency: efficiency.data?.efficiencyMetrics || {},
            financial: financial.data?.summary || {},
            // @ts-ignore
            score: efficiency.data?.score || 0,
          };
        })
      );

      // Calculate rankings and percentiles
      const rankedComparison = this.rankPitakComparison(comparisonResults, metrics);

      // Generate comparison insights
      const insights = this.generateComparisonInsights(rankedComparison);

      return {
        status: true,
        message: "Pitak productivity comparison completed",
        data: {
          pitaks: rankedComparison,
          summary: {
            averageScore: comparisonResults.reduce((/** @type {any} */ sum, /** @type {{ score: any; }} */ p) => sum + p.score, 0) / comparisonResults.length,
            // @ts-ignore
            bestPerformer: rankedComparison.find((/** @type {{ rankings: { overallRank: number; }; }} */ p) => p.rankings.overallRank === 1),
            // @ts-ignore
            worstPerformer: rankedComparison.find((/** @type {{ rankings: { overallRank: any; }; }} */ p) => p.rankings.overallRank === comparisonResults.length),
            consistency: this.calculateConsistencyScore(comparisonResults),
          },
          insights,
          metricsComparison: this.compareMetricsAcrossPitaks(rankedComparison),
        },
      };
    } catch (error) {
      // @ts-ignore
      logger.error("Error in comparePitaksProductivity:", error);
      throw error;
    }
  }

  /**
     * Helper: Get pitak financial productivity
     * @param {Object} repositories
     * @param {Object} params
     */
  async getPitakFinancialProductivity(repositories, params) {
    // @ts-ignore
    const { pitakId } = params;
    // @ts-ignore
    const { payment } = repositories;
    
    const query = payment.createQueryBuilder("p")
      .select([
        "COUNT(p.id) as totalPayments",
        "SUM(p.grossPay) as totalGrossPay",
        "SUM(p.netPay) as totalNetPay",
        "SUM(p.manualDeduction) as totalDeductions",
        "AVG(p.grossPay) as avgGrossPay",
        "AVG(p.netPay) as avgNetPay",
      ])
      .where("p.pitak = :pitakId", { pitakId: pitakId || null });

    const result = await query.getRawOne();

    return {
      status: true,
      message: "Financial productivity retrieved",
      data: {
        summary: {
          totalPayments: parseInt(result?.totalPayments) || 0,
          totalGrossPay: parseFloat(result?.totalGrossPay) || 0,
          totalNetPay: parseFloat(result?.totalNetPay) || 0,
          totalDeductions: parseFloat(result?.totalDeductions) || 0,
          avgGrossPay: parseFloat(result?.avgGrossPay) || 0,
          avgNetPay: parseFloat(result?.avgNetPay) || 0,
          deductionRate: parseFloat(result?.totalGrossPay) > 0 ? 
            (parseFloat(result?.totalDeductions) / parseFloat(result?.totalGrossPay)) * 100 : 0,
        },
      },
    };
  }

  /**
     * Helper: Calculate assignment productivity
     * @param {any[]} assignments
     */
  calculateAssignmentProductivity(assignments) {
    const completed = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "completed");
    const active = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "active");
    const cancelled = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "cancelled");
    
    const totalLuwang = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    const completedLuwang = completed.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    
    return {
      totalAssignments: assignments.length,
      completedAssignments: completed.length,
      activeAssignments: active.length,
      cancelledAssignments: cancelled.length,
      completionRate: assignments.length > 0 ? (completed.length / assignments.length) * 100 : 0,
      luwangProductivity: {
        total: totalLuwang,
        completed: completedLuwang,
        pending: totalLuwang - completedLuwang,
        completionRate: totalLuwang > 0 ? (completedLuwang / totalLuwang) * 100 : 0,
      },
    };
  }

  /**
     * Helper: Get worker performance for pitak
     * @param {Object} repositories
     * @param {any} pitakId
     */
  async getWorkerPerformanceForPitak(repositories, pitakId) {
    // @ts-ignore
    const { assignment } = repositories;
    
    const workerPerformance = await assignment
      .createQueryBuilder("a")
      .leftJoin("a.worker", "w")
      .select([
        "w.id",
        "w.name",
        "COUNT(a.id) as assignmentCount",
        "SUM(a.luwangCount) as totalLuwang",
        "AVG(a.luwangCount) as avgLuwang",
      ])
      .where("a.pitak = :pitakId", { pitakId })
      .groupBy("w.id")
      .getRawMany();

    return workerPerformance.map((/** @type {{ w_id: any; w_name: any; assignmentCount: string; totalLuwang: string; avgLuwang: string; }} */ w) => ({
      workerId: w.w_id,
      workerName: w.w_name,
      assignmentCount: parseInt(w.assignmentCount),
      totalLuwang: parseFloat(w.totalLuwang),
      avgLuwang: parseFloat(w.avgLuwang),
    }));
  }

  /**
     * Helper: Calculate pitak KPIs
     * @param {any[]} assignments
     * @param {{ totalLuwang: string; }} pitakInfo
     */
  calculatePitakKPIs(assignments, pitakInfo) {
    const completedAssignments = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "completed");
    const completedLuwang = completedAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    
    return {
      landUtilization: (completedLuwang / parseFloat(pitakInfo.totalLuwang)) * 100 || 0,
      assignmentEfficiency: assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0,
      luwangPerDay: this.calculateLuwangPerDay(assignments),
      workerTurnover: this.calculateWorkerTurnover(assignments),
      costPerLuwang: this.calculateCostPerLuwang(assignments),
    };
  }

  /**
     * Helper: Calculate luwang per day
     * @param {any[]} assignments
     */
  calculateLuwangPerDay(assignments) {
    const completedAssignments = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "completed");
    if (completedAssignments.length === 0) return 0;
    
    const dates = completedAssignments.map((/** @type {{ assignmentDate: string | number | Date; }} */ a) => new Date(a.assignmentDate)).filter(Boolean);
    if (dates.length === 0) return 0;
    
    // @ts-ignore
    const minDate = new Date(Math.min(...dates));
    // @ts-ignore
    const maxDate = new Date(Math.max(...dates));
    // @ts-ignore
    const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) || 1;
    
    const totalLuwang = completedAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    return totalLuwang / daysDiff;
  }

  /**
     * Helper: Calculate worker turnover
     * @param {any[]} assignments
     */
  calculateWorkerTurnover(assignments) {
    const workerIds = [...new Set(assignments.map((/** @type {{ worker: { id: any; }; }} */ a) => a.worker?.id).filter(Boolean))];
    return workerIds.length;
  }

  /**
     * Helper: Calculate cost per luwang
     * @param {any[]} assignments
     */
  calculateCostPerLuwang(assignments) {
    // This would need actual cost data - placeholder implementation
    const completedLuwang = assignments
      .filter((/** @type {{ status: string; }} */ a) => a.status === "completed")
      .reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    
    // Assuming 230 pesos per luwang as per system
    const totalCost = completedLuwang * 230;
    return completedLuwang > 0 ? totalCost / completedLuwang : 0;
  }

  /**
     * Helper: Generate productivity recommendations
     * @param {{ landUtilization: any; assignmentEfficiency?: number; luwangPerDay: any; workerTurnover?: number; costPerLuwang?: number; }} kpis
     * @param {{ totalAssignments?: any; completedAssignments?: any; activeAssignments?: any; cancelledAssignments?: any; completionRate: any; luwangProductivity?: { total: any; completed: any; pending: number; completionRate: number; }; }} assignmentProductivity
     */
  generateProductivityRecommendations(kpis, assignmentProductivity) {
    const recommendations = [];
    
    if (kpis.landUtilization < 70) {
      recommendations.push({
        priority: "high",
        area: "Land Utilization",
        recommendation: "Increase assignment frequency to improve land utilization",
        target: "Achieve >80% land utilization",
      });
    }
    
    if (assignmentProductivity.completionRate < 80) {
      recommendations.push({
        priority: "medium",
        area: "Assignment Completion",
        recommendation: "Review and optimize assignment scheduling",
        target: "Achieve >85% completion rate",
      });
    }
    
    if (kpis.luwangPerDay < 5) {
      recommendations.push({
        priority: "medium",
        area: "Daily Productivity",
        recommendation: "Consider adjusting worker assignments or providing incentives",
        target: "Increase to >5 luwang per day",
      });
    }
    
    return recommendations;
  }

  /**
     * Helper: Get date grouping for SQL
     * @param {any} period
     * @param {string} column
     */
  getDateGrouping(period, column, alias = "period") {
    switch (period) {
      case "daily":
        return `DATE(${column}) as ${alias}`;
      case "weekly":
        return `STRFTIME('%Y-%W', ${column}) as ${alias}`;
      case "monthly":
        return `STRFTIME('%Y-%m', ${column}) as ${alias}`;
      case "quarterly":
        return `STRFTIME('%Y', ${column}) || '-' || ((CAST(STRFTIME('%m', ${column}) AS INTEGER) - 1) / 3 + 1) as ${alias}`;
      case "yearly":
        return `STRFTIME('%Y', ${column}) as ${alias}`;
      default:
        return `STRFTIME('%Y-%m', ${column}) as ${alias}`;
    }
  }

  /**
     * Helper: Analyze production trend
     * @param {any[]} timeline
     */
  analyzeProductionTrend(timeline) {
    if (timeline.length < 2) {
      return {
        overallTrend: 0,
        volatility: 0,
        growthRate: 0,
        consistency: "insufficient data",
      };
    }

    const luwangValues = timeline.map((/** @type {{ metrics: { totalLuwang: any; }; }} */ p) => p.metrics.totalLuwang);
    const firstValue = luwangValues[0];
    const lastValue = luwangValues[luwangValues.length - 1];
    const growthRate = ((lastValue - firstValue) / firstValue) * 100 || 0;

    // Calculate volatility (standard deviation of growth rates)
    const growthRates = [];
    for (let i = 1; i < luwangValues.length; i++) {
      const growth = ((luwangValues[i] - luwangValues[i - 1]) / luwangValues[i - 1]) * 100;
      growthRates.push(growth);
    }
    
    const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
    const volatility = Math.sqrt(variance);

    return {
      overallTrend: growthRate,
      volatility,
      growthRate: avgGrowth,
      consistency: volatility < 10 ? "high" : volatility < 25 ? "medium" : "low",
      trendType: growthRate > 5 ? "growing" : growthRate < -5 ? "declining" : "stable",
    };
  }

  /**
     * Helper: Calculate worker productivity score
     * @param {{ completedAssignments: string; totalAssignments: string; completedLuwang: string; totalLuwang: string; avgLuwangPerAssignment: string; }} workerData
     */
  calculateWorkerProductivityScore(workerData) {
    const completionRate = (parseInt(workerData.completedAssignments) / parseInt(workerData.totalAssignments)) * 100 || 0;
    const luwangCompletion = (parseFloat(workerData.completedLuwang) / parseFloat(workerData.totalLuwang)) * 100 || 0;
    const avgLuwang = parseFloat(workerData.avgLuwangPerAssignment) || 0;
    
    // Weighted scoring
    const score = (completionRate * 0.4) + (luwangCompletion * 0.3) + (Math.min(avgLuwang / 10, 1) * 30);
    return Math.min(Math.round(score), 100);
  }

  /**
     * Helper: Calculate productivity distribution
     * @param {any[]} workers
     */
  calculateProductivityDistribution(workers) {
    const scores = workers.map((/** @type {{ productivityScore: any; }} */ w) => w.productivityScore);
    return {
      high: scores.filter((/** @type {number} */ s) => s >= 80).length,
      medium: scores.filter((/** @type {number} */ s) => s >= 60 && s < 80).length,
      low: scores.filter((/** @type {number} */ s) => s < 60).length,
      averageScore: scores.reduce((/** @type {any} */ sum, /** @type {any} */ s) => sum + s, 0) / scores.length || 0,
      distribution: scores,
    };
  }

  /**
     * Helper: Calculate efficiency metrics
     * @param {any[]} assignments
     * @param {any[]} payments
     * @param {{ totalLuwang: string; }} pitakInfo
     */
  calculateEfficiencyMetrics(assignments, payments, pitakInfo) {
    const completedAssignments = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "completed");
    const completedLuwang = completedAssignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    const totalPayments = payments.reduce((/** @type {number} */ sum, /** @type {{ netPay: string; }} */ p) => sum + parseFloat(p.netPay), 0);
    
    return {
      landEfficiency: (completedLuwang / parseFloat(pitakInfo.totalLuwang)) * 100 || 0,
      laborEfficiency: assignments.length > 0 ? (completedAssignments.length / assignments.length) * 100 : 0,
      costEfficiency: completedLuwang > 0 ? totalPayments / completedLuwang : 0,
      timeEfficiency: this.calculateTimeEfficiency(assignments),
      resourceUtilization: this.calculateResourceUtilization(assignments, pitakInfo),
    };
  }

  /**
     * Helper: Calculate time efficiency
     * @param {any[]} assignments
     */
  calculateTimeEfficiency(assignments) {
    const completedAssignments = assignments.filter((/** @type {{ status: string; }} */ a) => a.status === "completed");
    if (completedAssignments.length === 0) return 0;
    
    const assignmentDurations = completedAssignments.map((/** @type {{ assignmentDate: string | number | Date; updatedAt: string | number | Date; }} */ a) => {
      const assignedDate = new Date(a.assignmentDate);
      const completedDate = a.updatedAt ? new Date(a.updatedAt) : new Date();
      // @ts-ignore
      return Math.ceil((completedDate - assignedDate) / (1000 * 60 * 60 * 24));
    }).filter((/** @type {number} */ duration) => duration > 0);
    
    if (assignmentDurations.length === 0) return 0;
    
    const avgDuration = assignmentDurations.reduce((/** @type {any} */ sum, /** @type {any} */ d) => sum + d, 0) / assignmentDurations.length;
    return 100 - Math.min(avgDuration * 10, 100); // Inverse: shorter duration = higher efficiency
  }

  /**
     * Helper: Calculate resource utilization
     * @param {any[]} assignments
     * @param {{ totalLuwang: string; }} pitakInfo
     */
  calculateResourceUtilization(assignments, pitakInfo) {
    const workerCount = new Set(assignments.map((/** @type {{ worker: { id: any; }; }} */ a) => a.worker?.id).filter(Boolean)).size;
    // @ts-ignore
    const luwangPerWorker = workerCount > 0 ? 
      assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0) / workerCount : 0;
    
    const maxCapacity = parseFloat(pitakInfo.totalLuwang) * 0.8; // Assume 80% is optimal
    const actualCapacity = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
    
    return Math.min((actualCapacity / maxCapacity) * 100, 100);
  }

  /**
     * Helper: Get historical efficiency trends
     * @param {Object} repositories
     * @param {{ pitakId: any; periods: any; }} params
     */
  // @ts-ignore
  async getHistoricalEfficiencyTrends(repositories, params) {
    // Simplified implementation - would need more complex historical data
    return {
      periods: 3,
      trend: "stable",
      improvementRate: 0,
      consistency: "medium",
    };
  }

  /**
     * Helper: Calculate productivity benchmarks
     * @param {Object} repositories
     * @param {{ pitakId: any; }} params
     */
  async calculateProductivityBenchmarks(repositories, params) {
    const { pitakId } = params;
    // @ts-ignore
    const { pitak } = repositories;
    
    // Get all pitaks for comparison
    const allPitaks = await pitak.find({
      where: { status: "active" },
      relations: ["assignments"],
    });
    
    const pitakEfficiencies = allPitaks.map((/** @type {{ assignments: any[]; id: any; totalLuwang: string; }} */ p) => {
      const completedLuwang = p.assignments
        .filter((/** @type {{ status: string; }} */ a) => a.status === "completed")
        .reduce((/** @type {number} */ sum, /** @type {{ luwangCount: string; }} */ a) => sum + parseFloat(a.luwangCount), 0);
      
      return {
        pitakId: p.id,
        efficiency: (completedLuwang / parseFloat(p.totalLuwang)) * 100 || 0,
      };
    });
    
    const efficiencies = pitakEfficiencies.map((/** @type {{ efficiency: any; }} */ p) => p.efficiency).filter((/** @type {number} */ e) => !isNaN(e));
    const currentPitak = pitakEfficiencies.find((/** @type {{ pitakId: any; }} */ p) => p.pitakId === pitakId);
    
    return {
      average: efficiencies.reduce((/** @type {any} */ sum, /** @type {any} */ e) => sum + e, 0) / efficiencies.length || 0,
      top25: this.percentile(efficiencies, 75),
      median: this.percentile(efficiencies, 50),
      current: currentPitak?.efficiency || 0,
      percentile: this.calculatePercentile(efficiencies, currentPitak?.efficiency || 0),
    };
  }

  /**
     * Helper: Calculate percentile
     * @param {string | any[]} arr
     * @param {number} p
     */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
  }

  /**
     * Helper: Calculate percentile rank
     * @param {string | any[]} arr
     * @param {number} value
     */
  calculatePercentile(arr, value) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const countBelow = sorted.filter(v => v < value).length;
    return (countBelow / sorted.length) * 100;
  }

  /**
     * Helper: Generate efficiency insights
     * @param {{ landEfficiency: any; laborEfficiency: any; costEfficiency: any; timeEfficiency?: number; resourceUtilization?: number; }} metrics
     * @param {{ periods: number; trend: string; improvementRate: number; consistency: string; }} trends
     * @param {{ average: any; top25?: any; median?: any; current?: any; percentile?: number; }} benchmarks
     */
  // @ts-ignore
  generateEfficiencyInsights(metrics, trends, benchmarks) {
    const insights = [];
    
    if (metrics.landEfficiency < benchmarks.average) {
      insights.push({
        type: "warning",
        message: `Land efficiency (${metrics.landEfficiency.toFixed(1)}%) is below average (${benchmarks.average.toFixed(1)}%)`,
        suggestion: "Consider optimizing assignment scheduling",
      });
    }
    
    if (metrics.laborEfficiency < 70) {
      insights.push({
        type: "improvement",
        message: `Labor efficiency can be improved (currently ${metrics.laborEfficiency.toFixed(1)}%)`,
        suggestion: "Review worker assignments and provide training",
      });
    }
    
    if (metrics.costEfficiency > 250) {
      insights.push({
        type: "cost",
        message: "Cost per luwang is above optimal range",
        suggestion: "Review resource allocation and reduce overhead",
      });
    }
    
    return insights;
  }

  /**
     * Helper: Generate efficiency recommendations
     * @param {{ landEfficiency: any; laborEfficiency: any; costEfficiency?: number; timeEfficiency: any; resourceUtilization?: number; }} metrics
     * @param {{ type: string; message: string; suggestion: string; }[]} insights
     */
  // @ts-ignore
  generateEfficiencyRecommendations(metrics, insights) {
    const recommendations = [];
    
    if (metrics.landEfficiency < 75) {
      recommendations.push({
        priority: "high",
        action: "Increase land utilization",
        details: "Schedule more assignments to utilize available land capacity",
        expectedImpact: "+15-20% land efficiency",
      });
    }
    
    if (metrics.laborEfficiency < 80) {
      recommendations.push({
        priority: "medium",
        action: "Optimize worker assignments",
        details: "Assign workers based on skill and experience",
        expectedImpact: "+10-15% labor efficiency",
      });
    }
    
    if (metrics.timeEfficiency < 70) {
      recommendations.push({
        priority: "medium",
        action: "Reduce assignment completion time",
        details: "Streamline processes and provide better tools",
        expectedImpact: "Reduce completion time by 20%",
      });
    }
    
    return recommendations;
  }

  /**
     * Helper: Calculate overall efficiency score
     * @param {{ landEfficiency: any; laborEfficiency: any; costEfficiency: any; timeEfficiency: any; resourceUtilization: any; }} metrics
     */
  calculateOverallEfficiencyScore(metrics) {
    const weights = {
      landEfficiency: 0.3,
      laborEfficiency: 0.25,
      costEfficiency: 0.2,
      timeEfficiency: 0.15,
      resourceUtilization: 0.1,
    };
    
    // Normalize cost efficiency (lower is better, so invert)
    const normalizedCostEfficiency = Math.max(0, 100 - (metrics.costEfficiency * 0.4));
    
    const score = (
      metrics.landEfficiency * weights.landEfficiency +
      metrics.laborEfficiency * weights.laborEfficiency +
      normalizedCostEfficiency * weights.costEfficiency +
      metrics.timeEfficiency * weights.timeEfficiency +
      metrics.resourceUtilization * weights.resourceUtilization
    );
    
    return Math.min(Math.round(score), 100);
  }

  /**
     * Helper: Rank pitak comparison
     * @param {any[]} comparisonResults
     * @param {any} metrics
     */
  // @ts-ignore
  rankPitakComparison(comparisonResults, metrics) {
    // Calculate scores for ranking
    const ranked = comparisonResults.map((/** @type {{ productivity: any; efficiency: any; financial: any; }} */ pitak) => {
      // @ts-ignore
      const rankings = {};
      const scores = {};
      
      // Calculate scores for each metric category
      scores.productivity = this.calculateCategoryScore(pitak.productivity);
      scores.efficiency = this.calculateCategoryScore(pitak.efficiency);
      scores.financial = this.calculateCategoryScore(pitak.financial);
      
      // Overall score
      scores.overall = (scores.productivity * 0.4) + (scores.efficiency * 0.35) + (scores.financial * 0.25);
      
      return {
        ...pitak,
        scores,
        rankings: {} // Will be filled after sorting
      };
    });
    
    // Sort and assign ranks
    ranked.sort((/** @type {{ scores: { overall: number; }; }} */ a, /** @type {{ scores: { overall: number; }; }} */ b) => b.scores.overall - a.scores.overall);
    
    // @ts-ignore
    ranked.forEach((/** @type {{ rankings: { overallRank: any; percentile: number; }; }} */ pitak, /** @type {number} */ index) => {
      pitak.rankings = {
        overallRank: index + 1,
        percentile: ((ranked.length - index) / ranked.length) * 100,
      };
    });
    
    return ranked;
  }

  /**
     * Helper: Calculate category score
     * @param {{ completionRate: number | undefined; landUtilization: number | undefined; efficiency: number | undefined; }} data
     */
  calculateCategoryScore(data) {
    // Simple scoring based on key metrics
    let score = 0;
    let count = 0;
    
    if (data.completionRate !== undefined) {
      score += data.completionRate;
      count++;
    }
    
    if (data.landUtilization !== undefined) {
      score += data.landUtilization;
      count++;
    }
    
    if (data.efficiency !== undefined) {
      score += data.efficiency;
      count++;
    }
    
    return count > 0 ? score / count : 0;
  }

  /**
     * Helper: Generate comparison insights
     * @param {any[]} rankedComparison
     */
  generateComparisonInsights(rankedComparison) {
    if (rankedComparison.length < 2) return [];
    
    const insights = [];
    const topPerformer = rankedComparison[0];
    // @ts-ignore
    const averageScore = rankedComparison.reduce((/** @type {any} */ sum, /** @type {{ scores: { overall: any; }; }} */ p) => sum + p.scores.overall, 0) / rankedComparison.length;
    
    insights.push({
      type: "performance",
      message: `${topPerformer.info.location} is the top performer with score of ${topPerformer.scores.overall.toFixed(1)}`,
      highlight: "Consider replicating their best practices",
    });
    
    // Find opportunities for improvement
    rankedComparison.slice(1).forEach((/** @type {{ scores: { overall: number; }; info: { location: any; }; }} */ pitak) => {
      const gap = topPerformer.scores.overall - pitak.scores.overall;
      if (gap > 20) {
        insights.push({
          type: "opportunity",
          message: `${pitak.info.location} has ${gap.toFixed(1)} points improvement opportunity`,
          suggestion: "Review and adopt practices from top performers",
        });
      }
    });
    
    return insights;
  }

  /**
     * Helper: Compare metrics across pitaks
     * @param {any[]} rankedComparison
     */
  compareMetricsAcrossPitaks(rankedComparison) {
    const metrics = ["completionRate", "landUtilization", "efficiency", "costEfficiency"];
    const comparison = {};
    
    metrics.forEach(metric => {
      const values = rankedComparison.map((/** @type {{ productivity: { [x: string]: any; }; efficiency: { [x: string]: any; }; financial: { [x: string]: any; }; }} */ p) => 
        p.productivity[metric] || p.efficiency[metric] || p.financial[metric] || 0
      );
      
      // @ts-ignore
      comparison[metric] = {
        average: values.reduce((/** @type {any} */ sum, /** @type {any} */ v) => sum + v, 0) / values.length,
        range: {
          min: Math.min(...values),
          max: Math.max(...values),
        },
        standardDeviation: this.calculateStandardDeviation(values),
      };
    });
    
    return comparison;
  }

  /**
     * Helper: Calculate standard deviation
     * @param {any[]} values
     */
  calculateStandardDeviation(values) {
    const mean = values.reduce((/** @type {any} */ sum, /** @type {any} */ v) => sum + v, 0) / values.length;
    const variance = values.reduce((/** @type {number} */ sum, /** @type {number} */ v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
     * Helper: Calculate consistency score
     * @param {any[]} comparisonResults
     */
  calculateConsistencyScore(comparisonResults) {
    const scores = comparisonResults.map((/** @type {{ score: any; }} */ p) => p.score);
    const mean = scores.reduce((/** @type {any} */ sum, /** @type {any} */ s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((/** @type {number} */ sum, /** @type {number} */ s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      score: 100 - Math.min(stdDev * 10, 100),
      rating: stdDev < 10 ? "high" : stdDev < 20 ? "medium" : "low",
      stdDev,
    };
  }

  /**
     * Helper: Identify top performers
     * @param {string | any[]} productivityData
     */
  identifyTopPerformers(productivityData) {
    if (productivityData.length === 0) return [];
    
    // Sort by completion rate and utilization
    const sorted = [...productivityData].sort((a, b) => {
      const scoreA = (a.metrics.completionRate * 0.6) + (a.metrics.utilization * 0.4);
      const scoreB = (b.metrics.completionRate * 0.6) + (b.metrics.utilization * 0.4);
      return scoreB - scoreA;
    });
    
    return sorted.slice(0, Math.min(5, sorted.length)).map(p => ({
      pitakId: p.pitakId,
      location: p.location,
      completionRate: p.metrics.completionRate,
      utilization: p.metrics.utilization,
      score: (p.metrics.completionRate * 0.6) + (p.metrics.utilization * 0.4),
    }));
  }
}

module.exports = new PitakProductivityHandler();