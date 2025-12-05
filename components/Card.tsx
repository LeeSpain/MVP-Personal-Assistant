"use client";

import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/30 h-full flex flex-col ${className}`}>
      {title && (
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 shrink-0">
          {title}
        </h2>
      )}
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </section>
  );
}
