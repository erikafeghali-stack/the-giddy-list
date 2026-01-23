"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AnimatedImageGridProps {
  variant?: "hero" | "standard";
  className?: string;
}

// Full age range (0-18): kids, tweens, teens, and aspirational product shots
const HERO_IMAGE_SETS = [
  // Row 1, Column 1 - Toddler with gift (excited)
  [
    "https://images.unsplash.com/photo-1520483601560-389dff434fdf?w=800&h=900&fit=crop", // Toddler with gift excited
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=900&fit=crop", // Happy kids
    "https://images.unsplash.com/photo-1542037179399-e21bba394791?w=800&h=900&fit=crop", // Gift unwrapping
  ],
  // Row 1, Column 2 - Family together
  [
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&h=900&fit=crop", // Family together
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&h=900&fit=crop", // Happy family
    "https://images.unsplash.com/photo-1484665754804-74b091211472?w=800&h=900&fit=crop", // Birthday celebration
  ],
  // Row 1, Column 3 (TOP RIGHT) - Teen with headphones
  [
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=900&fit=crop", // Teen with headphones
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=900&fit=crop", // Teen friends laughing
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=900&fit=crop", // Teens hanging out
  ],
  // Row 2, Column 1 - Siblings playing
  [
    "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&h=900&fit=crop", // Siblings playing
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=900&fit=crop", // Excited kid
    "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=800&h=900&fit=crop", // Friends having fun
  ],
  // Row 2, Column 2 - Cool sneakers (aspirational product)
  [
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=900&fit=crop", // Cool sneakers
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&h=900&fit=crop", // Tech gadgets
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=900&fit=crop", // Colorful gift boxes
  ],
  // Row 2, Column 3 (BOTTOM RIGHT) - Birthday candles
  [
    "https://images.unsplash.com/photo-1513807016779-d51c0c026263?w=800&h=900&fit=crop", // Birthday candles
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=900&fit=crop", // Colorful balloons
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop", // Party celebration
  ],
];

// Standard grid images (smaller version) - Full age range
const STANDARD_IMAGE_SETS = [
  [
    "https://images.unsplash.com/photo-1520483601560-389dff434fdf?w=400&h=500&fit=crop", // Toddler with gift
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=500&fit=crop", // Happy kids
    "https://images.unsplash.com/photo-1542037179399-e21bba394791?w=400&h=500&fit=crop", // Gift unwrapping
  ],
  [
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=500&fit=crop", // Family together
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=500&fit=crop", // Happy family
    "https://images.unsplash.com/photo-1484665754804-74b091211472?w=400&h=500&fit=crop", // Birthday celebration
  ],
  [
    "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=400&h=500&fit=crop", // Teen headphones
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=500&fit=crop", // Teen friends
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=500&fit=crop", // Teens hanging out
  ],
  [
    "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=400&h=500&fit=crop", // Siblings playing
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=500&fit=crop", // Excited kid
    "https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=400&h=500&fit=crop", // Friends having fun
  ],
  [
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop", // Cool sneakers
    "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=500&fit=crop", // Tech gadgets
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&h=500&fit=crop", // Gift boxes
  ],
  [
    "https://images.unsplash.com/photo-1513807016779-d51c0c026263?w=400&h=500&fit=crop", // Birthday candles
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=500&fit=crop", // Colorful balloons
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop", // Party celebration
  ],
];

// Staggered intervals for each grid cell (in ms)
const INTERVALS = [4200, 5400, 4800, 5000, 4600, 5200];

function ImageCell({
  images,
  interval,
  delay,
  variant,
}: {
  images: string[];
  interval: number;
  delay: number;
  variant: "hero" | "standard";
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));

  // Preload next image
  const preloadImage = useCallback((index: number) => {
    if (imagesLoaded.has(index)) return;

    const img = new window.Image();
    img.src = images[index];
    img.onload = () => {
      setImagesLoaded((prev) => new Set([...prev, index]));
    };
  }, [images, imagesLoaded]);

  useEffect(() => {
    // Initial delay before starting animation
    const startTimer = setTimeout(() => {
      const rotateImage = () => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % images.length;
          // Preload the one after next
          preloadImage((nextIndex + 1) % images.length);
          return nextIndex;
        });
      };

      // Preload next image
      preloadImage(1);

      const intervalId = setInterval(rotateImage, interval);
      return () => clearInterval(intervalId);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay, images.length, interval, preloadImage]);

  const isHero = variant === "hero";

  return (
    <div className={`relative w-full h-full overflow-hidden ${isHero ? "" : "rounded-2xl shadow-lg"} bg-gray-200`}>
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity ease-in-out ${
            isHero ? "duration-[1500ms]" : "duration-[1200ms]"
          } ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes={isHero ? "(max-width: 768px) 50vw, 33vw" : "(max-width: 768px) 33vw, 200px"}
            priority={index === 0}
            unoptimized
          />
        </div>
      ))}

      {/* Subtle gradient overlay for depth (standard variant only) */}
      {!isHero && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
      )}
    </div>
  );
}

export default function AnimatedImageGrid({ variant = "standard", className = "" }: AnimatedImageGridProps) {
  const imageSets = variant === "hero" ? HERO_IMAGE_SETS : STANDARD_IMAGE_SETS;

  if (variant === "hero") {
    return (
      <div className={`absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2 ${className}`}>
        {imageSets.map((images, index) => (
          <div key={index} className="relative w-full h-full">
            <ImageCell
              images={images}
              interval={INTERVALS[index]}
              delay={index * 600}
              variant="hero"
            />
          </div>
        ))}
      </div>
    );
  }

  // Standard variant (for non-hero use)
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 ${className}`}>
      {imageSets.map((images, index) => (
        <div
          key={index}
          className={`aspect-[4/5] ${index >= 4 ? "hidden md:block" : ""}`}
        >
          <ImageCell
            images={images}
            interval={INTERVALS[index]}
            delay={index * 800}
            variant="standard"
          />
        </div>
      ))}
    </div>
  );
}
