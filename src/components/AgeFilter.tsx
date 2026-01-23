"use client";

import { AgeRange } from "@/lib/types";

interface AgeFilterProps {
  value: AgeRange | null;
  onChange: (value: AgeRange | null) => void;
  showAll?: boolean;
  variant?: "default" | "pills";
}

const AGE_RANGES: { value: AgeRange; label: string; shortLabel: string }[] = [
  { value: "0-2", label: "0-2 years", shortLabel: "Baby & Toddler" },
  { value: "3-5", label: "3-5 years", shortLabel: "Preschool" },
  { value: "6-8", label: "6-8 years", shortLabel: "Early School" },
  { value: "9-12", label: "9-12 years", shortLabel: "Tween" },
  { value: "13-18", label: "13-18 years", shortLabel: "Teen" },
];

export default function AgeFilter({
  value,
  onChange,
  showAll = true,
  variant = "default",
}: AgeFilterProps) {
  // Compact pills variant for inline filtering
  if (variant === "pills") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {AGE_RANGES.map((age) => (
          <button
            key={age.value}
            onClick={() => onChange(value === age.value ? null : age.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              value === age.value
                ? "bg-red text-white shadow-sm"
                : "bg-white text-foreground/60 border border-gray-200 hover:border-gray-300 hover:text-foreground"
            }`}
          >
            {age.shortLabel}
          </button>
        ))}
      </div>
    );
  }

  // Default full variant
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
      {showAll && (
        <button
          onClick={() => onChange(null)}
          className={`flex-shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
            value === null
              ? "bg-red text-white shadow-sm"
              : "bg-white border border-gray-200 text-foreground/60 hover:border-gray-300 hover:text-foreground"
          }`}
        >
          All Ages
        </button>
      )}
      {AGE_RANGES.map((age) => (
        <button
          key={age.value}
          onClick={() => onChange(age.value)}
          className={`flex-shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
            value === age.value
              ? "bg-red text-white shadow-sm"
              : "bg-white border border-gray-200 text-foreground/60 hover:border-gray-300 hover:text-foreground"
          }`}
        >
          <span className="hidden sm:inline">{age.label}</span>
          <span className="sm:hidden">{age.shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
