import Image from "next/image";
import { getInitials, cn } from "@/lib/utils";

export type AvatarSize = "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  ring?: boolean;
  verified?: boolean;
}

const sizeConfig: Record<
  AvatarSize,
  { container: string; text: string; px: number; badge: string }
> = {
  "2xs": { container: "h-5 w-5",  text: "text-2xs",  px: 20,  badge: "" },
  xs:    { container: "h-7 w-7",  text: "text-xs",   px: 28,  badge: "" },
  sm:    { container: "h-8 w-8",  text: "text-xs",   px: 32,  badge: "h-2.5 w-2.5 bottom-0 right-0" },
  md:    { container: "h-10 w-10", text: "text-sm",  px: 40,  badge: "h-3 w-3 bottom-0 right-0" },
  lg:    { container: "h-14 w-14", text: "text-base", px: 56, badge: "h-4 w-4 bottom-0 right-0" },
  xl:    { container: "h-18 w-18", text: "text-lg",  px: 72,  badge: "h-5 w-5 bottom-0.5 right-0.5" },
  "2xl": { container: "h-24 w-24", text: "text-2xl", px: 96, badge: "h-6 w-6 bottom-1 right-1" },
};

// Navy-tinted background palette based on initials (deterministic)
const avatarColors = [
  "bg-brand-100 text-brand-800",
  "bg-accent-100 text-accent-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
];

function getColorFromName(name: string): string {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  ring = false,
  verified = false,
}: AvatarProps) {
  const config = sizeConfig[size];
  const initials = getInitials(name);
  const colorClass = getColorFromName(name);

  return (
    <div className={cn("relative inline-flex flex-shrink-0", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-full flex-shrink-0",
          config.container,
          ring && "ring-2 ring-white ring-offset-1",
          !src && colorClass
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={name}
            width={config.px}
            height={config.px}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className={cn(
              "flex h-full w-full items-center justify-center font-semibold",
              config.text
            )}
            aria-label={name}
          >
            {initials}
          </span>
        )}
      </div>

      {verified && config.badge && (
        <span
          className={cn(
            "absolute rounded-full bg-accent-500 text-white flex items-center justify-center shadow-sm ring-1 ring-white",
            config.badge
          )}
          title="Verified"
        >
          <svg viewBox="0 0 10 10" fill="currentColor" className="h-full w-full p-0.5">
            <path
              fillRule="evenodd"
              d="M8.707 2.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L4 5.586l3.293-3.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </div>
  );
}

// ─── Avatar group ──────────────────────────────────────────────────────────────

interface AvatarGroupProps {
  items: { name: string; src?: string | null }[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  items,
  max = 4,
  size = "sm",
  className,
}: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const overflow = items.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((item, i) => (
        <div key={i} className="-ml-2 first:ml-0">
          <Avatar
            name={item.name}
            src={item.src}
            size={size}
            ring
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            "-ml-2 flex flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 ring-2 ring-white text-xs font-semibold text-neutral-600",
            sizeConfig[size].container
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
