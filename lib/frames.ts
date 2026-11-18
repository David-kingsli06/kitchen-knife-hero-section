export interface StageConfig {
  id: number;
  startP: number;
  endP: number;
  startFrame: number;
  endFrame: number;
  stageNumber: string;
  headline?: string;
  subline: string;
  isWordmark?: boolean;
}

export const TOTAL_FRAMES = 384;

export const STAGES: StageConfig[] = [
  {
    id: 1,
    startP: 0,
    endP: 0.25,
    startFrame: 0,
    endFrame: 95,
    stageNumber: "01",
    headline: "Forged in fire.",
    subline: "Every blade starts as raw steel.",
  },
  {
    id: 2,
    startP: 0.25,
    endP: 0.5,
    startFrame: 96,
    endFrame: 191,
    stageNumber: "02",
    headline: "Tempered in water.",
    subline: "Hardened by hand, cooled with care.",
  },
  {
    id: 3,
    startP: 0.5,
    endP: 0.75,
    startFrame: 192,
    endFrame: 287,
    stageNumber: "03",
    headline: "Honed to a fine edge.",
    subline: "Polished until the pattern speaks.",
  },
  {
    id: 4,
    startP: 0.75,
    endP: 1.0,
    startFrame: 288,
    endFrame: 383,
    stageNumber: "04",
    isWordmark: true,
    subline: "Made by hand. Ready for your kitchen.",
  },
];

/**
 * Maps scroll progress [0, 1] to frame index [0, TOTAL_FRAMES - 1].
 * For low-spec devices (lowConcurrency = true), rounds to nearest even index.
 */
export function progressToFrameIndex(p: number, lowConcurrency: boolean = false): number {
  const clampedP = Math.max(0, Math.min(1, p));
  let index = Math.round(clampedP * (TOTAL_FRAMES - 1));
  if (lowConcurrency) {
    index = Math.round(index / 2) * 2;
  }
  return Math.min(TOTAL_FRAMES - 1, Math.max(0, index));
}

/**
 * Returns zero-padded 3-digit frame filename (frame_000.webp through frame_383.webp)
 */
export function getFramePath(index: number): string {
  const padded = String(index).padStart(3, "0");
  return `/frames/frame_${padded}.webp`;
}
