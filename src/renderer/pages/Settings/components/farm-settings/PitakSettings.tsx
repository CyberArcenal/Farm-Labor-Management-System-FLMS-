import React from 'react';
import type { FarmPitakSettings } from '../../../../apis/system_config';

interface PitakSettingsProps {
  settings: FarmPitakSettings;
  onChange: (field: keyof FarmPitakSettings, value: any) => void;
}

export const PitakSettings: React.FC<PitakSettingsProps> = ({ 
  settings, 
  onChange 
}) => {
  const updateField = (field: keyof FarmPitakSettings, value: any) => {
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
            Default Total Luwang Capacity
          </label>
          <input
            type="number"
            value={settings.default_total_luwang_capacity || 0}
            onChange={(e) => updateField('default_total_luwang_capacity', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Format
          </label>
          <input
            type="text"
            value={settings.location_format || ''}
            onChange={(e) => updateField('location_format', e.target.value)}
            placeholder="e.g., Section {letter}, Row {number}"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Capacity
          </label>
          <input
            type="number"
            value={settings.min_capacity || 0}
            onChange={(e) => updateField('min_capacity', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Capacity
          </label>
          <input
            type="number"
            value={settings.max_capacity || 0}
            onChange={(e) => updateField('max_capacity', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ID Prefix
          </label>
          <input
            type="text"
            value={settings.id_prefix || ''}
            onChange={(e) => updateField('id_prefix', e.target.value)}
            placeholder="e.g., PTK"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pitak Number Format
          </label>
          <input
            type="text"
            value={settings.pitak_number_format || ''}
            onChange={(e) => updateField('pitak_number_format', e.target.value)}
            placeholder="e.g., {bukid_code}-{number}"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status Options
        </label>
        <div className="flex flex-wrap gap-2">
          {['active', 'inactive', 'completed'].map((status) => (
            <label key={status} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={(settings.status_options || []).includes(status)}
                onChange={() => toggleStatusOption(status)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{status}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_generate_pitak_ids || false}
            onChange={(e) => updateField('auto_generate_pitak_ids', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto Generate Pitak IDs</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.require_location || false}
            onChange={(e) => updateField('require_location', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Require Location</span>
        </label>
      </div>
    </div>
  );
};