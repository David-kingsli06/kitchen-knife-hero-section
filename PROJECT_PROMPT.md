# Project Creation Prompt

The following is the full prompt that was used to create the **Lame Atelier** hero section project, including all requirements, constraints, and design specifications.

---

## Initial Context
- **Project name:** Lame Atelier
- **Technology stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, GSAP.
- **Assets:** 384 frames (`/public/frames/frame_000.webp` … `frame_383.webp`) and a poster image (`/public/lame_atelier_poster_16x9.jpg`).
- **Design palette:** `#111111` (background), `#F4EDE1` (stage 4 wordmark), `#6B4A2F` (walnut), `#3A3D42` (charcoal iron).
- **Fonts:** Cormorant Garamond (display) and Inter (sans).

---

## Core Requirements
### Hero Behavior
1. **No poster on load.** The hero must start on **frame 0** with a plain `#111111` background and a walnut loading hairline until the first frame is decoded.
2. **Frame progression:** Frames 0‑383 play as before, with stage boundaries at progress values:
   - Stage 1: `p = 0.12`
   - Stage 2: `p = 0.37`
   - Stage 3: `p = 0.62`
   - Stage 4: `p = 1.0`
3. **Poster reveal:** When `p` reaches **0.98**, hold on frame 383. When `p` reaches **1**, cross‑fade from frame 383 to the poster over **1000 ms** using `cubic‑bezier(0.22, 1, 0.36, 1)`. The poster stays visible as the final state; no further frame playback.
4. **Reduced‑motion fallback:** If `prefers‑reduced‑motion` is set, display the poster immediately as a static background with stage 4 wordmark/subline on top, and hide the scroll cue.
5. **Scrolling model:** The hero is now **discrete** – a single scroll (or wheel tick, touch swipe, arrow/Page key) moves **exactly one stage** forward or backward. The transition is animated with GSAP (`duration ≈ 1.2 s`, `ease: power1.out`).
6. **Pin length:** 800 vh on desktop, 600 vh on mobile (< 768 px). Each stage occupies a quarter of the scroll.
7. **Frame smoothing:** `lerp = 1 - Math.pow(1‑0.06, dt * 60)`; capped at **12 fps**; snap when the delta is < 0.5 frames.

---

## Stage Transitions
- When a stage starts, the canvas layer **translates Y from –6 % to 0** and **opacity fades from 0.6 to 1** over **900 ms** with `cubic‑bezier(0.22, 1, 0.36, 1)`.
- Text motion: headlines split into two parts; each part moves **40 px inward**, fades **0→1**, and clears a **8 px→0 px blur** over **900 ms**. Exit animates in the opposite direction during the last **15 %** of the stage.
- Subline fades in **700 ms**, starting **300 ms** after the headline.
- Stage 4 wordmark reveal begins at `p = 0.85`.

---

## Stage Glow (Background Radial Glow)
| Stage | Color (hex) | Opacity |
|-------|-------------|---------|
| 1 | `#6B4A2F` (walnut) | 0.25 |
| 2 | `#3A3D42` (charcoal iron) | 0.25 |
| 3 | `#6B4A2F` (walnut) | 0.20 |
| 4 | `#F4EDE1` (warm off‑white) | 0.10 |
- The glow cross‑fades over **900 ms** and never affects the frame background (which stays `#111111`).

---

## Technical Constraints (must NOT be changed)
- Frame count, frame paths, stage boundaries, copy, typography sizes, colors, and layout positions.
- The poster must be drawn with the same **104 % cover crop** as the frames so the knife does not shift.
- The poster remains a **single background layer** after the cross‑fade.
- No closing call‑to‑action section; the hero ends on the wordmark.

---

## Implementation Highlights (what was actually done)
- Created a **single `Hero.tsx`** component using React hooks (`useRef`, `useState`, `useEffect`, `useCallback`).
- Added a **`currentStageRef`** to keep stage index in sync across event handlers.
- Implemented **wheel, touch‑swipe, and keyboard** listeners that respect a transition lock (`isTransitioningRef`).
- Used **GSAP** for smooth progress animation (`duration 1.2 s`, `ease power1.out`).
- Consolidated duplicate code blocks, removed stray semicolons, and fixed all syntax/Rules‑of‑Hooks errors.
- Added a **reduced‑motion** fallback rendering the poster statically.
- Updated the build (`npm run build`) – passes with **code 0**.

---

## How to Use This Prompt
1. Copy the contents of this markdown file.
2. Paste it into a new issue, README, or project brief to reproduce the exact specifications.
3. Follow the implementation notes if you need to recreate the code base.

---

*Generated on 2026‑11‑18.*