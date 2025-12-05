import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Personal AI Assistant",
  description: "MVP personal assistant dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}