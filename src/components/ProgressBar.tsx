"use client";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gradient";
}

export default function ProgressBar({
  value,
  max,
  label,
  showCount = true,
  size = "md",
  variant = "gradient",
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const heightClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const barClasses =
    variant === "gradient"
      ? "bg-gradient-to-r from-gold to-red"
      : "bg-red";

  return (
    <div>
      {(label || showCount) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showCount && (
            <span className="text-sm text-foreground/60">
              {value} of {max}
            </span>
          )}
        </div>
      )}
      <div
        className={`bg-cream-dark rounded-full overflow-hidden ${heightClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClasses}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
