// src/ipc/debt/calculate_interest.ipc.js
//@ts-check

module.exports = async (/** @type {{ principal: any; interestRate: any; days: any; compoundingPeriod?: "daily" | undefined; }} */ params) => {
  try {
    const { principal, interestRate, days, compoundingPeriod = "daily" } = params;
    
    const principalAmount = parseFloat(principal);
    const rate = parseFloat(interestRate) / 100; // Convert percentage to decimal
    const numberOfDays = parseFloat(days);

    let interest = 0;

    switch (compoundingPeriod) {
      case "daily":
        interest = principalAmount * rate * (numberOfDays / 365);
        break;
      // @ts-ignore
      case "monthly":
        interest = principalAmount * rate * (numberOfDays / 30);
        break;
      // @ts-ignore
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
        interestRate: parseFloat(interestRate),
        days: numberOfDays,
        compoundingPeriod,
        interest: parseFloat(interest.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
      }
    };
  } catch (error) {
    console.error("Error calculating interest:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};