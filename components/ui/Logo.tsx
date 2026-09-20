import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  href?: string;
  lightText?: boolean;
}

export function Logo({ className, imageClassName, href = "/", lightText }: LogoProps) {
  const content = (
    <>
      <Image
        src="/icon.png"
        alt="TutorMeet Logo"
        width={32}
        height={32}
        className={cn("h-8 w-8", imageClassName)}
        priority
      />
      <span className={cn(
        "text-2xl font-bold tracking-tight transition-colors hidden sm:block",
        lightText ? "text-white" : "text-navy-900"
      )}
        style={{ letterSpacing: "-0.02em" }}
      >
        <span>Tutor<span className="text-blue-500">Meet</span></span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("flex items-center gap-2.5 flex-shrink-0 transition-opacity hover:opacity-90", className)}
        aria-label="TutorMeet home"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5 flex-shrink-0", className)}>
      {content}
    </div>
  );
}
