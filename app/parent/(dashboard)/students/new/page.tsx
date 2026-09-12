import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { DashboardHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Add Student" };

export default function AddStudentPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5">
        <Link
          href="/parent/profile"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to profile
        </Link>
      </div>

      <DashboardHeader
        title="Add Student"
        description="Students are automatically created when you post a tuition requirement."
      />

      <Card padding="lg">
        <Alert
          variant="info"
          title="Students are created automatically"
          message="When you post a tuition requirement, simply enter the student's name and class. TutorMeet will create a student record for you automatically."
        />

        <div className="mt-6 flex gap-3">
          <Link href="/parent/requirements/new">
            <Button variant="primary">Post a Requirement</Button>
          </Link>
          <Link href="/parent/profile">
            <Button variant="ghost">Go Back</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
