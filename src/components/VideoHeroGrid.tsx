"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// All 26 videos in the pool
const VIDEO_POOL = Array.from({ length: 26 }, (_, i) =>
  `/videos/Compressed/Giddy ${i + 1}.mp4`
);

const SWAP_INTERVAL = 10000; // 10 seconds per video
const FADE_DURATION = 1500; // crossfade ms

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VideoHeroGrid() {
  // Create a shuffled playlist of all videos
  const [playlist] = useState(() => shuffle(VIDEO_POOL));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  const currentRef = useRef<HTMLVideoElement>(null);
  const nextRef = useRef<HTMLVideoElement>(null);

  const advance = useCallback(() => {
    const next = (currentIndex + 1) % playlist.length;
    setNextIndex(next);

    // Small delay to let next video element mount and start loading
    requestAnimationFrame(() => {
      if (nextRef.current) {
        nextRef.current.play().catch(() => {});
      }
      // Start crossfade
      setTimeout(() => setFading(true), 100);
    });

    // After fade completes, promote next to current
    setTimeout(() => {
      setCurrentIndex(next);
      setNextIndex(null);
      setFading(false);
    }, FADE_DURATION + 200);
  }, [currentIndex, playlist.length]);

  // Auto-rotate
  useEffect(() => {
    const timer = setTimeout(advance, SWAP_INTERVAL);
    return () => clearTimeout(timer);
  }, [advance, currentIndex]);

  // Play current video on mount / index change
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  return (
    <div className="absolute inset-0 bg-black">
      {/* Current video - full screen */}
      <video
        ref={currentRef}
        key={playlist[currentIndex]}
        src={playlist[currentIndex]}
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out`}
        style={{
          transitionDuration: `${FADE_DURATION}ms`,
          opacity: fading ? 0 : 1,
        }}
      />

      {/* Next video - fades in on top */}
      {nextIndex !== null && (
        <video
          ref={nextRef}
          key={playlist[nextIndex]}
          src={playlist[nextIndex]}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out`}
          style={{
            transitionDuration: `${FADE_DURATION}ms`,
            opacity: fading ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}
