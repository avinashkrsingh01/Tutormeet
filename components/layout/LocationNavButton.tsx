"use client";

import { useLocation } from "./LocationProvider";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationNavButtonProps {
  isOpaque: boolean;
}

export function LocationNavButton({ isOpaque }: LocationNavButtonProps) {
  const { location, openModal, isLoading } = useLocation();

  if (isLoading) {
    return (
      <div className="hidden h-10 w-32 animate-pulse rounded-md bg-neutral-200/50 sm:block" />
    );
  }

  return (
    <button
      onClick={openModal}
      className={cn(
        "hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors sm:flex hover:bg-neutral-100/10",
        isOpaque ? "hover:bg-neutral-100" : "hover:bg-white/10"
      )}
      aria-label="Update location"
    >
      <MapPin
        className={cn(
          "h-5 w-5",
          isOpaque ? "text-navy-900" : "text-white"
        )}
      />
      <div className="flex flex-col">
        <span
          className={cn(
            "text-[10px] leading-tight opacity-80",
            isOpaque ? "text-neutral-500" : "text-white/80"
          )}
        >
          {location ? "Your location" : "Select your"}
        </span>
        <span
          className={cn(
            "text-sm font-bold leading-tight",
            isOpaque ? "text-navy-900" : "text-white"
          )}
        >
          {location ? `${location.city} ${location.pincode}` : "Location"}
        </span>
      </div>
    </button>
  );
}
