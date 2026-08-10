import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HelpDesk IQ Sample",
  description: "A customer support SaaS concept embedding MCP Studio SDK.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
