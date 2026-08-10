import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowledgeCloud LMS Sample",
  description: "A learning platform concept embedding MCP Studio SDK for course assistants.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
