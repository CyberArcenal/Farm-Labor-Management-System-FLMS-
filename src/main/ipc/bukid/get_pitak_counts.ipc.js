// ipc/bukid/get_pitak_counts.ipc.js
//@ts-check

const { AppDataSource } = require("../../db/dataSource");
const Bukid = require("../../../entities/Bukid");

module.exports = async function getPitakCounts(params = {}) {
  try {
    // @ts-ignore
    const { bukidId } = params;

    const bukidRepo = AppDataSource.getRepository(Bukid);

    let query = bukidRepo
      .createQueryBuilder("bukid")
      .leftJoin("bukid.pitaks", "pitak")
      .select("bukid.id", "id")
      .addSelect("bukid.name", "name")
      .addSelect("COUNT(pitak.id)", "pitakCount")
      .addSelect("COALESCE(SUM(pitak.totalLuwang), 0)", "totalLuwang")
      .addSelect("COALESCE(AVG(pitak.totalLuwang), 0)", "averageLuwang")
      .groupBy("bukid.id");

    if (bukidId) {
      query = query.where("bukid.id = :bukidId", { bukidId });
    }

    const pitakCounts = await query.getRawMany();

    return {
      status: true,
      message: "Pitak counts retrieved successfully",
      data: {
        pitakCounts: pitakCounts.map((item) => ({
          id: item.id,
          name: item.name,
          pitakCount: parseInt(item.pitakCount, 10) || 0,
          totalLuwang: parseFloat(item.totalLuwang) || 0,
          averageLuwang: parseFloat(item.averageLuwang) || 0,
        })),
      },
    };
  } catch (error) {
    console.error("Error in getPitakCounts:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get pitak counts: ${error.message}`,
      data: null,
    };
  }
};