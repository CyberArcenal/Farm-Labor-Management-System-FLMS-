// ipc/bukid/get_kabisilya_info.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");
const Kabisilya = require("../../../../entities/Kabisilya");

module.exports = async function getKabisilyaInfo(params = {}) {
  try {
    // @ts-ignore
    const { id, _userId } = params;
    
    if (!id) {
      return {
        status: false,
        message: 'Bukid ID is required',
        data: null
      };
    }

    const bukidRepository = AppDataSource.getRepository(Bukid);
    const kabisilyaRepository = AppDataSource.getRepository(Kabisilya);

    const bukid = await bukidRepository.findOne({
      where: { id },
      relations: ['kabisilya']
    });

    if (!bukid) {
      return {
        status: false,
        message: 'Bukid not found',
        data: null
      };
    }

    if (!bukid.kabisilya) {
      return {
        status: true,
        message: 'Bukid is not assigned to any kabisilya',
        data: { kabisilya: null }
      };
    }

    // Get detailed kabisilya info
    const kabisilya = await kabisilyaRepository.findOne({
      where: { id: bukid.kabisilya.id },
      relations: ['workers', 'bukids']
    });

    return {
      status: true,
      message: 'Kabisilya info retrieved successfully',
      data: { 
        kabisilya,
        workerCount: kabisilya?.workers?.length || 0,
        bukidCount: kabisilya?.bukids?.length || 0
      }
    };
  } catch (error) {
    console.error('Error in getKabisilyaInfo:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get kabisilya info: ${error.message}`,
      data: null
    };
  }
};