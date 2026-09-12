import Link from "next/link";
import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Access Denied" };

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <ShieldX className="h-8 w-8" />
      </div>
      <h1 className="mb-2 text-xl font-bold text-navy-900">Access Denied</h1>
      <p className="mb-6 max-w-sm text-sm text-neutral-500">
        Your admin role doesn&apos;t have permission to view this page.
        Contact a Super Admin to request access.
      </p>
      <Link href="/admin/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
