// ipc/bukid/get/by_location.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getBukidByLocation(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { location, _userId } = params;
    
    if (!location) {
      return {
        status: false,
        message: 'Location is required',
        data: null
      };
    }

    const bukids = await bukidRepository.find({
      where: { location: location },
      relations: ['pitaks']
    });

    return {
      status: true,
      message: 'Bukid retrieved successfully',
      data: { bukids }
    };
  } catch (error) {
    console.error('Error in getBukidByLocation:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve bukid: ${error.message}`,
      data: null
    };
  }
};