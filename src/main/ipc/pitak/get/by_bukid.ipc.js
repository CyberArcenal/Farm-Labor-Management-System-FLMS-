// src/ipc/pitak/get/by_bukid.ipc
//@ts-check

const Pitak = require("../../../../entities/Pitak");
const Bukid = require("../../../../entities/Bukid");
const Assignment = require("../../../../entities/Assignment");
const { AppDataSource } = require("../../../db/dataSource");

// @ts-ignore
module.exports = async (
  /** @type {any} */ bukidId,
  filters = {},
  // @ts-ignore
  /** @type {any} */ userId,
) => {
  try {
    if (!bukidId) {
      return { status: false, message: "Bukid ID is required", data: null };
    }

    const bukidRepo = AppDataSource.getRepository(Bukid);
    const pitakRepo = AppDataSource.getRepository(Pitak);
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Verify bukid exists
    const bukid = await bukidRepo.findOne({
      where: { id: bukidId },
    });

    if (!bukid) {
      return { status: false, message: "Bukid not found", data: null };
    }

    const query = pitakRepo
      .createQueryBuilder("pitak")
      .where("pitak.bukidId = :bukidId", { bukidId });

    // Apply filters
    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      query.andWhere("pitak.status = :status", { status: filters.status });
    }

    // @ts-ignore
    if (filters.location) {
      // @ts-ignore
      query.andWhere("pitak.location LIKE :location", {
        // @ts-ignore
        location: `%${filters.location}%`,
      });
    }

    // @ts-ignore
    if (filters.minLuWang) {
      // @ts-ignore
      query.andWhere("pitak.totalLuwang >= :minLuWang", {
        // @ts-ignore
        minLuWang: filters.minLuWang,
      });
    }

    // @ts-ignore
    if (filters.maxLuWang) {
      // @ts-ignore
      query.andWhere("pitak.totalLuwang <= :maxLuWang", {
        // @ts-ignore
        maxLuWang: filters.maxLuWang,
      });
    }

    // Sorting
    // @ts-ignore
    const sortField = filters.sortBy || "location";
    // @ts-ignore
    const sortOrder = filters.sortOrder === "asc" ? "ASC" : "DESC";
    query.orderBy(`pitak.${sortField}`, sortOrder);

    // Get all pitaks for this bukid (usually not too many, so no pagination)
    const pitaks = await query.getMany();

    // Get assignment statistics for each pitak
    const pitaksWithStats = await Promise.all(
      pitaks.map(
        // @ts-ignore
        async (
          /** @type {{ id: any; location: any; totalLuwang: string; status: any; createdAt: any; updatedAt: any; }} */ pitak,
        ) => {
          const assignmentStats = await assignmentRepo
            .createQueryBuilder("assignment")
            .select([
              "COUNT(*) as totalAssignments",
              "SUM(assignment.luwangCount) as totalLuWangAssigned",
              'SUM(CASE WHEN assignment.status = "completed" THEN 1 ELSE 0 END) as completedAssignments',
              'SUM(CASE WHEN assignment.status = "active" THEN 1 ELSE 0 END) as activeAssignments',
            ])
            .where("assignment.pitakId = :pitakId", { pitakId: pitak.id })
            .getRawOne();

          return {
            id: pitak.id,
            location: pitak.location,
            totalLuwang: parseFloat(pitak.totalLuwang),
            status: pitak.status,
            assignmentStats: {
              total: parseInt(assignmentStats.totalAssignments) || 0,
              totalLuWangAssigned:
                parseFloat(assignmentStats.totalLuWangAssigned) || 0,
              completed: parseInt(assignmentStats.completedAssignments) || 0,
              active: parseInt(assignmentStats.activeAssignments) || 0,
            },
            utilizationRate:
              parseFloat(pitak.totalLuwang) > 0
                ? (parseFloat(assignmentStats.totalLuWangAssigned || 0) /
                    parseFloat(pitak.totalLuwang)) *
                  100
                : 0,
            createdAt: pitak.createdAt,
            updatedAt: pitak.updatedAt,
          };
        },
      ),
    );

    // Calculate bukid-level statistics
    const bukidStats = pitaksWithStats.reduce(
      (
        /** @type {{ totalPitaks: number; totalLuWangCapacity: any; totalLuWangAssigned: any; totalAssignments: any; totalActiveAssignments: any; activePitaks: number; inactivePitaks: number; harvestedPitaks: number; }} */ stats,
        /** @type {{ totalLuwang: any; assignmentStats: { totalLuWangAssigned: any; total: any; active: any; }; status: string; }} */ pitak,
      ) => {
        stats.totalPitaks++;
        stats.totalLuWangCapacity += pitak.totalLuwang;
        stats.totalLuWangAssigned += pitak.assignmentStats.totalLuWangAssigned;
        stats.totalAssignments += pitak.assignmentStats.total;
        stats.totalActiveAssignments += pitak.assignmentStats.active;

        if (pitak.status === "active") stats.activePitaks++;
        if (pitak.status === "inactive") stats.inactivePitaks++;
        if (pitak.status === "completed") stats.harvestedPitaks++;

        return stats;
      },
      {
        totalPitaks: 0,
        activePitaks: 0,
        inactivePitaks: 0,
        harvestedPitaks: 0,
        totalLuWangCapacity: 0,
        totalLuWangAssigned: 0,
        totalAssignments: 0,
        totalActiveAssignments: 0,
      },
    );

    // Calculate overall utilization
    // @ts-ignore
    bukidStats.utilizationRate =
      bukidStats.totalLuWangCapacity > 0
        ? (bukidStats.totalLuWangAssigned / bukidStats.totalLuWangCapacity) *
          100
        : 0;

    return {
      status: true,
      message: "Pitaks for bukid retrieved successfully",
      data: {
        bukid: {
          id: bukid.id,
          name: bukid.name,
          location: bukid.location,
        },
        pitaks: pitaksWithStats,
        statistics: bukidStats,
      },
      meta: {
        filters,
        retrievedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error retrieving pitaks by bukid:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve pitaks: ${error.message}`,
      data: null,
    };
  }
};
