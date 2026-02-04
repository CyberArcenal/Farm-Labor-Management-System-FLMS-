export interface DebtData {
  id: number;
  originalAmount: number;
  amount: number;
  balance: number;
  reason: string | null;
  status: "pending" | "partially_paid" | "paid" | "cancelled" | "overdue";
  dateIncurred: string;
  dueDate: string | null;
  paymentTerm: string | null;
  interestRate: number;
  totalInterest: number;
  totalPaid: number;
}

export interface DebtPaymentDialogProps {
  workerId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface FormData {
  paymentAmount: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
  // Tinanggal na: allocationMethod at manualAllocations
}