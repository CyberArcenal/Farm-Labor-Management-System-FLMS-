// dashboard/handlers/kabisilyaAnalytics.js
//@ts-check
class KabisilyaAnalytics {
  /**
     * @param {{ kabisilya: any; worker: any; bukid: any; }} repositories
     * @param {any} params
     */
  // @ts-ignore
  async getKabisilyaOverview(repositories, params) {
    // @ts-ignore
    const { kabisilya: kabisilyaRepo, worker: workerRepo, bukid: bukidRepo } = repositories;
    
    try {
      // Get all kabisilyas with their workers and bukids
      const kabisilyas = await kabisilyaRepo.find({
        relations: ['workers', 'bukids']
      });
      
      // Calculate metrics for each kabisilya
      const kabisilyaData = kabisilyas.map((/** @type {{ workers: never[]; bukids: never[]; id: any; name: any; createdAt: any; updatedAt: any; }} */ kabisilya) => {
        const workers = kabisilya.workers || [];
        const bukids = kabisilya.bukids || [];
        
        // Calculate worker statistics
        const totalWorkers = workers.length;
        const activeWorkers = workers.filter((/** @type {{ status: string; }} */ w) => w.status === 'active').length;
        const inactiveWorkers = workers.filter((/** @type {{ status: string; }} */ w) => w.status === 'inactive').length;
        
        // Calculate total debt
        const totalDebt = workers.reduce((/** @type {number} */ sum, /** @type {{ totalDebt: any; }} */ worker) => 
          sum + parseFloat(worker.totalDebt || 0), 0);
        
        // Calculate average debt per worker
        const averageDebt = totalWorkers > 0 ? totalDebt / totalWorkers : 0;
        
        // Calculate total paid
        const totalPaid = workers.reduce((/** @type {number} */ sum, /** @type {{ totalPaid: any; }} */ worker) => 
          sum + parseFloat(worker.totalPaid || 0), 0);
        
        return {
          id: kabisilya.id,
          name: kabisilya.name,
          workers: {
            total: totalWorkers,
            active: activeWorkers,
            inactive: inactiveWorkers,
            activePercentage: totalWorkers > 0 ? (activeWorkers / totalWorkers) * 100 : 0
          },
          bukids: {
            total: bukids.length
          },
          financial: {
            totalDebt: totalDebt,
            averageDebt: averageDebt,
            totalPaid: totalPaid,
            averagePaid: totalWorkers > 0 ? totalPaid / totalWorkers : 0
          },
          createdAt: kabisilya.createdAt,
          lastUpdated: kabisilya.updatedAt
        };
      });
      
      // Calculate overall statistics
      const overallStats = kabisilyaData.reduce((/** @type {{ totalKabisilyas: number; totalWorkers: any; totalActiveWorkers: any; totalBukids: any; totalDebt: any; totalPaid: any; }} */ acc, /** @type {{ workers: { total: any; active: any; }; bukids: { total: any; }; financial: { totalDebt: any; totalPaid: any; }; }} */ kabisilya) => {
        acc.totalKabisilyas++;
        acc.totalWorkers += kabisilya.workers.total;
        acc.totalActiveWorkers += kabisilya.workers.active;
        acc.totalBukids += kabisilya.bukids.total;
        acc.totalDebt += kabisilya.financial.totalDebt;
        acc.totalPaid += kabisilya.financial.totalPaid;
        return acc;
      }, {
        totalKabisilyas: 0,
        totalWorkers: 0,
        totalActiveWorkers: 0,
        totalBukids: 0,
        totalDebt: 0,
        totalPaid: 0
      });
      
      // Calculate averages
      const averageWorkersPerKabisilya = overallStats.totalKabisilyas > 0 
        ? overallStats.totalWorkers / overallStats.totalKabisilyas 
        : 0;
      
      const averageBukidsPerKabisilya = overallStats.totalKabisilyas > 0 
        ? overallStats.totalBukids / overallStats.totalKabisilyas 
        : 0;
      
      const averageDebtPerKabisilya = overallStats.totalKabisilyas > 0 
        ? overallStats.totalDebt / overallStats.totalKabisilyas 
        : 0;
      
      // Sort by number of workers (largest first)
      const sortedByWorkers = [...kabisilyaData].sort((a, b) => b.workers.total - a.workers.total);
      
      // Sort by total debt (highest first)
      const sortedByDebt = [...kabisilyaData].sort((a, b) => b.financial.totalDebt - a.financial.totalDebt);
      
      // Get kabisilyas with highest activity
      const mostActive = sortedByWorkers.slice(0, 5);
      
      // Get kabisilyas with highest debt
      const highestDebt = sortedByDebt.slice(0, 5);
      
      return {
        status: true,
        message: "Kabisilya overview retrieved",
        data: {
          kabisilyas: kabisilyaData,
          overallMetrics: {
            ...overallStats,
            workerActivityRate: overallStats.totalWorkers > 0 
              ? (overallStats.totalActiveWorkers / overallStats.totalWorkers) * 100 
              : 0,
            averageWorkersPerKabisilya: averageWorkersPerKabisilya,
            averageBukidsPerKabisilya: averageBukidsPerKabisilya,
            averageDebtPerKabisilya: averageDebtPerKabisilya,
            averageDebtPerWorker: overallStats.totalWorkers > 0 
              ? overallStats.totalDebt / overallStats.totalWorkers 
              : 0
          },
          rankings: {
            byWorkers: sortedByWorkers.map(k => ({
              name: k.name,
              workerCount: k.workers.total,
              activeWorkers: k.workers.active
            })),
            byDebt: sortedByDebt.map(k => ({
              name: k.name,
              totalDebt: k.financial.totalDebt,
              averageDebt: k.financial.averageDebt
            }))
          },
          mostActive: mostActive,
          highestDebt: highestDebt,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      console.error("getKabisilyaOverview error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ bukid: any; pitak: any; }} repositories
     * @param {{ kabisilyaId: any; }} params
     */
  async getBukidSummary(repositories, params) {
    const { bukid: bukidRepo, pitak: pitakRepo } = repositories;
    const { kabisilyaId } = params;
    
    try {
      // Build query for bukids
      let query = bukidRepo
        .createQueryBuilder("bukid")
        .leftJoin("bukid.kabisilya", "kabisilya")
        .leftJoin("bukid.pitaks", "pitak")
        .select([
          "bukid.id",
          "bukid.name",
          "bukid.location",
          "kabisilya.name as kabisilyaName",
          "COUNT(pitak.id) as pitakCount",
          "SUM(pitak.totalLuwang) as totalLuwang"
        ])
        .groupBy("bukid.id")
        .addGroupBy("bukid.name")
        .addGroupBy("bukid.location")
        .addGroupBy("kabisilya.name");
      
      // Apply filter if kabisilyaId is provided
      if (kabisilyaId) {
        query.where("bukid.kabisilyaId = :kabisilyaId", { kabisilyaId });
      }
      
      query.orderBy("bukid.name", "ASC");
      
      const bukids = await query.getRawMany();
      
      // Get detailed pitak information for each bukid
      const bukidData = await Promise.all(
        bukids.map(async (/** @type {{ bukid_id: any; bukid_name: any; bukid_location: any; kabisilyaName: any; }} */ bukid) => {
          const pitaks = await pitakRepo.find({
            where: { bukid: { id: bukid.bukid_id } },
            relations: ['assignments']
          });
          
          // Calculate pitak statistics
          const totalPitaks = pitaks.length;
          const activePitaks = pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'active').length;
          const inactivePitaks = pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'inactive').length;
          const harvestedPitaks = pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'harvested').length;
          
          // Calculate total assignments
          const totalAssignments = pitaks.reduce((/** @type {any} */ sum, /** @type {{ assignments: string | any[]; }} */ pitak) => 
            sum + (pitak.assignments?.length || 0), 0);
          
          // Calculate total luwang from assignments
          const totalAssignedLuwang = pitaks.reduce((/** @type {any} */ sum, /** @type {{ assignments: never[]; }} */ pitak) => {
            const assignments = pitak.assignments || [];
            return sum + assignments.reduce((/** @type {number} */ assignSum, /** @type {{ luwangCount: any; }} */ assignment) => 
              assignSum + parseFloat(assignment.luwangCount || 0), 0);
          }, 0);
          
          // Calculate available luwang
          const totalAvailableLuwang = pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: any; }} */ pitak) => 
            sum + parseFloat(pitak.totalLuwang || 0), 0);
          
          const utilizationRate = totalAvailableLuwang > 0 
            ? (totalAssignedLuwang / totalAvailableLuwang) * 100 
            : 0;
          
          // Get last activity date
          /**
             * @type {string | number | Date | null}
             */
          let lastActivity = null;
          pitaks.forEach((/** @type {{ assignments: never[]; }} */ pitak) => {
            const assignments = pitak.assignments || [];
            assignments.forEach((/** @type {{ updatedAt: any; createdAt: any; }} */ assignment) => {
              const activityDate = assignment.updatedAt || assignment.createdAt;
              if (activityDate && (!lastActivity || activityDate > lastActivity)) {
                lastActivity = activityDate;
              }
            });
          });
          
          return {
            id: bukid.bukid_id,
            name: bukid.bukid_name,
            location: bukid.bukid_location,
            kabisilyaName: bukid.kabisilyaName,
            pitaks: {
              total: totalPitaks,
              active: activePitaks,
              inactive: inactivePitaks,
              harvested: harvestedPitaks,
              activePercentage: totalPitaks > 0 ? (activePitaks / totalPitaks) * 100 : 0
            },
            luwang: {
              totalAvailable: totalAvailableLuwang,
              totalAssigned: totalAssignedLuwang,
              utilizationRate: utilizationRate,
              remaining: totalAvailableLuwang - totalAssignedLuwang
            },
            assignments: {
              total: totalAssignments
            },
            lastActivity: lastActivity,
            daysSinceLastActivity: lastActivity 
              // @ts-ignore
              ? Math.ceil((new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24))
              : null
          };
        })
      );
      
