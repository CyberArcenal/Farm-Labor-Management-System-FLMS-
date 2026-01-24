// ipc/payment/assign_to_pitak.ipc.js
//@ts-check

const Payment = require("../../../entities/Payment");
const Pitak = require("../../../entities/Pitak");
const PaymentHistory = require("../../../entities/PaymentHistory");
const UserActivity = require("../../../entities/UserActivity");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async function assignPaymentToPitak(params = {}, queryRunner = null) {
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
    const { paymentId, pitakId, _userId } = params;
    
    if (!paymentId) {
      return {
        status: false,
        message: 'Payment ID is required',
        data: null
      };
    }

    // @ts-ignore
    const paymentRepository = queryRunner.manager.getRepository(Payment);
    // @ts-ignore
    const pitakRepository = queryRunner.manager.getRepository(Pitak);

    const payment = await paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['pitak']
    });

    if (!payment) {
      return {
        status: false,
        message: 'Payment not found',
        data: null
      };
    }

    let newPitak = null;
    if (pitakId) {
      newPitak = await pitakRepository.findOne({
        where: { id: pitakId }
      });

      if (!newPitak) {
        return {
          status: false,
          message: 'Pitak not found',
          data: null
        };
      }
    }

    const oldPitak = payment.pitak;
    payment.pitak = newPitak;
    payment.updatedAt = new Date();

    const updatedPayment = await paymentRepository.save(payment);

    // Create payment history entry
    // @ts-ignore
    const paymentHistoryRepository = queryRunner.manager.getRepository(PaymentHistory);
    const paymentHistory = paymentHistoryRepository.create({
      payment: updatedPayment,
      actionType: 'update',
      changedField: 'pitak',
      oldValue: oldPitak ? `Pitak #${oldPitak.id}` : 'None',
      newValue: newPitak ? `Pitak #${newPitak.id}` : 'None',
      notes: newPitak 
        ? `Payment assigned to pitak #${newPitak.id}`
        : 'Payment unassigned from pitak',
      performedBy: _userId,
      changeDate: new Date()
    });

    await paymentHistoryRepository.save(paymentHistory);

    // Log activity
    // @ts-ignore
    const activityRepo = queryRunner.manager.getRepository(UserActivity);
    const activity = activityRepo.create({
      user_id: _userId,
      action: 'assign_payment_to_pitak',
      description: `Assigned payment #${paymentId} to ${newPitak ? `pitak #${pitakId}` : 'no pitak'}`,
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
      message: 'Payment assigned to pitak successfully',
      data: { 
        payment: updatedPayment,
        oldPitak: oldPitak ? { id: oldPitak.id } : null,
        newPitak: newPitak ? { id: newPitak.id } : null
      }
    };
  } catch (error) {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.rollbackTransaction();
    }
    console.error('Error in assignPaymentToPitak:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to assign payment to pitak: ${error.message}`,
      data: null
    };
  } finally {
    if (shouldRelease) {
      // @ts-ignore
      await queryRunner.release();
    }
  }
};