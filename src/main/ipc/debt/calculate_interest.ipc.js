//@ts-check

const { getDefaultInterestRate } = require("../../../utils/system");

// @ts-ignore
module.exports = async (params) => {
  try {
    const {
      principal,
      interestRate,
      days,
      compoundingPeriod = "daily",
    } = params;

    const principalAmount = parseFloat(principal);

    // kung walang interestRate na ipasa, gagamit ng settings util
    let rate = interestRate
      ? parseFloat(interestRate) / 100
      : await getDefaultInterestRate();

    const numberOfDays = parseFloat(days);

    let interest = 0;
    switch (compoundingPeriod) {
      case "daily":
        interest = principalAmount * rate * (numberOfDays / 365);
        break;
      case "monthly":
        interest = principalAmount * rate * (numberOfDays / 30);
        break;
      case "annually":
        interest = principalAmount * rate * (numberOfDays / 365);
        break;
      default:
        interest = principalAmount * rate * (numberOfDays / 365);
    }

    const totalAmount = principalAmount + interest;

    return {
      status: true,
      message: "Interest calculated successfully",
      data: {
        principal: principalAmount,
        interestRate: rate * 100, // show back as percent for clarity
        days: numberOfDays,
        compoundingPeriod,
        interest: parseFloat(interest.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
      },
    };
  } catch (error) {
    console.error("Error calculating interest:", error);
    // @ts-ignore
    return { status: false, message: error.message, data: null };
  }
};