      // Calculate overall statistics
      const overallStats = bukidData.reduce((acc, bukid) => {
        acc.totalBukids++;
        acc.totalPitaks += bukid.pitaks.total;
        acc.activePitaks += bukid.pitaks.active;
        acc.totalAvailableLuwang += bukid.luwang.totalAvailable;
        acc.totalAssignedLuwang += bukid.luwang.totalAssigned;
        acc.totalAssignments += bukid.assignments.total;
        acc.sumUtilizationRates += bukid.luwang.utilizationRate;
        return acc;
      }, {
        totalBukids: 0,
        totalPitaks: 0,
        activePitaks: 0,
        totalAvailableLuwang: 0,
        totalAssignedLuwang: 0,
        totalAssignments: 0,
        sumUtilizationRates: 0
      });
      
      // Calculate averages
      const averagePitaksPerBukid = overallStats.totalBukids > 0 
        ? overallStats.totalPitaks / overallStats.totalBukids 
        : 0;
      
      const averageUtilizationRate = overallStats.totalBukids > 0 
        ? overallStats.sumUtilizationRates / overallStats.totalBukids 
        : 0;
      
      const overallUtilizationRate = overallStats.totalAvailableLuwang > 0 
        ? (overallStats.totalAssignedLuwang / overallStats.totalAvailableLuwang) * 100 
        : 0;
      
      // Sort by utilization rate
      const sortedByUtilization = [...bukidData].sort((a, b) => 
        b.luwang.utilizationRate - a.luwang.utilizationRate);
      
      // Sort by number of pitaks
      const sortedByPitaks = [...bukidData].sort((a, b) => 
        b.pitaks.total - a.pitaks.total);
      
      // Get bukids needing attention (low utilization or no recent activity)
      const needsAttention = bukidData
        .filter(bukid => 
          bukid.luwang.utilizationRate < 20 || 
          (bukid.daysSinceLastActivity && bukid.daysSinceLastActivity > 30)
        )
        .slice(0, 10);
      
