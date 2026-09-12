"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CoverFlowCarouselProps {
  items: {
    content: ReactNode;
  }[];
  className?: string;
}

export function CoverFlowCarousel({ items, className }: CoverFlowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const len = items.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % len);
  }, [len]);

  // Auto-play every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className={cn("relative flex h-[420px] w-full items-center justify-center overflow-hidden", className)}>
      <div 
        className="relative flex h-full w-full max-w-5xl items-center justify-center" 
        style={{ perspective: "1200px" }}
      >
        {items.map((item, index) => {
          // Calculate circular offset
          let offset = index - currentIndex;
          if (offset > Math.floor(len / 2)) {
            offset -= len;
          } else if (offset < -Math.floor(len / 2)) {
            offset += len;
          }
          
          const isActive = offset === 0;
          const direction = Math.sign(offset);
          const absOffset = Math.abs(offset);
          
          // Z-index: center is highest, edges are lowest
          const zIndex = 50 - absOffset;
          
          // Scale: center is 1, sides get smaller
          const scale = isActive ? 1 : Math.max(0.6, 1 - absOffset * 0.15);
          
          // Translate X: space them out
          const translateX = offset * 160;
          
          // Translate Y: curve downwards slightly for the outer cards
          const translateY = absOffset * 25;
          
          // Rotate Y: tilt inwards towards the center
          // left cards rotate positive (right), right cards rotate negative (left)
          const rotateY = isActive ? 0 : direction * -35; 
          
          // Opacity: center is fully opaque, sides are slightly faded
          const opacity = isActive ? 1 : 0.6;
          
          return (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "absolute cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
                isActive ? "shadow-2xl" : "shadow-lg hover:opacity-100"
              )}
              style={{
                zIndex,
                opacity,
                transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotateY(${rotateY}deg)`,
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
      
      {/* Pagination dots */}
      <div className="absolute bottom-2 flex gap-2">
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
