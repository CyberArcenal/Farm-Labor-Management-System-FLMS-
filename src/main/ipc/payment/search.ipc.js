// src/ipc/payment/search.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Search payments with filters and pagination
 * @param {Object} params
 * @param {string} [params.query]
 * @param {string} [params.status]
 * @param {"ASC"|"DESC"} [params.sortOrder]
 * @param {string} [params.sortBy]
 * @param {string|Date} [params.startDate]
 * @param {string|Date} [params.endDate]
 * @param {string} [params.workerName]
 * @param {number} [params.limit=50]
 * @param {number} [params.page=1]
 */
module.exports = async function searchPayments(params = {}) {
  try {
    const {
      query,
      status,
      sortOrder = "DESC",
      sortBy = "payment.createdAt",
      startDate,
      endDate,
      workerName,
      limit = 50,
      page = 1,
    } = params;

    const paymentRepository = AppDataSource.getRepository(Payment);
    const qb = paymentRepository
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.worker", "worker")
      .leftJoinAndSelect("payment.pitak", "pitak");

    // Filters
    if (query) {
      qb.andWhere(
        "(payment.referenceNumber LIKE :query OR worker.name LIKE :query OR payment.notes LIKE :query)",
        { query: `%${query}%` }
      );
    }

    if (workerName) {
      qb.andWhere("worker.name LIKE :workerName", {
        workerName: `%${workerName}%`,
      });
    }

    if (status) {
      qb.andWhere("payment.status = :status", { status });
    }

    if (startDate) {
      const sd = new Date(startDate);
      if (!isNaN(sd.getTime())) {
        qb.andWhere("payment.createdAt >= :startDate", { startDate: sd });
      }
    }

    if (endDate) {
      const ed = new Date(endDate);
      if (!isNaN(ed.getTime())) {
        qb.andWhere("payment.createdAt <= :endDate", { endDate: ed });
      }
    }

    // Pagination
    const safeLimit = Math.max(1, parseInt(limit, 10));
    const safePage = Math.max(1, parseInt(page, 10));
    const skip = (safePage - 1) * safeLimit;

    const total = await qb.getCount();

    const payments = await qb
      .orderBy(sortBy, sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC")
      .skip(skip)
      .take(safeLimit)
      .getMany();

    return {
      status: true,
      message: "Payments searched successfully",
      data: {
        payments,
        pagination: {
          page: safePage,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit),
        },
      },
    };
  } catch (error) {
    console.error("Error in searchPayments:", error);
    return {
      status: false,
      message: `Failed to search payments: ${error?.message}`,
      data: null,
    };
  }
};