import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Martijn's Digital Self",
  description: "Personal Assistant Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 h-screen overflow-hidden selection:bg-indigo-100 selection:text-indigo-700`}>
        <div id="root" className="h-full">
          {children}
        </div>
      </body>
    </html>
  );
}