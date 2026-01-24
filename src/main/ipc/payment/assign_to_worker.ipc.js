// ipc/payment/assign_to_worker.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Worker = require("../../../entities/Worker");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function assignPaymentToWorker(params = {}, queryRunner = null) {
  let shouldRelease = false;
  
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();
    // @ts-ignore
    await queryRunner.connect();
    // @ts-ignore
    await queryRunner.startTransaction();
    shouldRelease = true;
  }

  try {
    // @ts-ignore
    const { paymentId, workerId, _userId } = params;
    
    if (!paymentId || !workerId) {
      return {
        status: false,
        message: 'Payment ID and Worker ID are required',
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const workerRepository = queryRunner.manager.getRepository(Worker);

    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['worker']
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    const newWorker = await workerRepository.findOne({
      where: { id: workerId }
    });

    if (!newWorker) {
      return {
        status: false,
        message: 'Worker not found',
        data: null
      };
    }

    const oldWorker = payment.worker;
    payment.worker = newWorker;
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: 'update',
      changedField: 'worker',
      oldValue: oldWorker ? oldWorker.name : 'None',
      newValue: newWorker.name,
      notes: `Payment reassigned from ${oldWorker ? oldWorker.name : 'No worker'} to ${newWorker.name}`,
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'assign_payment_to_worker',
      description: `Assigned payment #${paymentId} to worker ${newWorker.name}`,
      ip_address: "127.0.0.1",
      user_agent: "Kabisilya-Management-System",
      created_at: new Date()
    });
    await activityRepo.save(activity);

    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.commitTransaction();
    }

    return {
      status: true,
      message: 'Payment assigned to worker successfully',
      data: { 
        payment: updatedPayment,
        oldWorker: oldWorker ? { id: oldWorker.id, name: oldWorker.name } : null,
        newWorker: { id: newWorker.id, name: newWorker.name }
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in assignPaymentToWorker:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign payment to worker: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};