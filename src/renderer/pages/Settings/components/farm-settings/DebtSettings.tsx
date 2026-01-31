import React from 'react';
import type { FarmDebtSettings } from '../../../../apis/system_config';

interface DebtSettingsProps {
  settings: FarmDebtSettings;
  onChange: (field: keyof FarmDebtSettings, value: any) => void;
}

export const DebtSettings: React.FC<DebtSettingsProps> = ({ 
  settings, 
  onChange 
}) => {
  const updateField = (field: keyof FarmDebtSettings, value: any) => {
    onChange(field, value);
  };

  const toggleStatusOption = (status: string) => {
    const currentOptions = settings.status_options || [];
    const updated = currentOptions.includes(status)
      ? currentOptions.filter(s => s !== status)
      : [...currentOptions, status];
    updateField('status_options', updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={settings.default_interest_rate || 0}
            onChange={(e) => updateField('default_interest_rate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Term (Days)
          </label>
          <input
            type="number"
            value={settings.payment_term_days || 0}
            onChange={(e) => updateField('payment_term_days', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grace Period (Days)
          </label>
          <input
            type="number"
            value={settings.grace_period_days || 0}
            onChange={(e) => updateField('grace_period_days', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Debt Amount
          </label>
          <input
            type="number"
            value={settings.max_debt_amount || 0}
            onChange={(e) => updateField('max_debt_amount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interest Calculation Method
          </label>
          <select
            value={settings.interest_calculation_method || 'simple'}
            onChange={(e) => updateField('interest_calculation_method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="simple">Simple Interest</option>
            <option value="compound">Compound Interest</option>
          </select>
        </div>

        {settings.interest_calculation_method === 'compound' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compound Frequency
            </label>
            <select
              value={settings.compound_frequency || 'monthly'}
              onChange={(e) => updateField('compound_frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status Options
        </label>
        <div className="flex flex-wrap gap-2">
          {['pending', 'partially_paid', 'paid', 'cancelled', 'overdue'].map((status) => (
            <label key={status} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={(settings.status_options || []).includes(status)}
                onChange={() => toggleStatusOption(status)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{status.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.carry_over_to_next_session || false}
            onChange={(e) => updateField('carry_over_to_next_session', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Carry Over to Next Session</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.require_debt_reason || false}
            onChange={(e) => updateField('require_debt_reason', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Require Debt Reason</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_apply_interest || false}
            onChange={(e) => updateField('auto_apply_interest', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto Apply Interest</span>
        </label>
      </div>
    </div>
  );
};