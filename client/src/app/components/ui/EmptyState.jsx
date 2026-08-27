import * as React from "react";
import { cn } from "./utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-neutral-600 dark:text-neutral-400 max-w-sm mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
