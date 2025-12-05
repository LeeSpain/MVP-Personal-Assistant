"use client";

import { useState } from "react";
import Card from "./Card";
import Modal from "./Modal";

export default function InsightsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Small pill-style card */}
      <Card title="Insights">
        <p className="text-xs text-slate-300 mb-3">
          Patterns and trends from your chats, diary and tasks.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
        >
          View insights
        </button>
      </Card>

      {/* Full-screen style CRM insights modal */}
      <Modal open={open} title="Assistant Insights" onClose={() => setOpen(false)}>
        {/* High level summary */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            High-Level Summary
          </h3>
          <p className="text-sm text-slate-200">
            This area will surface a professional summary of where your focus
            has been, what is progressing and what needs attention. For now it’s
            static, but you can wire it to your real data later.
          </p>
        </section>

        {/* Focus areas */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Focus Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-200">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[10px] uppercase text-slate-400 mb-1">
                Deep Work
              </div>
              <div className="text-sm font-semibold mb-1">
                Projects & Strategy
              </div>
              <p className="text-[11px] text-slate-300">
                Time spent thinking long-term, planning and designing systems.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[10px] uppercase text-slate-400 mb-1">
                Execution
              </div>
              <div className="text-sm font-semibold mb-1">
                Day-to-Day Actions
              </div>
              <p className="text-[11px] text-slate-300">
                Tasks, follow-ups and concrete deliverables mentioned in chat.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[10px] uppercase text-slate-400 mb-1">
                Relationships
              </div>
              <div className="text-sm font-semibold mb-1">
                People & Communication
              </div>
              <p className="text-[11px] text-slate-300">
                Clients, partners, team and personal relationships you discuss.
              </p>
            </div>
          </div>
        </section>

        {/* Actionable items */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Suggested Follow-Ups
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            <li>• Tasks you’ve mentioned but not scheduled yet</li>
            <li>• Conversations that might need a response</li>
            <li>• Ideas worth turning into concrete projects</li>
          </ul>
        </section>

        {/* Metrics placeholders */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Metrics (to connect with CRM later)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-200">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">This week</div>
              <div className="text-lg font-semibold">—</div>
              <div className="text-[11px] text-slate-400">
                Chat sessions logged
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">Open loops</div>
              <div className="text-lg font-semibold">—</div>
              <div className="text-[11px] text-slate-400">
                Items needing follow-up
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">Focus balance</div>
              <div className="text-lg font-semibold">—</div>
              <div className="text-[11px] text-slate-400">
                Deep work vs execution
              </div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
              <div className="text-[11px] text-slate-400">
                Relationship touches
              </div>
              <div className="text-lg font-semibold">—</div>
              <div className="text-[11px] text-slate-400">
                People you interacted with
              </div>
            </div>
          </div>
        </section>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
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
