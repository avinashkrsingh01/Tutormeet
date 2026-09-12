import type { Metadata } from "next";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "" };

export default function Page() {
  return (
    <div>
      <DashboardHeader title="" description="Coming soon." />
      <Card><p className="text-sm text-neutral-400 py-8 text-center">This section is under construction.</p></Card>
    </div>
  );
}
