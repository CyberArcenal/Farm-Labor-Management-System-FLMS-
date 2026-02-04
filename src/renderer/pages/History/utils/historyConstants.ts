// components/History/utils/historyConstants.ts
export const TRANSACTION_TYPES = {
  PAYMENT: {
    'create': 'Created',
    'deduction': 'Deduction',
    'status_change': 'Status Change',
    'update': 'Updated',
    'delete': 'Deleted',
    'all': 'All Actions'
  },
  DEBT: {
    'payment': 'Payment',
    'adjustment': 'Adjustment',
    'interest': 'Interest',
    'refund': 'Refund',
    'all': 'All Transactions'
  },
};

export const PAYMENT_FIELDS = {
  'all': 'All Fields',
  'status': 'Status',
  'grossPay': 'Gross Pay',
  'netPay': 'Net Pay',
  'debt_payment': 'Debt Payment',
  'amount': 'Amount',
  'paymentMethod': 'Payment Method',
  'referenceNumber': 'Reference Number',
  'notes': 'Notes',
  'periodStart': 'Period Start',
  'periodEnd': 'Period End',
};

export const DEBT_FIELDS = {
  'all': 'All Fields',
  'amount': 'Amount',
  'balance': 'Balance',
  'status': 'Status',
  'reason': 'Reason',
  'dueDate': 'Due Date',
  'interestRate': 'Interest Rate',
};

export const FILTER_OPTIONS = {
  status: ['all', 'pending', 'processing', 'completed', 'cancelled', 'partially_paid'],
  paymentMethod: ['all', 'cash', 'bank', 'check', 'digital'],
};

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZES = [10, 25, 50, 100];

export const ACTION_ICONS: Record<string, string> = {
  'create': 'PlusCircle',
  'deduction': 'MinusCircle',
  'status_change': 'RefreshCw',
  'update': 'Edit',
  'delete': 'Trash2',
  'payment': 'CreditCard',
  'adjustment': 'TrendingUp',
  'interest': 'Percent',
  'refund': 'RefreshCw',
  'default': 'Clock'
};

export const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'create': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'deduction': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'status_change': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'update': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'delete': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  'payment': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'adjustment': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'interest': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  'refund': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};