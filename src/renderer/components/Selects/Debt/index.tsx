// components/DebtSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader, CreditCard } from 'lucide-react';
import type { DebtData } from '../../../apis/debt';
import debtAPI from '../../../apis/debt';

interface DebtSelectProps {
  value: number | null;
  onChange: (debtId: number | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const DebtSelect: React.FC<DebtSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a debt'
}) => {
  const [debts, setDebts] = useState<DebtData[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<DebtData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setLoading(true);
        const response = await debtAPI.getAll({});
        
        if (response.status && response.data) {
          setDebts(response.data);
          setFilteredDebts(response.data);
        }
      } catch (err) {
        console.error('Error fetching debts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDebts(debts);
    } else {
      const filtered = debts.filter(debt =>
        debt.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDebts(filtered);
    }
  }, [searchTerm, debts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSelect = (debtId: number) => {
    onChange(debtId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const selectedDebt = debts.find(d => d.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 rounded-lg text-left flex justify-between items-center text-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text-primary)',
          minHeight: '44px'
        }}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedDebt ? (
            <>
              <CreditCard className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate">{selectedDebt.worker.name} - {formatCurrency(selectedDebt.balance)}</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedDebt && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-100 rounded"
              style={{ color: 'var(--accent-rust)' }}
            >
              ×
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            maxHeight: '300px',
            overflow: 'hidden'
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                     style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search debts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
            </div>
          </div>

          {loading && (
            <div className="p-4 text-center">
              <Loader className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--accent-green)' }} />
              <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                Loading debts...
              </p>
            </div>
          )}

          {!loading && (
            <div className="max-h-60 overflow-y-auto">
              {filteredDebts.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {searchTerm ? 'No debts found' : 'No debts available'}
                </div>
              ) : (
                filteredDebts.map((debt) => (
                  <button
                    key={debt.id}
                    type="button"
                    onClick={() => handleSelect(debt.id)}
                    className={`w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      debt.id === value ? 'bg-gray-50' : ''
                    }`}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      debt.id === value ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {debt.id === value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <CreditCard className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{debt.worker.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatCurrency(debt.balance)} • {debt.status}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebtSelect;