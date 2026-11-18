"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { TOTAL_FRAMES, getFramePath, progressToFrameIndex } from "@/lib/frames";

interface FrameCanvasProps {
  progress: number;
  onLoaded?: () => void;
  posterSrc?: string;
}

export function FrameCanvas({
  progress,
  onLoaded,
  posterSrc = "/lame_atelier_poster_16x9.jpg",
}: FrameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentPRef = useRef<number>(0);
  const targetPRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const lowConcurrencyRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number | null>(null);
  const lastAdvanceTimeRef = useRef<number>(0);

  const [loadedRatio, setLoadedRatio] = useState<number>(0);
  const [frame0Drawn, setFrame0Drawn] = useState<boolean>(false);

  // Poster transition states
  const [showPoster, setShowPoster] = useState<boolean>(false);
  const [isCrossfadingBack, setIsCrossfadingBack] = useState<boolean>(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDrawnFrameRef = useRef<number>(-1);

  // Stage transition settling state: translateY(-6% to 0) & opacity(0.6 to 1) over 900ms
  const currentStageRef = useRef<number>(1);
  const [canvasSettling, setCanvasSettling] = useState<boolean>(false);

  // Detect active stage based on progress
  useEffect(() => {
    let stage = 1;
    if (progress >= 0.75) stage = 4;
    else if (progress >= 0.5) stage = 3;
    else if (progress >= 0.25) stage = 2;

    if (stage !== currentStageRef.current) {
      currentStageRef.current = stage;
      setCanvasSettling(true);
      const timer = window.setTimeout(() => {
        setCanvasSettling(false);
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Update target progress when prop changes
  useEffect(() => {
    targetPRef.current = Math.max(0, Math.min(1, progress));
  }, [progress]);

  // Detect hardwareConcurrency for low-end device optimization
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency < 4) {
        lowConcurrencyRef.current = true;
      }
    }
  }, []);

  // Center & crop frame to 104% with object-fit: cover logic
  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const nw = img.naturalWidth || 1280;
    const nh = img.naturalHeight || 720;

    const cropFactor = 1.04;
    const canvasRatio = cw / ch;
    const imageRatio = nw / nh;

    let drawW: number;
    let drawH: number;

    if (canvasRatio > imageRatio) {
      drawW = cw * cropFactor;
      drawH = (cw / imageRatio) * cropFactor;
    } else {
      drawH = ch * cropFactor;
      drawW = (ch * imageRatio) * cropFactor;
    }

    const drawX = (cw - drawW) / 2;
    const drawY = (ch - drawH) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, []);

  // Canvas resize with DPR capping between [1, 2]
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      const rect = canvas.getBoundingClientRect();
      const newWidth = Math.round(rect.width * dpr);
      const newHeight = Math.round(rect.height * dpr);

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        const currentIdx = progressToFrameIndex(
          currentPRef.current,
          lowConcurrencyRef.current
        );
        const img = imagesRef.current[currentIdx];
        if (img && img.complete && img.naturalWidth > 0) {
          drawFrame(img);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  // Preload frames in background - starts on frame 0
  useEffect(() => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);
    imagesRef.current = images;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      img.onload = () => {
        loadedCount++;
        setLoadedRatio(loadedCount / TOTAL_FRAMES);

        if (i === 0 && !frame0Drawn) {
          drawFrame(img);
          setFrame0Drawn(true);
          lastDrawnFrameRef.current = 0;
          onLoaded?.();
        }

        if (loadedCount === TOTAL_FRAMES) {
          onLoaded?.();
        }
      };

      img.onerror = () => {
        loadedCount++;
        setLoadedRatio(loadedCount / TOTAL_FRAMES);
      };

      images[i] = img;
    }
  }, [drawFrame, frame0Drawn, onLoaded]);

  // Smooth lerp loop with dt normalization & 12fps cap
  useEffect(() => {
    let lastRenderedIndex = -1;

    const renderLoop = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const lerpFactor = 1 - Math.pow(1 - 0.06, dt * 60);

      const target = targetPRef.current;
      const current = currentPRef.current;
      const delta = target - current;

      if (Math.abs(delta) > 0.00001) {
        currentPRef.current = current + delta * lerpFactor;
      } else {
        currentPRef.current = target;
      }

      const effectiveP = currentPRef.current;
      const targetFrame = effectiveP * (TOTAL_FRAMES - 1);
      const currentFrame = currentPRef.current * (TOTAL_FRAMES - 1);

      let frameIdx: number;
      if (Math.abs(targetFrame - currentFrame) < 0.5) {
        frameIdx = progressToFrameIndex(target, lowConcurrencyRef.current);
      } else {
        frameIdx = progressToFrameIndex(effectiveP, lowConcurrencyRef.current);
      }

      // Check for reverse scrolling if poster is active or scheduled
      if (frameIdx < 383) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (showPoster) {
          setIsCrossfadingBack(true);
          setShowPoster(false);
          // 600ms fade back to frame 383 before full scrub resumes
          window.setTimeout(() => {
            setIsCrossfadingBack(false);
          }, 600);
        }
      }

      // Cap frame advance at 12 fps
      const minIntervalMs = 1000 / 12;
      const canAdvance = (timestamp - lastAdvanceTimeRef.current) >= minIntervalMs;

      // Only draw frames when poster is not fully replacing canvas
      if (!showPoster && frameIdx !== lastRenderedIndex) {
        if (canAdvance || Math.abs(targetFrame - currentFrame) < 0.5) {
          const img = imagesRef.current[frameIdx];
          if (img && img.complete && img.naturalWidth > 0) {
            drawFrame(img);
            lastRenderedIndex = frameIdx;
            lastDrawnFrameRef.current = frameIdx;
            lastAdvanceTimeRef.current = timestamp;

            // Trigger poster only from drawn frame reaching 383
            if (frameIdx === 383 && !showPoster && !holdTimerRef.current) {
              holdTimerRef.current = setTimeout(() => {
                setShowPoster(true);
                holdTimerRef.current = null;
              }, 400); // Hold on frame 383 for 400ms
            }
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, [drawFrame, showPoster]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#111111]">
      {/* 
        Canvas Container with Stage Settling Transition:
        Renders frame 0 immediately upon decode, with plain #111111 and hairline before that.
        No poster visible until frame 383 is drawn + 400ms hold.
      */}
      <div
        className="w-full h-full relative"
        style={{
          transform: canvasSettling ? "translateY(0%)" : "translateY(0%)",
          animation: canvasSettling
            ? "canvasSettle 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
            : undefined,
          zIndex: 1,
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Hand-forged Damascus chef's knife from Lame Atelier, shown from heat and hammering through quenching and grinding to the finished knife with a walnut handle."
          className={`w-full h-full block object-cover transition-opacity duration-300 ease-out ${
            frame0Drawn ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* 
        End-of-scroll Poster:
        - Never shown before frame 383 has been displayed.
        - Triggered from frame 383 drawn + 400ms hold.
        - Crossfades in over 1000ms with cubic-bezier(0.22, 1, 0.36, 1).
        - If user scrolls back up, fades out over 600ms back to frame 383.
        - Drawn with 104% cover crop so the knife never shifts position.
      */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          zIndex: 2,
          opacity: showPoster ? 1 : 0,
          transition: isCrossfadingBack
            ? "opacity 600ms ease-out"
            : "opacity 1000ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <img
          src={posterSrc}
          alt="Lame Atelier Finished Damascus Chef's Knife"
          className="w-full h-full object-cover"
          style={{ transform: "scale(1.04)", transformOrigin: "center center" }}
        />
      </div>

      {/* Loading progress hairline in walnut #6B4A2F while frames load */}
      {loadedRatio < 1 && (
        <div
          className="absolute bottom-0 left-0 h-[1px] bg-[#6B4A2F] transition-all duration-300 ease-out pointer-events-none"
          style={{
            width: `${Math.round(loadedRatio * 100)}%`,
            zIndex: 10,
            opacity: loadedRatio > 0.99 ? 0 : 0.7,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
