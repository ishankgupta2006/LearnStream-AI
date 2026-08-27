export const ProgressRing = ({ progress = 0, color = '#6366f1' }) => {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  const radius = 34;
  const stroke = 7;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="40"
          cy="40"
          className="text-neutral-200 dark:text-neutral-700"
        />

        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx="40"
          cy="40"
          className="transition-all duration-500"
        />
      </svg>

      <span className="absolute text-sm font-bold text-neutral-800 dark:text-white">
        {safeProgress}%
      </span>
    </div>
  );
};