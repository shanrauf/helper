import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helper Stats",
  description: "Ticket count dashboard",
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-background p-8">{children}</main>;
}
