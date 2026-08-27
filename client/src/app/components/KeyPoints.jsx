import { Lightbulb, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

export const KeyPoints = () => {
  const { currentVideo } = useApp();

  if (!currentVideo) return null;

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
          Key Learning Points
        </h2>
      </div>

      <div className="space-y-4">
        {currentVideo.keyPoints.map((point, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                {index + 1}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {point}
              </p>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800">
        <p className="text-sm text-indigo-900 dark:text-indigo-100 font-medium">
          💡 Pro Tip: Review these key points before taking the quiz to maximize your learning retention.
        </p>
      </div>
    </div>
  );
};
