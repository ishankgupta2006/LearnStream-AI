import { History as HistoryIcon, Clock, Youtube, Trash2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

export const History = () => {
  const { history, loadFromHistory } = useApp();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950 flex items-center justify-center">
          <HistoryIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Learning History
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {history.length} video{history.length !== 1 ? 's' : ''} processed
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <HistoryIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">
            No videos processed yet
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Your processed videos will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((video) => (
            <button
              key={video.id}
              onClick={() => loadFromHistory(video)}
              className="w-full p-4 rounded-xl border-2 border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-neutral-50 dark:bg-neutral-950 hover:bg-white dark:hover:bg-neutral-900 transition-all text-left group"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                    <img
                      src={video.thumbnail}
                      alt={video.videoTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://img.youtube.com/vi/${video.videoId}/default.jpg`;
                      }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {video.videoTitle}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(video.processedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      <span>YouTube</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      Summary
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-xs font-medium text-amber-700 dark:text-amber-300">
                      {video.keyPointsCount || video.keyPoints?.length || 0} Points
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-xs font-medium text-purple-700 dark:text-purple-300">
                      {video.quizCount || video.quiz?.length || 0} Q Quiz
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            History is stored locally in your browser
          </p>
        </div>
      )}
    </div>
  );
};
