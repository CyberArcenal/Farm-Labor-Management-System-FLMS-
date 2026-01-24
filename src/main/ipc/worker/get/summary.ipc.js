// ipc/worker/get/summary.ipc.js
//@ts-check

const Worker = require("../../../../entities/Worker");
const { AppDataSource } = require("../../../db/dataSource");

module.exports = async function getWorkerSummary(params = {}) {
  try {
    // @ts-ignore
    const { id, _userId } = params;

    if (!id) {
      return {
        status: false,
        message: 'Worker ID is required',
        data: null
      };
    }

    const workerRepository = AppDataSource.getRepository(Worker);

    // Get basic worker info
    const worker = await workerRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['kabisilya']
    });

    if (!worker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    // Get counts from related tables
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const [
        debtCount,
        paymentCount,
        assignmentCount,
        activeAssignmentCount
      ] = await Promise.all([
        queryRunner.query(
          'SELECT COUNT(*) as count FROM debts WHERE workerId = ? AND (status = ? OR status = ?)',
          [id, 'pending', 'partially_paid']
        ),
        queryRunner.query(
          'SELECT COUNT(*) as count FROM payments WHERE workerId = ?',
          [id]
        ),
        queryRunner.query(
          'SELECT COUNT(*) as count FROM assignments WHERE workerId = ?',
          [id]
        ),
        queryRunner.query(
          'SELECT COUNT(*) as count FROM assignments WHERE workerId = ? AND status = ?',
          [id, 'active']
        )
      ]);

      await queryRunner.release();

      return {
        status: true,
        message: 'Worker summary retrieved successfully',
        data: {
          worker,
          summary: {
            basicInfo: {
              name: worker.name,
              status: worker.status,
              hireDate: worker.hireDate,
              daysEmployed: worker.hireDate ? 
                // @ts-ignore
                Math.floor((new Date() - new Date(worker.hireDate)) / (1000 * 60 * 60 * 24)) : 0
            },
            counts: {
              totalDebts: parseInt(debtCount[0].count),
              totalPayments: parseInt(paymentCount[0].count),
              totalAssignments: parseInt(assignmentCount[0].count),
              activeAssignments: parseInt(activeAssignmentCount[0].count)
            },
            financial: {
              totalDebt: parseFloat(worker.totalDebt || 0),
              totalPaid: parseFloat(worker.totalPaid || 0),
              currentBalance: parseFloat(worker.currentBalance || 0)
            }
          }
        }
      };
    } catch (error) {
      await queryRunner.release();
      throw error;
    }
  } catch (error) {
    console.error('Error in getWorkerSummary:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve worker summary: ${error.message}`,
      data: null
    };
  }
};