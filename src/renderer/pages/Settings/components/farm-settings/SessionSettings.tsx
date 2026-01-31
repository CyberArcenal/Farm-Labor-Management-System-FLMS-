import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import type { FarmSessionSettings } from '../../../../apis/system_config';
import sessionAPI, { type SessionListData } from '../../../../apis/session';

interface SessionSettingsProps {
  settings: FarmSessionSettings;
  onChange: (field: keyof FarmSessionSettings, value: any) => void;
}

export const SessionSettings: React.FC<SessionSettingsProps> = ({ 
  settings, 
  onChange 
}) => {
  const [sessions, setSessions] = useState<SessionListData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await sessionAPI.getAll({
        sortBy: 'startDate',
        sortOrder: 'DESC'
      });

      if (response.status && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const updateField = (field: keyof FarmSessionSettings, value: any) => {
    onChange(field, value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DEFAULT SESSION SELECTOR */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Session *
          </label>
          {loadingSessions ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                No sessions found. Please create a session first.
              </p>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate', { detail: '/sessions/new' }));
                }}
                className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
              >
                Create New Session
              </button>
            </div>
          ) : (
            <>
              <select
                value={settings.default_session_id || ''}
                onChange={(e) => updateField('default_session_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select a session...</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.year}) - {session.status}
                  </option>
                ))}
              </select>

              {settings.default_session_id && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Selected Session Details
                      </h4>
                      {(() => {
                        const selectedSession = sessions.find(s => s.id === settings.default_session_id);
                        if (!selectedSession) return null;

                        return (
                          <div className="mt-1 space-y-1 text-sm text-blue-800">
                            <p><strong>Name:</strong> {selectedSession.name}</p>
                            <p><strong>Year:</strong> {selectedSession.year}</p>
                            <p><strong>Season:</strong> {selectedSession.seasonType || 'Not specified'}</p>
                            <p><strong>Status:</strong> {selectedSession.status}</p>
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={loadSessions}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Required - all farm data will be tied to this session
          </p>
        </div>

        {/* SESSION CREATION QUICK FORM */}
        <div className="md:col-span-2">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-3">Quick Create Session</h4>
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: '/sessions/create' }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Session
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Create a new session if you don't see the one you need
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Season Type
          </label>
          <select
            value={settings.season_type || 'tag-ulan'}
            onChange={(e) => updateField('season_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="tag-ulan">Tag-ulan</option>
            <option value="tag-araw">Tag-araw</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={settings.status || 'active'}
            onChange={(e) => updateField('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={settings.start_date || ''}
            onChange={(e) => updateField('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={settings.end_date || ''}
            onChange={(e) => updateField('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={settings.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          placeholder="Optional metadata about the session"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.require_default_session || true}
            onChange={(e) => updateField('require_default_session', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Require Default Session</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.auto_close_previous || false}
            onChange={(e) => updateField('auto_close_previous', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Auto Close Previous Session</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.allow_multiple_active_sessions || false}
            onChange={(e) => updateField('allow_multiple_active_sessions', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Allow Multiple Active Sessions</span>
        </label>
      </div>
    </div>
  );
};