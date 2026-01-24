// ipc/notification/preferences/types.ipc.js
//@ts-check

module.exports = async function getNotificationTypes(params = {}) {
  try {
    // Define available notification types
    const notificationTypes = [
      {
        id: 'system',
        name: 'System Notifications',
        description: 'Important system updates and alerts',
        defaultEnabled: true
      },
      {
        id: 'worker',
        name: 'Worker Notifications',
        description: 'Updates about workers (assignments, status changes)',
        defaultEnabled: true
      },
      {
        id: 'debt',
        name: 'Debt Notifications',
        description: 'Debt-related updates (new debts, payments, overdue)',
        defaultEnabled: true
      },
      {
        id: 'payment',
        name: 'Payment Notifications',
        description: 'Payment processing updates',
        defaultEnabled: true
      },
      {
        id: 'assignment',
        name: 'Assignment Notifications',
        description: 'Task and assignment updates',
        defaultEnabled: true
      },
      {
        id: 'kabisilya',
        name: 'Kabisilya Notifications',
        description: 'Kabisilya and bukid management updates',
        defaultEnabled: true
      },
      {
        id: 'report',
        name: 'Report Notifications',
        description: 'Report generation and completion notifications',
        defaultEnabled: false
      }
    ];

    return {
      status: true,
      message: 'Notification types retrieved successfully',
      data: { notificationTypes }
    };
  } catch (error) {
    console.error('Error in getNotificationTypes:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retrieve notification types: ${error.message}`,
      data: null
    };
  }
};