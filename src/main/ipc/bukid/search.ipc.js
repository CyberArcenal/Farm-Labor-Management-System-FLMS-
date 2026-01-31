// ipc/bukid/search.ipc.js
//@ts-check

const Bukid = require("../../../entities/Bukid");
const { AppDataSource } = require("../../db/dataSource");


module.exports = async function searchBukid(params = {}) {
  try {
    const bukidRepository = AppDataSource.getRepository(Bukid);
    // @ts-ignore
    const { query, filters = {}, _userId } = params;
    
    if (!query) {
      return {
        status: false,
        message: 'Search query is required',
        data: null
      };
    }

    const { page = 1, limit = 50 } = filters;

    const searchQuery = bukidRepository
      .createQueryBuilder('bukid')
      .leftJoinAndSelect('bukid.pitaks', 'pitaks')
      .where('bukid.name LIKE :query', { query: `%${query}%` })
      .orWhere('bukid.location LIKE :query', { query: `%${query}%` })
      .orderBy('bukid.name', 'ASC');

    const skip = (page - 1) * limit;
    searchQuery.skip(skip).take(limit);

    const [bukids, total] = await searchQuery.getManyAndCount();

    return {
      status: true,
      message: 'Search completed successfully',
      data: {
        bukids,
        query,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in searchBukid:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search bukid: ${error.message}`,
      data: null
    };
  }
};