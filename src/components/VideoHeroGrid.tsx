"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// All 26 videos
const VIDEO_POOL = Array.from({ length: 26 }, (_, i) =>
  `/videos/Compressed/Giddy ${i + 1}.mp4`
);

const GRID_SIZE = 6;
const SWAP_INTERVAL = 12000; // 12s between swaps
const FADE_DURATION = 1200;
const PRELOAD_AHEAD = 8; // preload this many videos ahead

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFromPool(exclude: string[]): string {
  const available = VIDEO_POOL.filter((v) => !exclude.includes(v));
  if (available.length === 0)
    return VIDEO_POOL[Math.floor(Math.random() * VIDEO_POOL.length)];
  return available[Math.floor(Math.random() * available.length)];
}

// Preload a video into browser cache
function preloadVideo(src: string): Promise<void> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.src = src;
    v.oncanplaythrough = () => {
      v.src = ""; // release after cached
      resolve();
    };
    v.onerror = () => resolve();
    setTimeout(() => resolve(), 8000); // timeout fallback
  });
}

interface CellData {
  src: string;
  nextSrc: string | null;
  fading: boolean;
}

function VideoCell({ cell }: { cell: CellData }) {
  const currentRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // Reset ready state when src changes
  useEffect(() => {
    setReady(false);
  }, [cell.src]);

  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.play().catch(() => {});
    }
  }, [cell.src]);

  useEffect(() => {
    if (cell.nextSrc && nextRef.current) {
      nextRef.current.play().catch(() => {});
    }
  }, [cell.nextSrc]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Dark placeholder - visible until video loads */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black transition-opacity duration-1000 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Current video */}
      <video
        ref={currentRef}
        key={cell.src}
        src={cell.src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlayThrough={() => setReady(true)}
        onLoadedData={() => setReady(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
        style={{
          transitionDuration: `${FADE_DURATION}ms`,
          opacity: cell.fading ? 0 : ready ? 1 : 0,
        }}
      />

      {/* Next video crossfade layer */}
      {cell.nextSrc && (
        <video
          ref={nextRef}
          key={cell.nextSrc}
          src={cell.nextSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
          style={{
            transitionDuration: `${FADE_DURATION}ms`,
            opacity: cell.fading ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}

export default function VideoHeroGrid() {
  const [cells, setCells] = useState<CellData[]>(() => {
    const initial = shuffle(VIDEO_POOL).slice(0, GRID_SIZE);
    return initial.map((src) => ({ src, nextSrc: null, fading: false }));
  });

  const preloadedRef = useRef<Set<string>>(new Set());

  // Background preloader: preload videos not currently showing
  useEffect(() => {
    let cancelled = false;
    const showing = cells.map((c) => c.src);

    // Mark initial videos as preloaded
    showing.forEach((s) => preloadedRef.current.add(s));

    const queue = shuffle(
      VIDEO_POOL.filter(
        (v) => !showing.includes(v) && !preloadedRef.current.has(v)
      )
    ).slice(0, PRELOAD_AHEAD);

    async function run() {
      for (const src of queue) {
        if (cancelled) break;
        await preloadVideo(src);
        if (!cancelled) preloadedRef.current.add(src);
      }
    }
    run();

    return () => {
      cancelled = true;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const swapVideos = useCallback(() => {
    const swapCount = Math.random() < 0.5 ? 1 : 2;
    const positions = shuffle([0, 1, 2, 3, 4, 5]).slice(0, swapCount);

    setCells((prev) => {
      const updated = [...prev];
      const showing = prev.map((c) => c.src);

      for (const pos of positions) {
        const newSrc = pickFromPool(showing);
        showing[pos] = newSrc;
        updated[pos] = { ...prev[pos], nextSrc: newSrc, fading: true };
      }
      return updated;
    });

    // After fade completes, promote next → current
    setTimeout(() => {
      setCells((prev) =>
        prev.map((cell) => {
          if (cell.fading && cell.nextSrc) {
            return { src: cell.nextSrc, nextSrc: null, fading: false };
          }
          return cell;
        })
      );

      // Preload more after swap
      const currentShowing = new Set<string>();
      setCells((prev) => {
        prev.forEach((c) => currentShowing.add(c.src));
        return prev;
      });
      const nextBatch = VIDEO_POOL.filter(
        (v) => !currentShowing.has(v) && !preloadedRef.current.has(v)
      );
      if (nextBatch.length > 0) {
        const toLoad = shuffle(nextBatch).slice(0, 3);
        toLoad.forEach((src) => preloadVideo(src).then(() => preloadedRef.current.add(src)));
      }
    }, FADE_DURATION + 100);
  }, []);

  // Start rotation after 5s (give initial videos time to load)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    const startDelay = setTimeout(() => {
      intervalId = setInterval(swapVideos, SWAP_INTERVAL);
    }, 5000);

    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [swapVideos]);

  return (
    <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2">
      {cells.map((cell, index) => (
        <VideoCell key={index} cell={cell} />
      ))}
    </div>
  );
}
