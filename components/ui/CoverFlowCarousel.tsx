"use client";

import React, { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CoverFlowCarouselProps {
  items: {
    content: ReactNode;
  }[];
  className?: string;
}

export function CoverFlowCarousel({ items, className }: CoverFlowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(items.length / 2));

  return (
    <div className={cn("relative flex h-[400px] w-full items-center justify-center overflow-hidden", className)}>
      <div 
        className="relative flex h-full w-full max-w-5xl items-center justify-center" 
        style={{ perspective: "1500px" }}
      >
        {items.map((item, index) => {
          const isActive = index === currentIndex;
          const offset = index - currentIndex;
          const direction = Math.sign(offset);
          const absOffset = Math.abs(offset);
          
          // Calculate z-index: middle is highest
          const zIndex = 50 - absOffset;
          
          // Calculate scale: middle is 1, others scale down
          const scale = isActive ? 1 : Math.max(0.6, 1 - absOffset * 0.15);
          
          // Calculate translateX: bring them closer together so they overlap
          // On mobile, reduce the offset so they don't go offscreen
          const translateX = `calc(${offset * 140}px)`; 
          
          // Calculate rotateY: left cards rotate right, right cards rotate left
          const rotateY = isActive ? 0 : direction * -45; 
          
          // Calculate opacity: hide cards that are too far away
          const opacity = absOffset > 2 ? 0 : isActive ? 1 : 0.7;
          
          return (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "absolute cursor-pointer transition-all duration-500 ease-out",
                isActive ? "shadow-2xl" : "shadow-lg hover:opacity-100"
              )}
              style={{
                zIndex,
                opacity,
                transform: `translateX(${translateX}) scale(${scale}) rotateY(${rotateY}deg)`,
                pointerEvents: absOffset > 2 ? "none" : "auto",
                // Set a fixed width/height for the cards
                width: "280px", 
                height: "300px",
                borderRadius: "2rem",
                transformStyle: "preserve-3d"
              }}
            >
              {item.content}
            </div>
          );
        })}
      </div>
      
      {/* Optional: pagination dots */}
      <div className="absolute bottom-4 flex gap-2">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              idx === currentIndex ? "w-6 bg-brand-600" : "w-2 bg-neutral-300 hover:bg-brand-400"
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
