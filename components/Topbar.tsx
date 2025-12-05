import React from "react";
import { Mode } from "../types";

interface TopbarProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  onOpenSettings: () => void;
  onOpenInsights: () => void;
  onOpenCommandPalette?: () => void;
}

const MODES: Mode[] = [
  "Deep Work",
  "Execution",
  "Relationship",
  "Recovery",
];

export const Topbar: React.FC<TopbarProps> = ({
  currentMode,
  onModeChange,
  onOpenSettings,
  onOpenInsights,
  onOpenCommandPalette,
}) => {
  return (
    <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between">

      {/* LEFT — BRAND AREA */}
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
          DIGITAL SELF
        </span>

        <h1 className="text-xl lg:text-2xl font-bold text-white -mt-1">
          Martijn&apos;s Personal OS
        </h1>

        <p className="text-xs text-slate-400 -mt-0.5">
          One place for your thinking, decisions, and execution.
        </p>
      </div>

      {/* CENTER — MODE SELECTOR */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-full px-1 py-1 shadow-inner">
          {MODES.map((mode) => {
            const active = mode === currentMode;
            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={[
                  "px-4 py-1.5 text-sm rounded-full transition-all",
                  active
                    ? "bg-cyan-500 text-slate-900 font-medium shadow"
                    : "text-slate-300 hover:bg-slate-800"
                ].join(" ")}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — ACTIONS */}
      <div className="flex items-center gap-3">

        {/* 🧠 COMMAND BUTTON */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:inline-flex items-center px-4 py-2 text-sm rounded-full bg-slate-800 text-slate-200 
                       border border-slate-700 hover:bg-slate-700 transition"
          >
            Command
          </button>
        )}

        {/* INSIGHTS */}
        <button
          onClick={onOpenInsights}
          className="hidden lg:inline-flex items-center px-4 py-2 text-sm rounded-full bg-slate-800 text-slate-200 
                     border border-slate-700 hover:bg-slate-700 transition"
        >
          Insights
        </button>

        {/* SETTINGS */}
        <button
          onClick={onOpenSettings}
          className="hidden lg:inline-flex items-center px-4 py-2 text-sm rounded-full bg-slate-800 text-slate-200 
                     border border-slate-700 hover:bg-slate-700 transition"
        >
          Settings
        </button>

        {/* AVATAR */}
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br 
                        from-cyan-500 to-sky-400 text-slate-900 font-bold shadow-md shadow-slate-900/20 
                        ring-2 ring-slate-900">
          M
        </div>
      </div>

    </div>
  );
};
