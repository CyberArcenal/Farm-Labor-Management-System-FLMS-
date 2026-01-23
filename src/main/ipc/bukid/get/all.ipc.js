// ipc/bukid/get/all.ipc.js
//@ts-check

const { AppDataSource } = require("../../../db/dataSource");
const Bukid = require("../../../../entities/Bukid");

module.exports = async function getAllBukid(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    const { 
      // @ts-ignore
      filters = {}, 
      // @ts-ignore
      _userId 
    } = params;
    
    const { 
      kabisilyaId, 
      status, 
      page = 1, 
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;

    const queryBuilder = bukidRepository.createQueryBuilder('bukid')
      .leftJoinAndSelect('bukid.kabisilya', 'kabisilya')
      .leftJoinAndSelect('bukid.pitaks', 'pitaks');

    if (kabisilyaId) {
      queryBuilder.andWhere('bukid.kabisilyaId = :kabisilyaId', { kabisilyaId });
    }
    if (status) {
      queryBuilder.andWhere('bukid.status = :status', { status });
    }

    queryBuilder.orderBy(`bukid.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [bukids, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: 'Bukid retrieved successfully',
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
    console.error('Error in getAllBukid:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve bukid: ${error.message}`,
      data: null
    };
  }
};