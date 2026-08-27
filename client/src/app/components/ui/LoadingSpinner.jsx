import * as React from "react";
import { cn } from "./utils";

export function LoadingSpinner({ className, size = "md", ...props }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

export function LoadingDots({ className }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ className, lines = 3 }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}
