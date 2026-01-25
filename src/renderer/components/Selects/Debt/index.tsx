// components/DebtSelect.tsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Loader, CreditCard, User, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { DebtData } from '../../../apis/debt';
import debtAPI from '../../../apis/debt';

interface DebtSelectProps {
  value: number | null;
  onChange: (debtId: number, debtData?: DebtData) => void;
  disabled?: boolean;
  showDetails?: boolean;
  placeholder?: string;
  statusFilter?: 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue' | 'all';
  workerFilter?: number;
  overdueOnly?: boolean;
}

const DebtSelect: React.FC<DebtSelectProps> = ({
  value,
  onChange,
  disabled = false,
  showDetails = true,
  placeholder = 'Select a debt',
  statusFilter = 'all',
  workerFilter,
  overdueOnly = false
}) => {
  const [debts, setDebts] = useState<DebtData[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<DebtData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (workerFilter) filters.worker_id = workerFilter;
      if (overdueOnly) filters.overdue = true;

      const response = await debtAPI.getAll(filters);
      
      if (response.status && response.data) {
        setDebts(response.data);
        setFilteredDebts(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch debts');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch debts');
      console.error('Error fetching debts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [statusFilter, workerFilter, overdueOnly]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDebts(debts);
    } else {
      const filtered = debts.filter(debt =>
        debt.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        debt.paymentTerm?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDebts(filtered);
    }
  }, [searchTerm, debts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDebtSelect = (debt: DebtData) => {
    onChange(debt.id, debt);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-badge-pending';
      case 'partially_paid': return 'status-badge-partially-paid';
      case 'paid': return 'status-badge-paid';
      case 'cancelled': return 'status-badge-cancelled';
      case 'overdue': return 'status-badge-overdue';
      default: return 'status-badge-inactive';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="icon-xs" />;
      case 'partially_paid': return <AlertTriangle className="icon-xs" />;
      case 'paid': return <CheckCircle className="icon-xs" />;
      case 'cancelled': return <XCircle className="icon-xs" />;
      case 'overdue': return <AlertTriangle className="icon-xs" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const selectedDebt = debts.find(d => d.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`compact-input w-full rounded-md text-left flex justify-between items-center transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'text-gray-900 dark:text-[#9ED9EC] hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
        }`}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: isOpen ? 'var(--accent-green)' : 'var(--border-color)',
          borderWidth: '1px',
          minHeight: '42px'
        }}
      >
        <div className="flex items-center truncate">
          {selectedDebt ? (
            <div className="flex items-center space-x-2">
              <CreditCard className="icon-sm" style={{ color: 'var(--accent-green)' }} />
              <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
                {selectedDebt.worker.name}
                {showDetails && (
                  <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                    • {formatCurrency(selectedDebt.balance)}
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`icon-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-xs rounded-md shadow-lg max-h-80 overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: 'var(--card-secondary-bg)',
            borderColor: 'var(--border-color)',
            borderWidth: '1px',
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          <div className="compact-card border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 icon-sm" style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search debts by worker, reason, or amount..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="compact-input w-full pl-8 rounded-md focus:ring-1 focus:ring-blue-500"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--sidebar-text)'
                }}
                autoFocus
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader className="icon-sm animate-spin" style={{ color: 'var(--accent-green)' }} />
              <span className="ml-xs text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading debts...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="compact-card text-center">
              <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
              <button
                onClick={fetchDebts}
                className="text-sm compact-button"
                style={{
                  backgroundColor: 'var(--accent-green)',
                  color: 'var(--sidebar-text)',
                  padding: 'var(--size-xs) var(--size-sm)'
                }}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="max-h-60 overflow-y-auto kabisilya-scrollbar">
              {filteredDebts.length === 0 ? (
                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No debts found
                </div>
              ) : (
                filteredDebts.map((debt) => (
                  <button
                    key={debt.id}
                    type="button"
                    onClick={() => handleDebtSelect(debt)}
                    className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${
                      debt.id === value
                        ? 'border-l-2 border-green-600'
                        : ''
                    }`}
                    style={{
                      backgroundColor: debt.id === value ? 'var(--card-hover-bg)' : 'transparent',
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                          <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                            {debt.worker.name}
                          </div>
                          <div className={`px-xs py-xs rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(debt.status)}`}>
                            {getStatusIcon(debt.status)}
                            {getStatusText(debt.status)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-xs">
                          <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <User className="icon-xs mr-1" />
                            {debt.worker.contact || 'No contact'}
                          </div>
                          
                          {debt.reason && (
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {debt.reason}
                            </div>
                          )}
                        </div>
                        
                        {debt.dueDate && (
                          <div className="mt-xs text-xs" style={{ 
                            color: isOverdue(debt.dueDate) ? 'var(--accent-rust)' : 'var(--text-secondary)' 
                          }}>
                            Due: {new Date(debt.dueDate).toLocaleDateString()}
                            {isOverdue(debt.dueDate) && (
                              <span className="ml-1 font-semibold">(Overdue)</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right ml-xs">
                        <div className="text-xs font-semibold" style={{ 
                          color: debt.balance > 0 ? 'var(--accent-rust)' : 'var(--accent-green)' 
                        }}>
                          {formatCurrency(debt.balance)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {formatCurrency(debt.totalPaid)} paid
                        </div>
                      </div>
                    </div>

                    {debt.interestRate > 0 && (
                      <div className="mt-xs text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Interest: {debt.interestRate}% • Total: {formatCurrency(debt.amount)}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DebtSelect;