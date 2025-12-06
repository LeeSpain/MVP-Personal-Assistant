"use client";

import App from "../App";
import { LanguageProvider } from "../contexts/LanguageContext";

export default function HomePage() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}