      // Group by kabisilya
      const byKabisilya = bukidData.reduce((acc, bukid) => {
        const kabisilyaName = bukid.kabisilyaName || 'Unassigned';
        if (!acc[kabisilyaName]) {
          acc[kabisilyaName] = {
            bukidCount: 0,
            pitakCount: 0,
            totalLuwang: 0,
            assignedLuwang: 0
          };
        }
        
        acc[kabisilyaName].bukidCount++;
        acc[kabisilyaName].pitakCount += bukid.pitaks.total;
        acc[kabisilyaName].totalLuwang += bukid.luwang.totalAvailable;
        acc[kabisilyaName].assignedLuwang += bukid.luwang.totalAssigned;
        
        return acc;
      }, {});
      
      return {
        status: true,
        message: "Bukid summary retrieved",
        data: {
          bukids: bukidData,
          overallMetrics: {
            ...overallStats,
            averagePitaksPerBukid: averagePitaksPerBukid,
            averageUtilizationRate: averageUtilizationRate,
            overallUtilizationRate: overallUtilizationRate,
            activePitakRate: overallStats.totalPitaks > 0 
              ? (overallStats.activePitaks / overallStats.totalPitaks) * 100 
              : 0
          },
          rankings: {
            byUtilization: sortedByUtilization.map(b => ({
              name: b.name,
              utilizationRate: b.luwang.utilizationRate,
              totalLuwang: b.luwang.totalAvailable
            })),
            byPitaks: sortedByPitaks.map(b => ({
              name: b.name,
              pitakCount: b.pitaks.total,
              activePitaks: b.pitaks.active
            }))
          },
          byKabisilya: Object.keys(byKabisilya).map(kabisilyaName => ({
            kabisilyaName: kabisilyaName,
            bukidCount: byKabisilya[kabisilyaName].bukidCount,
            pitakCount: byKabisilya[kabisilyaName].pitakCount,
            totalLuwang: byKabisilya[kabisilyaName].totalLuwang,
            assignedLuwang: byKabisilya[kabisilyaName].assignedLuwang,
            utilizationRate: byKabisilya[kabisilyaName].totalLuwang > 0 
              ? (byKabisilya[kabisilyaName].assignedLuwang / byKabisilya[kabisilyaName].totalLuwang) * 100 
              : 0
          })),
          needsAttention: needsAttention,
          mostUtilized: sortedByUtilization.slice(0, 10),
          filters: {
            kabisilyaId: kabisilyaId
          }
        }
      };
    } catch (error) {
      console.error("getBukidSummary error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ pitak: any; assignment: any; }} repositories
     * @param {{ status: any; bukidId: any; kabisilyaId: any; }} params
     */
  async getPitakSummary(repositories, params) {
    const { pitak: pitakRepo, assignment: assignmentRepo } = repositories;
    const { status, bukidId, kabisilyaId } = params;
    
    try {
      // Build query for pitaks
      let query = pitakRepo
        .createQueryBuilder("pitak")
        .leftJoin("pitak.bukid", "bukid")
        .leftJoin("bukid.kabisilya", "kabisilya")
        .leftJoin("pitak.assignments", "assignment")
        .select([
          "pitak.id",
          "pitak.location",
          "pitak.totalLuwang",
          "pitak.status",
          "pitak.createdAt",
          "pitak.updatedAt",
          "bukid.name as bukidName",
          "bukid.id as bukidId",
          "kabisilya.name as kabisilyaName",
          "COUNT(assignment.id) as assignmentCount",
          "SUM(CASE WHEN assignment.status = 'completed' THEN assignment.luwangCount ELSE 0 END) as completedLuwang"
        ])
        .groupBy("pitak.id")
        .addGroupBy("pitak.location")
        .addGroupBy("pitak.totalLuwang")
        .addGroupBy("pitak.status")
        .addGroupBy("pitak.createdAt")
        .addGroupBy("pitak.updatedAt")
        .addGroupBy("bukid.name")
        .addGroupBy("bukid.id")
        .addGroupBy("kabisilya.name");
      
      // Apply filters
      const whereConditions = [];
      const parameters = {};
      
      if (status) {
        whereConditions.push("pitak.status = :status");
        // @ts-ignore
        parameters.status = status;
      }
      
      if (bukidId) {
        whereConditions.push("pitak.bukidId = :bukidId");
        // @ts-ignore
        parameters.bukidId = bukidId;
      }
      
      if (kabisilyaId) {
        whereConditions.push("bukid.kabisilyaId = :kabisilyaId");
        // @ts-ignore
        parameters.kabisilyaId = kabisilyaId;
      }
      
      if (whereConditions.length > 0) {
        query.where(whereConditions.join(" AND "), parameters);
      }
      
      query.orderBy("pitak.updatedAt", "DESC");
      
      const pitaks = await query.getRawMany();
      
      // Get detailed assignment data for each pitak
      const pitakData = await Promise.all(
        pitaks.map(async (/** @type {{ pitak_id: any; pitak_totalLuwang: string; completedLuwang: string; assignmentCount: string; pitak_updatedAt: string | number | Date; pitak_location: any; pitak_status: any; bukidId: any; bukidName: any; kabisilyaName: any; pitak_createdAt: string | number | Date; }} */ pitak) => {
          // Get recent assignments
          const recentAssignments = await assignmentRepo.find({
            where: { pitak: { id: pitak.pitak_id } },
            relations: ['worker'],
            order: { assignmentDate: 'DESC' },
            take: 5
          });
          
          // Calculate utilization metrics
          const totalLuwang = parseFloat(pitak.pitak_totalLuwang) || 0;
          const completedLuwang = parseFloat(pitak.completedLuwang) || 0;
          const utilizationRate = totalLuwang > 0 ? (completedLuwang / totalLuwang) * 100 : 0;
          
          // Calculate activity metrics
          const assignmentCount = parseInt(pitak.assignmentCount) || 0;
          // @ts-ignore
          const daysSinceUpdate = Math.ceil((new Date() - new Date(pitak.pitak_updatedAt)) / (1000 * 60 * 60 * 24));
          
          // Get worker statistics for this pitak
          const uniqueWorkers = [...new Set(recentAssignments.map((/** @type {{ worker: { id: any; }; }} */ a) => a.worker?.id))].filter(id => id);
          
          return {
            id: pitak.pitak_id,
            location: pitak.pitak_location,
            totalLuwang: totalLuwang,
            status: pitak.pitak_status,
            bukid: {
              id: pitak.bukidId,
              name: pitak.bukidName
            },
            kabisilyaName: pitak.kabisilyaName,
            assignments: {
              total: assignmentCount,
              completedLuwang: completedLuwang,
              utilizationRate: utilizationRate,
              remainingLuwang: totalLuwang - completedLuwang
            },
            activity: {
              lastUpdated: pitak.pitak_updatedAt,
              daysSinceUpdate: daysSinceUpdate,
              createdAt: pitak.pitak_createdAt,
              // @ts-ignore
              ageInDays: Math.ceil((new Date() - new Date(pitak.pitak_createdAt)) / (1000 * 60 * 60 * 24))
            },
            workers: {
              uniqueCount: uniqueWorkers.length
            },
            recentAssignments: recentAssignments.map((/** @type {{ id: any; worker: { name: any; }; luwangCount: string; status: any; assignmentDate: any; }} */ assignment) => ({
              id: assignment.id,
              workerName: assignment.worker?.name || 'Unknown',
              luwangCount: parseFloat(assignment.luwangCount),
              status: assignment.status,
              assignmentDate: assignment.assignmentDate
            }))
          };
        })
      );
      
      // Calculate overall statistics
      const overallStats = pitakData.reduce((acc, pitak) => {
        acc.totalPitaks++;
        
        // Count by status
        if (!acc.statusCounts[pitak.status]) {
          acc.statusCounts[pitak.status] = 0;
        }
        acc.statusCounts[pitak.status]++;
        
        // Sum luwang metrics
        acc.totalLuwang += pitak.totalLuwang;
        acc.totalCompletedLuwang += pitak.assignments.completedLuwang;
        acc.sumUtilizationRates += pitak.assignments.utilizationRate;
        
        // Count assignments
        acc.totalAssignments += pitak.assignments.total;
        acc.totalUniqueWorkers += pitak.workers.uniqueCount;
        
        return acc;
      }, {
        totalPitaks: 0,
        statusCounts: {},
        totalLuwang: 0,
        totalCompletedLuwang: 0,
        sumUtilizationRates: 0,
        totalAssignments: 0,
        totalUniqueWorkers: 0
      });
      
      // Calculate averages
      const averageUtilizationRate = overallStats.totalPitaks > 0 
        ? overallStats.sumUtilizationRates / overallStats.totalPitaks 
        : 0;
      
      const overallUtilizationRate = overallStats.totalLuwang > 0 
        ? (overallStats.totalCompletedLuwang / overallStats.totalLuwang) * 100 
        : 0;
      
      const averageAssignmentsPerPitak = overallStats.totalPitaks > 0 
        ? overallStats.totalAssignments / overallStats.totalPitaks 
        : 0;
      
      const averageWorkersPerPitak = overallStats.totalPitaks > 0 
        ? overallStats.totalUniqueWorkers / overallStats.totalPitaks 
        : 0;
      
      // Sort by utilization rate
      const sortedByUtilization = [...pitakData].sort((a, b) => 
        b.assignments.utilizationRate - a.assignments.utilizationRate);
      
      // Sort by total luwang
      const sortedByLuwang = [...pitakData].sort((a, b) => 
        b.totalLuwang - a.totalLuwang);
      
      // Get pitaks needing attention
      const needsAttention = pitakData
        .filter(pitak => 
          (pitak.assignments.utilizationRate < 20 && pitak.status === 'active') ||
          pitak.activity.daysSinceUpdate > 60
        )
        .slice(0, 10);
      
      // Group by status
      const byStatus = Object.keys(overallStats.statusCounts).map(status => ({
        status: status,
        count: overallStats.statusCounts[status],
        percentage: (overallStats.statusCounts[status] / overallStats.totalPitaks) * 100
      }));
      
      // Group by bukid
      const byBukid = pitakData.reduce((acc, pitak) => {
        const bukidName = pitak.bukid.name || 'Unassigned';
        if (!acc[bukidName]) {
          acc[bukidName] = {
            pitakCount: 0,
            totalLuwang: 0,
            completedLuwang: 0
          };
        }
        
        acc[bukidName].pitakCount++;
        acc[bukidName].totalLuwang += pitak.totalLuwang;
        acc[bukidName].completedLuwang += pitak.assignments.completedLuwang;
        
        return acc;
      }, {});
      
      return {
        status: true,
        message: "Pitak summary retrieved",
        data: {
          pitaks: pitakData,
          overallMetrics: {
            totalPitaks: overallStats.totalPitaks,
            totalLuwang: overallStats.totalLuwang,
            totalCompletedLuwang: overallStats.totalCompletedLuwang,
            overallUtilizationRate: overallUtilizationRate,
            averageUtilizationRate: averageUtilizationRate,
            totalAssignments: overallStats.totalAssignments,
            totalUniqueWorkers: overallStats.totalUniqueWorkers,
            averageAssignmentsPerPitak: averageAssignmentsPerPitak,
            averageWorkersPerPitak: averageWorkersPerPitak
          },
          statusBreakdown: byStatus,
          rankings: {
            byUtilization: sortedByUtilization.map(p => ({
              location: p.location,
              utilizationRate: p.assignments.utilizationRate,
              totalLuwang: p.totalLuwang,
              bukidName: p.bukid.name
            })),
            byLuwang: sortedByLuwang.map(p => ({
              location: p.location,
              totalLuwang: p.totalLuwang,
              completedLuwang: p.assignments.completedLuwang,
              bukidName: p.bukid.name
            }))
          },
          byBukid: Object.keys(byBukid).map(bukidName => ({
            bukidName: bukidName,
            pitakCount: byBukid[bukidName].pitakCount,
            totalLuwang: byBukid[bukidName].totalLuwang,
            completedLuwang: byBukid[bukidName].completedLuwang,
            utilizationRate: byBukid[bukidName].totalLuwang > 0 
              ? (byBukid[bukidName].completedLuwang / byBukid[bukidName].totalLuwang) * 100 
              : 0
          })),
          needsAttention: needsAttention,
          mostUtilized: sortedByUtilization.slice(0, 10),
          filters: {
            status: status,
            bukidId: bukidId,
            kabisilyaId: kabisilyaId
          }
        }
      };
    } catch (error) {
      console.error("getPitakSummary error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ assignment: any; kabisilya: any; }} repositories
     * @param {{ period?: "month" | undefined; startDate: any; endDate: any; }} params
     */
  async getProductionByKabisilya(repositories, params) {
    const { assignment: assignmentRepo, kabisilya: kabisilyaRepo } = repositories;
    const { period = 'month', startDate, endDate } = params;
    
    try {
      // Calculate date range
      let queryStartDate, queryEndDate;
      
      if (startDate && endDate) {
        queryStartDate = new Date(startDate);
        queryEndDate = new Date(endDate);
      } else {
        queryEndDate = new Date();
        queryStartDate = new Date();
        
        switch(period) {
          // @ts-ignore
          case 'week':
            queryStartDate.setDate(queryStartDate.getDate() - 7);
            break;
          case 'month':
            queryStartDate.setMonth(queryStartDate.getMonth() - 1);
            break;
          // @ts-ignore
          case 'quarter':
            queryStartDate.setMonth(queryStartDate.getMonth() - 3);
            break;
          // @ts-ignore
          case 'year':
            queryStartDate.setFullYear(queryStartDate.getFullYear() - 1);
            break;
          default:
            queryStartDate.setMonth(queryStartDate.getMonth() - 1);
        }
      }
      
      // Get all kabisilyas
      const kabisilyas = await kabisilyaRepo.find();
      
      // Get production data for each kabisilya
      const productionData = await Promise.all(
        kabisilyas.map(async (/** @type {{ id: any; name: any; }} */ kabisilya) => {
          // Get assignments for workers in this kabisilya
          const assignments = await assignmentRepo
            .createQueryBuilder("assignment")
            .leftJoin("assignment.worker", "worker")
            .leftJoin("worker.kabisilya", "kabisilya")
            .select([
              "assignment.id",
              "assignment.luwangCount",
              "assignment.status",
              "assignment.assignmentDate",
              "worker.id as workerId",
              "worker.name as workerName"
            ])
            .where("kabisilya.id = :kabisilyaId", { kabisilyaId: kabisilya.id })
            .andWhere("assignment.assignmentDate BETWEEN :start AND :end", {
              start: queryStartDate,
              end: queryEndDate
            })
            .getRawMany();
          
          // Calculate production metrics
          const totalAssignments = assignments.length;
          const completedAssignments = assignments.filter((/** @type {{ assignment_status: string; }} */ a) => a.assignment_status === 'completed').length;
          
          const totalLuwang = assignments.reduce((/** @type {number} */ sum, /** @type {{ assignment_luwangCount: any; }} */ a) => 
            sum + parseFloat(a.assignment_luwangCount || 0), 0);
          
          const completedLuwang = assignments
            .filter((/** @type {{ assignment_status: string; }} */ a) => a.assignment_status === 'completed')
            .reduce((/** @type {number} */ sum, /** @type {{ assignment_luwangCount: any; }} */ a) => sum + parseFloat(a.assignment_luwangCount || 0), 0);
          
          // Get unique workers
          const uniqueWorkers = [...new Set(assignments.map((/** @type {{ workerId: any; }} */ a) => a.workerId))].filter(id => id);
          
          // Calculate daily production
          const dailyProduction = assignments.reduce((/** @type {{ [x: string]: { assignments: number; }; }} */ acc, /** @type {{ assignment_assignmentDate: { toISOString: () => string; }; assignment_luwangCount: any; }} */ assignment) => {
            const date = assignment.assignment_assignmentDate.toISOString().split('T')[0];
            if (!acc[date]) {
              // @ts-ignore
              acc[date] = { luwang: 0, assignments: 0 };
            }
            // @ts-ignore
            acc[date].luwang += parseFloat(assignment.assignment_luwangCount || 0);
            acc[date].assignments++;
            return acc;
          }, {});
          
          const dailyTrend = Object.keys(dailyProduction).map(date => ({
            date: date,
            luwang: dailyProduction[date].luwang,
            assignments: dailyProduction[date].assignments
          // @ts-ignore
          })).sort((a, b) => new Date(a.date) - new Date(b.date));
          
          // Calculate completion rate
          const completionRate = totalAssignments > 0 
            ? (completedAssignments / totalAssignments) * 100 
            : 0;
          
          const luwangCompletionRate = totalLuwang > 0 
            ? (completedLuwang / totalLuwang) * 100 
            : 0;
          
          // Calculate productivity (luwang per worker per day)
          const totalDays = dailyTrend.length;
          const productivity = uniqueWorkers.length > 0 && totalDays > 0 
            ? totalLuwang / (uniqueWorkers.length * totalDays) 
            : 0;
          
          return {
            kabisilyaId: kabisilya.id,
            kabisilyaName: kabisilya.name,
            production: {
              totalAssignments: totalAssignments,
              completedAssignments: completedAssignments,
              totalLuwang: totalLuwang,
              completedLuwang: completedLuwang,
              completionRate: completionRate,
              luwangCompletionRate: luwangCompletionRate
            },
            workers: {
              total: uniqueWorkers.length,
              averageAssignments: uniqueWorkers.length > 0 
                ? totalAssignments / uniqueWorkers.length 
                : 0,
              averageLuwang: uniqueWorkers.length > 0 
                ? totalLuwang / uniqueWorkers.length 
                : 0
            },
            productivity: {
              dailyAverage: totalDays > 0 ? totalLuwang / totalDays : 0,
              perWorkerPerDay: productivity,
              trend: dailyTrend
            },
            periodMetrics: {
              startDate: queryStartDate,
              endDate: queryEndDate,
              totalDays: totalDays
            }
          };
        })
      );
      
      // Calculate overall statistics
      const overallStats = productionData.reduce((acc, kabisilya) => {
        acc.totalKabisilyas++;
        acc.totalAssignments += kabisilya.production.totalAssignments;
        acc.totalCompletedAssignments += kabisilya.production.completedAssignments;
        acc.totalLuwang += kabisilya.production.totalLuwang;
        acc.totalCompletedLuwang += kabisilya.production.completedLuwang;
        acc.totalWorkers += kabisilya.workers.total;
        acc.sumCompletionRates += kabisilya.production.completionRate;
        acc.sumProductivity += kabisilya.productivity.perWorkerPerDay;
        return acc;
      }, {
        totalKabisilyas: 0,
        totalAssignments: 0,
        totalCompletedAssignments: 0,
        totalLuwang: 0,
        totalCompletedLuwang: 0,
        totalWorkers: 0,
        sumCompletionRates: 0,
        sumProductivity: 0
      });
      
      // Calculate averages
      const overallCompletionRate = overallStats.totalAssignments > 0 
        ? (overallStats.totalCompletedAssignments / overallStats.totalAssignments) * 100 
        : 0;
      
      const averageCompletionRate = overallStats.totalKabisilyas > 0 
        ? overallStats.sumCompletionRates / overallStats.totalKabisilyas 
        : 0;
      
      const averageProductivity = overallStats.totalKabisilyas > 0 
        ? overallStats.sumProductivity / overallStats.totalKabisilyas 
        : 0;
      
      const averageLuwangPerKabisilya = overallStats.totalKabisilyas > 0 
        ? overallStats.totalLuwang / overallStats.totalKabisilyas 
        : 0;
      
      const averageWorkersPerKabisilya = overallStats.totalKabisilyas > 0 
        ? overallStats.totalWorkers / overallStats.totalKabisilyas 
        : 0;
      
      // Sort by production (total luwang)
      const sortedByProduction = [...productionData].sort((a, b) => 
        b.production.totalLuwang - a.production.totalLuwang);
      
      // Sort by productivity
      const sortedByProductivity = [...productionData].sort((a, b) => 
        b.productivity.perWorkerPerDay - a.productivity.perWorkerPerDay);
      
      // Sort by completion rate
      const sortedByCompletion = [...productionData].sort((a, b) => 
        b.production.completionRate - a.production.completionRate);
      
      // Get top performers
      const topProducers = sortedByProduction.slice(0, 5);
      const topProductive = sortedByProductivity.slice(0, 5);
      const topCompleters = sortedByCompletion.slice(0, 5);
      
      // Calculate production trend over time (aggregated across all kabisilyas)
      const allAssignments = await assignmentRepo
        .createQueryBuilder("assignment")
        .leftJoin("assignment.worker", "worker")
        .leftJoin("worker.kabisilya", "kabisilya")
        .select([
          "DATE(assignment.assignmentDate) as date",
          "kabisilya.name as kabisilyaName",
          "SUM(assignment.luwangCount) as dailyLuwang",
          "COUNT(assignment.id) as dailyAssignments"
        ])
        .where("assignment.assignmentDate BETWEEN :start AND :end", {
          start: queryStartDate,
          end: queryEndDate
        })
        .groupBy("DATE(assignment.assignmentDate)")
        .addGroupBy("kabisilya.name")
        .orderBy("date", "ASC")
        .getRawMany();
      
      // Group by date for overall trend
      const dailyTrend = allAssignments.reduce((/** @type {{ [x: string]: { kabisilyas: { add: (arg0: any) => void; }; }; }} */ acc, /** @type {{ date: any; dailyLuwang: string; dailyAssignments: string; kabisilyaName: any; }} */ item) => {
        const date = item.date;
        if (!acc[date]) {
          // @ts-ignore
          acc[date] = { luwang: 0, assignments: 0, kabisilyas: new Set() };
        }
        // @ts-ignore
        acc[date].luwang += parseFloat(item.dailyLuwang) || 0;
        // @ts-ignore
        acc[date].assignments += parseInt(item.dailyAssignments) || 0;
        acc[date].kabisilyas.add(item.kabisilyaName);
        return acc;
      }, {});
      
      const overallDailyTrend = Object.keys(dailyTrend).map(date => ({
        date: date,
        luwang: dailyTrend[date].luwang,
        assignments: dailyTrend[date].assignments,
        kabisilyas: dailyTrend[date].kabisilyas.size
      // @ts-ignore
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return {
        status: true,
        message: "Production by Kabisilya analysis retrieved",
        data: {
          period: {
            start: queryStartDate,
            end: queryEndDate,
            type: startDate && endDate ? 'custom' : period
          },
          productionData: productionData,
          overallMetrics: {
            ...overallStats,
            overallCompletionRate: overallCompletionRate,
            averageCompletionRate: averageCompletionRate,
            averageProductivity: averageProductivity,
            averageLuwangPerKabisilya: averageLuwangPerKabisilya,
            averageWorkersPerKabisilya: averageWorkersPerKabisilya,
            averageAssignmentsPerWorker: overallStats.totalWorkers > 0 
              ? overallStats.totalAssignments / overallStats.totalWorkers 
              : 0,
            averageLuwangPerAssignment: overallStats.totalAssignments > 0 
              ? overallStats.totalLuwang / overallStats.totalAssignments 
              : 0
          },
          rankings: {
            byProduction: sortedByProduction.map(k => ({
              kabisilyaName: k.kabisilyaName,
              totalLuwang: k.production.totalLuwang,
              completionRate: k.production.completionRate
            })),
            byProductivity: sortedByProductivity.map(k => ({
              kabisilyaName: k.kabisilyaName,
              productivity: k.productivity.perWorkerPerDay,
              totalWorkers: k.workers.total
            })),
            byCompletion: sortedByCompletion.map(k => ({
              kabisilyaName: k.kabisilyaName,
              completionRate: k.production.completionRate,
              totalAssignments: k.production.totalAssignments
            }))
          },
          topPerformers: {
            producers: topProducers,
            productive: topProductive,
            completers: topCompleters
          },
          dailyTrend: overallDailyTrend,
          recommendations: overallCompletionRate < 70 ? [
            "Focus on improving assignment completion rates",
            "Provide support to kabisilyas with low productivity",
            "Review assignment distribution across kabisilyas"
          ] : [
            "Production levels are good",
            "Continue monitoring productivity metrics",
            "Share best practices between kabisilyas"
          ]
        }
      };
    } catch (error) {
      console.error("getProductionByKabisilya error:", error);
      throw error;
    }
  }
  
  /**
     * @param {{ bukid: any; pitak: any; assignment: any; }} repositories
     * @param {any} params
     */
  // @ts-ignore
  async getLandUtilization(repositories, params) {
    // @ts-ignore
    const { bukid: bukidRepo, pitak: pitakRepo, assignment: assignmentRepo } = repositories;
    
    try {
      // Get all bukids with their pitaks
      const bukids = await bukidRepo.find({
        relations: ['pitaks', 'kabisilya']
      });
      
      // Calculate land utilization for each bukid
      const landUtilization = await Promise.all(
        bukids.map(async (/** @type {{ pitaks: never[]; id: any; name: any; location: any; kabisilya: { name: any; }; }} */ bukid) => {
          const pitaks = bukid.pitaks || [];
          
          // Calculate pitak statistics
          const totalPitaks = pitaks.length;
          const activePitaks = pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'active').length;
          const inactivePitaks = pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'inactive').length;
          const harvestedPitaks = pitaks.filter((/** @type {{ status: string; }} */ p) => p.status === 'harvested').length;
          
          // Calculate total luwang capacity
          const totalLuwangCapacity = pitaks.reduce((/** @type {number} */ sum, /** @type {{ totalLuwang: any; }} */ pitak) => 
            sum + parseFloat(pitak.totalLuwang || 0), 0);
          
          // Get assignments for all pitaks in this bukid
          let totalAssignedLuwang = 0;
          let totalCompletedLuwang = 0;
          
          for (const pitak of pitaks) {
            const assignments = await assignmentRepo.find({
              // @ts-ignore
              where: { pitak: { id: pitak.id } }
            });
            
            const assignedLuwang = assignments.reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ assignment) => 
              sum + parseFloat(assignment.luwangCount || 0), 0);
            
            const completedLuwang = assignments
              .filter((/** @type {{ status: string; }} */ a) => a.status === 'completed')
              .reduce((/** @type {number} */ sum, /** @type {{ luwangCount: any; }} */ assignment) => 
                sum + parseFloat(assignment.luwangCount || 0), 0);
            
            totalAssignedLuwang += assignedLuwang;
            totalCompletedLuwang += completedLuwang;
          }
          
          // Calculate utilization rates
          const capacityUtilization = totalLuwangCapacity > 0 
            ? (totalAssignedLuwang / totalLuwangCapacity) * 100 
            : 0;
          
          const completionUtilization = totalAssignedLuwang > 0 
            ? (totalCompletedLuwang / totalAssignedLuwang) * 100 
            : 0;
          
          const overallUtilization = totalLuwangCapacity > 0 
            ? (totalCompletedLuwang / totalLuwangCapacity) * 100 
            : 0;
          
          // Calculate pitak density (pitaks per area - using location as proxy)
          const pitakDensity = totalPitaks; // In real app, divide by actual area
          
          return {
            bukidId: bukid.id,
            bukidName: bukid.name,
            location: bukid.location,
            kabisilyaName: bukid.kabisilya?.name || 'Unassigned',
            pitaks: {
              total: totalPitaks,
              active: activePitaks,
              inactive: inactivePitaks,
              harvested: harvestedPitaks,
              activePercentage: totalPitaks > 0 ? (activePitaks / totalPitaks) * 100 : 0
            },
            capacity: {
              totalLuwang: totalLuwangCapacity,
              assignedLuwang: totalAssignedLuwang,
              completedLuwang: totalCompletedLuwang,
              remainingLuwang: totalLuwangCapacity - totalAssignedLuwang,
              availableLuwang: totalLuwangCapacity - totalCompletedLuwang
            },
            utilization: {
              capacityUtilization: capacityUtilization,
              completionUtilization: completionUtilization,
              overallUtilization: overallUtilization,
              pitakDensity: pitakDensity
            },
            efficiency: {
              assignmentsPerPitak: totalPitaks > 0 ? totalAssignedLuwang / totalPitaks : 0,
              completionEfficiency: completionUtilization > 80 ? 'High' : 
                                  completionUtilization > 50 ? 'Medium' : 'Low'
            }
          };
        })
      );
      
      // Calculate overall statistics
      const overallStats = landUtilization.reduce((acc, bukid) => {
        acc.totalBukids++;
        acc.totalPitaks += bukid.pitaks.total;
        acc.activePitaks += bukid.pitaks.active;
        acc.totalLuwangCapacity += bukid.capacity.totalLuwang;
        acc.totalAssignedLuwang += bukid.capacity.assignedLuwang;
        acc.totalCompletedLuwang += bukid.capacity.completedLuwang;
        acc.sumCapacityUtilization += bukid.utilization.capacityUtilization;
        acc.sumCompletionUtilization += bukid.utilization.completionUtilization;
        acc.sumOverallUtilization += bukid.utilization.overallUtilization;
        return acc;
      }, {
        totalBukids: 0,
        totalPitaks: 0,
        activePitaks: 0,
        totalLuwangCapacity: 0,
        totalAssignedLuwang: 0,
        totalCompletedLuwang: 0,
        sumCapacityUtilization: 0,
        sumCompletionUtilization: 0,
        sumOverallUtilization: 0
      });
      
      // Calculate averages
      const averageCapacityUtilization = overallStats.totalBukids > 0 
        ? overallStats.sumCapacityUtilization / overallStats.totalBukids 
        : 0;
      
      const averageCompletionUtilization = overallStats.totalBukids > 0 
        ? overallStats.sumCompletionUtilization / overallStats.totalBukids 
        : 0;
      
      const averageOverallUtilization = overallStats.totalBukids > 0 
        ? overallStats.sumOverallUtilization / overallStats.totalBukids 
        : 0;
      
      const overallCapacityUtilization = overallStats.totalLuwangCapacity > 0 
        ? (overallStats.totalAssignedLuwang / overallStats.totalLuwangCapacity) * 100 
        : 0;
      
      const overallCompletionRate = overallStats.totalAssignedLuwang > 0 
        ? (overallStats.totalCompletedLuwang / overallStats.totalAssignedLuwang) * 100 
        : 0;
      
      // Categorize bukids by utilization
      const categories = {
        highlyUtilized: [],    // Overall > 80%
        wellUtilized: [],      // Overall 50-80%
        underutilized: [],     // Overall 20-49%
        severelyUnderutilized: [] // Overall < 20%
      };
      
      landUtilization.forEach(bukid => {
        if (bukid.utilization.overallUtilization >= 80) {
          // @ts-ignore
          categories.highlyUtilized.push(bukid);
        } else if (bukid.utilization.overallUtilization >= 50) {
          // @ts-ignore
          categories.wellUtilized.push(bukid);
        } else if (bukid.utilization.overallUtilization >= 20) {
          // @ts-ignore
          categories.underutilized.push(bukid);
        } else {
          // @ts-ignore
          categories.severelyUnderutilized.push(bukid);
        }
      });
      
      // Sort by overall utilization
      const sortedByUtilization = [...landUtilization].sort((a, b) => 
        b.utilization.overallUtilization - a.utilization.overallUtilization);
      
      // Sort by capacity
      const sortedByCapacity = [...landUtilization].sort((a, b) => 
        b.capacity.totalLuwang - a.capacity.totalLuwang);
      
      // Get bukids needing attention
      const needsAttention = landUtilization
        .filter(bukid => bukid.utilization.overallUtilization < 30)
        .slice(0, 10);
      
      // Calculate utilization by kabisilya
      const byKabisilya = landUtilization.reduce((acc, bukid) => {
        const kabisilyaName = bukid.kabisilyaName;
        if (!acc[kabisilyaName]) {
          acc[kabisilyaName] = {
            bukidCount: 0,
            totalLuwangCapacity: 0,
            totalAssignedLuwang: 0,
            totalCompletedLuwang: 0
          };
        }
        
        acc[kabisilyaName].bukidCount++;
        acc[kabisilyaName].totalLuwangCapacity += bukid.capacity.totalLuwang;
        acc[kabisilyaName].totalAssignedLuwang += bukid.capacity.assignedLuwang;
        acc[kabisilyaName].totalCompletedLuwang += bukid.capacity.completedLuwang;
        
        return acc;
      }, {});
      
      const kabisilyaUtilization = Object.keys(byKabisilya).map(kabisilyaName => {
        const data = byKabisilya[kabisilyaName];
        const capacityUtilization = data.totalLuwangCapacity > 0 
          ? (data.totalAssignedLuwang / data.totalLuwangCapacity) * 100 
          : 0;
        
        const completionUtilization = data.totalAssignedLuwang > 0 
          ? (data.totalCompletedLuwang / data.totalAssignedLuwang) * 100 
          : 0;
        
        const overallUtilization = data.totalLuwangCapacity > 0 
          ? (data.totalCompletedLuwang / data.totalLuwangCapacity) * 100 
          : 0;
        
        return {
          kabisilyaName: kabisilyaName,
          bukidCount: data.bukidCount,
          capacityUtilization: capacityUtilization,
          completionUtilization: completionUtilization,
          overallUtilization: overallUtilization,
          totalLuwangCapacity: data.totalLuwangCapacity,
          assignedLuwang: data.totalAssignedLuwang,
          completedLuwang: data.totalCompletedLuwang
        };
      });
      
      return {
        status: true,
        message: "Land utilization analysis retrieved",
        data: {
          landUtilization: landUtilization,
          overallMetrics: {
            totalBukids: overallStats.totalBukids,
            totalPitaks: overallStats.totalPitaks,
            activePitaks: overallStats.activePitaks,
            totalLuwangCapacity: overallStats.totalLuwangCapacity,
            totalAssignedLuwang: overallStats.totalAssignedLuwang,
            totalCompletedLuwang: overallStats.totalCompletedLuwang,
            remainingCapacity: overallStats.totalLuwangCapacity - overallStats.totalAssignedLuwang,
            overallCapacityUtilization: overallCapacityUtilization,
            overallCompletionRate: overallCompletionRate,
            averageCapacityUtilization: averageCapacityUtilization,
            averageCompletionUtilization: averageCompletionUtilization,
            averageOverallUtilization: averageOverallUtilization,
            pitakActivityRate: overallStats.totalPitaks > 0 
              ? (overallStats.activePitaks / overallStats.totalPitaks) * 100 
              : 0
          },
          categories: {
            highlyUtilized: {
              count: categories.highlyUtilized.length,
              percentage: (categories.highlyUtilized.length / overallStats.totalBukids) * 100,
              bukids: categories.highlyUtilized
            },
            wellUtilized: {
              count: categories.wellUtilized.length,
              percentage: (categories.wellUtilized.length / overallStats.totalBukids) * 100,
              bukids: categories.wellUtilized
            },
            underutilized: {
              count: categories.underutilized.length,
              percentage: (categories.underutilized.length / overallStats.totalBukids) * 100,
              bukids: categories.underutilized
            },
            severelyUnderutilized: {
              count: categories.severelyUnderutilized.length,
              percentage: (categories.severelyUnderutilized.length / overallStats.totalBukids) * 100,
              bukids: categories.severelyUnderutilized
            }
          },
          rankings: {
            byUtilization: sortedByUtilization.map(b => ({
              bukidName: b.bukidName,
              overallUtilization: b.utilization.overallUtilization,
              capacityUtilization: b.utilization.capacityUtilization,
              kabisilyaName: b.kabisilyaName
            })),
            byCapacity: sortedByCapacity.map(b => ({
              bukidName: b.bukidName,
              totalLuwang: b.capacity.totalLuwang,
              assignedLuwang: b.capacity.assignedLuwang,
              kabisilyaName: b.kabisilyaName
            }))
          },
          byKabisilya: kabisilyaUtilization,
          needsAttention: needsAttention,
          mostUtilized: sortedByUtilization.slice(0, 10),
          recommendations: overallCapacityUtilization < 60 ? [
            "Increase assignment coverage in underutilized bukids",
            "Review pitak status and activation",
            "Consider land expansion or reallocation"
          ] : [
            "Land utilization is at good levels",
            "Focus on improving completion rates",
            "Optimize assignment distribution"
          ]
        }
      };
    } catch (error) {
      console.error("getLandUtilization error:", error);
      throw error;
    }
  }
}

module.exports = new KabisilyaAnalytics();