import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-200 text-neutral-400">
        <Search className="h-9 w-9" />
      </div>
      <h1 className="mb-2 text-4xl font-extrabold text-navy-900" style={{ letterSpacing: "-0.04em" }}>
        404
      </h1>
      <p className="mb-1.5 text-lg font-semibold text-navy-900">Page not found</p>
      <p className="mb-8 max-w-sm text-sm text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/">
          <Button variant="primary">Go to homepage</Button>
        </Link>
        <Link href="/tutors">
          <Button variant="ghost">Find a tutor</Button>
        </Link>
      </div>
    </div>
  );
}
