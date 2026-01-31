// ipc/bukid/get/by_name.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getBukidByName(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { name, _userId } = params;
    
    if (!name) {
      return {
        status: false,
        message: 'Name is required',
        data: null
      };
    }

    const bukids = await bukidRepository.find({
      where: { name: name },
      relations: ['pitaks']
    });

    return {
      status: true,
      message: 'Bukid retrieved successfully',
      data: { bukids }
    };
  } catch (error) {
    console.error('Error in getBukidByName:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve bukid: ${error.message}`,
      data: null
    };
  }
};