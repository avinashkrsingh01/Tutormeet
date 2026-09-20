import Link from "next/link";
import Image from "next/image";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Beautiful branding / image (Hidden on mobile) */}
      <div className="hidden w-1/2 flex-col justify-between border-r border-neutral-100 bg-brand-50/50 p-12 lg:flex relative overflow-hidden bg-dot-pattern">
        
        {/* Soft radial glow in background */}
        <div className="absolute -left-[20%] -top-[20%] h-[70%] w-[70%] rounded-full bg-accent-500/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[20%] h-[70%] w-[70%] rounded-full bg-brand-500/10 blur-[120px]" />

        <div className="relative z-10">
          <Logo className="transition-transform hover:scale-105" />
          <h1 className="mt-16 text-4xl font-bold leading-tight tracking-tight text-navy-900">
            Find the perfect home tutor for your child.
          </h1>
          <p className="mt-4 max-w-md text-lg text-neutral-600">
            {APP_TAGLINE} Join thousands of parents and verified tutors building a better learning experience.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-navy-900">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-neutral-200">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=eef2f9`} alt="User" />
              </div>
            ))}
          </div>
          <p>Over <span className="font-bold text-accent-600">5,000+</span> verified tutors</p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 xl:px-12 relative animate-fade-in">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="absolute top-6 left-6 lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <FloatingWhatsApp />
    </div>
  );
}
