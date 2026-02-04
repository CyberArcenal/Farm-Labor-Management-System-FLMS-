import React, { useState } from 'react';
import { type HistoryType } from '../types/history.types';
import type { PaymentHistoryItem as PaymentHistoryData } from "../../../apis/payment";
import { type DebtHistoryItem as DebtHistoryData } from '../../../apis/debt';
import PaymentHistoryItem from './PaymentHistoryItem';
import DebtHistoryItem from './DebtHistoryItem';

interface HistoryListProps {
  viewType: HistoryType;
  paymentHistory: PaymentHistoryData[];
  debtHistory: DebtHistoryData[];
}

const HistoryList: React.FC<HistoryListProps> = ({ 
  viewType, 
  paymentHistory, 
  debtHistory 
}) => {
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const toggleRecordExpansion = (id: number) => {
    setExpandedRecord(prev => prev === id ? null : id);
  };

  if (viewType === 'payment') {
    return (
      <div className="space-y-4">
        {paymentHistory.map((record) => (
          <PaymentHistoryItem
            key={record.id}
            record={record}
            isExpanded={expandedRecord === record.id}
            onToggleExpand={() => toggleRecordExpansion(record.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debtHistory.map((record) => (
        <DebtHistoryItem
          key={record.id}
          record={record}
          isExpanded={expandedRecord === record.id}
          onToggleExpand={() => toggleRecordExpansion(record.id)}
        />
      ))}
    </div>
  );
};

export default HistoryList;