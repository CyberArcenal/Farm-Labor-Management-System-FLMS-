// src/ipc/debt/validate_data.ipc.js
//@ts-check
const validateDebtData = async (/** @type {{ worker_id: any; amount: any; reason: any; dueDate: any; }} */ params) => {
  try {
    const { worker_id, amount, reason, dueDate } = params;
    const errors = [];

    // Validate required fields
    if (!worker_id) {
      errors.push("Worker ID is required");
    }

    if (!amount || parseFloat(amount) <= 0) {
      errors.push("Valid amount is required");
    }

    if (!reason || reason.trim() === "") {
      errors.push("Reason is required");
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      errors.push("Due date cannot be in the past");
    }

    return {
      status: errors.length === 0,
      message: errors.length > 0 ? errors.join(", ") : "Data is valid",
      data: { errors }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};

module.exports = validateDebtData;