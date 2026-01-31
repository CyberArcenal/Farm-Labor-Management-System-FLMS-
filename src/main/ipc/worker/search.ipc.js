// ipc/worker/search.ipc.js
//@ts-check

const Worker = require("../../../entities/Worker");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function searchWorkers(params = {}) {
  try {
    const { 
      // @ts-ignore
      query, 
      // @ts-ignore
      page = 1, 
      // @ts-ignore
      limit = 50, 
      // @ts-ignore
      sortBy = 'name', 
      // @ts-ignore
      sortOrder = 'ASC',
      // @ts-ignore
      status = null,
      // @ts-ignore
      _userId 
    } = params;

    if (!query || query.trim() === '') {
      return {
        status: false,
        message: 'Search query is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    // Build query (removed kabisilya join)
    const qb = workerRepository
      .createQueryBuilder('worker')
      .where(
        'worker.name LIKE :query OR worker.contact LIKE :query OR worker.email LIKE :query OR worker.address LIKE :query',
        { query: `%${query}%` }
      );

    // Apply filters
    if (status) {
      qb.andWhere('worker.status = :status', { status });
    }

    // Get total count first
    const total = await qb.getCount();

    // Apply pagination and ordering
    qb.orderBy(`worker.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const workers = await qb.getMany();

    return {
      status: true,
      message: 'Workers retrieved successfully',
      data: {
        workers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error('Error in searchWorkers:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to search workers: ${error.message}`,
      data: null
    };
  }
};