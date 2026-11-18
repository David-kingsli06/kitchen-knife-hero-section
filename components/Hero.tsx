"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { FrameCanvas } from "./FrameCanvas";
import { HeroOverlay } from "./HeroOverlay";
import { useReducedMotion } from "@/lib/useReducedMotion";
import gsap from "gsap";

// Stage target progress positions:
// Stage 1: p = 0.12 (middle of stage 1, frames 0-95, settled on heat & hammer)
// Stage 2: p = 0.37 (middle of stage 2, frames 96-191, settled on quench)
// Stage 3: p = 0.62 (middle of stage 3, frames 192-287, settled on grind & polish)
// Stage 4: p = 1.0  (stage 4 reveal & poster end state)
const STAGE_PROGRESS = [0.12, 0.37, 0.62, 1.0];

export function Hero() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const currentStageRef = useRef<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0.12);
  const animProgressRef = useRef<{ value: number }>({ value: 0.12 });
  const isTransitioningRef = useRef<boolean>(false);
  const prefersReducedMotion = useReducedMotion();

  // Keep currentStageRef in sync
  useEffect(() => {
    currentStageRef.current = currentStageIndex;
  }, [currentStageIndex]);

  // Animate progress smoothly between stages using GSAP
  const goToStage = useCallback((targetIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(STAGE_PROGRESS.length - 1, targetIndex));
    if (clampedIndex === currentStageRef.current && !isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    currentStageRef.current = clampedIndex;
    setCurrentStageIndex(clampedIndex);

    const targetP = STAGE_PROGRESS[clampedIndex];

    gsap.killTweensOf(animProgressRef.current);
    gsap.to(animProgressRef.current, {
      value: targetP,
      duration: 1.2,
      ease: "power1.out",
      onUpdate: () => {
        setScrollProgress(animProgressRef.current.value);
      },
      onComplete: () => {
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 250);
      },
    });
  }, []);

  // Discrete wheel/trackpad scroll interception
  useEffect(() => {
    if (prefersReducedMotion) return;

    let accumulatedDelta = 0;
    let wheelResetTimer: NodeJS.Timeout | null = null;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (isTransitioningRef.current) {
        accumulatedDelta = 0;
        if (wheelResetTimer) {
          clearTimeout(wheelResetTimer);
          wheelResetTimer = null;
        }
        return;
      }

      accumulatedDelta += e.deltaY;

      if (wheelResetTimer) clearTimeout(wheelResetTimer);
      wheelResetTimer = setTimeout(() => {
        accumulatedDelta = 0;
      }, 250);

      const threshold = 30;
      if (accumulatedDelta > threshold) {
        accumulatedDelta = 0;
        const next = Math.min(STAGE_PROGRESS.length - 1, currentStageRef.current + 1);
        if (next !== currentStageRef.current) goToStage(next);
      } else if (accumulatedDelta < -threshold) {
        accumulatedDelta = 0;
        const prev = Math.max(0, currentStageRef.current - 1);
        if (prev !== currentStageRef.current) goToStage(prev);
      }
    };

    // Touch swipe support for mobile
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // prevent native scroll jitter
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioningRef.current) return;
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      const swipeThreshold = 50;
      if (diff > swipeThreshold) {
        const next = Math.min(STAGE_PROGRESS.length - 1, currentStageRef.current + 1);
        if (next !== currentStageRef.current) goToStage(next);
      } else if (diff < -swipeThreshold) {
        const prev = Math.max(0, currentStageRef.current - 1);
        if (prev !== currentStageRef.current) goToStage(prev);
      }
    };

    // Keyboard Arrow/Page controls support
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioningRef.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        const next = Math.min(STAGE_PROGRESS.length - 1, currentStageRef.current + 1);
        if (next !== currentStageRef.current) goToStage(next);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        const prev = Math.max(0, currentStageRef.current - 1);
        if (prev !== currentStageRef.current) goToStage(prev);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
      if (wheelResetTimer) clearTimeout(wheelResetTimer);
    };
  }, [goToStage, prefersReducedMotion]);

  // Reduced motion: static view showing the poster as the static background with stage 4 wordmark & subline
  if (prefersReducedMotion) {
    return (
      <section className="relative w-full h-screen overflow-hidden bg-[#111111]">
        <div className="absolute inset-0">
          <img
            src="/lame_atelier_poster_16x9.jpg"
            alt="Lame Atelier Damascus Chef Knife"
            className="w-full h-full object-cover"
            style={{ transform: "scale(1.04)", transformOrigin: "center center" }}
          />
        </div>
        <HeroOverlay progress={1} reducedMotion={true} />
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="fixed inset-0 w-full h-screen overflow-hidden bg-[#111111]"
      aria-label="Lame Atelier Hero Presentation"
    >
      {/* Frame Canvas with smooth animation */}
      <FrameCanvas progress={scrollProgress} />

      {/* Text, stage typography, and stage glow overlay */}
      <HeroOverlay progress={scrollProgress} />

      {/* Subtle discrete stage pagination indicator at bottom right */}
      <div className="absolute bottom-8 right-8 z-30 flex items-center gap-2 pointer-events-auto">
        {STAGE_PROGRESS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToStage(idx)}
            aria-label={`Go to stage ${idx + 1}`}
            className={`transition-all duration-500 ease-out rounded-full ${
              idx === currentStageIndex
                ? "w-6 h-1 bg-[#F4EDE1]"
                : "w-1.5 h-1.5 bg-[#3A3D42] hover:bg-[#6B4A2F]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
