"use client";

import { useState } from "react";
import Card from "./Card";
import Modal from "./Modal";
import { Settings, UserProfile, MemoryItem } from "../types";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
  onReset: () => void;

  onClearChat: () => void;
  // Memory Props
  userProfile: UserProfile;
  memories: MemoryItem[];
  onUpdateProfile: (profile: UserProfile) => void;
  onDeleteMemory: (id: string) => void;
}

export default function SettingsPanel({
  settings,
  onChange,
  onClose,
  onReset,
  onClearChat,
  userProfile,
  memories,
  onUpdateProfile,
  onDeleteMemory
}: SettingsPanelProps) {
  // The parent controls visibility via rendering this component. 
  // We can assume if this component is rendered, the modal should be open.
  // However, the previous implementation had local state 'open'.
  // To support "direct access", we should rely on the parent's state (isSettingsOpen).
  // But App.tsx renders this component conditionally: {isSettingsOpen && <SettingsPanel ... />}
  // So we can just render the Modal with open={true}.

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const handleChange = (key: keyof Settings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const handleAddIntegration = (type: 'custom' | 'zoho' | 'outlook' | 'teams') => {
    let newIntegration: any = {
      id: crypto.randomUUID(),
      type,
      enabled: true,
    };

    switch (type) {
      case 'zoho':
        newIntegration.name = 'Zoho CRM';
        newIntegration.icon = '🏢';
        newIntegration.description = 'Manage leads and contacts.';
        break;
      case 'outlook':
        newIntegration.name = 'Outlook';
        newIntegration.icon = '📧';
        newIntegration.description = 'Sync emails and calendar.';
        break;
      case 'teams':
        newIntegration.name = 'Microsoft Teams';
        newIntegration.icon = '👥';
        newIntegration.description = 'Chat and meetings.';
        break;
      case 'custom':
      default:
        newIntegration.name = 'New Link';
        newIntegration.icon = '🔗';
        newIntegration.url = 'https://';
        break;
    }

    onChange({ ...settings, integrations: [...settings.integrations, newIntegration] });
    setIsAddMenuOpen(false);
  };



  return (
    <Modal open={true} title="Assistant Settings" onClose={onClose}>
      {/* Profile & Memory */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Profile & Memory
        </h3>
        <div className="space-y-3">
          {/* Bio */}
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Bio / Role
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-violet-500"
              value={userProfile.bio}
              onChange={(e) => onUpdateProfile({ ...userProfile, bio: e.target.value })}
            />
          </label>

          {/* Memories List */}
          <div className="bg-slate-900 rounded border border-slate-800 p-2 max-h-32 overflow-y-auto">
            <div className="text-[10px] text-slate-500 mb-2 uppercase font-semibold">Long-term Memories ({memories.length})</div>
            {memories.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No memories yet. Tell me something important!</p>
            ) : (
              <ul className="space-y-1">
                {memories.map(m => (
                  <li key={m.id} className="text-xs text-slate-300 flex justify-between items-start group">
                    <span>• {m.content}</span>
                    <button onClick={() => onDeleteMemory(m.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Context Settings */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Context Settings
        </h3>
        <div className="space-y-2">
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Current Goals
            <textarea
              rows={2}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-violet-500"
              placeholder="e.g. 'Help me with business planning...'"
              value={settings.goals}
              onChange={(e) => handleChange('goals', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            AI Behavior
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-violet-500"
              placeholder="e.g. 'Concise, professional'"
              value={settings.aiBehavior}
              onChange={(e) => handleChange('aiBehavior', e.target.value)}
            />
          </label>
        </div>
      </section>

      {/* Behaviour */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Automation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={settings.autoCreateMeetings}
              onChange={(e) => handleChange('autoCreateMeetings', e.target.checked)}
            />
            Auto-create meetings
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={settings.requireConfirmBeforeEmail}
              onChange={(e) => handleChange('requireConfirmBeforeEmail', e.target.checked)}
            />
            Confirm before email
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={settings.voiceInputEnabled}
              onChange={(e) => handleChange('voiceInputEnabled', e.target.checked)}
            />
            Voice Input Enabled
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={settings.voiceOutputEnabled}
              onChange={(e) => handleChange('voiceOutputEnabled', e.target.checked)}
            />
            Voice Output Enabled
          </label>
        </div>
      </section>

      {/* Integrations */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Integrations & Links
            </h3>
            <p className="text-[10px] text-slate-500">
              Manage connections and custom shortcuts.
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              + Add Link
            </button>

            {isAddMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => handleAddIntegration('custom')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded flex items-center gap-2"
                  >
                    <span>🔗</span> Custom Link
                  </button>
                  <button
                    onClick={() => handleAddIntegration('zoho')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded flex items-center gap-2"
                  >
                    <span>🏢</span> Zoho CRM
                  </button>
                  <button
                    onClick={() => handleAddIntegration('outlook')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded flex items-center gap-2"
                  >
                    <span>📧</span> Outlook
                  </button>
                  <button
                    onClick={() => handleAddIntegration('teams')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded flex items-center gap-2"
                  >
                    <span>👥</span> Microsoft Teams
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {settings.integrations.map((integration, index) => (
            <div key={integration.id} className="bg-slate-900 rounded border border-slate-800 p-3">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{integration.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {integration.type === 'custom' ? (
                        <input
                          value={integration.name}
                          onChange={(e) => {
                            const updated = [...settings.integrations];
                            updated[index] = { ...integration, name: e.target.value };
                            onChange({ ...settings, integrations: updated });
                          }}
                          className="bg-transparent border-b border-slate-700 focus:border-violet-500 outline-none w-32"
                        />
                      ) : (
                        integration.name
                      )}
                    </div>
                    {integration.description && <div className="text-[10px] text-slate-500">{integration.description}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={integration.enabled}
                      onChange={(e) => {
                        const updated = [...settings.integrations];
                        updated[index] = { ...integration, enabled: e.target.checked };
                        onChange({ ...settings, integrations: updated });
                      }}
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                  </label>
                  {integration.type === 'custom' && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this link?')) {
                          const updated = settings.integrations.filter(i => i.id !== integration.id);
                          onChange({ ...settings, integrations: updated });
                        }
                      }}
                      className="text-slate-600 hover:text-red-400 ml-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Config Fields (Only show if enabled) */}
              {integration.enabled && (
                <div className="mt-3 pl-8 space-y-2 border-l-2 border-slate-800">
                  {integration.type === 'custom' ? (
                    <label className="block text-xs">
                      <span className="text-slate-400">URL</span>
                      <input
                        value={integration.url || ''}
                        onChange={(e) => {
                          const updated = [...settings.integrations];
                          updated[index] = { ...integration, url: e.target.value };
                          onChange({ ...settings, integrations: updated });
                        }}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-violet-500 outline-none"
                        placeholder="https://example.com"
                      />
                    </label>
                  ) : (
                    <>
                      <label className="block text-xs">
                        <span className="text-slate-400">API Key / Token</span>
                        <input
                          type="password"
                          value={integration.apiKey || ''}
                          onChange={(e) => {
                            const updated = [...settings.integrations];
                            updated[index] = { ...integration, apiKey: e.target.value };
                            onChange({ ...settings, integrations: updated });
                          }}
                          className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-violet-500 outline-none"
                          placeholder={`Enter ${integration.name} API Key`}
                        />
                      </label>
                      {['slack', 'linear'].includes(integration.type) && (
                        <label className="block text-xs">
                          <span className="text-slate-400">Webhook URL (Optional)</span>
                          <input
                            value={integration.webhookUrl || ''}
                            onChange={(e) => {
                              const updated = [...settings.integrations];
                              updated[index] = { ...integration, webhookUrl: e.target.value };
                              onChange({ ...settings, integrations: updated });
                            }}
                            className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-violet-500 outline-none"
                            placeholder="https://hooks.slack.com/..."
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="pt-4 border-t border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-red-400 mb-2">
          Danger Zone
        </h3>
        <div className="flex gap-3">
          <button onClick={onClearChat} className="text-xs text-slate-400 hover:text-slate-200 underline">Clear Chat History</button>
          <button onClick={onReset} className="text-xs text-red-500 hover:text-red-400 underline">Reset All Data</button>
        </div>
      </section>

      <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
