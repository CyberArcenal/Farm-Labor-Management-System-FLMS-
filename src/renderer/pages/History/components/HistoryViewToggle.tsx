import React from 'react';
import { CreditCard, DollarSign } from 'lucide-react';
import { type HistoryType } from '../types/history.types';

interface HistoryViewToggleProps {
  viewType: HistoryType;
  onChange: (type: HistoryType) => void;
}

const HistoryViewToggle: React.FC<HistoryViewToggleProps> = ({ viewType, onChange }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-1 inline-flex">
      <button
        onClick={() => onChange('payment')}
        className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
          viewType === 'payment'
            ? 'bg-white shadow-sm text-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Payment History
      </button>
      <button
        onClick={() => onChange('debt')}
        className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
          viewType === 'debt'
            ? 'bg-white shadow-sm text-blue-600'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Debt History
      </button>
    </div>
  );
};

export default HistoryViewToggle;