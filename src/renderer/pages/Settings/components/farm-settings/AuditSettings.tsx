import React from 'react';
import type { FarmAuditSettings } from '../../../../apis/system_config';

interface AuditSettingsProps {
  settings: FarmAuditSettings;
  onChange: (field: keyof FarmAuditSettings, value: any) => void;
}

export const AuditSettings: React.FC<AuditSettingsProps> = ({ 
  settings, 
  onChange 
}) => {
  const updateField = (field: keyof FarmAuditSettings, value: any) => {
    onChange(field, value);
  };

  const toggleLogEvent = (event: string) => {
    const currentEvents = settings.log_events || [];
    const updated = currentEvents.includes(event)
      ? currentEvents.filter(e => e !== event)
      : [...currentEvents, event];
    updateField('log_events', updated);
  };

  const toggleCriticalEvent = (event: string) => {
    const currentEvents = settings.critical_events || [];
    const updated = currentEvents.includes(event)
      ? currentEvents.filter(e => e !== event)
      : [...currentEvents, event];
    updateField('critical_events', updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Audit Retention (Days)
          </label>
          <input
            type="number"
            value={settings.audit_retention_days || 365}
            onChange={(e) => updateField('audit_retention_days', parseInt(e.target.value) || 365)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Log Events
        </label>
        <div className="flex flex-wrap gap-2">
          {['create', 'update', 'delete', 'view', 'export'].map((event) => (
            <label key={event} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={(settings.log_events || []).includes(event)}
                onChange={() => toggleLogEvent(event)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700 capitalize">{event}</span>
            </label>
          ))}
        </div>
      </div>

      {settings.notify_on_critical_events && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Critical Events
          </label>
          <div className="flex flex-wrap gap-2">
            {['data_deletion', 'payment_override', 'debt_write_off', 'user_permission_change'].map((event) => (
              <label key={event} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={(settings.critical_events || []).includes(event)}
                  onChange={() => toggleCriticalEvent(event)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 capitalize">{event.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.log_actions_enabled !== false}
            onChange={(e) => updateField('log_actions_enabled', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Log Actions Enabled</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.track_entity_id !== false}
            onChange={(e) => updateField('track_entity_id', e.target.checked)}
            className="rounded border-gray-300"
            disabled
          />
          <span className="text-sm text-gray-700">Track Entity + Entity ID (Always On)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.capture_ip_address || false}
            onChange={(e) => updateField('capture_ip_address', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Capture IP Address</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.capture_user_agent || false}
            onChange={(e) => updateField('capture_user_agent', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Capture User Agent</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.tie_to_session !== false}
            onChange={(e) => updateField('tie_to_session', e.target.checked)}
            className="rounded border-gray-300"
            disabled
          />
          <span className="text-sm text-gray-700">Tie to Session (Always On for Audit Clarity)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enable_real_time_logging || false}
            onChange={(e) => updateField('enable_real_time_logging', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Enable Real-time Logging</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notify_on_critical_events || false}
            onChange={(e) => updateField('notify_on_critical_events', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Notify on Critical Events</span>
        </label>
      </div>
    </div>
  );
};