"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AnimatedImageGridProps {
  variant?: "hero" | "standard";
  className?: string;
}

// Bright, colorful, joyful images - kids, parties, gifts, family moments
const HERO_IMAGE_SETS = [
  // Row 1, Column 1
  [
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=900&fit=crop", // Happy kids
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&h=900&fit=crop", // Colorful toys
    "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=800&h=900&fit=crop", // Kids laughing
  ],
  // Row 1, Column 2
  [
    "https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800&h=900&fit=crop", // Kids playing
    "https://images.unsplash.com/photo-1484665754804-74b091211472?w=800&h=900&fit=crop", // Birthday party
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=900&fit=crop", // Toddler playing
  ],
  // Row 1, Column 3 (TOP RIGHT - fixed)
  [
    "https://images.unsplash.com/photo-1513807016779-d51c0c026263?w=800&h=900&fit=crop", // Birthday candles
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=900&fit=crop", // Colorful balloons
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=900&fit=crop", // Kids party hats
  ],
  // Row 2, Column 1
  [
    "https://images.unsplash.com/photo-1542037179399-e21bba394791?w=800&h=900&fit=crop", // Gift unwrapping
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=800&h=900&fit=crop", // Happy family
    "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=800&h=900&fit=crop", // Birthday cake
  ],
  // Row 2, Column 2
  [
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&h=900&fit=crop", // Child with gift
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=900&fit=crop", // Kids crafts
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&h=900&fit=crop", // Kid smiling
  ],
  // Row 2, Column 3 (BOTTOM RIGHT - fixed)
  [
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&h=900&fit=crop", // Wrapped gifts
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=900&fit=crop", // Gift boxes colorful
    "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&h=900&fit=crop", // Present ribbons
  ],
];

// Standard grid images (smaller version)
const STANDARD_IMAGE_SETS = [
  [
    "https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=500&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=400&h=500&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1542037179399-e21bba394791?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=500&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1513807016779-d51c0c026263?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&h=500&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1484665754804-74b091211472?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=500&fit=crop",
  ],
  [
    "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1542037179399-e21bba394791?w=400&h=500&fit=crop",
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
