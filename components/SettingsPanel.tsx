"use client";

import { useState } from "react";
import Card from "./Card";
import Modal from "./Modal";
import { Settings } from "../types";

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
  onReset: () => void;
  onClearChat: () => void;
}

export default function SettingsPanel({ settings, onChange, onClose, onReset, onClearChat }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  const handleChange = (key: keyof Settings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <>
      {/* Small pill-style card in the column */}
      <Card title="Settings">
        <p className="text-xs text-slate-300 mb-3">
          Control how the assistant behaves and what it can use.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          Open settings
        </button>
      </Card>

      {/* Full CRM-style modal */}
      <Modal open={open} title="Assistant Settings" onClose={() => setOpen(false)}>
        {/* Profile */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Profile & Context
          </h3>
          <div className="space-y-2">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Goals
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
            onClick={() => setOpen(false)}
            className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
