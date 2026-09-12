import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Minimal header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-14 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-brand-700"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
              TM
            </span>
            <span>{APP_NAME}</span>
          </Link>
          <span className="ml-3 hidden text-sm text-gray-400 sm:block">
            — {APP_TAGLINE}
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
