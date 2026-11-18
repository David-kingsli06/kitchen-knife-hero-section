"use client";

import React, { useMemo } from "react";
import { STAGES } from "@/lib/frames";

interface HeroOverlayProps {
  progress: number;
  reducedMotion?: boolean;
}

export function HeroOverlay({ progress, reducedMotion = false }: HeroOverlayProps) {
  // Determine current active stage (1 to 4)
  const activeStage = useMemo(() => {
    if (reducedMotion) return 4;
    if (progress < 0.25) return 1;
    if (progress < 0.5) return 2;
    if (progress < 0.75) return 3;
    return 4;
  }, [progress, reducedMotion]);

  // Stage Glow per stage:
  // Stage 1: walnut #6B4A2F @ 25%
  // Stage 2: charcoal iron #3A3D42 @ 25%
  // Stage 3: walnut #6B4A2F @ 20%
  // Stage 4: warm off-white #F4EDE1 @ 10%
  const glowStyles = useMemo(() => {
    switch (activeStage) {
      case 1:
        return "rgba(107, 74, 47, 0.25)";
      case 2:
        return "rgba(58, 61, 66, 0.25)";
      case 3:
        return "rgba(107, 74, 47, 0.20)";
      case 4:
      default:
        return "rgba(244, 237, 225, 0.10)";
    }
  }, [activeStage]);

  // Stage 4 Wordmark progress calculations (begins at p = 0.85)
  const wordmarkStyles = useMemo(() => {
    if (reducedMotion) {
      return {
        letterSpacing: "0.08em",
        opacity: 1,
      };
    }

    if (progress < 0.85) {
      return {
        letterSpacing: "0.4em",
        opacity: 0,
        pointerEvents: "none" as const,
      };
    }

    // Between 0.85 and 1.0; reveal intensifies
    const rawT = Math.max(0, Math.min(1, (progress - 0.85) / 0.14));
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedT = easeOutCubic(rawT);

    const letterSpacing = 0.4 - easedT * (0.4 - 0.08); // 0.4em -> 0.08em
    const opacity = easedT;

    return {
      letterSpacing: `${letterSpacing.toFixed(3)}em`,
      opacity,
    };
  }, [progress, reducedMotion]);

  // Pulse scroll cue visible only when p <= 0.02
  const showScrollCue = !reducedMotion && progress <= 0.02;

  // Compute stage phase: entrance (first 25%), middle hold (60%), exit (last 15%)
  // Normalized within the stage: localProgress in [0, 1]
  const getStageAnimationState = (stageId: number) => {
    if (reducedMotion) {
      return {
        opacity: stageId === 4 ? 1 : 0,
        leftTransform: "translateX(0px)",
        rightTransform: "translateX(0px)",
        blur: "blur(0px)",
        sublineOpacity: 1,
      };
    }

    const startP = (stageId - 1) * 0.25;
    const endP = stageId * 0.25;

    // Not active stage
    if (progress < startP || progress > endP) {
      return {
        opacity: 0,
        leftTransform: "translateX(-40px)",
        rightTransform: "translateX(40px)",
        blur: "blur(8px)",
        sublineOpacity: 0,
      };
    }

    const localP = (progress - startP) / 0.25; // 0 to 1

    if (localP <= 0.25) {
      // Entrance phase: 0 to 0.25 (first 25%)
      const t = localP / 0.25;
      const easeT = 1 - Math.pow(1 - t, 3); // cubic-bezier(0.22, 1, 0.36, 1) approx

      const offset = (1 - easeT) * 40;
      const blurAmount = (1 - easeT) * 8;
      const opacity = easeT;

      // Subline starts after headline: starts at t >= 0.3
      const subT = Math.max(0, Math.min(1, (t - 0.3) / 0.7));
      const sublineOpacity = 1 - Math.pow(1 - subT, 3);

      return {
        opacity,
        leftTransform: `translateX(-${offset.toFixed(1)}px)`,
        rightTransform: `translateX(${offset.toFixed(1)}px)`,
        blur: `blur(${blurAmount.toFixed(1)}px)`,
        sublineOpacity,
      };
    } else if (localP <= 0.85) {
      // Middle hold phase (middle 60% of the stage scroll range)
      return {
        opacity: 1,
        leftTransform: "translateX(0px)",
        rightTransform: "translateX(0px)",
        blur: "blur(0px)",
        sublineOpacity: 1,
      };
    } else {
      // Exit phase in the last 15% (0.85 to 1.0)
      const t = (localP - 0.85) / 0.15;
      const easeT = Math.pow(t, 2); // accelerate out

      const offset = easeT * 40;
      const blurAmount = easeT * 8;
      const opacity = 1 - easeT;
      const sublineOpacity = 1 - easeT;

      return {
        opacity,
        leftTransform: `translateX(-${offset.toFixed(1)}px)`,
        rightTransform: `translateX(${offset.toFixed(1)}px)`,
        blur: `blur(${blurAmount.toFixed(1)}px)`,
        sublineOpacity,
      };
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 md:p-12 lg:p-16 select-none overflow-hidden">
      {/* 
        Soft Radial Stage Glow:
        Behind the text column, changes color per stage with a 900ms cross-fade.
        Never touches the knife directly; frame background remains #111111.
      */}
      <div
        className="absolute top-1/2 left-[10vw] -translate-y-1/2 w-[40vw] h-[40vw] rounded-full blur-[100px] pointer-events-none transition-all duration-900 ease-out"
        style={{
          background: `radial-gradient(circle, ${glowStyles} 0%, transparent 70%)`,
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Background legibility gradient for text zone */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#111111]/80 via-[#111111]/30 to-transparent pointer-events-none"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      />

      {/* Top bar: Stage counter top right */}
      <header className="relative w-full flex justify-between items-start z-20">
        <div />
        {/* Stage counter: fixed "/ 04", cross-fades current number */}
        <div
          className="font-sans text-[14px] tracking-[0.2em] text-[#F4EDE1]/70 font-light"
          aria-live="polite"
        >
          <span className="inline-block transition-opacity duration-400 ease-out">
            {STAGES[activeStage - 1].stageNumber}
          </span>
          <span className="text-[#3A3D42] mx-1">/</span>
          <span>04</span>
        </div>
      </header>

      {/* Main Content Area */}
      {/* Desktop: left 6vw, width 34vw, vertically centered */}
      {/* Mobile: top 35% of the viewport */}
      <main className="relative z-20 w-full max-w-full lg:w-[34vw] lg:ml-[6vw] my-auto">
        {STAGES.map((stage) => {
          const isActive = stage.id === activeStage;
          if (reducedMotion && stage.id !== 4) return null;

          const anim = getStageAnimationState(stage.id);

          return (
            <div
              key={stage.id}
              className={`flex flex-col ${
                isActive
                  ? "relative"
                  : "pointer-events-none absolute inset-0 opacity-0"
              }`}
              style={{
                opacity: stage.id === 4 ? undefined : anim.opacity,
              }}
            >
              {/* Stage 1: Headline split into two parts (Forged / in fire.) */}
              {stage.id === 1 && (
                <>
                  <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[72px] leading-[1.1] text-[#F4EDE1] tracking-tight text-shadow-subtle flex flex-wrap gap-x-3">
                    <span
                      className="inline-block transition-transform duration-900"
                      style={{
                        transform: anim.leftTransform,
                        filter: anim.blur,
                      }}
                    >
                      Forged
                    </span>
                    <span
                      className="inline-block transition-transform duration-900"
                      style={{
                        transform: anim.rightTransform,
                        filter: anim.blur,
                      }}
                    >
                      in fire.
                    </span>
                  </h1>
                  <p
                    className="mt-4 font-sans text-[16px] sm:text-[18px] leading-[1.5] text-[#F4EDE1]/90 text-shadow-subtle transition-opacity duration-700 ease-out"
                    style={{ opacity: anim.sublineOpacity }}
                  >
                    {stage.subline}
                  </p>
                  {/* Scroll Cue Line: 40px line, pulsing between 0.3 and 0.8 opacity */}
                  {showScrollCue && (
                    <div className="mt-8 flex items-center gap-3">
                      <div className="w-[40px] h-[1px] bg-[#6B4A2F] animate-pulse opacity-60" />
                      <span className="text-[12px] tracking-[0.25em] uppercase text-[#3A3D42] font-sans">
                        Scroll
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Stage 2: Single headline with fade & slide */}
              {stage.id === 2 && (
                <>
                  <h2
                    className="font-serif text-[42px] sm:text-[56px] lg:text-[72px] leading-[1.1] text-[#F4EDE1] tracking-tight text-shadow-subtle transition-all duration-900"
                    style={{
                      transform: anim.leftTransform,
                      filter: anim.blur,
                    }}
                  >
                    {stage.headline}
                  </h2>
                  <p
                    className="mt-4 font-sans text-[16px] sm:text-[18px] leading-[1.5] text-[#F4EDE1]/90 text-shadow-subtle transition-opacity duration-700 ease-out"
                    style={{ opacity: anim.sublineOpacity }}
                  >
                    {stage.subline}
                  </p>
                </>
              )}

              {/* Stage 3: Headline split into two parts (Honed / to a fine edge.) */}
              {stage.id === 3 && (
                <>
                  <h2 className="font-serif text-[42px] sm:text-[56px] lg:text-[72px] leading-[1.1] text-[#F4EDE1] tracking-tight text-shadow-subtle flex flex-wrap gap-x-3">
                    <span
                      className="inline-block transition-transform duration-900"
                      style={{
                        transform: anim.leftTransform,
                        filter: anim.blur,
                      }}
                    >
                      Honed
                    </span>
                    <span
                      className="inline-block transition-transform duration-900"
                      style={{
                        transform: anim.rightTransform,
                        filter: anim.blur,
                      }}
                    >
                      to a fine edge.
                    </span>
                  </h2>
                  <p
                    className="mt-4 font-sans text-[16px] sm:text-[18px] leading-[1.5] text-[#F4EDE1]/90 text-shadow-subtle transition-opacity duration-700 ease-out"
                    style={{ opacity: anim.sublineOpacity }}
                  >
                    {stage.subline}
                  </p>
                </>
              )}

              {/* Stage 4: Wordmark reveal begins at p = 0.85 */}
              {stage.id === 4 && (
                <>
                  <p
                    className="font-serif text-[60px] sm:text-[76px] lg:text-[96px] leading-[1.05] text-[#F4EDE1] font-normal transition-all duration-1000 ease-out text-shadow-subtle"
                    style={{
                      letterSpacing: wordmarkStyles.letterSpacing,
                      opacity: wordmarkStyles.opacity,
                    }}
                  >
                    Lame Atelier
                  </p>
                  <p
                    className="mt-4 font-sans text-[16px] sm:text-[18px] leading-[1.5] text-[#F4EDE1]/90 text-shadow-subtle transition-opacity duration-700 ease-out"
                    style={{
                      opacity: wordmarkStyles.opacity,
                    }}
                  >
                    {stage.subline}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </main>

      {/* Bottom spacer for balance */}
      <footer className="relative z-20 w-full flex justify-between items-end">
        <div className="text-[11px] font-sans tracking-[0.2em] text-[#3A3D42] uppercase">
          Hand-Forged Damascus • Walnut Handle
        </div>
        <div className="w-12 h-[1px] bg-[#6B4A2F]/40" />
      </footer>
    </div>
  );
}
