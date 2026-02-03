// components/Payment/components/PaymentTableView.tsx
import React, { useState } from 'react';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import type { PaymentData } from '../../../../apis/payment';
import PaymentTableRow from './PaymentTableRow';

interface PaymentTableViewProps {
    payments: PaymentData[];
    selectedPayments: number[];
    toggleSelectAll: () => void;
    toggleSelectPayment: (id: number) => void;
    onView: (id: number) => void;
    onUpdateStatus: (id: number, currentStatus: string, newStatus: string) => void;
    onProcessPayment: (id: number) => void;
    onCancelPayment: (id: number) => void;
    onGenerateSlip: (id: number) => void;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (field: string) => void;
}

const PaymentTableView: React.FC<PaymentTableViewProps> = ({
    payments,
    selectedPayments,
    toggleSelectAll,
    toggleSelectPayment,
    onView,
    onUpdateStatus,
    onProcessPayment,
    onCancelPayment,
    onGenerateSlip,
    sortBy,
    sortOrder,
    onSort
}) => {
    const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

    const toggleExpandPayment = (id: number) => {
        setExpandedPayment(prev => prev === id ? null : id);
    };

    return (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-color)' }}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr style={{ background: 'var(--table-header-bg)' }}>
                            <th className="p-4 text-left">
                                <input
                                    type="checkbox"
                                    checked={selectedPayments.length === payments.length && payments.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('paymentDate')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Date
                                    {sortBy === 'paymentDate' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Worker
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('grossPay')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Gross Pay
                                    {sortBy === 'grossPay' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                <button
                                    onClick={() => onSort('netPay')}
                                    className="flex items-center gap-1 hover:text-primary"
                                >
                                    Net Pay
                                    {sortBy === 'netPay' && (
                                        <ChevronRightIcon className={`w-3 h-3 transform ${sortOrder === 'asc' ? 'rotate-90' : '-rotate-90'}`} />
                                    )}
                                </button>
                            </th>
                            {/* <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Deductions
                            </th> */}
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Method
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Status
                            </th>
                            <th className="p-4 text-left text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <PaymentTableRow
                                key={payment.id}
                                payment={payment}
                                isSelected={selectedPayments.includes(payment.id)}
                                isExpanded={expandedPayment === payment.id}
                                onSelect={() => toggleSelectPayment(payment.id)}
                                onToggleExpand={() => toggleExpandPayment(payment.id)}
                                onView={onView}
                                onUpdateStatus={onUpdateStatus}
                                onProcessPayment={onProcessPayment}
                                onCancelPayment={onCancelPayment}
                                onGenerateSlip={onGenerateSlip}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentTableView;