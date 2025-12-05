// components/TodayPanel.tsx
"use client";

import Card from "./Card";

export default function TodayPanel() {
  return (
    <Card title="Today">
      <ul className="space-y-2 text-xs text-slate-200">
        <li>• Capture ideas and tasks in the chat.</li>
        <li>• Ask me to summarise your day or plan tomorrow.</li>
        <li>• Turn conversations into structured actions.</li>
      </ul>
    </Card>
  );
}
