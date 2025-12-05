"use client";

import { useState } from "react";
import Card from "./Card";
import Modal from "./Modal";

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);

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
              Display name
              <input
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                placeholder="How the assistant should call you"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Short bio / focus
              <textarea
                rows={2}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-violet-500"
                placeholder="e.g. 'Help me with business planning, health tracking and daily execution.'"
              />
            </label>
          </div>
        </section>

        {/* Behaviour */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Assistant Behaviour
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Be proactive with suggestions
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Ask clarifying questions before acting
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Turn long chats into summaries automatically
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Highlight follow-ups I might forget
            </label>
          </div>
        </section>

        {/* Memory / data sources */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Memory & Data Sources
          </h3>
          <div className="space-y-2 text-xs text-slate-300">
            <label className="flex items-center justify-between gap-2">
              <span>Store chat history as long-term memory</span>
              <input type="checkbox" className="h-3 w-3" />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Use diary entries when answering questions</span>
              <input type="checkbox" className="h-3 w-3" />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Use task/CRM data for insights</span>
              <input type="checkbox" className="h-3 w-3" />
            </label>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Notifications
          </h3>
          <div className="space-y-2 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Daily check-in summary
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Weekly review & planning email
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" />
              Alerts when something important is overdue
            </label>
          </div>
        </section>

        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Close
          </button>
          <button
            className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
          >
            Save (wire up later)
          </button>
        </div>
      </Modal>
    </>
  );
}
