// ipc/bukid/get/by_kabisilya.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getBukidByKabisilya(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { kabisilyaId, filters = {}, _userId } = params;
    
    if (!kabisilyaId) {
      return {
        status: false,
        message: 'Kabisilya ID is required',
        data: null
      };
    }

    const { page = 1, limit = 50 } = filters;

    const queryBuilder = bukidRepository.createQueryBuilder('bukid')
      .leftJoinAndSelect('bukid.kabisilya', 'kabisilya')
      .leftJoinAndSelect('bukid.pitaks', 'pitaks')
      .where('bukid.kabisilyaId = :kabisilyaId', { kabisilyaId });

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [bukids, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Bukid retrieved successfully',
      data: {
        bukids,
        kabisilyaId,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getBukidByKabisilya:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve bukid: ${error.message}`,
      data: null
    };
  }
};