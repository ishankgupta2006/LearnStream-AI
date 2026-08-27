import * as React from "react";
import { cn } from "./utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return Minus;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-neutral-500";
  };

  const TrendIcon = getTrendIcon();

  return (
    <div
      className={cn(
        "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        {description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        )}
        {trend && trendValue && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
            {TrendIcon && <TrendIcon className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
