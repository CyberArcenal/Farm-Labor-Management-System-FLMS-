// ipc/bukid/get/active.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getActiveBukid(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { filters = {}, _userId } = params;
    
    const { page = 1, limit = 50 } = filters;

    const queryBuilder = bukidRepository.createQueryBuilder('bukid')
      .leftJoinAndSelect('bukid.pitaks', 'pitaks')
      .where('bukid.status = :status', { status: 'active' })
      .orderBy('bukid.name', 'ASC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [bukids, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Active bukid retrieved successfully',
      data: {
        bukids,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in getActiveBukid:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve active bukid: ${error.message}`,
      data: null
    };
  }
};