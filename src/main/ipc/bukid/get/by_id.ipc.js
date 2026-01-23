// ipc/bukid/get/by_id.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getBukidById(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { id, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Bukid ID is required',
        data: null
      };
    }

    const bukid = await bukidRepository.findOne({
      where: { id },
      relations: ['kabisilya', 'pitaks', 'pitaks.assignments', 'pitaks.assignments.worker']
    });

    if (!bukid) {
      return {
        status: false,
        message: 'Bukid not found',
        data: null
      };
    }

    return {
      status: true,
      message: 'Bukid retrieved successfully',
      data: { bukid }
    };
  } catch (error) {
    console.error('Error in getBukidById:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve bukid: ${error.message}`,
      data: null
    };
  }
};