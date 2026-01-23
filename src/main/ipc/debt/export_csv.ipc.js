//@ts-check
const { Parser } = require("json2csv");
const fs = require("fs");
const { AppDataSource } = require("../../db/dataSource");

module.exports = async (/** @type {{ filters: any; outputPath: any; }} */ params) => {
  try {
    const { filters, outputPath } = params;

    const debtRepository = AppDataSource.getRepository("Debt");
    
    const query = debtRepository.createQueryBuilder("debt")
      .leftJoinAndSelect("debt.worker", "worker")
      .orderBy("debt.dateIncurred", "DESC");

    // Apply filters
    if (filters) {
      if (filters.status) {
        query.andWhere("debt.status = :status", { status: filters.status });
      }

      if (filters.worker_id) {
        query.andWhere("debt.worker_id = :worker_id", { worker_id: filters.worker_id });
      }

      if (filters.date_from && filters.date_to) {
        query.andWhere("debt.dateIncurred BETWEEN :date_from AND :date_to", {
          date_from: filters.date_from,
          date_to: filters.date_to
        });
      }
    }

    const debts = await query.getMany();

    // Format data for CSV
    const formattedDebts = debts.map((/** @type {{ id: any; worker: { id: any; name: any; }; amount: any; balance: any; reason: any; status: any; dateIncurred: any; dueDate: any; interestRate: any; paymentTerm: any; totalPaid: any; totalInterest: any; }} */ debt) => ({
      id: debt.id,
      worker_id: debt.worker.id,
      worker_name: debt.worker.name,
      amount: debt.amount,
      balance: debt.balance,
      reason: debt.reason,
      status: debt.status,
      date_incurred: debt.dateIncurred,
      due_date: debt.dueDate,
      interest_rate: debt.interestRate,
      payment_term: debt.paymentTerm,
      total_paid: debt.totalPaid,
      total_interest: debt.totalInterest
    }));

    const fields = [
      'id',
      'worker_id',
      'worker_name',
      'amount',
      'balance',
      'reason',
      'status',
      'date_incurred',
      'due_date',
      'interest_rate',
      'payment_term',
      'total_paid',
      'total_interest'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(formattedDebts);

    // Write to file
    const filePath = outputPath || `debts_export_${Date.now()}.csv`;
    fs.writeFileSync(filePath, csv);

    return {
      status: true,
      message: `Exported ${debts.length} debts to ${filePath}`,
      data: {
        filePath,
        count: debts.length
      }
    };
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
};