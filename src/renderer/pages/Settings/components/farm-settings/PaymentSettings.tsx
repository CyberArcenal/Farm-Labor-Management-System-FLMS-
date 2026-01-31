import React from 'react';
import type { FarmPaymentSettings } from '../../../../apis/system_config';

interface PaymentSettingsProps {
  settings: FarmPaymentSettings;
  onChange: (field: keyof FarmPaymentSettings, value: any) => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ 
  settings, 
  onChange 
}) => {
  const updateField = (field: keyof FarmPaymentSettings, value: any) => {
    onChange(field, value);
  };

  const togglePaymentMethod = (method: string) => {
    const currentMethods = settings.payment_methods || [];
    const updated = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    updateField('payment_methods', updated);
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
            Default Wage Multiplier
          </label>
          <input
            type="number"
            step="0.01"
            value={settings.default_wage_multiplier || 1.0}
            onChange={(e) => updateField('default_wage_multiplier', parseFloat(e.target.value) || 1.0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deduction Rules
          </label>
          <select
            value={settings.deduction_rules || 'manual'}
            onChange={(e) => updateField('deduction_rules', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="manual">Manual Deduction</option>
            <option value="auto_debt_deduction">Auto Debt Deduction</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Terms (Days)
          </label>
          <input
            type="number"
            value={settings.payment_terms_days || 0}
            onChange={(e) => updateField('payment_terms_days', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Percentage (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={settings.tax_percentage || 0}
            onChange={(e) => updateField('tax_percentage', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Other Deductions Config (JSON)
        </label>
        <textarea
          value={settings.other_deductions_config || ''}
          onChange={(e) => updateField('other_deductions_config', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
          placeholder='{"insurance": 0.5, "equipment": 1.0}'
        />
        <p className="text-xs text-gray-500 mt-1">JSON format for breakdown of other deductions</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Methods
        </label>
        <div className="flex flex-wrap gap-2">
          {['cash', 'gcash', 'bank', 'check'].map((method) => (
            <label key={method} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={(settings.payment_methods || []).includes(method)}
                onChange={() => togglePaymentMethod(method)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{method}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status Options
        </label>
        <div className="flex flex-wrap gap-2">
          {['pending', 'processing', 'completed', 'cancelled', 'partially_paid'].map((status) => (
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
            checked={settings.require_reference_number || false}
            onChange={(e) => updateField('require_reference_number', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Require Reference Number</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_calculate_total || false}
            onChange={(e) => updateField('auto_calculate_total', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto Calculate Total</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.require_payment_date || false}
            onChange={(e) => updateField('require_payment_date', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Require Payment Date</span>
        </label>
      </div>
    </div>
  );
};