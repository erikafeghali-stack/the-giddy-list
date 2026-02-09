"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// All 26 videos in the pool
const VIDEO_POOL = Array.from({ length: 26 }, (_, i) =>
  `/videos/Compressed/Giddy ${i + 1}.mp4`
);

const GRID_SIZE = 6;
const SWAP_INTERVAL = 12000; // 12 seconds between swaps
const FADE_DURATION = 1200; // crossfade ms

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick initial 6 random videos
function pickInitial(): string[] {
  return shuffle(VIDEO_POOL).slice(0, GRID_SIZE);
}

// Pick a video not currently showing
function pickNew(showing: string[]): string {
  const available = VIDEO_POOL.filter((v) => !showing.includes(v));
  if (available.length === 0) {
    // All videos showing (can't happen with 26 and 6 slots, but safety)
    return VIDEO_POOL[Math.floor(Math.random() * VIDEO_POOL.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

interface CellState {
  // Two layers for crossfade: the "current" video and the "next" video fading in
  current: string;
  next: string | null;
  fading: boolean;
}

function VideoCell({ cellState }: { cellState: CellState }) {
  const currentRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);

  // When next video becomes current (fade complete), play it
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.play().catch(() => {});
    }
  }, [cellState.current]);

  useEffect(() => {
    if (cellState.next && nextRef.current) {
      nextRef.current.play().catch(() => {});
    }
  }, [cellState.next]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Current video */}
      <video
        ref={currentRef}
        key={cellState.current}
        src={cellState.current}
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out ${
          cellState.fading ? "opacity-0" : "opacity-100"
        }`}
        style={{ transitionDuration: `${FADE_DURATION}ms` }}
      />

      {/* Next video (fades in on top) */}
      {cellState.next && (
        <video
          ref={nextRef}
          key={cellState.next}
          src={cellState.next}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out ${
            cellState.fading ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
        />
      )}
    </div>
  );
}

export default function VideoHeroGrid() {
  const [cells, setCells] = useState<CellState[]>(() => {
    const initial = pickInitial();
    return initial.map((src) => ({ current: src, next: null, fading: false }));
  });

  const showingRef = useRef<string[]>(cells.map((c) => c.current));

  // Keep showingRef in sync
  useEffect(() => {
    showingRef.current = cells.map((c) => (c.fading && c.next ? c.next : c.current));
  }, [cells]);

  const swapVideos = useCallback(() => {
    // Pick 1-2 random positions to swap
    const swapCount = Math.random() < 0.5 ? 1 : 2;
    const positions = shuffle([0, 1, 2, 3, 4, 5]).slice(0, swapCount);

    setCells((prev) => {
      const updated = [...prev];
      const currentlyShowing = prev.map((c) => c.current);

      for (const pos of positions) {
        const newVideo = pickNew(currentlyShowing);
        // Add new video to "showing" so second swap doesn't pick the same
        currentlyShowing[pos] = newVideo;
        updated[pos] = {
          current: prev[pos].current,
          next: newVideo,
          fading: true,
        };
      }
      return updated;
    });

    // After fade completes, promote next to current
    setTimeout(() => {
      setCells((prev) =>
        prev.map((cell) => {
          if (cell.fading && cell.next) {
            return { current: cell.next, next: null, fading: false };
          }
          return cell;
        })
      );
    }, FADE_DURATION + 100);
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    // Wait 3s before starting rotation
    const startDelay = setTimeout(() => {
      intervalId = setInterval(swapVideos, SWAP_INTERVAL);
    }, 3000);

    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [swapVideos]);

  return (
    <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2">
      {cells.map((cellState, index) => (
        <VideoCell key={index} cellState={cellState} />
      ))}
    </div>
  );
}
