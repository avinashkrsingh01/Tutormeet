"use client";

import React, { useRef, useState, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // Maximum tilt angle in degrees
  scale?: number; // Scale on hover
}

export function TiltCard({
  children,
  className,
  maxTilt = 15,
  scale = 1.05,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse position relative to card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation (-1 to 1)
    const normalizedX = (x / width) * 2 - 1;
    const normalizedY = (y / height) * 2 - 1;

    // Set rotation
    setRotateX(normalizedY * -maxTilt);
    setRotateY(normalizedX * maxTilt);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      className={cn("perspective-1000", className)}
      style={{ perspective: "1000px" }}
      {...props}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "h-full w-full transition-all ease-out",
          isHovered ? "duration-100" : "duration-500"
        )}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${
            isHovered ? scale : 1
          })`,
          transformStyle: "preserve-3d",
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
            : "none",
        }}
      >
        <div
          className="h-full w-full"
          style={{ transform: "translateZ(30px)" }} // Pop out the content slightly
        >
          {children}
        </div>
      </div>
    </div>
  );
}
